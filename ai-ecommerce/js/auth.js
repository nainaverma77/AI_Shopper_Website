/* =========================
   AUTH STATE MANAGER
   Tracks login/logout across all pages
========================= */
import { isLoggedIn, getCurrentUser, logoutUser } from './api.js';

/* =========================
   INIT AUTH UI
========================= */
export function initAuth() {
  updateAuthUI();
  window.addEventListener('storage', updateAuthUI);
}

/* =========================
   UPDATE NAVBAR AUTH STATE
========================= */
export function updateAuthUI() {
  const accountBtn = document.getElementById('accountBtn');
  const accountMenu = document.getElementById('accountMenu');
  if (!accountBtn || !accountMenu) return;

  const user = getCurrentUser();
  const loggedIn = isLoggedIn();

  /* Update account button */
  if (loggedIn && user) {
    const initial = (user.name || 'U').charAt(0).toUpperCase();
    accountBtn.innerHTML = `<span class="user-avatar-sm">${initial}</span>`;
    accountBtn.setAttribute('data-tooltip', user.name);
  } else {
    accountBtn.innerHTML = '👤';
    accountBtn.removeAttribute('data-tooltip');
  }

  /* Update dropdown */
  if (loggedIn && user) {
    accountMenu.innerHTML = `
      <div class="dropdown-header">
        <span class="dropdown-avatar">${(user.name || 'U').charAt(0).toUpperCase()}</span>
        <div>
          <strong>${user.name}</strong>
          <small>${user.email}</small>
        </div>
      </div>
      <div class="dropdown-divider"></div>
      <a href="account.html">👤 My Profile</a>
      <a href="account.html#orders">📦 My Orders</a>
      <a href="account.html#addresses">📍 My Addresses</a>
      <a href="wishlist.html">❤️ Wishlist</a>
      <a href="help.html">❓ Help & Support</a>
      <div class="dropdown-divider"></div>
      <a href="#" id="logoutBtn" class="logout-link">🚪 Logout</a>
    `;

    /* Logout handler */
    document.getElementById('logoutBtn')?.addEventListener('click', async (e) => {
      e.preventDefault();
      await logoutUser();
      window.showToast?.('Logged out successfully', 'success');
      setTimeout(() => window.location.href = 'index.html', 500);
    });
  } else {
    accountMenu.innerHTML = `
      <a href="login.html">🔐 Login / Sign Up</a>
      <div class="dropdown-divider"></div>
      <a href="help.html">❓ Help & Support</a>
    `;
  }
}

/* =========================
   AUTH GUARD
========================= */
export function requireAuth(redirectTo = 'login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}
