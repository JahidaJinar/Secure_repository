/**
 * EdTech Secure Project Repository - Auth Page Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleRegisterBtn = document.getElementById('toggleRegister');
  const toggleLoginBtn = document.getElementById('toggleLogin');
  const userBadgeContainer = document.getElementById('userNavBadge');

  // Update navbar user status
  const currentUser = AppAuth.getCurrentUser();
  if (userBadgeContainer) {
    if (currentUser) {
      userBadgeContainer.innerHTML = `
        <div class="user-profile-badge">
          <span>👤 ${currentUser.displayName} (${currentUser.email})</span>
          <button onclick="AppAuth.logout()" class="btn btn-secondary" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Logout</button>
        </div>
      `;
    } else {
      userBadgeContainer.innerHTML = `
        <a href="/login.html" class="btn btn-primary" style="padding: 0.4rem 0.9rem; font-size: 0.85rem;">Login / Register</a>
      `;
    }
  }

  // Toggle Forms
  if (toggleRegisterBtn && toggleLoginBtn) {
    toggleRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('loginCard').style.display = 'none';
      document.getElementById('registerCard').style.display = 'block';
    });

    toggleLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('registerCard').style.display = 'none';
      document.getElementById('loginCard').style.display = 'block';
    });
  }

  // Login Handler
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value.trim();

      if (!email || !password) {
        showToast('Please enter both email and password.', 'error');
        return;
      }

      AppAuth.login(email, password);
      showToast('Logged in successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 800);
    });
  }

  // Registration Handler
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value.trim();

      if (!email || !password) {
        showToast('Please provide email and password.', 'error');
        return;
      }

      AppAuth.register(email, password, name);
      showToast('Account created successfully! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = '/index.html';
      }, 800);
    });
  }
});

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'} ${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}
