/* =========================
   MAIN APP CONTROLLER
========================= */
import { initTheme, toggleTheme } from './theme.js';
import { showToast } from './toast.js';
import { initSearch } from './search.js';

const CART_KEY = 'ai_shop_cart';
const WISHLIST_KEY = 'ai_shop_wishlist';

/* =========================
   GLOBAL SAFETY
========================= */
document.addEventListener('submit', (e) => {
  e.preventDefault();
});

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  setupNavbar();
  setupHeroActions();
  setupThemeToggle();
  updateBadges();
  initSearch();
  setupAuthUI();
  addScrollEffect();
  setupMobileSearch();
});

/* =========================
   NAVBAR
========================= */
function setupNavbar() {
  const account = document.querySelector('.account');
  const accountBtn = document.getElementById('accountBtn');

  /* Account dropdown */
  if (account && accountBtn) {
    accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      account.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!account.contains(e.target)) {
        account.classList.remove('open');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') account.classList.remove('open');
    });
  }

  /* Cart & Wishlist navigation */
  document.querySelectorAll('.nav-icon[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const { action } = btn.dataset;
      if (action === 'cart') navigateTo('cart.html');
      if (action === 'wishlist') navigateTo('wishlist.html');
    });
  });
}

/* =========================
   AUTH UI — Show user profile or login link
========================= */
function setupAuthUI() {
  const user = JSON.parse(localStorage.getItem('ai_shop_user'));
  const accountBtn = document.getElementById('accountBtn');
  const dropdown = document.getElementById('accountMenu');

  if (user && accountBtn) {
    /* Show avatar initial */
    accountBtn.innerHTML = `<span class="avatar sm">${user.name.charAt(0).toUpperCase()}</span>`;

    if (dropdown) {
      dropdown.innerHTML = `
        <div style="padding:10px 12px;border-bottom:1px solid var(--border-subtle);margin-bottom:4px">
          <div style="font-weight:600;font-size:14px">${user.name}</div>
          <div style="font-size:12px;color:var(--text-muted)">${user.email}</div>
        </div>
        <a href="dashboard.html">📊 Dashboard</a>
        <a href="#" data-action="orders">📦 My Orders</a>
        <a href="wishlist.html">❤️ Wishlist</a>
        <a href="#" data-action="settings">⚙️ Settings</a>
        <div class="divider" style="margin:4px 0"></div>
        <a href="#" id="logoutBtn" style="color:var(--danger)">🚪 Logout</a>
      `;

      /* Logout handler */
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          localStorage.removeItem('ai_shop_token');
          localStorage.removeItem('ai_shop_refresh_token');
          localStorage.removeItem('ai_shop_user');
          showToast('Logged out successfully', 'success');
          setTimeout(() => window.location.reload(), 500);
        });
      }
    }
  } else if (dropdown) {
    dropdown.innerHTML = `
      <a href="login.html">🔐 Login / Sign Up</a>
      <a href="#">📦 Track Order</a>
      <a href="#">🎧 Customer Support</a>
      <a href="#">⚙️ Settings</a>
    `;
  }
}

/* =========================
   THEME TOGGLE
========================= */
function setupThemeToggle() {
  const toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      showToast(`Switched to ${newTheme} mode`, 'info', 1500);
    });
  }
}

/* =========================
   HERO ACTIONS
========================= */
function setupHeroActions() {
  const exploreBtn = document.getElementById('exploreBtn');
  const refreshAiBtn = document.getElementById('refreshAiBtn');

  if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
      document.getElementById('allProducts')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (refreshAiBtn) {
    refreshAiBtn.addEventListener('click', () => {
      window.refreshAIPicks?.();
      showToast('AI recommendations refreshed ✨', 'success', 2000);
    });
  }
}

/* =========================
   SCROLL EFFECTS
========================= */
function addScrollEffect() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* =========================
   MOBILE SEARCH
========================= */
function setupMobileSearch() {
  const mobileSearch = document.querySelector('.mobile-search');
  if (!mobileSearch) return;

  const searchBar = mobileSearch.querySelector('.search-bar');
  if (searchBar) {
    searchBar.addEventListener('input', () => {
      clearTimeout(window._mobileSearchTimer);
      window._mobileSearchTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('ai-search', {
          detail: { query: searchBar.value.trim() }
        }));
      }, 400);
    });
  }
}

/* =========================
   BADGE LOGIC
========================= */
function updateBadges() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

  const cartBadge = document.getElementById('cartCount');
  const wishlistBadge = document.getElementById('wishlistCount');

  if (cartBadge) {
    cartBadge.textContent = cart.length;
    cartBadge.style.display = cart.length ? 'flex' : 'none';
  }

  if (wishlistBadge) {
    wishlistBadge.textContent = wishlist.length;
    wishlistBadge.style.display = wishlist.length ? 'flex' : 'none';
  }
}

/* =========================
   NAVIGATION HELPER
========================= */
function navigateTo(url) {
  window.location.href = url;
}

/* =========================
   TIME-BASED GREETING
========================= */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

/* =========================
   GLOBAL EXPORTS
========================= */
window.updateBadges = updateBadges;
window.showToast = showToast;
window.addEventListener('storage', updateBadges);