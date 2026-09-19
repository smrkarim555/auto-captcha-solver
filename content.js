// Ultra-lightweight, 0% CPU Captcha Solver with Site Filters & Master Switch
// Does nothing on non-captcha pages and restricted sites

(function () {
  let isSolving = false;
  let masterEnabled = true;
  let siteMode = "specific";
  let allowedSites = "kolotibablo.com, localhost";
  let showFloatingBadge = true;
  let autoSolveEnabled = true;
  let apiKey = "";
  let clickDelay = 400;
  let selectedModel = "gemini-2.5-flash";
  let lastSolvedSrc = "";
  let isLicensed = true;
  let licenseExpiry = null;

  // Load all settings from storage
  chrome.storage.local.get([
    "masterEnabled",
    "siteMode",
    "allowedSites",
    "showFloatingBadge",
    "geminiApiKey",
    "autoSolve",
    "clickDelay",
    "model",
    "isLicensed",
    "licenseExpiry"
  ], (data) => {
    if (data.masterEnabled !== undefined) masterEnabled = data.masterEnabled;
    if (data.siteMode) siteMode = data.siteMode;
    if (data.allowedSites) allowedSites = data.allowedSites;
    if (data.showFloatingBadge !== undefined) showFloatingBadge = data.showFloatingBadge;
    if (data.geminiApiKey) apiKey = data.geminiApiKey;
    if (data.autoSolve !== undefined) autoSolveEnabled = data.autoSolve;
    if (data.clickDelay) clickDelay = data.clickDelay;
    if (data.model) selectedModel = data.model;
    if (data.isLicensed !== undefined) isLicensed = data.isLicensed;
    if (data.licenseExpiry !== undefined) licenseExpiry = data.licenseExpiry;
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.masterEnabled !== undefined) {
      masterEnabled = changes.masterEnabled.newValue;
      if (!masterEnabled) removeBadge();
    }
    if (changes.isLicensed !== undefined) isLicensed = changes.isLicensed.newValue;
    if (changes.licenseExpiry !== undefined) licenseExpiry = changes.licenseExpiry.newValue;
    if (changes.siteMode) siteMode = changes.siteMode.newValue;
    if (changes.allowedSites) allowedSites = changes.allowedSites.newValue;
    if (changes.showFloatingBadge !== undefined) {
      showFloatingBadge = changes.showFloatingBadge.newValue;
      if (!showFloatingBadge) removeBadge();
    }
    if (changes.geminiApiKey) apiKey = changes.geminiApiKey.newValue;
    if (changes.autoSolve !== undefined) autoSolveEnabled = changes.autoSolve.newValue;
    if (changes.clickDelay) clickDelay = changes.clickDelay.newValue;
    if (changes.model) selectedModel = changes.model.newValue;
  });

  // Check if current website is allowed to run
  function isSiteAllowed() {
    if (!masterEnabled) return false;
    if (siteMode === "all") return true;

    // Specific mode: check domain
    const hostname = (window.location.hostname || "").toLowerCase();
    const list = allowedSites.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

    return list.some(domain => hostname === domain || hostname.endsWith("." + domain) || domain.includes(hostname));
  }

  // Passive 2-second check: uses 0% CPU
  setInterval(() => {
    if (isSolving) return;

    // 1. Is extension enabled and site allowed?
    if (!isSiteAllowed()) {
      removeBadge();
      return;
    }

    // 2. Is there an actual captcha on screen?
    const gridWrap = document.querySelector(".grid-wrap");
    if (!gridWrap) {
      removeBadge();
      return; // On login/username/password screen, exit immediately!
    }

    const img = gridWrap.querySelector("img.gr-image, img");
    if (!img || !img.src) return;

    // 3. Show badge only if enabled and captcha is visible
    if (showFloatingBadge) {
      showBadge();
    } else {
      removeBadge();
    }

  function isLicenseActive() {
    if (isLicensed === false) return false;
    if (licenseExpiry && Date.now() > licenseExpiry) return false;
    return true;
  }

  // 4. Auto-solve if enabled, license is active, and new challenge
    if (autoSolveEnabled && img.src !== lastSolvedSrc && apiKey && isLicenseActive()) {
      isSolving = true;
      updateBadgeText("🤖 Auto-solving in 1s...");
      setTimeout(() => {
        solveCaptchaFlow();
      }, 1000);
    }
  }, 2000);

  function showBadge() {
    if (!showFloatingBadge) return;
    let badge = document.getElementById("ai-captcha-solver-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "ai-captcha-solver-badge";
      document.body.appendChild(badge);
    }

    if (!isLicenseActive()) {
      badge.innerHTML = `
        <span class="status-dot error" style="background:#ef4444;"></span>
        <span id="ai-badge-text" style="font-weight:600; color:#f87171;">🔐 License Expired</span>
        <button id="ai-badge-btn" class="badge-btn" style="background:#ef4444;" title="License Expired">Renew</button>
      `;
      const btn = badge.querySelector("#ai-badge-btn");
      if (btn) {
        btn.onclick = () => {
          alert("Your extension subscription has expired! Please open the extension popup to check or renew your license.");
        };
      }
      return;
    }

    badge.innerHTML = `
      <span class="status-dot normal"></span>
      <span id="ai-badge-text" style="font-weight:600;">🤖 AI Captcha Ready</span>
      <button id="ai-badge-btn" class="badge-btn">⚡ Solve</button>
    `;
    const btn = badge.querySelector("#ai-badge-btn");
    if (btn) {
      btn.onclick = () => {
        if (!isSolving) {
          isSolving = true;
          solveCaptchaFlow();
        }
      };
    }
  }

  function removeBadge() {
    const badge = document.getElementById("ai-captcha-solver-badge");
    if (badge) badge.remove();
  }

  function updateBadgeText(text) {
    const el = document.getElementById("ai-badge-text");
    if (el) el.textContent = text;
  }

  function getPromptText() {
    const wrap = document.querySelector(".grid-wrap");
    if (!wrap) return "Select all images containing requested items";

    const parent = wrap.parentElement || document.body;
    const text = parent.innerText || "";
    const match = text.match(/Select all images containing[^\n\r]+/i);
    return match ? match[0].trim() : "Select all images containing target";
  }

  async function solveCaptchaFlow() {
    try {
      if (!apiKey) {
        updateBadgeText("⚠️ Set Gemini API Key in extension!");
        isSolving = false;
        return;
      }

      // Round 1
      const round1 = await solveOneStep(1);

      if (round1.isNext) {
        updateBadgeText("Round 1 done. Waiting Round 2...");

        const wrap = document.querySelector(".grid-wrap");
        const img = wrap?.querySelector("img.gr-image, img");

        let waited = 0;
        while (img && img.src === round1.oldSrc && waited < 7000) {
          await wait(250);
          waited += 250;
        }
        await wait(600);

        // Round 2
        updateBadgeText("Solving Round 2...");
        await solveOneStep(2);
      }

      // Check if error message appeared
      await wait(1800);
      const hasError = Array.from(document.querySelectorAll("div, p, span"))
        .some(el => el.innerText?.toLowerCase().includes("incorrect captcha"));

      if (hasError) {
        updateBadgeText("⚠️ Retrying new challenge...");
        await wait(1500);
        isSolving = false;
        solveCaptchaFlow(); // Retry
        return;
      }

      const wrapEnd = document.querySelector(".grid-wrap");
      const imgEnd = wrapEnd?.querySelector("img.gr-image, img");
      lastSolvedSrc = imgEnd ? imgEnd.src : "";

      updateBadgeText("🎉 Captcha Solved!");
      setTimeout(() => {
        removeBadge();
      }, 2500);

    } catch (e) {
      console.error(e);
      updateBadgeText("❌ Error solving captcha");
    } finally {
      setTimeout(() => {
        isSolving = false;
      }, 2000);
    }
  }

  async function solveOneStep(stepNum) {
    const wrap = document.querySelector(".grid-wrap");
    if (!wrap) throw new Error("No grid");

    const img = wrap.querySelector("img.gr-image, img");
    const cells = Array.from(wrap.querySelectorAll(".cell"));
    const btn = document.querySelector("button.btn.btn-primary") || document.querySelector("button");

    const promptText = getPromptText();
    const oldSrc = img.src;
    const cleanBase64 = img.src.replace(/^data:image\/(png|jpeg|webp);base64,/, "");

    updateBadgeText(`Step ${stepNum}: AI analyzing...`);

    const response = await chrome.runtime.sendMessage({
      action: "SOLVE_CAPTCHA",
      payload: {
        apiKey: apiKey,
        promptText: promptText,
        compositeImage: cleanBase64,
        tileCount: cells.length,
        selectedModel: "gemini-2.5-flash"
      }
    });

    if (!response || !response.success) {
      throw new Error(response?.error || "AI failed");
    }

    const matches = response.result?.matches || [];
    console.log(`[AI Solver] Step ${stepNum} Matches:`, matches);

    for (const num of matches) {
      const cell = cells[num - 1];
      if (cell) {
        cell.classList.add("ai-solver-selected-tile");
        cell.click();
        await wait(clickDelay + Math.random() * 80);
      }
    }

    await wait(600);

    const isNext = btn && btn.innerText.trim().toLowerCase() === "next";
    if (btn) {
      btn.click();
    }

    return { isNext, oldSrc };
  }

  function wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }
})();
