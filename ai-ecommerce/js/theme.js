/* =========================
   THEME MANAGER — Dark/Light Mode
========================= */

const THEME_KEY = 'ai_shop_theme';

/**
 * Initialize theme system
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);

  if (saved) {
    setTheme(saved);
  } else {
    /* Detect system preference */
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'dark'); // default dark
  }

  /* Listen for system changes */
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
}

/**
 * Set theme
 */
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  updateToggleIcon(theme);
}

/**
 * Toggle theme
 */
export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

/**
 * Get current theme
 */
export function getTheme() {
  return document.documentElement.getAttribute('data-theme') || 'dark';
}

/**
 * Update toggle button icon
 */
function updateToggleIcon(theme) {
  const toggleBtn = document.getElementById('themeToggle');
  if (!toggleBtn) return;

  const sun = toggleBtn.querySelector('.sun');
  const moon = toggleBtn.querySelector('.moon');

  if (sun && moon) {
    /* CSS handles the visibility via [data-theme] selectors */
  }
}
