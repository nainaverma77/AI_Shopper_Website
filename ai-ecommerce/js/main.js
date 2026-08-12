/* =========================
   MAIN APP CONTROLLER
========================= */
import { initAuth } from './auth.js';
import { initTheme, toggleTheme } from './theme.js';
import { initSearch } from './search.js';
import { showToast } from './toast.js';

const CART_KEY = "ai_shop_cart";
const WISHLIST_KEY = "ai_shop_wishlist";

/* =========================
   GLOBAL SAFETY
========================= */
document.addEventListener("submit", (e) => {
  if (!e.target.closest('.auth-form') && !e.target.closest('.review-form-el') && !e.target.closest('.contact-form')) {
    e.preventDefault();
  }
});

/* =========================
   INIT
========================= */
function initApp() {
  initTheme();
  initAuth();
  initSearch();
  setupNavbar();
  setupHeroActions();
  updateBadges();
  initChatbot();
}

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}

/* =========================
   NAVBAR ACTIONS
========================= */
function setupNavbar() {
  const account = document.querySelector(".account");
  const accountBtn = document.getElementById("accountBtn");

  /* -------- ACCOUNT DROPDOWN -------- */
  if (account && accountBtn) {
    accountBtn.addEventListener("click", e => {
      e.stopPropagation();
      account.classList.toggle("open");
    });

    document.addEventListener("click", e => {
      if (!account.contains(e.target)) {
        account.classList.remove("open");
      }
    });

    document.addEventListener("keydown", e => {
      if (e.key === "Escape") {
        account.classList.remove("open");
      }
    });
  }

  /* -------- CART & WISHLIST NAVIGATION -------- */
  document.querySelectorAll(".nav-icon[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { action } = btn.dataset;
      if (action === "cart") window.location.href = "cart.html";
      if (action === "wishlist") window.location.href = "wishlist.html";
    });
  });

  /* -------- THEME TOGGLE -------- */
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const newTheme = toggleTheme();
      themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
      showToast(`Switched to ${newTheme} mode`, 'info', 1500);
    });

    /* Set initial icon */
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    themeBtn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
  }
}

/* =========================
   HERO ACTIONS
========================= */
function setupHeroActions() {
  const exploreBtn = document.getElementById("exploreBtn");
  const refreshAiBtn = document.getElementById("refreshAiBtn");

  if (exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document
        .getElementById("allProducts")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  }

  if (refreshAiBtn) {
    refreshAiBtn.addEventListener("click", () => {
      window.refreshAIPicks?.();
    });
  }
}

/* =========================
   BADGE LOGIC
========================= */
function updateBadges() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  const wishlist = JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];

  const cartBadge = document.getElementById("cartCount");
  const wishlistBadge = document.getElementById("wishlistCount");

  if (cartBadge) {
    cartBadge.textContent = cart.length;
    cartBadge.style.display = cart.length ? "flex" : "none";
  }

  if (wishlistBadge) {
    wishlistBadge.textContent = wishlist.length;
    wishlistBadge.style.display = wishlist.length ? "flex" : "none";
  }
}

/* =========================
   CHATBOT INIT (lazy loaded)
========================= */
function initChatbot() {
  import('./chatbot.js').then(mod => {
    mod.initChatbot?.();
  }).catch(() => {});
}

/* =========================
   GLOBAL SYNC
========================= */
window.updateBadges = updateBadges;
window.addEventListener("storage", updateBadges);