chrome.runtime.onInstalled.addListener(() => {
  console.log("Auto AI Captcha Solver installed successfully!");
  chrome.storage.local.get(["autoSolve", "clickDelay", "model"], (data) => {
    chrome.storage.local.set({
      autoSolve: data.autoSolve !== undefined ? data.autoSolve : true,
      clickDelay: data.clickDelay || 350,
      model: data.model || "gemini-3.1-flash-lite"
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "TEST_API_KEY") {
    handleTestApiKey(request.apiKey)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.action === "SOLVE_CAPTCHA") {
    handleSolveCaptcha(request.payload)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function handleTestApiKey(apiKey) {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error("API Key empty. Please enter your free Gemini API Key.");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;
  const resp = await fetch(endpoint);
  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(data.error?.message || "Invalid API key or network error");
  }

  return { success: true, message: "API Key is valid and active!" };
}

async function handleSolveCaptcha(payload) {
  const { apiKey, promptText, images, compositeImage, tileCount, selectedModel } = payload;

  // Verify license status
  const licenseCheck = await new Promise((resolve) => {
    chrome.storage.local.get(["isLicensed", "licenseExpiry"], resolve);
  });
  if (licenseCheck.isLicensed === false || (licenseCheck.licenseExpiry && Date.now() > licenseCheck.licenseExpiry)) {
    throw new Error("সাবস্ক্রিপশন মেয়াদ শেষ বা লাইসেন্স নিষ্ক্রিয়! এক্সটেনশন পপআপে গিয়ে লাইসেন্স রিনিউ করুন।");
  }

  if (!apiKey) {
    throw new Error("Gemini API Key is not configured! Please click extension icon and save your key.");
  }

  // Choose model: user selected model first, then fallback cascade
  const targetModel = selectedModel || "gemini-3.1-flash-lite";
  const modelsToTry = [
    targetModel,
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash"
  ];
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const model of uniqueModels) {
    try {
      console.log(`[AI Captcha Solver] Attempting solve with model: ${model}`);
      const result = await callGeminiVision(model, apiKey, promptText, images, compositeImage, tileCount);
      return { success: true, result, modelUsed: model };
    } catch (err) {
      console.warn(`Model ${model} attempt failed:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to solve with Gemini Vision API.");
}

async function callGeminiVision(model, apiKey, promptText, images, compositeImage, tileCount) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const parts = [];

  const systemInstruction = `You are an expert, high-precision CAPTCHA image classifier AI for a 3x3 grid numbered 1 to 9.
Prompt: "${promptText}".
3x3 Grid Layout:
Row 1: [Tile 1] [Tile 2] [Tile 3]
Row 2: [Tile 4] [Tile 5] [Tile 6]
Row 3: [Tile 7] [Tile 8] [Tile 9]

STRICT EVALUATION CRITERIA:
1. Examine each of the 9 tiles individually from left-to-right, top-to-bottom.
2. Every condition in the prompt MUST be satisfied simultaneously.
   - For example, if prompt is "bear and jungle":
     - The tile MUST contain an actual real or cartoon BEAR. A red balloon, pig, robot, turkey, cat, dog, sheep, rabbit, or hippo is NEVER a bear!
     - The background MUST be a jungle or forest (green trees, plants, foliage). Desert, sea, indoor, or city is NOT a jungle!
3. Pay strict attention to tile coordinates (Row 1 is 1-3, Row 2 is 4-6, Row 3 is 7-9). Do not confuse adjacent rows or columns.
4. If no tiles meet the prompt, return: {"matches": []}
5. Return ONLY a valid JSON object:
{"matches": [indices]}`;

  parts.push({ text: systemInstruction });

  // If a composite grid screenshot is available
  if (compositeImage) {
    const cleanBase64 = compositeImage.replace(/^data:image\/(png|jpeg|webp);base64,/, "");
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: cleanBase64
      }
    });
  } else if (images && images.length > 0) {
    // Or if individual tile images are provided
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const cleanBase64 = img.base64 ? img.base64.replace(/^data:image\/(png|jpeg|webp);base64,/, "") : "";
      if (cleanBase64) {
        parts.push({ text: `Tile ${i + 1}:` });
        parts.push({
          inline_data: {
            mime_type: "image/png",
            data: cleanBase64
          }
        });
      }
    }
  } else {
    throw new Error("No image data available to solve.");
  }

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: parts
      }
    ],
    generationConfig: {
      temperature: 0.1,
      response_mime_type: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini API error: ${response.status}`);
  }

  const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error("No response generated by Gemini model.");
  }

  try {
    // Clean potential markdown wrapper
    const jsonStr = candidateText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    const matches = Array.isArray(parsed) ? parsed : (parsed.matches || parsed.selected || parsed.indices || []);
    return {
      matches: matches.map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 1 && n <= (tileCount || 9)),
      rawResponse: candidateText
    };
  } catch (e) {
    // Regex fallback to extract numbers if JSON parse fails
    const matchedNumbers = candidateText.match(/\b([1-9]|1[0-6])\b/g);
    if (matchedNumbers) {
      const uniqueNumbers = [...new Set(matchedNumbers.map(n => parseInt(n, 10)))];
      return {
        matches: uniqueNumbers.filter(n => n >= 1 && n <= (tileCount || 9)),
        rawResponse: candidateText
      };
    }
    throw new Error(`Failed to parse AI output: ${candidateText}`);
  }
}
