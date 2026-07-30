import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';
import { CryptoUtils } from '../utils/cryptoUtils';

export default function Repository({ showToast }) {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentCategory, setCurrentCategory] = useState('all');
  const [currentBatch, setCurrentBatch] = useState('all');
  const [currentSearch, setCurrentSearch] = useState('');
  
  // Modals state
  const [activeProject, setActiveProject] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const currentUser = AppAuth.getCurrentUser();

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/projects');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setProjects(data.projects || []);
      } else {
        showToast('Failed to load projects: ' + data.message, 'error');
      }
    } catch (err) {
      console.warn('Load projects warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const imagePool = [
    '/images/edu_cover.jpg',
    '/images/cover_1.jpg',
    '/images/tech_cover.jpg',
    '/images/cover_2.jpg',
    '/images/edtech_cover.jpg',
    '/images/cover_4.jpg',
    '/images/thesis_cover.jpg',
    '/images/cover_3.jpg'
  ];

  const getProjectImage = (id, title) => {
    const hashStr = (id || '') + (title || '');
    let hashNum = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hashNum = (hashNum << 5) - hashNum + hashStr.charCodeAt(i);
      hashNum |= 0;
    }
    return imagePool[Math.abs(hashNum) % imagePool.length];
  };

  const filteredProjects = projects.filter(p => {
    if (currentCategory !== 'all' && p.category !== currentCategory) return false;
    if (currentBatch !== 'all' && p.batch !== currentBatch) return false;
    if (currentSearch.trim()) {
      const q = currentSearch.toLowerCase().trim();
      const matchTitle = (p.title || '').toLowerCase().includes(q);
      const matchDesc = (p.description || '').toLowerCase().includes(q);
      const matchAuthor = (p.authorName || '').toLowerCase().includes(q) || (p.authorEmail || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor) return false;
    }
    return true;
  });

  const handleOpenDetails = (proj) => {
    setActiveProject(proj);
    setShowDetailsModal(true);
  };

  const handleOpenRequest = (proj) => {
    if (!currentUser) {
      showToast('Please login to request access to this project.', 'error');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    const userEmailPrefix = (currentUser.email || '').split('@')[0].toLowerCase();
    const authorEmailPrefix = (proj.authorEmail || '').split('@')[0].toLowerCase();

    if (
      currentUser.email.toLowerCase() === proj.authorEmail.toLowerCase() ||
      userEmailPrefix === authorEmailPrefix
    ) {
      showToast('⚠️ You cannot request access to your own project! You are the author.', 'warning');
      return;
    }
    setActiveProject(proj);
    setShowRequestModal(true);
  };

  const handleOpenDecrypt = (proj) => {
    setActiveProject(proj);
    setDecryptPassword('');
    setShowDecryptModal(true);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || !activeProject) return;

    try {
      const res = await fetch(`/api/projects/${activeProject.id}/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterUid: currentUser.uid,
          requesterEmail: currentUser.email,
          requesterName: currentUser.displayName
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Access request submitted successfully!', 'success');
        setShowRequestModal(false);
        loadProjects();
      } else {
        showToast('Error: ' + data.message, 'error');
      }
    } catch (err) {
      showToast('Network error submitting request.', 'error');
    }
  };

  const handleDecryptDownload = async () => {
    if (!decryptPassword.trim()) {
      showToast('Please enter the decryption password.', 'error');
      return;
    }
    if (!activeProject) return;

    setIsDecrypting(true);
    try {
      const downloadUrl = `/api/drive/download/${activeProject.fileId}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error('Could not fetch encrypted file from storage.');
      }
      const encryptedText = await response.text();
      const { blob, originalName } = CryptoUtils.decryptFilePayload(encryptedText, decryptPassword.trim());

      CryptoUtils.downloadBlob(blob, originalName || activeProject.fileName.replace('.enc', ''));
      showToast('✅ File decrypted and downloaded successfully!', 'success');
      setShowDecryptModal(false);
    } catch (err) {
      showToast('❌ Decryption Failed! ' + err.message, 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="container">
      {/* Hero Banner */}
      <header className="hero-banner">
        <div className="zero-knowledge-badge">
          <span>🔐 Zero-Knowledge Security Architecture</span>
        </div>
        <h1 className="hero-title" style={{ marginTop: '1rem' }}>Department Project Repository</h1>
        <p className="hero-subtitle">
          Secure academic archive for Educational, Technical, EdTech, and Thesis projects across all student batches. Files are encrypted client-side using AES-256 before reaching the cloud.
        </p>
      </header>

      {/* Control Bar */}
      <section className="controls-bar">
        <div className="category-tabs">
          <button
            className={`category-btn ${currentCategory === 'all' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('all')}
          >
            All Projects
          </button>
          <button
            className={`category-btn ${currentCategory === 'Educational Projects' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('Educational Projects')}
          >
            📖 Educational
          </button>
          <button
            className={`category-btn ${currentCategory === 'Technical Projects' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('Technical Projects')}
          >
            ⚡ Technical
          </button>
          <button
            className={`category-btn ${currentCategory === 'EdTech Projects' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('EdTech Projects')}
          >
            🚀 EdTech
          </button>
          <button
            className={`category-btn ${currentCategory === 'Thesis Projects' ? 'active' : ''}`}
            onClick={() => setCurrentCategory('Thesis Projects')}
          >
            🔬 Thesis
          </button>
        </div>

        <div className="filter-group">
          <select
            value={currentBatch}
            onChange={(e) => setCurrentBatch(e.target.value)}
            className="select-input"
            style={{ maxWidth: '150px' }}
          >
            <option value="all">🎓 All Batches</option>
            <option value="1st Batch">1st Batch</option>
            <option value="2nd Batch">2nd Batch</option>
            <option value="3rd Batch">3rd Batch</option>
            <option value="4th Batch">4th Batch</option>
            <option value="5th Batch">5th Batch</option>
            <option value="6th Batch">6th Batch</option>
            <option value="7th Batch">7th Batch</option>
            <option value="8th Batch">8th Batch</option>
          </select>
          <input
            type="text"
            value={currentSearch}
            onChange={(e) => setCurrentSearch(e.target.value)}
            name="search_query_filter_unique_input"
            id="search_query_filter_unique_input"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            data-lpignore="true"
            className="search-input"
            placeholder="🔍 Search title, author, keywords..."
          />
        </div>
      </section>

      {/* Projects Grid */}
      <main className="projects-grid">
        {loading ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            ⏳ Loading department projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 1rem', background: 'var(--bg-card)', borderRadius: '26px', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
            <h3 style={{ marginBottom: '0.5rem' }}>No projects found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try clearing your filters or search terms.</p>
          </div>
        ) : (
          filteredProjects.map(p => {
            const userEmailPrefix = currentUser?.email ? currentUser.email.split('@')[0].toLowerCase() : '';
            const authorEmailPrefix = (p.authorEmail || '').split('@')[0].toLowerCase();
            const isAuthor = currentUser && (
              currentUser.email.toLowerCase() === (p.authorEmail || '').toLowerCase() ||
              (userEmailPrefix && userEmailPrefix === authorEmailPrefix)
            );

            const userReq = (currentUser && !isAuthor && p.accessRequests) 
              ? p.accessRequests.find(r => r.requesterEmail.toLowerCase() === currentUser.email.toLowerCase() || (r.requesterEmail.split('@')[0].toLowerCase() === userEmailPrefix)) 
              : null;
            const reqStatus = userReq ? userReq.status : null;

            let badgeClass = 'badge-educational';
            if (p.category === 'Technical Projects') badgeClass = 'badge-technical';
            if (p.category === 'EdTech Projects') badgeClass = 'badge-edtech';
            if (p.category === 'Thesis Projects') badgeClass = 'badge-thesis';

            const coverImgSrc = getProjectImage(p.id, p.title);

            return (
              <div key={p.id} className="project-card">
                <div className="card-banner-img">
                  <img src={coverImgSrc} alt={p.title} loading="lazy" />
                </div>
                <div>
                  <div className="card-header">
                    <span className={`category-badge ${badgeClass}`}>{p.category}</span>
                    <span className="batch-pill">🎓 {p.batch}</span>
                  </div>
                  <h3 className="project-title">{p.title}</h3>
                  <p className="project-desc">{p.description}</p>
                </div>

                <div>
                  <div className="author-meta">
                    <span>👤 Author: <strong>{p.authorName || p.authorEmail}</strong></span>
                  </div>
                  <div className="card-footer">
                    <button onClick={() => handleOpenDetails(p)} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                      ℹ️ Details
                    </button>
                    {isAuthor ? (
                      <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                        ⚙️ Manage (Author)
                      </button>
                    ) : reqStatus === 'approved' ? (
                      <button onClick={() => handleOpenDecrypt(p)} className="btn btn-success" style={{ fontSize: '0.8rem' }}>
                        🔓 Decrypt & Download
                      </button>
                    ) : reqStatus === 'pending' ? (
                      <span className="status-badge status-pending">⏳ Request Pending</span>
                    ) : reqStatus === 'rejected' ? (
                      <span className="status-badge status-rejected">❌ Access Denied</span>
                    ) : (
                      <button onClick={() => handleOpenRequest(p)} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                        🔑 Request Access
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Details Modal */}
      {showDetailsModal && activeProject && (
        <div className="modal-backdrop show" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{activeProject.title}</h2>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>&times;</button>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <span className="category-badge badge-edtech">{activeProject.category}</span>
                <span className="batch-pill">{activeProject.batch}</span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>{activeProject.description}</p>
              <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem' }}>
                <div>👤 Author: <strong>{activeProject.authorName} ({activeProject.authorEmail})</strong></div>
                <div style={{ marginTop: '0.25rem' }}>📄 File: <code>{activeProject.fileName}</code></div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && activeProject && (
        <div className="modal-backdrop show" onClick={() => setShowRequestModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔑 Request Access</h2>
              <button className="close-btn" onClick={() => setShowRequestModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
                You are requesting permission to access and decrypt <strong style={{ color: 'var(--text-main)' }}>{activeProject.title}</strong>.
              </p>
              <div className="form-group">
                <label className="form-label">Project Author</label>
                <div style={{ color: 'var(--secondary)', fontWeight: 600 }}>{activeProject.authorEmail}</div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Email Address</label>
                <input type="email" value={currentUser?.email || ''} className="form-input" readOnly required />
              </div>
              <div className="form-hint" style={{ marginBottom: '1.5rem' }}>
                The author will review your request in their dashboard. Once approved, you will be able to unlock the encrypted payload.
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowRequestModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decrypt Modal */}
      {showDecryptModal && activeProject && (
        <div className="modal-backdrop show" onClick={() => setShowDecryptModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔓 Decrypt & Download Project</h2>
              <button className="close-btn" onClick={() => setShowDecryptModal(false)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Decryption for <strong style={{ color: 'var(--text-main)' }}>{activeProject.title}</strong> happens zero-knowledge inside your browser using <strong>CryptoJS AES-256</strong>.
            </p>
            <div className="form-group">
              <label className="form-label">Enter Secret Encryption Password</label>
              <input
                type="password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                className="form-input"
                placeholder="Secret Key set by author..."
                required
              />
              <div style={{ marginTop: '0.6rem', background: 'rgba(217, 122, 83, 0.1)', padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(217, 122, 83, 0.3)', fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600 }}>
                🔑 <strong>Passcode Key:</strong> <code>{activeProject.passwordKey || '123456'}</code>
              </div>
              <div className="form-hint" style={{ marginTop: '0.4rem' }}>Only the author holds the password key. Enter it to decrypt the file payload.</div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDecryptModal(false)}>Cancel</button>
              <button type="button" onClick={handleDecryptDownload} disabled={isDecrypting} className="btn btn-success">
                {isDecrypting ? '⏳ Decrypting...' : '🔓 Decrypt & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
