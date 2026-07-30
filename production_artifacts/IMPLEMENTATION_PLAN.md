# IMPLEMENTATION PLAN - EdTech Secure Project Repository

## 🎯 System Overview
The **EdTech Secure Project Repository** is a secure, cloud-based project management system built for university departments. It safely archives academic projects across all student batches (from 1st Batch to latest Batch) under four distinct project categories:
1. **Educational Projects** (শিক্ষামূলক)
2. **Technical Projects** (টেকনিক্যাল)
3. **EdTech Projects** (এডটেক)
4. **Thesis Projects** (থিসিস)

---

## 🔐 Zero-Knowledge Security & AES-256 Encryption Architecture
1. **Client-Side AES-256 Encryption**:
   - Files selected for upload are encrypted directly in the user's browser using **CryptoJS (AES-256)** with a secret password provided by the author.
   - The plain-text file content and encryption password are **never sent to the server or database**.
2. **Author Authorization Gate**:
   - Only the author holds initial access to decrypt.
   - Non-authors can browse metadata (Title, Batch, Category, Description) and click **"Request Access"**.
   - The author receives access requests on their personal dashboard and can **Approve** or **Reject** access.
3. **Decryption & Download**:
   - Requesters who receive author approval can download the encrypted payload from storage.
   - Decryption occurs entirely inside the client's browser after providing the matching secret key.

---

## 💻 Technology Stack & Components
- **Backend**: Node.js + Express (`server.js`)
- **Storage Integration**: Google Drive API v3 (via `googleapis` service with seamless local disk fallback for zero-config offline execution)
- **Database**: Firebase Firestore (for storing project metadata and request statuses)
- **Auth**: Firebase Auth (Email/Password authentication)
- **Encryption**: CryptoJS (Client-side AES-256-CBC with PBKDF2 key derivation)
- **Frontend**: HTML5, Modern CSS (Glassmorphism, Neon dynamic gradients, responsive grid), Vanilla JS.

---

## 📁 Directory Structure
```
app_build/
├── package.json
├── server.js
├── .env.example
├── services/
│   ├── firebaseService.js
│   └── googleDriveService.js
├── routes/
│   ├── projects.js
│   └── drive.js
└── public/
    ├── index.html
    ├── login.html
    ├── dashboard.html
    ├── upload.html
    ├── css/
    │   └── style.css
    └── js/
        ├── firebase-config.js
        ├── crypto-utils.js
        ├── auth.js
        ├── app.js
        ├── upload.js
        └── dashboard.js
```
