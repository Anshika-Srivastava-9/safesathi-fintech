# 🛡️ SafeSathi (सेफसाथी) — AI FinTech Scam & Deception Shield

> **Assistive pre-transaction fraud triage and pre-click threat inspection for elderly and non-tech-savvy digital banking users in India.**
>
> Built for **SPIRIT 3.0 Buildathon** | **FinTech & Security Theme** | Dr. Shakuntala Misra National Rehabilitation University (DSMNRU), Lucknow.

---

## 📌 Problem Statement

Digital banking and UPI have made financial transactions more accessible across India, but social engineering scams continue to put users at risk. Senior citizens and non-technical users can be particularly vulnerable to messages that create panic or imitate trusted institutions.

SafeSathi focuses on three common fraud scenarios:

- ⚡ **Coercive Utility Disconnection Threats:** Fake electricity disconnection warnings that pressure users into downloading suspicious third-party `.apk` applications or making urgent payments.
- 🏦 **Deceptive Banking Phishing:** Messages impersonating banks such as SBI, HDFC, or PNB to solicit PAN details, KYC updates, or banking credentials through unverified links.
- 💸 **UPI Collect Traps:** Fake lottery winnings, prize claims, or tax refunds designed to trick users into approving payment requests or entering their UPI PIN.

A suspicious link can expose users to phishing, malware, or fraudulent payment flows. Many users also struggle to interpret technical security warnings when they are under pressure.

**SafeSathi** addresses these challenges through a dual-tier defense architecture combining local browser-based threat inspection with AI-assisted, plain-language fraud triage.

---

## 🏗️ Dual-Tier System Architecture

SafeSathi combines two complementary components: a Chromium browser extension for local pre-click inspection and a web diagnostic console for deeper message analysis.

```text
┌──────────────────────────────────────────────────────────┐
│                 USER BROWSING / APP USAGE                │
└──────────────────────────┬───────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌────────────────────────────┐ ┌────────────────────────────┐
│ TIER 1: BROWSER EXTENSION  │ │ TIER 2: WEB CONSOLE         │
│ Chromium Manifest V3       │ │ Next.js + Tailwind CSS      │
├────────────────────────────┤ ├────────────────────────────┤
│ • Local link inspection    │ │ • Deterministic rule engine │
│ • APK / UPI indicators     │ │ • Groq-powered AI analysis  │
│ • Suspicious URL patterns  │ │ • Threat Radar breakdown   │
│ • In-memory analysis       │ │ • Hindi / English voice    │
└──────────────┬─────────────┘ └──────────────┬─────────────┘
               │                              │
               ▼                              ▼
┌────────────────────────────┐ ┌────────────────────────────┐
│ Local Threat Assessment    │ │ Diagnostic Verdict         │
│ Before Following a Link    │ │ Guidance + 1930 Helpline   │
└────────────────────────────┘ └────────────────────────────┘
```

### 1. Tier 1: Client-Side Extension

**Purpose:** Inspect suspicious links and visible page content locally before users follow potentially dangerous links.

- **Directory:** `extension/`
- **Platform:** Chromium Manifest V3
- **Local Rule Engine:** Checks suspicious `.apk` links, `upi://pay` patterns, and potential credential-harvesting indicators.
- **In-Memory Inspection:** Processes inspected content locally without intentionally transmitting it to an external analysis service.
- **Pre-Click Assistance:** Helps users identify suspicious indicators before navigating to a link.

The extension is intended to provide a lightweight, privacy-conscious first layer of defense. Its actual inspection scope depends on the permissions and browser APIs implemented in the extension.

### 2. Tier 2: Web Diagnostic Console

**Purpose:** Analyze suspicious messages and provide understandable, actionable safety guidance.

- **Frontend:** Next.js 16, TypeScript, and Tailwind CSS.
- **API Handler:** `src/app/api/analyze/route.ts`
- **Deterministic Rule Engine:** Uses regular expressions and heuristics to identify suspicious financial requests and urgency-related language.
- **AI-Assisted Analysis:** Uses the Groq SDK with `llama-3.1-8b-instant` to generate structured explanations.
- **Threat Radar:** Visualizes risk indicators across urgency pressure, domain/APK risk, and payment/UPI exploits.
- **Voice Input:** Browser-supported speech recognition for hands-free message entry.
- **Voice Verdict:** Speech synthesis for Hindi and English diagnostic explanations.
- **Emergency Guidance:** Provides access to India's Cyber Crime Helpline at **1930**.

The rule engine and AI analysis serve complementary purposes. Rule-based checks offer predictable detection of known patterns, while the language model helps explain suspicious messages in plain language.

---

## ✨ Key Features

- 🛡️ **Dual-Tier Threat Protection:** Combines local browser inspection with AI-assisted web-based message analysis.
- 🔍 **Deterministic FinTech Rules:** Identifies suspicious links, APK download indicators, UPI payment patterns, and coercive language.
- 🤖 **AI-Powered Explanations:** Converts potentially complex threat indicators into understandable guidance.
- 📊 **Three-Pillar Threat Radar:** Displays separate risk indicators for urgency, domain/APK activity, and payment exploits.
- 🎙️ **Microphone Input (STT):** Enables users to dictate suspicious messages where browser speech recognition is supported.
- 🔊 **Bilingual Voice Assistance (TTS):** Reads diagnostic results aloud in Hindi or English, subject to available browser voices.
- ✅ **False-Positive Mitigation:** Uses heuristics to reduce incorrect warnings for common legitimate notifications.
- 🚨 **Cybercrime Escalation:** Provides quick access to the national cybercrime helpline and reporting resources.
- 🔐 **Privacy-Conscious Design:** Keeps extension inspection local by design and handles the web console's AI requests through a server-side API route.

---

## 🧪 Evaluation Test Suite

The following scenarios can be used to evaluate SafeSathi's detection behavior. Expected verdicts are targets for testing, not a guarantee of the current implementation's performance.

| Test Scenario | Threat Indicator | Expected Result |
|---|---|---|
| ⚡ Electricity Disconnection Alert | Urgency + suspicious APK link | High risk |
| 💳 Fake Bank KYC Message | Unverified domain + credential request | High risk |
| 🎁 Lottery / UPI Collect Message | Suspicious payment request + prize claim | High risk |
| ✅ Authentic Bank Credit | Informational transaction notification | Low risk / likely safe |
| ✅ Bank Login OTP | Ordinary authentication notification | Low risk / likely safe |
| ✅ Courier Delivery Alert | Routine delivery notification | Low risk / likely safe |

### Evaluation Criteria

- **Threat detection:** Does the system identify relevant suspicious indicators?
- **False-positive handling:** Does it avoid flagging ordinary notifications without sufficient evidence?
- **Explainability:** Does the verdict explain why a message appears suspicious?
- **Accessibility:** Can users understand the result through text and voice?
- **Privacy:** Does the extension avoid unintended transmission of inspected content?
- **Reliability:** Does the application handle malformed input, unavailable AI services, and unexpected model responses safely?

> **Note:** A legitimate-looking message is not automatically safe, and a suspicious-looking message is not necessarily fraudulent. Users should verify important requests through official channels.

---

## 📁 Repository Structure

```text
safesathi-fintech/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   └── popup.js
├── src/
│   └── app/
│       ├── page.tsx
│       ├── layout.tsx
│       └── api/
│           └── analyze/
│               └── route.ts
├── public/
├── .gitignore
├── next.config.ts
├── package.json
└── README.md
```

**Directory overview:**

- `extension/` — Chromium extension configuration, interface, and local analysis logic.
- `src/app/page.tsx` — Web diagnostic console interface.
- `src/app/layout.tsx` — Root layout and application metadata.
- `src/app/api/analyze/route.ts` — Server-side message analysis endpoint.
- `public/` — Static assets and icons.
- `.gitignore` — Excludes configured local files and sensitive environment variables.
- `package.json` — Project dependencies and scripts.

---

## 🚀 Getting Started

### Prerequisites

- Node.js and npm
- A Groq API key
- Google Chrome or Microsoft Edge
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Anshika-Srivastava-9/safesathi-fintech.git
cd safesathi-fintech
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the repository root:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Replace the placeholder with your actual API key.

**Security:** Never commit `.env.local`, publish your API key, or expose server-side credentials in client-side JavaScript.

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the web console

Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧩 Loading the Chromium Extension

1. Open Google Chrome or Microsoft Edge.
2. Navigate to `chrome://extensions/` in Chrome, or `edge://extensions/` in Edge.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the repository's `extension/` directory.
6. Pin the SafeSathi extension to the browser toolbar if desired.
7. Open a suitable webpage and test the extension's implemented inspection workflow.

The extension must have a valid Manifest V3 configuration and the required files before it can be loaded. Browser permissions and supported inspection behavior are determined by `manifest.json` and the extension code.

---

## 🔐 Security & Privacy

SafeSathi is designed with privacy and responsible fraud screening in mind.

- **Local Extension Processing:** Browser-extension rules are intended to inspect content locally without sending it to the web console.
- **Server-Side API Credentials:** The Groq API key belongs in `.env.local` and should only be accessed by server-side code.
- **Data Minimization:** Avoid collecting or retaining unnecessary message content, credentials, or personal information.
- **No Credential Requests:** Users should never provide their UPI PIN, banking password, or OTP to SafeSathi or to suspicious third parties.
- **Safe Error Handling:** AI service failures and malformed responses should not cause the system to label an unverified message as definitively safe.
- **Responsible Risk Scoring:** Threat Radar values are heuristic indicators, not verified probabilities of fraud.
- **Independent Verification:** Users should confirm banking, utility, and payment requests through official channels.

Privacy guarantees depend on the actual implementation, browser permissions, logging configuration, and third-party services used by the web console.

---

## 🚨 Cybercrime Reporting in India

If you suspect financial cyber fraud:

- **Helpline:** Call **1930** promptly.
- **Online reporting:** Visit the official [National Cyber Crime Reporting Portal](https://cybercrime.gov.in/).
- **Banking safety:** Contact your bank using the official contact details published on its website or application.

SafeSathi provides guidance and access to reporting resources; it does not replace official reporting channels or bank security procedures.

---

## 👥 Team

**Team TRIAXIS**

- **Event:** SPIRIT 3.0 Buildathon
- **Theme:** FinTech & Security
- **Institution:** Dr. Shakuntala Misra National Rehabilitation University (DSMNRU), Lucknow, India.

---

## 💡 Vision

To make digital financial safety more accessible through local threat inspection, explainable AI-assisted triage, and vernacular voice guidance—empowering Indian digital banking users to **pause, verify, and act safely** before responding to suspicious financial requests.
