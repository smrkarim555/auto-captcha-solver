# 🤖 Auto AI Captcha Solver (Chrome Extension)

A Chrome extension powered by **Google Gemini Vision API** to analyze and assist with image grid captchas. Includes a complete **Subscription & Device Licensing Manager** with an **Admin Panel** backed by GitHub.

---

## 📁 Project Directory:
```
c:\Users\Rk pc\Desktop\testing\auto-captcha-solver-ai
```

---

## 🚀 Setup Guide (3 Simple Steps):

### 1. Get a Free Gemini API Key (1 minute)
1. Go to [Google AI Studio (API Key Page)](https://aistudio.google.com/app/apikey).
2. Sign in with your Google Account and click **"Create API Key"**.
3. Copy the generated key (Google provides a free tier with high request quotas).

---

### 2. Install Extension in Chrome / Brave / Edge
1. Open your browser and navigate to:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
2. In the top-right corner, turn on **"Developer mode"**.
3. In the top-left corner, click **"Load unpacked"**.
4. Select this directory:
   `c:\Users\Rk pc\Desktop\testing\auto-captcha-solver-ai`
5. The **Auto AI Captcha Solver** extension is now installed.

---

### 3. Configure API Key
1. Click on the extension icon (🤖) in your browser toolbar.
2. Paste your copied **Gemini API Key** into the input box.
3. Click **"Save & Test Key"**.
4. Once the status badge shows `Active`, the extension is ready.

---

## 🔐 Subscription & Licensing System:

Each user installation automatically generates a unique **Device ID** (e.g. `DEV-9B4F82C10AD5`). You can control access, grant trial periods, or activate 1-month subscriptions through the included **Admin Panel**.

### How to Manage Users:
1. Open the Admin Panel directly in your browser:
   ```
   file:///c:/Users/Rk pc/Desktop/testing/auto-captcha-solver-ai/admin.html
   ```
2. The user copies their **Device ID** from the extension popup and sends it to you.
3. In `admin.html`, enter their name, paste their **Device ID**, choose the validity period (e.g. **1 Month / 30 Days**), and click **"Save Subscription"**.
4. Click **"Download licenses.json"** (or **Copy JSON**).
5. Commit / upload `licenses.json` to your GitHub repository.
6. The extension fetches and verifies the subscription in real-time from GitHub!

---

## 🚀 Pushing to GitHub:

This repository is already initialized with Git. Follow these steps to push to your GitHub account:

1. Create a new repository on [GitHub.com](https://github.com/) (e.g. `my-captcha-extension`).
2. Run these commands in PowerShell or Terminal:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
3. Open `licenses.json` in your GitHub repository, click **Raw**, and copy the URL (e.g., `https://raw.githubusercontent.com/username/repo/main/licenses.json`).
4. In the extension popup under **"⚙️ GitHub License URL Settings"**, paste this Raw URL and save. All client extensions will now automatically sync licenses with your GitHub repo!

---

## 🧪 Testing Offline:
A standalone offline demo page is provided for local testing:
1. Open this file in your browser:
   ```
   file:///c:/Users/Rk pc/Desktop/testing/auto-captcha-solver-ai/test-captcha.html
   ```
2. The AI badge will appear in the bottom-right corner and assist with solving the demo tiles.

---

## ⚙️ Key Features:
* **Unique Device ID:** Generates a persistent machine/device fingerprint per installation.
* **Subscription Expiry Control:** Automatic countdown (e.g. 30 days trial/license). Locks functionality when expired.
* **Admin Dashboard (`admin.html`):** Full standalone UI for adding users, tracking days left, and exporting JSON.
* **Domain Restrictions:** Configure allowed domains (e.g. `kolotibablo.com, localhost`) or enable across all sites.
* **Human-like Click Delay:** Configurable delays (e.g. 400ms) between clicks.
* **Multimodal Model Support:** Gemini 2.5 Flash, Gemini 3.1 Flash-Lite, and Gemini 1.5 Flash.
