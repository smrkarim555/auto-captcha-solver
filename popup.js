// Popup controller for Auto AI Captcha Solver

document.addEventListener("DOMContentLoaded", () => {
  const masterSwitch = document.getElementById("toggle-master-switch");
  const apiKeyInput = document.getElementById("api-key");
  const toggleKeyVisibilityBtn = document.getElementById("toggle-key-visibility");
  const saveKeyBtn = document.getElementById("btn-save-key");
  const messageBox = document.getElementById("key-message");
  const statusBadge = document.getElementById("status-badge");

  const siteModeSelect = document.getElementById("select-site-mode");
  const specificSitesContainer = document.getElementById("specific-sites-container");
  const allowedSitesInput = document.getElementById("input-allowed-sites");
  const addCurrentTabBtn = document.getElementById("btn-add-current-tab");

  const floatingBadgeToggle = document.getElementById("toggle-floating-badge");
  const autoSolveToggle = document.getElementById("toggle-auto-solve");
  const modelSelect = document.getElementById("select-model");

  // Load saved state
  chrome.storage.local.get([
    "masterEnabled",
    "geminiApiKey",
    "siteMode",
    "allowedSites",
    "showFloatingBadge",
    "autoSolve",
    "model"
  ], (data) => {
    // Master switch (default true)
    masterSwitch.checked = data.masterEnabled !== undefined ? data.masterEnabled : true;

    // API Key
    if (data.geminiApiKey) {
      apiKeyInput.value = data.geminiApiKey;
      updateStatus(true);
    } else {
      updateStatus(false);
    }

    // Site Mode (default "specific")
    const mode = data.siteMode || "specific";
    siteModeSelect.value = mode;
    toggleSitesContainer(mode);

    // Allowed Sites (default "kolotibablo.com, localhost")
    allowedSitesInput.value = data.allowedSites || "kolotibablo.com, localhost";

    // Show Floating Badge (default true, but only when captcha is present)
    floatingBadgeToggle.checked = data.showFloatingBadge !== undefined ? data.showFloatingBadge : true;

    // Auto solve
    autoSolveToggle.checked = data.autoSolve !== undefined ? data.autoSolve : true;

    // Model
    modelSelect.value = data.model || "gemini-2.5-flash";
  });

  function toggleSitesContainer(mode) {
    if (mode === "specific") {
      specificSitesContainer.style.display = "block";
    } else {
      specificSitesContainer.style.display = "none";
    }
  }

  // Master Switch change
  masterSwitch.addEventListener("change", () => {
    chrome.storage.local.set({ masterEnabled: masterSwitch.checked });
  });

  // Site Mode change
  siteModeSelect.addEventListener("change", () => {
    const mode = siteModeSelect.value;
    toggleSitesContainer(mode);
    chrome.storage.local.set({ siteMode: mode });
  });

  // Allowed Sites input change
  allowedSitesInput.addEventListener("input", () => {
    chrome.storage.local.set({ allowedSites: allowedSitesInput.value.trim() });
  });

  // Add current tab to allowed sites
  addCurrentTabBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const domain = url.hostname;
          if (domain) {
            let current = allowedSitesInput.value.trim();
            const list = current.split(",").map(s => s.trim().toLowerCase());
            if (!list.includes(domain.toLowerCase())) {
              const updated = current ? `${current}, ${domain}` : domain;
              allowedSitesInput.value = updated;
              chrome.storage.local.set({ allowedSites: updated });
              showMessage(`✓ "${domain}" সাইটটি যুক্ত হয়েছে!`, "success");
            } else {
              showMessage(`"${domain}" সাইটটি আগেই তালিকায় আছে!`, "info");
            }
          }
        } catch (e) {}
      }
    });
  });

  // Floating badge toggle
  floatingBadgeToggle.addEventListener("change", () => {
    chrome.storage.local.set({ showFloatingBadge: floatingBadgeToggle.checked });
  });

  // Auto solve toggle
  autoSolveToggle.addEventListener("change", () => {
    chrome.storage.local.set({ autoSolve: autoSolveToggle.checked });
  });

  // Model select
  modelSelect.addEventListener("change", () => {
    chrome.storage.local.set({ model: modelSelect.value });
  });

  // Toggle API key visibility
  toggleKeyVisibilityBtn.addEventListener("click", () => {
    if (apiKeyInput.type === "password") {
      apiKeyInput.type = "text";
      toggleKeyVisibilityBtn.textContent = "🔒";
    } else {
      apiKeyInput.type = "password";
      toggleKeyVisibilityBtn.textContent = "👁️";
    }
  });

  // Save & Test API key
  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (!key) {
      showMessage("অনুগ্রহ করে একটি API Key লিখুন!", "error");
      return;
    }

    showMessage("ভ্যালিডেট করা হচ্ছে...", "info");
    saveKeyBtn.disabled = true;

    chrome.runtime.sendMessage({ action: "TEST_API_KEY", apiKey: key }, (response) => {
      saveKeyBtn.disabled = false;
      if (response && response.success) {
        chrome.storage.local.set({ geminiApiKey: key }, () => {
          showMessage("✓ API Key সফলভাবে সেভ হয়েছে!", "success");
          updateStatus(true);
        });
      } else {
        showMessage(`❌ ভুল API Key: ${response?.error || "Invalid response"}`, "error");
        updateStatus(false);
      }
    });
  });

  // --- Device ID & License Management ---
  const inputDeviceId = document.getElementById("input-device-id");
  const btnCopyDeviceId = document.getElementById("btn-copy-device-id");
  const subStatusInfo = document.getElementById("sub-status-info");
  const subBadge = document.getElementById("sub-badge");
  const btnCheckLicense = document.getElementById("btn-check-license");
  const inputLicenseUrl = document.getElementById("input-license-url");
  const btnSaveLicenseUrl = document.getElementById("btn-save-license-url");

  let currentDeviceId = "";

  // 1. Initialize Device ID
  initDeviceId();

  async function initDeviceId() {
    chrome.storage.local.get(["deviceId", "githubLicenseUrl", "isLicensed", "licenseExpiry", "licenseUser"], async (data) => {
      if (data.deviceId) {
        currentDeviceId = data.deviceId;
      } else {
        currentDeviceId = await generateUniqueDeviceId();
        chrome.storage.local.set({ deviceId: currentDeviceId });
      }

      if (inputDeviceId) inputDeviceId.value = currentDeviceId;
      if (inputLicenseUrl && data.githubLicenseUrl) {
        inputLicenseUrl.value = data.githubLicenseUrl;
      }

      // Display cached license status first
      updateLicenseUI(data.isLicensed, data.licenseExpiry, data.licenseUser);

      // If license URL is configured, auto-sync in background
      if (data.githubLicenseUrl) {
        verifyLicenseFromRemote(data.githubLicenseUrl, currentDeviceId, false);
      }
    });
  }

  async function generateUniqueDeviceId() {
    try {
      const specs = [
        navigator.platform || "unknown",
        navigator.hardwareConcurrency || 4,
        screen.width + "x" + screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
      ].join("###");
      const msgUint8 = new TextEncoder().encode(specs);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return "DEV-" + hashHex.substring(0, 12).toUpperCase();
    } catch (e) {
      return "DEV-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    }
  }

  // Copy Device ID
  if (btnCopyDeviceId) {
    btnCopyDeviceId.addEventListener("click", () => {
      if (!currentDeviceId) return;
      navigator.clipboard.writeText(currentDeviceId).then(() => {
        const originalText = btnCopyDeviceId.textContent;
        btnCopyDeviceId.textContent = "✓ Copied!";
        btnCopyDeviceId.style.background = "#10b981";
        setTimeout(() => {
          btnCopyDeviceId.textContent = originalText;
          btnCopyDeviceId.style.background = "";
        }, 1800);
      });
    });
  }

  // Save License URL
  if (btnSaveLicenseUrl) {
    btnSaveLicenseUrl.addEventListener("click", () => {
      const url = inputLicenseUrl.value.trim();
      if (!url) {
        alert("অনুগ্রহ করে একটি সঠিক GitHub Raw URL দিন!");
        return;
      }
      chrome.storage.local.set({ githubLicenseUrl: url }, () => {
        alert("✓ GitHub License URL সেভ হয়েছে! এখন লাইসেন্স চেক করা হচ্ছে...");
        verifyLicenseFromRemote(url, currentDeviceId, true);
      });
    });
  }

  // Refresh / Sync License
  if (btnCheckLicense) {
    btnCheckLicense.addEventListener("click", () => {
      chrome.storage.local.get(["githubLicenseUrl"], (data) => {
        const url = (inputLicenseUrl && inputLicenseUrl.value.trim()) || data.githubLicenseUrl;
        if (!url) {
          alert("GitHub License URL সেট করা নেই! নিচের '⚙️ GitHub License URL সেটিংস'-এ গিয়ে আপনার রিপোজিটরির Raw URL দিন।");
          return;
        }
        verifyLicenseFromRemote(url, currentDeviceId, true);
      });
    });
  }

  async function verifyLicenseFromRemote(url, deviceId, isManualClick = false) {
    if (subStatusInfo) {
      subStatusInfo.textContent = "সার্ভার থেকে লাইসেন্স যাচাই হচ্ছে...";
      subStatusInfo.style.color = "#38bdf8";
    }

    try {
      // Fetch with cache busting to get real-time status from GitHub
      const response = await fetch(`${url}?t=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const json = await response.json();
      const devices = json.devices || {};
      const userRecord = devices[deviceId];

      if (!userRecord) {
        // Device not registered in licenses.json
        chrome.storage.local.set({ isLicensed: false, licenseExpiry: null });
        updateLicenseUI(false, null, null, "ডিভাইসটি ডাটাবেসে পাওয়া যায়নি! Admin-কে আপনার ডিভাইস আইডি পাঠান।");
        if (isManualClick) alert(`❌ লাইসেন্স নিষ্ক্রিয়! আপনার ডিভাইস আইডি (${deviceId}) অ্যাডমিনের licenses.json এ যুক্ত নেই।`);
        return;
      }

      const now = Date.now();
      const expiry = new Date(userRecord.expiryDate).getTime();
      const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      const isActive = diffDays > 0 && userRecord.status !== "blocked";

      chrome.storage.local.set({
        isLicensed: isActive,
        licenseExpiry: expiry,
        licenseUser: userRecord.name || "User"
      });

      updateLicenseUI(isActive, expiry, userRecord.name);

      if (isManualClick) {
        if (isActive) {
          alert(`✅ অভিনন্দন ${userRecord.name || ""}! আপনার সাবস্ক্রিপশন সক্রিয়। বাকি আছে: ${diffDays} দিন।`);
        } else {
          alert(`❌ আপনার লাইসেন্সের মেয়াদ শেষ হয়ে গেছে!`);
        }
      }
    } catch (err) {
      console.warn("License sync error:", err);
      if (subStatusInfo) {
        subStatusInfo.innerHTML = `<span style="color: #f87171;">⚠️ সার্ভারের সাথে যোগাযোগ ব্যর্থ: ${err.message}</span>`;
      }
    }
  }

  function updateLicenseUI(isLicensed, expiryDate, userName, customMsg) {
    if (!subStatusInfo || !subBadge) return;

    if (customMsg) {
      subStatusInfo.innerHTML = `<span style="color: #f87171;">${customMsg}</span>`;
      subBadge.textContent = "Inactive";
      subBadge.className = "badge-status disconnected";
      return;
    }

    if (!expiryDate) {
      subStatusInfo.innerHTML = `<span style="color: #94a3b8;">কোনো সক্রিয় সাবস্ক্রিপশন নেই</span>`;
      subBadge.textContent = "Inactive";
      subBadge.className = "badge-status disconnected";
      return;
    }

    const now = Date.now();
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (isLicensed && diffDays > 0) {
      subBadge.textContent = "Active";
      subBadge.className = "badge-status connected";
      subStatusInfo.innerHTML = `
        <div style="color: #34d399;">
          ✅ সক্রিয় ইউজার: <b>${userName || "User"}</b><br>
          <span style="font-size: 11px; color: #cbd5e1;">মেয়াদ বাকি: <b>${diffDays} দিন</b> (${new Date(expiryDate).toLocaleDateString()})</span>
        </div>
      `;
    } else {
      subBadge.textContent = "Expired";
      subBadge.className = "badge-status disconnected";
      subStatusInfo.innerHTML = `
        <div style="color: #f87171;">
          ❌ মেয়াদ শেষ (Expired)<br>
          <span style="font-size: 11px; color: #94a3b8;">রিনিউ করার জন্য Admin-এর সাথে যোগাযোগ করুন</span>
        </div>
      `;
    }
  }

  function showMessage(text, type) {
    messageBox.className = `message-box ${type}`;
    messageBox.textContent = text;
    messageBox.style.display = "block";
  }

  function updateStatus(isReady) {
    if (isReady) {
      statusBadge.textContent = "Active";
      statusBadge.className = "badge-status connected";
    } else {
      statusBadge.textContent = "No Key";
      statusBadge.className = "badge-status disconnected";
    }
  }
});

