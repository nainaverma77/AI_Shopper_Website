/* =========================
   PRODUCTS PAGE LOGIC
========================= */
import { getAllProducts, getCategories, getRecommended } from './api.js';
import { showSkeletons } from './skeleton.js';

const CART_KEY = 'ai_shop_cart';
const WISHLIST_KEY = 'ai_shop_wishlist';

/* =========================
   ELEMENTS
========================= */
const productsEl = document.getElementById('products');
const recommendedEl = document.getElementById('recommended');
const categoriesEl = document.getElementById('categoriesScroll');
const dealsEl = document.getElementById('dealsGrid');

const totalProductsEl = document.getElementById('totalProducts');
const totalCategoriesEl = document.getElementById('totalCategories');

const categoryFilter = document.getElementById('categoryFilter');
const sortFilter = document.getElementById('sortFilter');
const priceFilter = document.getElementById('priceFilter');
const priceValue = document.getElementById('priceValue');
const activeFiltersText = document.getElementById('activeFiltersText');

/* Modal */
const modal = document.getElementById('productModal');
const modalImg = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalPrice = document.getElementById('modalPrice');
const closeModal = document.getElementById('closeModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalCartBtn = document.getElementById('modalCartBtn');

/* =========================
   STATE
========================= */
let allProducts = [];
let filteredProducts = [];
let activeProduct = null;
let currentPage = 1;
let totalPages = 1;
let isLoading = false;

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', init);

async function init() {
  /* Show skeletons while loading */
  showSkeletons(productsEl, 8);
  showSkeletons(recommendedEl, 4);

  try {
    /* Fetch products and categories in parallel */
    const [productData, catData, recData] = await Promise.all([
      getAllProducts({ limit: 40, sort: 'trendingScore', order: 'desc' }),
      getCategories(),
      getRecommended(4)
    ]);

    allProducts = productData.products || [];
    filteredProducts = [...allProducts];
    totalPages = productData.pagination?.pages || 1;

    setupFilters(catData.categories || []);
    updateHeroStats(catData.categories || []);
    renderCategories(catData.categories || []);
    renderRecommended(recData.products || []);
    renderProducts(filteredProducts);

    /* Update greeting */
    updateGreeting();

  } catch (err) {
    console.error('Init error:', err);
    if (productsEl) productsEl.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">⚠️</div>
        <h3>Could not load products</h3>
        <p>Please make sure the server is running on localhost:5000</p>
        <button class="primary" onclick="location.reload()">Retry</button>
      </div>`;
  }

  /* Listen for search events */
  window.addEventListener('ai-search', (e) => {
    const { query } = e.detail;
    handleSmartSearch(query);
  });
}

/* =========================
   GREETING
========================= */
function updateGreeting() {
  const heroTitle = document.querySelector('.hero h1');
  if (!heroTitle) return;

  const user = JSON.parse(localStorage.getItem('ai_shop_user'));
  const hour = new Date().getHours();
  let greeting = 'Good Morning';
  if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
  else if (hour >= 17 && hour < 21) greeting = 'Good Evening';
  else if (hour >= 21) greeting = 'Good Night';

  if (user) {
    heroTitle.textContent = `${greeting}, ${user.name.split(' ')[0]} ✨`;
  } else {
    heroTitle.textContent = `${greeting}! Smart Shopping with AI`;
  }
}

/* =========================
   CATEGORIES
========================= */
function renderCategories(categories) {
  if (!categoriesEl) return;
  categoriesEl.innerHTML = categories.slice(0, 12).map(c => `
    <div class="category-card" data-category="${c.name.toLowerCase().replace(/\s+/g, '-')}">
      <div class="category-icon">${c.icon}</div>
      <div class="category-name">${c.name}</div>
      <div class="category-count">${c.count} items</div>
    </div>
  `).join('');

  /* Click to filter */
  categoriesEl.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
      const catName = card.dataset.category;
      if (categoryFilter) {
        categoryFilter.value = catName;
        applyFilters();
      }
      document.getElementById('allProducts')?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/* =========================
   FILTERS
========================= */
function setupFilters(categories) {
  if (!categoryFilter) return;

  const catOptions = [{ name: 'All', slug: 'all' }, ...categories.map(c => ({
    name: c.name,
    slug: c.name.toLowerCase().replace(/\s+/g, '-')
  }))];

  categoryFilter.innerHTML = catOptions
    .map(c => `<option value="${c.slug}">${c.name}</option>`)
    .join('');

  const maxPrice = Math.max(...allProducts.map(p => p.price), 200000);
  const finalMax = Math.min(maxPrice, 200000);

  if (priceFilter) {
    priceFilter.max = finalMax;
    priceFilter.value = finalMax;
  }
  if (priceValue) priceValue.textContent = `₹${finalMax.toLocaleString()}`;

  categoryFilter.onchange = applyFilters;
  if (sortFilter) sortFilter.onchange = applyFilters;
  if (priceFilter) priceFilter.oninput = () => {
    if (priceValue) priceValue.textContent = `₹${Math.round(priceFilter.value).toLocaleString()}`;
    applyFilters();
  };
}

function applyFilters() {
  const category = categoryFilter?.value || 'all';
  const sort = sortFilter?.value || 'ai';
  const maxPrice = priceFilter ? Number(priceFilter.value) : 999999;

  filteredProducts = allProducts.filter(p =>
    (category === 'all' || p.category === category) &&
    p.price <= maxPrice
  );

  if (sort === 'price-low') filteredProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price-high') filteredProducts.sort((a, b) => b.price - a.price);
  if (sort === 'rating') filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sort === 'ai') filteredProducts.sort((a, b) => (b.trendingScore || 0) - (a.trendingScore || 0));

  renderProducts(filteredProducts);
  updateFilterSummary();
}

function updateFilterSummary() {
  if (!activeFiltersText) return;
  const category = categoryFilter?.value || 'all';
  const count = filteredProducts.length;
  let text = `${count} product${count !== 1 ? 's' : ''}`;
  if (category !== 'all') text += ` in ${capitalize(category)}`;
  activeFiltersText.textContent = text;
}

/* =========================
   SMART SEARCH
========================= */
async function handleSmartSearch(query) {
  if (!query || query.length < 2) {
    filteredProducts = [...allProducts];
    renderProducts(filteredProducts);
    return;
  }

  showSkeletons(productsEl, 4);

  try {
    const { smartSearch } = await import('./api.js');
    const data = await smartSearch(query);
    filteredProducts = data.products || [];
    renderProducts(filteredProducts);

    const sectionTitle = document.querySelector('#allProducts h2');
    if (sectionTitle) {
      sectionTitle.textContent = `Results for "${query}" (${filteredProducts.length})`;
    }
  } catch (err) {
    console.error('Search failed:', err);
  }
}

/* =========================
   RENDER PRODUCTS
========================= */
function renderProducts(products) {
  if (!productsEl) return;
  productsEl.innerHTML = '';

  if (products.length === 0) {
    productsEl.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">🔍</div>
        <h3>No products found</h3>
        <p>Try adjusting your filters or search query</p>
      </div>`;
    return;
  }

  products.forEach(p => productsEl.appendChild(createCard(p)));
}

function renderRecommended(products) {
  if (!recommendedEl) return;
  recommendedEl.innerHTML = '';
  products.forEach(p => recommendedEl.appendChild(createCard(p, true)));
}

window.refreshAIPicks = async () => {
  if (!recommendedEl) return;
  showSkeletons(recommendedEl, 4);
  try {
    const data = await getRecommended(4);
    renderRecommended(data.products || []);
  } catch (err) {
    console.error('Refresh error:', err);
  }
};

/* =========================
   PRODUCT CARD
========================= */
function createCard(p, isAI = false) {
  const card = document.createElement('div');
  card.className = 'card';

  const inCart = getCart().some(i => (i._id || i.id) === (p._id || p.id));
  const inWish = getWishlist().some(i => (i._id || i.id) === (p._id || p.id));
  const discount = p.discount || (p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0);
  const rating = p.rating || 4.0;
  const stars = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '');
  const img = p.thumbnail || (p.images && p.images[0]) || p.image || '';

  card.innerHTML = `
    ${isAI ? '<span class="tag">AI Pick</span>' : ''}
    ${discount > 5 ? `<span class="discount-badge">-${discount}%</span>` : ''}

    <button type="button" class="wishlist-btn ${inWish ? 'active' : ''}" aria-label="Add to wishlist">❤</button>

    <div class="image-wrap">
      <img src="${img}" alt="${p.title}" loading="lazy">
    </div>

    <h3>${p.title}</h3>

    <div class="rating">
      <span class="stars">${stars}</span>
      <span class="rating-count">(${p.reviewCount || Math.floor(Math.random() * 200 + 10)})</span>
    </div>

    <div class="price">
      <span class="price-current">₹${Math.round(p.price).toLocaleString()}</span>
      ${p.originalPrice && p.originalPrice > p.price ? `<span class="price-original">₹${Math.round(p.originalPrice).toLocaleString()}</span>` : ''}
      ${discount > 5 ? `<span class="price-discount">${discount}% off</span>` : ''}
    </div>

    <div class="card-actions">
      <button type="button" class="ghost view-btn">👁 View</button>
      <button type="button" class="primary cart-btn ${inCart ? 'added' : ''}">
        ${inCart ? '✓ Added' : '🛒 Add'}
      </button>
    </div>
  `;

  /* VIEW */
  card.querySelector('.view-btn').onclick = () => openModal(p);
  card.querySelector('.image-wrap').onclick = () => openModal(p);

  /* WISHLIST */
  const wishBtn = card.querySelector('.wishlist-btn');
  wishBtn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const list = getWishlist();
    const pid = p._id || p.id;
    const exists = list.some(i => (i._id || i.id) === pid);

    saveWishlist(
      exists ? list.filter(i => (i._id || i.id) !== pid) : [...list, p]
    );

    wishBtn.classList.toggle('active', !exists);
    window.updateBadges?.();
    window.showToast?.(exists ? 'Removed from wishlist' : 'Added to wishlist ❤️', exists ? 'info' : 'success', 1500);
  };

  /* CART */
  const cartBtn = card.querySelector('.cart-btn');
  cartBtn.onclick = (e) => {
    e.preventDefault();
    const cart = getCart();
    const pid = p._id || p.id;
    const exists = cart.some(i => (i._id || i.id) === pid);

    saveCart(
      exists ? cart.filter(i => (i._id || i.id) !== pid) : [...cart, { ...p, qty: 1 }]
    );

    cartBtn.classList.toggle('added', !exists);
    cartBtn.innerHTML = exists ? '🛒 Add' : '✓ Added';
    window.updateBadges?.();
    window.showToast?.(exists ? 'Removed from cart' : 'Added to cart 🛒', exists ? 'info' : 'success', 1500);
  };

  return card;
}

/* =========================
   MODAL
========================= */
function openModal(p) {
  if (!modal) return;
  activeProduct = p;
  const img = p.thumbnail || (p.images && p.images[0]) || p.image || '';
  modalImg.src = img;
  modalTitle.textContent = p.title;
  modalPrice.textContent = `₹${Math.round(p.price).toLocaleString()}`;
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  if (!modal) return;
  modal.classList.remove('show');
  activeProduct = null;
  document.body.style.overflow = '';
}

if (closeModal) closeModal.onclick = closeProductModal;
if (modalCloseBtn) modalCloseBtn.onclick = closeProductModal;
if (modal) modal.onclick = (e) => { if (e.target === modal) closeProductModal(); };

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeProductModal();
});

if (modalCartBtn) {
  modalCartBtn.onclick = () => {
    if (!activeProduct) return;
    const cart = getCart();
    const pid = activeProduct._id || activeProduct.id;
    if (!cart.some(p => (p._id || p.id) === pid)) {
      saveCart([...cart, { ...activeProduct, qty: 1 }]);
      window.updateBadges?.();
      window.showToast?.('Added to cart 🛒', 'success', 1500);
    }
    closeProductModal();
  };
}

/* =========================
   STORAGE HELPERS
========================= */
const getCart = () => JSON.parse(localStorage.getItem(CART_KEY)) || [];
const getWishlist = () => JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
const saveCart = (cart) => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const saveWishlist = (list) => localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));

/* =========================
   STATS
========================= */
function updateHeroStats(categories) {
  if (totalProductsEl) totalProductsEl.textContent = allProducts.length;
  if (totalCategoriesEl) totalCategoriesEl.textContent = categories.length;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
}
