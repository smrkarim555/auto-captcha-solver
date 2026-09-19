const fs = require('fs');
const path = require('path');

const tilesDir = path.join(__dirname, 'tiles');
const base64Tiles = [];

for (let i = 1; i <= 9; i++) {
  const filePath = path.join(tilesDir, `tile${i}.png`);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath);
    base64Tiles.push(`data:image/png;base64,${data.toString('base64')}`);
  } else {
    console.error(`Missing tile${i}.png`);
  }
}

const htmlContent = `<!DOCTYPE html>
<html lang="bn">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captcha Test Page - Auto AI Captcha Solver</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #0d1117;
      color: #f0f6fc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .header-box {
      text-align: center;
      max-width: 520px;
      margin-bottom: 20px;
    }
    .header-box h1 {
      font-size: 22px;
      color: #58a6ff;
      margin-bottom: 8px;
    }
    .header-box p {
      font-size: 13px;
      color: #8b949e;
      line-height: 1.5;
    }
    .captcha-card {
      background-color: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 20px;
      width: 100%;
      max-width: 380px;
      box-shadow: 0 16px 32px rgba(0, 0, 0, 0.6);
    }
    .captcha-prompt {
      font-size: 16px;
      font-weight: 500;
      color: #f0f6fc;
      text-align: center;
      margin-bottom: 14px;
      padding: 4px;
    }
    .captcha-prompt strong {
      color: #79c0ff;
      font-weight: 700;
    }
    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px;
      background-color: #010409;
      padding: 5px;
      border-radius: 8px;
      border: 1px solid #30363d;
      margin-bottom: 18px;
    }
    .captcha-tile {
      position: relative;
      aspect-ratio: 1 / 1;
      cursor: pointer;
      overflow: hidden;
      border-radius: 4px;
      border: 2px solid transparent;
      transition: transform 0.15s ease, border-color 0.15s ease;
      background-color: #21262d;
    }
    .captcha-tile:hover {
      transform: scale(0.97);
    }
    .captcha-tile img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: cover;
      user-select: none;
      -webkit-user-drag: none;
    }
    .captcha-tile.selected {
      border-color: #1f6feb;
    }
    .captcha-tile.selected::after {
      content: "✓";
      position: absolute;
      top: 4px;
      right: 4px;
      background-color: #1f6feb;
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.6);
    }
    .footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 14px;
      border-top: 1px solid #30363d;
    }
    .btn-reset {
      background: none;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    .btn-reset:hover {
      color: #f0f6fc;
      border-color: #8b949e;
    }
    .btn-verify {
      background: linear-gradient(135deg, #1f6feb, #238636);
      color: #ffffff;
      border: none;
      padding: 8px 24px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-verify:hover {
      opacity: 0.9;
    }
    .status-feedback {
      margin-top: 14px;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      text-align: center;
      display: none;
    }
    .status-feedback.success {
      display: block;
      background-color: rgba(35, 134, 54, 0.2);
      border: 1px solid #2ea043;
      color: #3fb950;
    }
    .status-feedback.fail {
      display: block;
      background-color: rgba(248, 81, 73, 0.2);
      border: 1px solid #f85149;
      color: #ff7b72;
    }
    .tip-box {
      margin-top: 20px;
      max-width: 380px;
      background-color: rgba(56, 139, 253, 0.1);
      border: 1px solid rgba(56, 139, 253, 0.3);
      padding: 12px;
      border-radius: 8px;
      font-size: 12px;
      color: #c9d1d9;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <div class="header-box">
    <h1>🎯 AI Captcha Solver Test Page</h1>
    <p>নিচে আপনার দেওয়া ক্যাপচাটি রিয়েল ইমেজ গ্রিড হিসেবে সেট করা আছে।</p>
  </div>

  <div class="captcha-card">
    <div class="captcha-prompt">
      Select all images containing <strong>crocodile and moon</strong>
    </div>

    <div class="grid-container" id="grid">
      ${base64Tiles.map((b64, idx) => `
      <div class="captcha-tile" data-index="${idx + 1}" title="Tile ${idx + 1}">
        <img src="${b64}" alt="Tile ${idx + 1}">
      </div>`).join('')}
    </div>

    <div class="footer-row">
      <button type="button" class="btn-reset" id="btn-reset">🔄 Reset</button>
      <button type="button" class="btn-verify" id="btn-verify">Verify</button>
    </div>

    <div id="status-feedback" class="status-feedback"></div>
  </div>

  <div class="tip-box">
    <strong>💡 এক্সটেনশন কাজ না করলে চেক করুন:</strong><br>
    ১. <code>chrome://extensions</code>-এ গিয়ে এক্সটেনশনটির <strong>"Details"</strong>-এ ক্লিক করুন এবং <strong>"Allow access to file URLs"</strong> অন করুন।<br>
    ২. অথবা নিচে দেওয়া <code>start-server.bat</code> ফাইলে ডাবল ক্লিক করে <code>http://localhost:3000</code> পেজ ওপেন করুন।
  </div>

  <script>
    const correctTiles = [2, 4, 9];
    const tiles = document.querySelectorAll(".captcha-tile");
    const verifyBtn = document.getElementById("btn-verify");
    const resetBtn = document.getElementById("btn-reset");
    const feedback = document.getElementById("status-feedback");

    tiles.forEach(tile => {
      tile.addEventListener("click", () => {
        tile.classList.toggle("selected");
      });
    });

    resetBtn.addEventListener("click", () => {
      tiles.forEach(t => t.classList.remove("selected", "ai-solver-selected-tile"));
      feedback.style.display = "none";
    });

    verifyBtn.addEventListener("click", () => {
      const selected = Array.from(document.querySelectorAll(".captcha-tile.selected, .captcha-tile.ai-solver-selected-tile"))
        .map(t => parseInt(t.dataset.index, 10));
      
      const uniqueSelected = [...new Set(selected)];
      const isCorrect = uniqueSelected.length === correctTiles.length &&
        correctTiles.every(idx => uniqueSelected.includes(idx));

      if (isCorrect) {
        feedback.className = "status-feedback success";
        feedback.innerHTML = "🎉 <strong>দারুণ! ক্যাপচা সফলভাবে সলভ হয়েছে!</strong> (Tile 2, 4, 9)";
      } else {
        feedback.className = "status-feedback fail";
        feedback.innerHTML = \`❌ ভুল হয়েছে! আপনি সিলেক্ট করেছেন: [\${uniqueSelected.join(", ")}], সঠিক উত্তর ছিল: [2, 4, 9]\`;
      }
      feedback.style.display = "block";
    });
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'test-captcha.html'), htmlContent, 'utf-8');
console.log('Updated test-captcha.html successfully with all 9 embedded tiles!');
