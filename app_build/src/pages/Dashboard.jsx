import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppAuth } from '../utils/firebaseConfig';
import { CryptoUtils } from '../utils/cryptoUtils';

export default function Dashboard({ showToast }) {
  const navigate = useNavigate();
  const currentUser = AppAuth.getCurrentUser();
  const currentUserEmail = currentUser?.email;

  const [myProjects, setMyProjects] = useState([]);
  const [requestedProjects, setRequestedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decrypt modal state
  const [activeProject, setActiveProject] = useState(null);
  const [showDecryptModal, setShowDecryptModal] = useState(false);
  const [decryptPassword, setDecryptPassword] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const loadDashboardData = async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      // 1. Author's uploaded projects
      try {
        const resAuth = await fetch(`/api/projects/author/${encodeURIComponent(email)}`);
        if (resAuth.ok) {
          const dataAuth = await resAuth.json();
          if (dataAuth.success) {
            setMyProjects(dataAuth.projects || []);
          }
        }
      } catch (e) {
        console.warn('Could not fetch author projects:', e);
      }

      // 2. User's requested projects
      try {
        const resReq = await fetch(`/api/projects/user-requests/${encodeURIComponent(email)}`);
        if (resReq.ok) {
          const dataReq = await resReq.json();
          if (dataReq.success) {
            setRequestedProjects(dataReq.projects || []);
          }
        }
      } catch (e) {
        console.warn('Could not fetch user requested projects:', e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserEmail) {
      showToast('Please login to access your Dashboard.', 'error');
      setTimeout(() => navigate('/login'), 1000);
      return;
    }
    loadDashboardData(currentUserEmail);
  }, [currentUserEmail]);

  const handleUpdateRequestStatus = async (projectId, requesterEmail, newStatus) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/update-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterEmail, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Request updated to ${newStatus}!`, 'success');
        loadDashboardData(currentUser.email);
      } else {
        showToast('Failed to update request: ' + data.message, 'error');
      }
    } catch (err) {
      showToast('Network error updating status.', 'error');
    }
  };

  const handleOpenDecrypt = (proj) => {
    setActiveProject(proj);
    setDecryptPassword('');
    setShowDecryptModal(true);
  };

  const handleDashDecryptDownload = async () => {
    if (!decryptPassword.trim()) {
      showToast('Please enter decryption password.', 'error');
      return;
    }
    if (!activeProject) return;

    setIsDecrypting(true);
    try {
      const downloadUrl = `/api/drive/download/${activeProject.fileId}`;
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Storage file payload not found.');

      const encryptedText = await response.text();
      const { blob, originalName } = CryptoUtils.decryptFilePayload(encryptedText, decryptPassword.trim());

      CryptoUtils.downloadBlob(blob, originalName || activeProject.fileName.replace('.enc', ''));
      showToast('✅ File decrypted and downloaded successfully!', 'success');
      setShowDecryptModal(false);
    } catch (err) {
      showToast('❌ Decryption Failed: ' + err.message, 'error');
    } finally {
      setIsDecrypting(false);
    }
  };

  const totalIncomingRequests = [];
  myProjects.forEach(p => {
    if (p.accessRequests && p.accessRequests.length > 0) {
      p.accessRequests.forEach(r => {
        totalIncomingRequests.push({
          projectId: p.id,
          projectTitle: p.title,
          passwordKey: p.passwordKey,
          requesterEmail: r.requesterEmail,
          requesterName: r.requesterName || r.requesterEmail,
          status: r.status,
          requestedAt: r.requestedAt
        });
      });
    }
  });

  return (
    <div className="container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Author Access Control Dashboard</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {currentUser ? `${currentUser.displayName} (${currentUser.email})` : 'Loading profile...'}
          </div>
        </div>
        <Link to="/upload" className="btn btn-primary">➕ Encrypt & Upload Project</Link>
      </header>

      {/* Incoming Access Requests */}
      <section className="dash-section">
        <div className="dash-title">
          <span>📬 Incoming Access Requests (Your Projects)</span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Review and authorize pending student/faculty access requests for projects you authored.
        </p>

        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>Loading access requests...</div>
        ) : totalIncomingRequests.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>No access requests received yet.</div>
        ) : (
          <table className="requests-table">
            <thead>
              <tr>
                <th>Project Title</th>
                <th>Requester Name / Email</th>
                <th>Date Requested</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {totalIncomingRequests.map((req, idx) => (
                <React.Fragment key={idx}>
                  <tr>
                    <td><strong>{req.projectTitle}</strong></td>
                    <td>
                      {req.requesterName}<br />
                      <small style={{ color: 'var(--text-muted)' }}>{req.requesterEmail}</small>
                    </td>
                    <td>{new Date(req.requestedAt).toLocaleDateString()}</td>
                    <td><span className={`status-badge status-${req.status}`}>{req.status}</span></td>
                    <td>
                      {req.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.projectId, req.requesterEmail, 'approved')}
                            className="btn btn-success"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem', marginRight: '0.3rem' }}
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleUpdateRequestStatus(req.projectId, req.requesterEmail, 'rejected')}
                            className="btn btn-danger"
                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                          >
                            ❌ Reject
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleUpdateRequestStatus(req.projectId, req.requesterEmail, req.status === 'approved' ? 'rejected' : 'approved')}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          Toggle Status
                        </button>
                      )}
                    </td>
                  </tr>
                  {req.status === 'approved' && (
                    <tr style={{ background: 'rgba(108, 128, 105, 0.08)' }}>
                      <td colSpan="5" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', color: 'var(--primary)' }}>
                        💡 <strong>Author Action:</strong> You approved access for <strong>{req.requesterEmail}</strong>. Your project secret password is: <strong style={{ background: '#FAF7F2', padding: '0.15rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--accent)' }}>{req.passwordKey || 'Secret key set during upload'}</strong>. Share this password with the user so they can decrypt & download.
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Authored Projects */}
      <section className="dash-section">
        <div className="dash-title">
          <span>📂 My Authored Projects</span>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>Loading your projects...</div>
        ) : myProjects.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>You have not uploaded any projects yet.</div>
        ) : (
          myProjects.map(p => (
            <div key={p.id} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{p.title}</h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Category: <strong>{p.category}</strong> | Batch: <strong>{p.batch}</strong> | File: <code>{p.fileName}</code> | 🔑 Secret Password: <strong style={{ color: 'var(--accent)', background: 'rgba(217, 122, 83, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>{p.passwordKey || 'Secret key set during upload'}</strong>
                </div>
              </div>
              <div>
                <button onClick={() => handleOpenDecrypt(p)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
                  🔓 Decrypt File
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Requested Projects */}
      <section className="dash-section">
        <div className="dash-title">
          <span>🔑 Projects You Requested Access To</span>
        </div>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>Loading requested projects...</div>
        ) : requestedProjects.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', padding: '1.5rem', textAlign: 'center' }}>You have not requested access to any other projects.</div>
        ) : (
          requestedProjects.map(p => {
            const req = p.accessRequests.find(r => r.requesterEmail.toLowerCase() === currentUser.email.toLowerCase());
            const status = req ? req.status : 'pending';

            return (
              <div key={p.id} style={{ background: 'rgba(0,0,0,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1rem 1.25rem', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>{p.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Author: <strong>{p.authorName || p.authorEmail}</strong> | Status: <span className={`status-badge status-${status}`}>{status}</span>
                    {status === 'approved' && (
                      <span style={{ marginLeft: '0.75rem' }}>
                        🔑 Passcode: <strong style={{ color: 'var(--accent)', background: 'rgba(217, 122, 83, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>{p.passwordKey || '123456'}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {status === 'approved' ? (
                    <button onClick={() => handleOpenDecrypt(p)} className="btn btn-success" style={{ fontSize: '0.8rem' }}>
                      🔓 Decrypt & Download
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Awaiting Author Approval</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Decrypt Modal */}
      {showDecryptModal && activeProject && (
        <div className="modal-backdrop show" onClick={() => setShowDecryptModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">🔓 Decrypt Project Archive</h2>
              <button className="close-btn" onClick={() => setShowDecryptModal(false)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              Decrypting <strong style={{ color: 'var(--text-main)' }}>{activeProject.title}</strong> client-side.
            </p>
            <div className="form-group">
              <label className="form-label">Enter Secret Encryption Password</label>
              <input
                type="password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                className="form-input"
                placeholder="Secret Key..."
                required
              />
              <div style={{ marginTop: '0.6rem', background: 'rgba(217, 122, 83, 0.1)', padding: '0.45rem 0.85rem', borderRadius: '10px', border: '1px solid rgba(217, 122, 83, 0.3)', fontSize: '0.88rem', color: 'var(--accent)', fontWeight: 600 }}>
                🔑 <strong>Passcode Key:</strong> <code>{activeProject.passwordKey || '123456'}</code>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDecryptModal(false)}>Cancel</button>
              <button type="button" onClick={handleDashDecryptDownload} disabled={isDecrypting} className="btn btn-success">
                {isDecrypting ? '⏳ Decrypting...' : '🔓 Decrypt & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
