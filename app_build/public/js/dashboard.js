/**
 * EdTech Secure Project Repository - Author Dashboard & Requests Manager
 */

let myProjects = [];
let myUserRequests = [];

document.addEventListener('DOMContentLoaded', () => {
  const user = AppAuth.getCurrentUser();
  if (!user) {
    showToast('Please login to access your Dashboard.', 'error');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  document.getElementById('dashAuthorEmail').innerText = `${user.displayName} (${user.email})`;
  loadDashboardData(user.email);
});

async function loadDashboardData(email) {
  try {
    // 1. Load Projects authored by this user
    const resAuth = await fetch(`/api/projects/author/${encodeURIComponent(email)}`);
    const dataAuth = await resAuth.json();
    if (dataAuth.success) {
      myProjects = dataAuth.projects;
      renderAuthorProjectsAndRequests();
    }

    // 2. Load Requests made by this user for other projects
    const resReq = await fetch(`/api/projects/user-requests/${encodeURIComponent(email)}`);
    const dataReq = await resReq.json();
    if (dataReq.success) {
      myUserRequests = dataReq.projects;
      renderUserRequestedProjects();
    }

  } catch (err) {
    console.error(err);
    showToast('Error loading dashboard data.', 'error');
  }
}

function renderAuthorProjectsAndRequests() {
  const incomingReqContainer = document.getElementById('incomingRequestsContainer');
  const myProjectsContainer = document.getElementById('myProjectsContainer');

  let totalIncomingRequests = [];

  myProjects.forEach(p => {
    if (p.accessRequests && p.accessRequests.length > 0) {
      p.accessRequests.forEach(r => {
        totalIncomingRequests.push({
          projectId: p.id,
          projectTitle: p.title,
          requesterEmail: r.requesterEmail,
          requesterName: r.requesterName || r.requesterEmail,
          status: r.status,
          requestedAt: r.requestedAt
        });
      });
    }
  });

  // Render Incoming Requests Table
  if (totalIncomingRequests.length === 0) {
    incomingReqContainer.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">No access requests received yet.</div>';
  } else {
    incomingReqContainer.innerHTML = `
      <table class="requests-table">
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
          ${totalIncomingRequests.map(req => `
            <tr>
              <td><strong>${escapeHtml(req.projectTitle)}</strong></td>
              <td>${escapeHtml(req.requesterName)}<br><small style="color: var(--text-muted);">${escapeHtml(req.requesterEmail)}</small></td>
              <td>${new Date(req.requestedAt).toLocaleDateString()}</td>
              <td><span class="status-badge status-${req.status}">${req.status}</span></td>
              <td>
                ${req.status === 'pending' ? `
                  <button onclick="updateAccessRequestStatus('${req.projectId}', '${req.requesterEmail}', 'approved')" class="btn btn-success" style="font-size: 0.75rem; padding: 0.3rem 0.6rem; margin-right: 0.3rem;">✅ Approve</button>
                  <button onclick="updateAccessRequestStatus('${req.projectId}', '${req.requesterEmail}', 'rejected')" class="btn btn-danger" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">❌ Reject</button>
                ` : `
                  <button onclick="updateAccessRequestStatus('${req.projectId}', '${req.requesterEmail}', '${req.status === 'approved' ? 'rejected' : 'approved'}')" class="btn btn-secondary" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;">Toggle Status</button>
                `}
              </td>
            </tr>
            ${req.status === 'approved' ? `
              <tr style="background: rgba(16, 185, 129, 0.05);">
                <td colspan="5" style="padding: 0.4rem 1rem; font-size: 0.8rem; color: #34d399;">
                  💡 <strong>Author Action:</strong> You approved access for <strong>${escapeHtml(req.requesterEmail)}</strong>. Please share your project secret password with this user so they can decrypt & download.
                </td>
              </tr>
            ` : ''}
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Render My Uploaded Projects List
  if (myProjects.length === 0) {
    myProjectsContainer.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">You have not uploaded any projects yet.</div>';
  } else {
    myProjectsContainer.innerHTML = myProjects.map(p => `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;">${escapeHtml(p.title)}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Category: <strong>${escapeHtml(p.category)}</strong> | Batch: <strong>${escapeHtml(p.batch)}</strong> | File: <code>${escapeHtml(p.fileName)}</code>
          </div>
        </div>
        <div>
          <button onclick="openAuthorDecryptModal('${p.id}')" class="btn btn-secondary" style="font-size: 0.8rem;">🔓 Decrypt File</button>
        </div>
      </div>
    `).join('');
  }
}

function renderUserRequestedProjects() {
  const container = document.getElementById('myRequestedProjectsContainer');
  const user = AppAuth.getCurrentUser();

  if (myUserRequests.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); padding: 1.5rem; text-align: center;">You have not requested access to any other projects.</div>';
    return;
  }

  container.innerHTML = myUserRequests.map(p => {
    const req = p.accessRequests.find(r => r.requesterEmail.toLowerCase() === user.email.toLowerCase());
    const status = req ? req.status : 'pending';

    return `
      <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="font-size: 1.05rem; margin-bottom: 0.2rem;">${escapeHtml(p.title)}</h4>
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            Author: <strong>${escapeHtml(p.authorName || p.authorEmail)}</strong> | Status: <span class="status-badge status-${status}">${status}</span>
          </div>
        </div>
        <div>
          ${status === 'approved' ? `
            <button onclick="openAuthorDecryptModal('${p.id}')" class="btn btn-success" style="font-size: 0.8rem;">🔓 Decrypt & Download</button>
          ` : `
            <span style="font-size: 0.8rem; color: var(--text-dim);">Awaiting Author Approval</span>
          `}
        </div>
      </div>
    `;
  }).join('');
}

async function updateAccessRequestStatus(projectId, requesterEmail, newStatus) {
  try {
    const res = await fetch(`/api/projects/${projectId}/update-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail, status: newStatus })
    });
    const data = await res.json();

    if (data.success) {
      showToast(`Request updated to ${newStatus}!`, 'success');
      const user = AppAuth.getCurrentUser();
      loadDashboardData(user.email);
    } else {
      showToast('Failed to update request: ' + data.message, 'error');
    }
  } catch (err) {
    showToast('Network error updating status.', 'error');
  }
}

let activeDashProject = null;

function openAuthorDecryptModal(projectId) {
  const project = myProjects.concat(myUserRequests).find(p => p.id === projectId);
  if (!project) return;
  activeDashProject = project;

  document.getElementById('dashModalProjectTitle').innerText = project.title;
  document.getElementById('dashDecryptModal').classList.add('show');
}

async function handleDashDecryptDownload() {
  const password = document.getElementById('dashDecryptPassword').value.trim();
  if (!password) {
    showToast('Please enter decryption password.', 'error');
    return;
  }

  if (!activeDashProject) return;

  const btn = document.getElementById('dashStartDecryptBtn');
  btn.innerText = '⏳ Decrypting...';
  btn.disabled = true;

  try {
    const downloadUrl = `/api/drive/download/${activeDashProject.fileId}`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Storage file payload not found.');
    }

    const encryptedText = await response.text();
    const { blob, originalName } = CryptoUtils.decryptFilePayload(encryptedText, password);

    CryptoUtils.downloadBlob(blob, originalName || activeDashProject.fileName.replace('.enc', ''));
    showToast('✅ File decrypted and downloaded!', 'success');
    closeDashModal();
  } catch (err) {
    showToast('❌ Decryption Failed: ' + err.message, 'error');
  } finally {
    btn.innerText = '🔓 Decrypt & Download';
    btn.disabled = false;
  }
}

function closeDashModal() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  activeDashProject = null;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
