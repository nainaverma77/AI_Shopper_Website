/* =========================
   WISHLIST PAGE LOGIC (Enhanced)
========================= */

const WISHLIST_KEY = 'ai_shop_wishlist';
const CART_KEY = 'ai_shop_cart';

document.addEventListener('DOMContentLoaded', initWishlist);

function initWishlist() {
  const wishlistEl = document.getElementById('wishlistItems');
  const moveAllBtn = document.getElementById('moveAllToCartBtn');

  if (!wishlistEl) return;

  renderWishlist();

  /* Move All to Cart */
  if (moveAllBtn) {
    moveAllBtn.addEventListener('click', () => {
      const list = getWishlist();
      const cart = getCart();

      list.forEach(product => {
        const pid = product._id || product.id;
        if (!cart.some(p => (p._id || p.id) === pid)) {
          cart.push({ ...product, qty: 1 });
        }
      });

      saveCart(cart);
      saveWishlist([]);
      renderWishlist();
      window.updateBadges?.();
      window.showToast?.('All items moved to cart 🛒', 'success');
    });
  }

  /* =========================
     HELPERS
  ========================= */
  function getWishlist() {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || [];
  }

  function saveWishlist(list) {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
    window.updateBadges?.();
  }

  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.updateBadges?.();
  }

  /* =========================
     RENDER
  ========================= */
  function renderWishlist() {
    const list = getWishlist();
    const cart = getCart();
    wishlistEl.innerHTML = '';

    /* Show/hide Move All button */
    if (moveAllBtn) {
      moveAllBtn.style.display = list.length > 1 ? 'inline-flex' : 'none';
    }

    if (!list.length) {
      wishlistEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love and track price drops.</p>
          <a href="index.html" class="primary" style="display:inline-flex;padding:12px 24px;border-radius:var(--radius-md);text-decoration:none;margin-top:8px">🛍 Discover Products</a>
        </div>
      `;
      return;
    }

    list.forEach(product => {
      const pid = product._id || product.id;
      const inCart = cart.some(p => (p._id || p.id) === pid);
      const img = product.thumbnail || (product.images && product.images[0]) || product.image || '';

      const card = document.createElement('div');
      card.className = 'card';

      card.innerHTML = `
        <div class="image-wrap">
          <img src="${img}" alt="${product.title}" loading="lazy" />
        </div>

        <h3>${product.title}</h3>

        <div class="price">
          <span class="price-current">₹${Math.round(product.price).toLocaleString()}</span>
        </div>

        <div class="card-actions" style="margin-top:auto;padding-top:12px">
          <button class="primary add-cart-btn" type="button">
            ${inCart ? '✓ In Cart' : '🛒 Add to Cart'}
          </button>
          <button class="ghost remove-btn" type="button" style="color:var(--danger)">✕</button>
        </div>
      `;

      /* ADD TO CART */
      card.querySelector('.add-cart-btn').onclick = () => {
        if (!inCart) {
          const updatedCart = [...getCart(), { ...product, qty: 1 }];
          saveCart(updatedCart);
          window.showToast?.('Moved to cart 🛒', 'success');
        }
        removeFromWishlist(pid);
      };

      /* REMOVE */
      card.querySelector('.remove-btn').onclick = () => {
        removeFromWishlist(pid);
        window.showToast?.('Removed from wishlist', 'info');
      };

      wishlistEl.appendChild(card);
    });
  }

  /* =========================
     ACTIONS
  ========================= */
  function removeFromWishlist(id) {
    const updated = getWishlist().filter(p => (p._id || p.id) !== id);
    saveWishlist(updated);
    renderWishlist();
  }
}
