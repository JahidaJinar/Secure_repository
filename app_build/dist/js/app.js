/**
 * EdTech Secure Project Repository - Main Repository Browser logic
 */

let allProjects = [];
let currentCategory = 'all';
let currentBatch = 'all';
let currentSearch = '';
let activeProjectForModal = null;

document.addEventListener('DOMContentLoaded', () => {
  loadProjects();

  // Category Tabs Listener
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentCategory = e.target.getAttribute('data-category');
      renderProjects();
    });
  });

  // Batch Filter Listener
  const batchFilter = document.getElementById('batchFilter');
  if (batchFilter) {
    batchFilter.addEventListener('change', (e) => {
      currentBatch = e.target.value;
      renderProjects();
    });
  }

  // Search Input Listener
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const clearSearch = () => {
      if (searchInput.value) {
        searchInput.value = '';
        currentSearch = '';
        renderProjects();
      }
    };
    searchInput.value = '';
    currentSearch = '';
    setTimeout(clearSearch, 50);
    setTimeout(clearSearch, 300);
    setTimeout(clearSearch, 800);

    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.toLowerCase().trim();
      renderProjects();
    });
  }

  // Close Modal
  document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Modal backdrop click
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Request Access Form Submit
  const requestAccessForm = document.getElementById('requestAccessForm');
  if (requestAccessForm) {
    requestAccessForm.addEventListener('submit', handleAccessRequestSubmit);
  }
});

async function loadProjects() {
  const grid = document.getElementById('projectsGrid');
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">⏳ Loading department projects...</div>';

  try {
    const res = await fetch('/api/projects');
    const data = await res.json();

    if (data.success) {
      allProjects = data.projects;
      renderProjects();
    } else {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">Failed to load projects: ${data.message}</div>`;
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #ef4444;">Error connecting to project server.</div>';
  }
}

function renderProjects() {
  const grid = document.getElementById('projectsGrid');
  const user = AppAuth.getCurrentUser();

  let filtered = allProjects.filter(p => {
    // Category match
    if (currentCategory !== 'all' && p.category !== currentCategory) {
      return false;
    }
    // Batch match
    if (currentBatch !== 'all' && p.batch !== currentBatch) {
      return false;
    }
    // Search match
    if (currentSearch) {
      const q = currentSearch;
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description.toLowerCase().includes(q);
      const matchAuthor = (p.authorName || '').toLowerCase().includes(q) || (p.authorEmail || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchAuthor) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1rem; background: var(--bg-card); border-radius: 16px; border: 1px dashed var(--border-color);">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔍</div>
        <h3 style="margin-bottom: 0.5rem;">No projects found</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">Try clearing your filters or search terms.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isAuthor = user && user.email.toLowerCase() === p.authorEmail.toLowerCase();
    
    // Find if user has requested access
    const userRequest = user && p.accessRequests ? p.accessRequests.find(r => r.requesterEmail.toLowerCase() === user.email.toLowerCase()) : null;
    const requestStatus = userRequest ? userRequest.status : null;

    let badgeClass = 'badge-educational';
    if (p.category === 'Technical Projects') badgeClass = 'badge-technical';
    if (p.category === 'EdTech Projects') badgeClass = 'badge-edtech';
    if (p.category === 'Thesis Projects') badgeClass = 'badge-thesis';

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

    const hashStr = (p.id || '') + (p.title || '');
    let hashNum = 0;
    for (let i = 0; i < hashStr.length; i++) {
      hashNum = (hashNum << 5) - hashNum + hashStr.charCodeAt(i);
      hashNum |= 0;
    }
    const coverImgSrc = imagePool[Math.abs(hashNum) % imagePool.length];

    let actionBtnHtml = '';
    if (isAuthor) {
      actionBtnHtml = `<a href="/dashboard.html" class="btn btn-secondary" style="font-size: 0.8rem;">⚙️ Manage (Author)</a>`;
    } else if (requestStatus === 'approved') {
      actionBtnHtml = `<button onclick="openDecryptModal('${p.id}')" class="btn btn-success" style="font-size: 0.8rem;">🔓 Decrypt & Download</button>`;
    } else if (requestStatus === 'pending') {
      actionBtnHtml = `<span class="status-badge status-pending">⏳ Request Pending</span>`;
    } else if (requestStatus === 'rejected') {
      actionBtnHtml = `<span class="status-badge status-rejected">❌ Access Denied</span>`;
    } else {
      actionBtnHtml = `<button onclick="openRequestModal('${p.id}')" class="btn btn-primary" style="font-size: 0.8rem;">🔑 Request Access</button>`;
    }

    return `
      <div class="project-card">
        <div class="card-banner-img">
          <img src="${coverImgSrc}" alt="${escapeHtml(p.title)}" loading="lazy">
        </div>
        <div>
          <div class="card-header">
            <span class="category-badge ${badgeClass}">${escapeHtml(p.category)}</span>
            <span class="batch-pill">🎓 ${escapeHtml(p.batch)}</span>
          </div>
          <h3 class="project-title">${escapeHtml(p.title)}</h3>
          <p class="project-desc">${escapeHtml(p.description)}</p>
        </div>

        <div>
          <div class="author-meta">
            <span>👤 Author: <strong>${escapeHtml(p.authorName || p.authorEmail)}</strong></span>
          </div>
          <div class="card-footer">
            <button onclick="viewProjectDetails('${p.id}')" class="btn btn-secondary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">ℹ️ Details</button>
            ${actionBtnHtml}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function viewProjectDetails(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  activeProjectForModal = project;

  document.getElementById('modalTitle').innerText = project.title;
  document.getElementById('modalCategory').innerText = project.category;
  document.getElementById('modalBatch').innerText = project.batch;
  document.getElementById('modalAuthor').innerText = `${project.authorName || ''} (${project.authorEmail})`;
  document.getElementById('modalDesc').innerText = project.description;
  document.getElementById('modalFileName').innerText = project.fileName || 'Encrypted_Project_Package.enc';

  document.getElementById('projectModal').classList.add('show');
}

function openRequestModal(id) {
  const user = AppAuth.getCurrentUser();
  if (!user) {
    showToast('Please login to request access to this project.', 'error');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
    return;
  }

  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  activeProjectForModal = project;

  document.getElementById('reqProjectTitle').innerText = project.title;
  document.getElementById('reqAuthorEmail').innerText = project.authorEmail;
  document.getElementById('requesterUserEmail').value = user.email;

  document.getElementById('requestModal').classList.add('show');
}

async function handleAccessRequestSubmit(e) {
  e.preventDefault();
  const user = AppAuth.getCurrentUser();
  if (!user || !activeProjectForModal) return;

  try {
    const res = await fetch(`/api/projects/${activeProjectForModal.id}/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requesterUid: user.uid,
        requesterEmail: user.email,
        requesterName: user.displayName
      })
    });
    const data = await res.json();

    if (data.success) {
      showToast('Access request sent to the author successfully!', 'success');
      closeModal();
      loadProjects();
    } else {
      showToast('Error sending request: ' + data.message, 'error');
    }
  } catch (err) {
    showToast('Network error submitting request.', 'error');
  }
}

function openDecryptModal(id) {
  const project = allProjects.find(p => p.id === id);
  if (!project) return;
  activeProjectForModal = project;

  document.getElementById('decryptProjectTitle').innerText = project.title;
  document.getElementById('decryptModal').classList.add('show');
}

async function triggerDecryptedDownload() {
  const password = document.getElementById('decryptPasswordInput').value.trim();
  if (!password) {
    showToast('Please enter the decryption password.', 'error');
    return;
  }

  if (!activeProjectForModal) return;

  const btn = document.getElementById('startDecryptBtn');
  btn.innerText = '⏳ Fetching & Decrypting...';
  btn.disabled = true;

  try {
    const downloadUrl = `/api/drive/download/${activeProjectForModal.fileId}`;
    const response = await fetch(downloadUrl);
    
    if (!response.ok) {
      throw new Error('Could not download encrypted file payload from cloud storage.');
    }

    const encryptedText = await response.text();

    // Client-side AES-256 Decryption using CryptoJS
    const { blob, originalName } = CryptoUtils.decryptFilePayload(encryptedText, password);

    // Save File
    CryptoUtils.downloadBlob(blob, originalName || activeProjectForModal.fileName.replace('.enc', ''));
    showToast('✅ File decrypted and downloaded successfully!', 'success');
    closeModal();
  } catch (err) {
    showToast('❌ Decryption Failed! ' + err.message, 'error');
  } finally {
    btn.innerText = '🔓 Decrypt & Download';
    btn.disabled = false;
  }
}

function closeModal() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  activeProjectForModal = null;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
