/* =========================
   PRODUCT DETAIL PAGE
========================= */
import { getProductById, getAllProducts } from './api.js';

const CART_KEY = 'ai_shop_cart';
const WISHLIST_KEY = 'ai_shop_wishlist';

document.addEventListener('DOMContentLoaded', initProductPage);

async function initProductPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) { window.location.href = 'index.html'; return; }

  const product = await getProductById(id);
  if (!product) {
    document.getElementById('productContainer').innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="icon">😕</div><h3>Product not found</h3>
        <p>The product you're looking for doesn't exist.</p>
        <a href="index.html"><button class="primary">Back to Shop</button></a>
      </div>`;
    return;
  }

  document.title = `${product.title} — AiShopper`;
  renderProduct(product);
  renderReviews(product);
  loadSimilarProducts(product);
}

function renderProduct(p) {
  const container = document.getElementById('productContainer');
  const inCart = getCart().some(i => i.id === p.id);
  const inWish = getWishlist().some(i => i.id === p.id);
  const images = p.images && p.images.length ? p.images : [p.image];

  container.innerHTML = `
    <!-- Gallery -->
    <div class="product-gallery">
      <div class="gallery-main">
        <img src="${images[0]}" alt="${p.title}" id="mainImage">
      </div>
      <div class="gallery-thumbs">
        ${images.map((img, i) => `
          <div class="gallery-thumb ${i === 0 ? 'active' : ''}" data-img="${img}">
            <img src="${img}" alt="Thumbnail ${i+1}">
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Info -->
    <div class="product-info">
      <span class="product-brand">${p.brand || 'AiShopper'}</span>
      <h1 class="product-title">${p.title}</h1>

      <div class="product-rating">
        <span class="stars">${renderStars(p.rating)}</span>
        <span>${p.rating?.toFixed(1) || '4.0'}</span>
        <span class="rating-count">(${p.reviewCount || 0} reviews)</span>
      </div>

      <div class="product-price-box">
        <span class="current-price">₹${Math.round(p.price).toLocaleString('en-IN')}</span>
        ${p.originalPrice ? `<span class="original-price">₹${Math.round(p.originalPrice).toLocaleString('en-IN')}</span>` : ''}
        ${p.discount ? `<span class="discount-badge">${p.discount}% OFF</span>` : ''}
      </div>

      <p style="color:var(--text-secondary);font-size:14px;line-height:1.7">${p.description}</p>

      <div class="product-meta">
        <div class="meta-row"><span class="icon">🚚</span> ${p.shippingInformation || 'Ships in 3-5 business days'}</div>
        <div class="meta-row"><span class="icon">🔄</span> ${p.returnPolicy || '7 Day Return Policy'}</div>
        <div class="meta-row"><span class="icon">🛡️</span> ${p.warrantyInformation || '1 Year Warranty'}</div>
        <div class="meta-row"><span class="icon">💳</span> Cash on Delivery Available</div>
        <div class="meta-row"><span class="icon">${p.stock > 0 ? '✅' : '❌'}</span> ${p.stock > 0 ? `In Stock (${p.stock} left)` : 'Out of Stock'}</div>
      </div>

      <div class="product-buy-actions">
        <button class="primary cart-btn ${inCart ? 'added' : ''}" id="addToCartBtn">
          ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
        </button>
        <button class="buy-now-btn" id="buyNowBtn">⚡ Buy Now</button>
      </div>

      <button class="ghost" style="margin-top:8px;width:100%" id="wishlistToggle">
        ${inWish ? '❤️ In Wishlist' : '🤍 Add to Wishlist'}
      </button>
    </div>
  `;

  /* Gallery thumbs */
  container.querySelectorAll('.gallery-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      document.getElementById('mainImage').src = thumb.dataset.img;
      container.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
    });
  });

  /* Add to Cart */
  document.getElementById('addToCartBtn').addEventListener('click', () => {
    const cart = getCart();
    const exists = cart.some(i => i.id === p.id);
    if (exists) {
      saveCart(cart.filter(i => i.id !== p.id));
    } else {
      saveCart([...cart, { ...p, qty: 1 }]);
    }
    window.updateBadges?.();
    const btn = document.getElementById('addToCartBtn');
    const nowInCart = !exists;
    btn.classList.toggle('added', nowInCart);
    btn.textContent = nowInCart ? '✓ In Cart' : '🛒 Add to Cart';
    window.showToast?.(nowInCart ? 'Added to cart 🛒' : 'Removed from cart', nowInCart ? 'success' : 'info', 1500);
  });

  /* Buy Now */
  document.getElementById('buyNowBtn').addEventListener('click', () => {
    const cart = getCart();
    if (!cart.some(i => i.id === p.id)) {
      saveCart([...cart, { ...p, qty: 1 }]);
      window.updateBadges?.();
    }
    window.location.href = 'checkout.html';
  });

  /* Wishlist */
  document.getElementById('wishlistToggle').addEventListener('click', () => {
    const list = getWishlist();
    const exists = list.some(i => i.id === p.id);
    saveWishlist(exists ? list.filter(i => i.id !== p.id) : [...list, p]);
    const btn = document.getElementById('wishlistToggle');
    btn.textContent = exists ? '🤍 Add to Wishlist' : '❤️ In Wishlist';
    window.updateBadges?.();
    window.showToast?.(exists ? 'Removed from wishlist' : 'Added to wishlist ❤️', exists ? 'info' : 'success', 1500);
  });

  /* Specs */
  if (p.weight || p.dimensions) {
    const specsSection = document.getElementById('specsSection');
    const specsTable = document.getElementById('specsTable');
    specsSection.style.display = 'block';
    let rows = '';
    if (p.brand) rows += `<tr><td>Brand</td><td>${p.brand}</td></tr>`;
    if (p.weight) rows += `<tr><td>Weight</td><td>${p.weight}g</td></tr>`;
    if (p.dimensions) rows += `<tr><td>Dimensions</td><td>${p.dimensions.width} × ${p.dimensions.height} × ${p.dimensions.depth} cm</td></tr>`;
    rows += `<tr><td>Warranty</td><td>${p.warrantyInformation || '1 Year'}</td></tr>`;
    rows += `<tr><td>Return Policy</td><td>${p.returnPolicy || '7 Days'}</td></tr>`;
    rows += `<tr><td>Category</td><td>${capitalize(p.category)}</td></tr>`;
    specsTable.innerHTML = rows;
  }
}

function renderReviews(p) {
  const reviews = p.reviews || [];
  const overview = document.getElementById('ratingOverview');

  /* Rating overview */
  const avgRating = p.rating || 4.0;
  const starDist = [0,0,0,0,0];
  reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) starDist[r.rating - 1]++; });
  const totalReviews = reviews.length || 1;

  overview.innerHTML = `
    <div class="rating-big">
      <div class="number">${avgRating.toFixed(1)}</div>
      <div class="stars">${renderStars(avgRating)}</div>
      <div class="count">${reviews.length} reviews</div>
    </div>
    <div class="rating-bars">
      ${[5,4,3,2,1].map(star => {
        const count = starDist[star-1];
        const pct = Math.round((count / totalReviews) * 100);
        return `<div class="rating-bar-row">
          <span class="label">${star} ★</span>
          <div class="bar"><div class="bar-fill" style="width:${pct}%"></div></div>
          <span class="pct">${pct}%</span>
        </div>`;
      }).join('')}
    </div>
  `;

  /* Review list */
  const list = document.getElementById('reviewList');
  if (reviews.length === 0) {
    list.innerHTML = '<p style="color:var(--text-muted);padding:16px 0">No reviews yet. Be the first to review!</p>';
  } else {
    list.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="review-header">
          <div class="review-avatar">${(r.user || 'A').charAt(0).toUpperCase()}</div>
          <div>
            <div class="review-name">${r.user || 'Anonymous'}</div>
            <div class="review-date">${r.date ? new Date(r.date).toLocaleDateString('en-IN', {year:'numeric',month:'short',day:'numeric'}) : ''}</div>
          </div>
        </div>
        <div class="review-stars">${renderStars(r.rating)}</div>
        <div class="review-text">${r.text}</div>
      </div>
    `).join('');
  }

  /* Star input */
  let selectedRating = 0;
  document.querySelectorAll('#starInput span').forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.star);
      document.querySelectorAll('#starInput span').forEach((s, i) => {
        s.classList.toggle('active', i < selectedRating);
      });
    });
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.star);
      document.querySelectorAll('#starInput span').forEach((s, i) => {
        s.style.color = i < val ? '#f59e0b' : '';
      });
    });
    star.addEventListener('mouseleave', () => {
      document.querySelectorAll('#starInput span').forEach((s, i) => {
        s.style.color = i < selectedRating ? '#f59e0b' : '';
      });
    });
  });

  /* Submit review */
  document.getElementById('submitReviewBtn').addEventListener('click', () => {
    const text = document.getElementById('reviewText').value.trim();
    if (!selectedRating) { window.showToast?.('Please select a rating', 'warning'); return; }
    if (!text) { window.showToast?.('Please write a review', 'warning'); return; }

    /* Add review locally (since no auth required for demo) */
    const user = JSON.parse(localStorage.getItem('ai_shop_user'));
    const newReview = {
      user: user?.name || 'You',
      rating: selectedRating,
      text,
      date: new Date().toISOString()
    };

    const reviewCard = document.createElement('div');
    reviewCard.className = 'review-card';
    reviewCard.innerHTML = `
      <div class="review-header">
        <div class="review-avatar">${newReview.user.charAt(0).toUpperCase()}</div>
        <div>
          <div class="review-name">${newReview.user}</div>
          <div class="review-date">Just now</div>
        </div>
      </div>
      <div class="review-stars">${renderStars(newReview.rating)}</div>
      <div class="review-text">${newReview.text}</div>
    `;

    const reviewList = document.getElementById('reviewList');
    const noReviews = reviewList.querySelector('p');
    if (noReviews) noReviews.remove();
    reviewList.prepend(reviewCard);

    document.getElementById('reviewText').value = '';
    selectedRating = 0;
    document.querySelectorAll('#starInput span').forEach(s => s.classList.remove('active'));

    window.showToast?.('Review submitted! ⭐', 'success');
  });
}

async function loadSimilarProducts(product) {
  const allProds = await getAllProducts();
  const similar = allProds
    .filter(p => p.category === product.category && p.id !== product.id)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  const grid = document.getElementById('similarProducts');
  if (!grid || similar.length === 0) return;

  grid.innerHTML = similar.map(p => `
    <div class="card" onclick="window.location.href='product.html?id=${p.id}'">
      <div class="image-wrap">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
      </div>
      <h3>${p.title}</h3>
      <p class="price">₹${Math.round(p.price).toLocaleString('en-IN')}</p>
    </div>
  `).join('');
}

/* Helpers */
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY)) || [];
const getWishlist = () => JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
const saveCart = cart => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const saveWishlist = list => localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, ' ');
