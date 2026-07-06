# 🛡️ DevVault — Privacy Policy

> **Your Privacy Matters**
> DevVault is built with an offline-first architecture. Your data stays on your device — always.

| Effective Date | Architecture | Version |
|:-:|:-:|:-:|
| July 6, 2025 | Offline-First | 1.0.0 |

---

## ℹ️ Overview

DevVault ("the App") is a developer-focused mobile application that allows you to save, organize, manage, and understand code snippets directly on your device. This Privacy Policy explains what data the App handles, how it is stored, and your rights regarding that data.

By using DevVault, you agree to the practices described in this policy. If you do not agree, please discontinue use of the App.

---

## 📦 Data We Collect

### Snippet Data

All code snippets you create — including titles, code content, programming language, tags, and favorite status — are stored exclusively in a local SQLite database on your device.

### Application Preferences

Theme preferences (light, dark, or system) and application settings such as onboarding state are stored locally using AsyncStorage. These preferences never leave your device.

### API Keys

If you choose to use AI-powered features, your OpenAI API key is stored securely on your device using Expo SecureStore, which leverages the platform's native keychain (iOS Keychain / Android Keystore). The App never transmits your API key to any server other than the AI provider (OpenAI) when you explicitly request an AI explanation.

### Files & Attachments

Screenshots, code files, templates, and other resources attached to snippets are stored locally on your device's filesystem using Expo FileSystem. Files are organized into dedicated directories (screenshots, code files, templates) and remain entirely on-device. They are not uploaded to any cloud service.

### AI Explanations

When you generate an AI-powered code explanation, the resulting response is cached locally in your SQLite database so you can access it offline without re-requesting it.

---

## 🗄️ How Data Is Stored

DevVault uses the following storage technologies, each for a specific purpose:

| Technology | Purpose |
|---|---|
| **SQLite** | Snippet database, tags, programming languages, file metadata, AI explanations |
| **AsyncStorage** | Theme & app preferences, onboarding state |
| **SecureStore** | API keys & sensitive credentials (encrypted via native keychain) |
| **Expo FileSystem** | Attached screenshots, code files, downloaded templates, exported snippets |

All storage is local to your device. No data is synced to external servers or cloud storage as part of the App's core functionality.

---

## ⭐ AI Code Explanation

DevVault offers an optional AI-powered feature that generates code explanations, summaries, and improvement suggestions for your snippets using OpenAI's GPT-4o model.

### How It Works

- When you request an AI explanation, the selected snippet's code content and programming language are sent to the OpenAI API using the API key you have provided.
- The request is made directly from your device to OpenAI — no intermediary servers are involved. DevVault does not operate any backend servers.
- AI-generated responses are cached locally in your SQLite database for offline access, so the same snippet does not need to be re-analyzed.
- We do not store, log, or have access to any data sent to or received from OpenAI.

> [!WARNING]
> Please review [OpenAI's privacy policy](https://openai.com/privacy/) to understand how they handle data sent via API requests. DevVault has no control over third-party data processing.

---

## 🔗 Export & Sharing

DevVault allows you to export and share your snippets through the following mechanisms:

- Export snippets as `.txt`, `.js`, or `.json` files saved locally on your device.
- Share snippets with other applications using your device's native share sheet (via Expo Sharing).
- Exported files are saved to your device's local storage and are not uploaded automatically.

When you use the share functionality, the destination app's privacy policy governs how the shared data is handled. DevVault does not track or log sharing activity.

---

## 🏠 Data We Do NOT Collect

DevVault is designed with privacy at its core. We do **not**:

- Collect personal information (name, email, phone number)
- Track your location or device identifiers
- Use analytics, telemetry, or crash-reporting SDKs
- Display advertisements or use ad-tracking
- Require user accounts or authentication
- Sync, upload, or back up your data to any server
- Share any data with third parties (except as described in the AI section above)

---

## 🔐 Device Permissions

DevVault may request the following device permissions:

| Permission | Reason |
|---|---|
| 📷 **Camera** | Capture screenshots for snippet attachments |
| 🖼️ **Photo Library** | Select images to attach to snippets |
| 📄 **File Access** | Import, export, and manage local files |
| 🔑 **Biometric Auth** | Protect access to sensitive stored credentials |

All permissions are optional and requested only when you initiate the relevant action. Denying a permission will not affect other App functionality.

---

## 🗑️ Data Retention & Deletion

Since all data is stored locally on your device, you have full control over its lifecycle:

- Delete individual snippets, files, tags, or AI explanations at any time through the App's interface.
- Use the "Reset Local Database" option in Settings to erase all snippet data, tags, languages, file records, and AI explanations at once.
- Uninstalling the App will remove all locally stored data permanently.
- Stored API keys can be cleared from Settings or will be removed automatically on uninstall.

---

## 👨‍👩‍👧‍👦 Children's Privacy

DevVault is a general-purpose developer tool and is not directed at children under 13. We do not knowingly collect any personal information from children. Since the App does not collect personal data from any user, no special provisions for children's data apply.

---

## 📝 Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in the App's functionality or for legal compliance. Any updates will be published within the App and on this page with a revised effective date. Continued use of the App after changes constitutes acceptance of the updated policy.

---

## 📬 Contact Us

If you have questions, concerns, or feedback regarding this Privacy Policy or the App's data practices, please reach out:

- ✉️ **Email:** [prashantchandel6144@gmail.com](mailto:prashantchandel6144@gmail.com)
- 🏷️ **App:** DevVault v1.0.0
- 🐙 **GitHub:** [Prashant-Chandel-6144/snippet-vault](https://github.com/Prashant-Chandel-6144/snippet-vault)

---

<p align="center">
  <strong>DevVault</strong> — Privacy-first, offline-first.<br/>
  © 2025 DevVault. All rights reserved.
</p>
