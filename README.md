# EdTech Secure Project Repository 🎓🔐

**EdTech Secure Project Repository** is a zero-knowledge cloud repository web application designed for university departments to store, organize, and share student and faculty projects securely across all academic batches.

---

## 🌟 Key Features

1. **Category Organization**:
   - 📖 **Educational Projects** (শিক্ষামূলক)
   - ⚡ **Technical Projects** (টেকনিক্যাল)
   - 🚀 **EdTech Projects** (এডটেক)
   - 🔬 **Thesis Projects** (থিসিস)

2. **Batch Filtering & Global Search**:
   - Filter projects seamlessly by Batch (1st Batch through latest) or search by project title, author, and keywords.

3. **Zero-Knowledge Client-Side AES-256 Encryption**:
   - All files are encrypted inside the browser using **CryptoJS (AES-256-CBC)** before reaching the network or cloud storage.
   - Passwords and plain-text file data are **never stored** on the server or in database fields.

4. **Author-Gated Access Request System**:
   - Requesters submit an access request to view/download a project.
   - Project authors receive notifications on their personal dashboard to **Approve** or **Reject** requests.
   - Approved users enter the encryption secret key to decrypt and download files on their client machine.

5. **Cloud Storage & Database Integration**:
   - Metadata stored in **Firebase Firestore**.
   - Encrypted files saved to **Google Drive API v3** (with built-in local cloud fallback for instant offline testing).
   - User authentication powered by **Firebase Auth**.

---

## 🚀 Quick Start Guide

### 1. Installation
Navigate into the `app_build/` directory and install dependencies:
```bash
cd app_build
npm install
```

### 2. Configuration (Optional)
Copy `.env.example` to `.env` if configuring real Google Drive or Firebase credentials:
```bash
cp .env.example .env
```
*(Note: If no credentials are configured, the app runs smoothly with integrated local storage and client-side database simulation for instant demonstration.)*

### 3. Run Application
Start the Node.js Express server:
```bash
npm start
```
Open your browser and visit: `http://localhost:3000`

---

## 📁 Repository Structure

```
├── app_build/               # Application Codebase
│   ├── server.js            # Express Node Server
│   ├── package.json         # Node Dependencies
│   ├── services/            # Storage & Database Services
│   ├── routes/              # Express API Routes
│   └── public/              # Frontend Web Client
│       ├── index.html       # Repository Browser
│       ├── dashboard.html   # Author Management Console
│       ├── upload.html      # Encrypted Upload Interface
│       ├── login.html       # Firebase Auth Page
│       ├── css/style.css    # Dark Glassmorphism Styling
│       └── js/              # Application Logic & Encryption
├── production_artifacts/    # Documentation & Specifications
│   └── IMPLEMENTATION_PLAN.md
└── README.md
```
