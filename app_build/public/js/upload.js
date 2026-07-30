/**
 * EdTech Secure Project Repository - Client-Side Encrypted Upload Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const user = AppAuth.getCurrentUser();
  if (!user) {
    showToast('Please login to upload a project.', 'error');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  const projectTitleInput = document.getElementById('projectTitle');
  if (projectTitleInput) {
    const clearTitle = () => { if (projectTitleInput.value && projectTitleInput.value.includes('@')) projectTitleInput.value = ''; };
    projectTitleInput.value = '';
    setTimeout(clearTitle, 50);
    setTimeout(clearTitle, 300);
    setTimeout(clearTitle, 800);
  }

  const uploadForm = document.getElementById('projectUploadForm');
  if (uploadForm) {
    uploadForm.addEventListener('submit', handleUploadSubmit);
  }
});

async function handleUploadSubmit(e) {
  e.preventDefault();

  const user = AppAuth.getCurrentUser();
  if (!user) return;

  const title = document.getElementById('projectTitle').value.trim();
  const category = document.getElementById('projectCategory').value;
  const batch = document.getElementById('projectBatch').value;
  const description = document.getElementById('projectDescription').value.trim();
  const password = document.getElementById('encryptionPassword').value.trim();
  const fileInput = document.getElementById('projectFile');

  if (!title || !category || !batch || !password || !fileInput.files.length) {
    showToast('Please fill out all required fields and choose a file.', 'error');
    return;
  }

  const selectedFile = fileInput.files[0];
  const submitBtn = document.getElementById('submitUploadBtn');
  const uploadProgressStatus = document.getElementById('uploadStatusText');

  submitBtn.disabled = true;
  submitBtn.innerHTML = '🔒 Encrypting AES-256 Client-Side...';
  uploadProgressStatus.innerText = '🔒 Performing Zero-Knowledge AES-256 Encryption in browser memory...';

  try {
    // 1. Client-Side AES-256 Encryption via CryptoJS
    const { encryptedBlob, originalName, mimeType } = await CryptoUtils.encryptFile(selectedFile, password);

    uploadProgressStatus.innerText = '☁️ Uploading encrypted payload to Google Drive Storage...';
    submitBtn.innerHTML = '☁️ Uploading to Storage...';

    // 2. Upload Encrypted Payload Blob to Backend / Google Drive
    const formData = new FormData();
    formData.append('encryptedFile', encryptedBlob, `${originalName}.enc`);

    const driveRes = await fetch('/api/drive/upload', {
      method: 'POST',
      body: formData
    });
    const driveData = await driveRes.json();

    if (!driveData.success) {
      throw new Error('Storage upload failed: ' + driveData.message);
    }

    uploadProgressStatus.innerText = '📝 Registering Metadata in Firestore...';

    // 3. Save Project Metadata to Firestore / Database
    const metadataPayload = {
      title,
      category,
      batch,
      description,
      authorUid: user.uid,
      authorEmail: user.email,
      authorName: user.displayName,
      fileId: driveData.fileId,
      fileName: `${originalName}.enc`,
      driveUrl: driveData.driveUrl
    };

    const projectRes = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metadataPayload)
    });
    const projectData = await projectRes.json();

    if (!projectData.success) {
      throw new Error('Metadata save failed: ' + projectData.message);
    }

    showToast('🎉 Project encrypted & uploaded successfully!', 'success');
    uploadProgressStatus.innerText = '✅ Upload complete! Redirecting to Repository...';

    setTimeout(() => {
      window.location.href = '/index.html';
    }, 1200);

  } catch (err) {
    console.error(err);
    showToast('❌ Upload Error: ' + err.message, 'error');
    uploadProgressStatus.innerText = '❌ Error during encryption or upload.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '🔒 Encrypt & Upload Project';
  }
}
