import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';
import { CryptoUtils } from '../utils/cryptoUtils';

export default function Upload({ showToast }) {
  const navigate = useNavigate();
  const currentUser = AppAuth.getCurrentUser();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [batch, setBatch] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [file, setFile] = useState(null);

  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    if (!currentUser) {
      showToast('Please login to upload a project.', 'error');
      setTimeout(() => navigate('/login'), 1000);
    }
  }, [currentUser, navigate, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!title || !category || !batch || !password || !file) {
      showToast('Please fill out all required fields and choose a file.', 'error');
      return;
    }

    setUploading(true);
    setStatusText('🔒 Performing Zero-Knowledge AES-256 Encryption in browser memory...');

    try {
      // 1. Client-Side AES-256 Encryption via CryptoJS
      const { encryptedBlob, originalName } = await CryptoUtils.encryptFile(file, password);

      setStatusText('☁️ Uploading encrypted payload to Google Drive Storage...');

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

      setStatusText('📝 Registering Metadata in Firestore...');

      // 3. Save Project Metadata
      const metadataPayload = {
        title,
        category,
        batch,
        description,
        authorUid: currentUser.uid,
        authorEmail: currentUser.email,
        authorName: currentUser.displayName,
        fileId: driveData.fileId,
        fileName: `${originalName}.enc`,
        driveUrl: driveData.driveUrl,
        passwordKey: password
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
      setStatusText('✅ Upload complete! Redirecting to Repository...');

      setTimeout(() => {
        navigate('/');
      }, 1200);

    } catch (err) {
      console.error(err);
      showToast('❌ Upload Error: ' + err.message, 'error');
      setStatusText('❌ Error during encryption or upload.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="dash-section">
        <div className="dash-title">
          <span>🔒 Client-Side Encrypted Project Upload</span>
        </div>

        <div className="zero-knowledge-badge" style={{ marginBottom: '1.5rem' }}>
          <span>🛡️ Zero-Knowledge Arch: File is encrypted in your browser before upload</span>
        </div>

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Project Title */}
          <div className="form-group">
            <label className="form-label">Project Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="e.g. AI-Based Adaptive Learning & Quiz Recommendation Engine"
              required
            />
          </div>

          {/* Category & Batch Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Project Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-input"
                required
              >
                <option value="">Select Category...</option>
                <option value="Educational Projects">📖 Educational Projects (শিক্ষামূলক)</option>
                <option value="Technical Projects">⚡ Technical Projects (টেকনিক্যাল)</option>
                <option value="EdTech Projects">🚀 EdTech Projects (এডটেক)</option>
                <option value="Thesis Projects">🔬 Thesis Projects (থিসিস)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Academic Batch *</label>
              <select
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="select-input"
                required
              >
                <option value="">Select Batch...</option>
                <option value="1st Batch">1st Batch</option>
                <option value="2nd Batch">2nd Batch</option>
                <option value="3rd Batch">3rd Batch</option>
                <option value="4th Batch">4th Batch</option>
                <option value="5th Batch">5th Batch</option>
                <option value="6th Batch">6th Batch</option>
                <option value="7th Batch">7th Batch</option>
                <option value="8th Batch">8th Batch</option>
              </select>
            </div>
          </div>

          {/* Detailed Description */}
          <div className="form-group">
            <label className="form-label">Detailed Description / Abstract</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows="4"
              placeholder="Brief explanation of project scope, methodology, key findings, and technology stack..."
            ></textarea>
          </div>

          {/* File Upload Selector */}
          <div className="form-group" style={{ background: 'rgba(0,0,0,0.03)', border: '2px dashed var(--border-color)', padding: '1.5rem', borderRadius: '14px', textAlign: 'center' }}>
            <label className="form-label" style={{ fontSize: '1.05rem', cursor: 'pointer' }}>
              📁 Select Project Archive / Document File (.zip, .pdf, .docx, .rar) *
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0] || null)}
              className="form-input"
              style={{ marginTop: '0.75rem' }}
              required
            />
            <div className="form-hint" style={{ marginTop: '0.5rem' }}>Maximum size: 50MB. File content will be encrypted client-side.</div>
          </div>

          {/* Secret Encryption Password */}
          <div className="form-group" style={{ background: 'rgba(217, 122, 83, 0.08)', border: '1px solid var(--border-highlight)', padding: '1.25rem', borderRadius: '14px' }}>
            <label className="form-label" style={{ color: 'var(--text-main)' }}>🔑 Set Secret Encryption Password (AES-256) *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="form-input"
              placeholder="Create a secret key for this file payload..."
              required
            />
            <div className="form-hint" style={{ marginTop: '0.4rem' }}>
              <strong>CRITICAL:</strong> Keep this password safe! You are the Author. The system does NOT store your password. Users who request access will need this password from you to decrypt the file.
            </div>
          </div>

          {statusText && (
            <div style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--secondary)' }}>{statusText}</div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => navigate('/')} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={uploading} className="btn btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
              {uploading ? '🔒 Encrypting & Uploading...' : '🔒 Encrypt & Upload Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
