/* =========================
   WISHLIST PAGE LOGIC
========================= */

const WISHLIST_KEY = "ai_shop_wishlist";
const CART_KEY = "ai_shop_cart";

document.addEventListener("DOMContentLoaded", initWishlist);

function initWishlist() {
  const wishlistEl = document.getElementById("wishlistItems");
  if (!wishlistEl) return;

  renderWishlist();

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

  function renderWishlist() {
    const list = getWishlist();
    const cart = getCart();
    wishlistEl.innerHTML = "";

    if (!list.length) {
      wishlistEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">❤️</div>
          <h3>Your wishlist is empty</h3>
          <p>Save products you love for later.</p>
          <a href="index.html"><button class="primary">Browse Products</button></a>
        </div>
      `;
      return;
    }

    list.forEach(product => {
      const inCart = cart.some(p => p.id === product.id);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <button type="button" class="wishlist-btn active" aria-label="Remove from wishlist">❤</button>

        <div class="image-wrap" onclick="window.location.href='product.html?id=${product.id}'">
          <img src="${product.image}" alt="${product.title}" loading="lazy">
        </div>

        <h3>${product.title}</h3>
        <p class="price">
          ₹${Math.round(product.price).toLocaleString('en-IN')}
          ${product.originalPrice ? `<span class="original-price">₹${Math.round(product.originalPrice).toLocaleString('en-IN')}</span>` : ''}
          ${product.discount ? `<span class="discount-tag">${product.discount}% off</span>` : ''}
        </p>

        <div class="card-actions">
          <button class="primary add-cart-btn">
            ${inCart ? "✓ In Cart" : "🛒 Add to Cart"}
          </button>
          <button class="ghost remove-btn">Remove</button>
        </div>
      `;

      /* Remove from wishlist via heart */
      card.querySelector(".wishlist-btn").onclick = (e) => {
        e.stopPropagation();
        removeFromWishlist(product.id);
      };

      /* Add to Cart */
      card.querySelector(".add-cart-btn").onclick = () => {
        if (!inCart) {
          const updatedCart = [...getCart(), { ...product, qty: 1 }];
          saveCart(updatedCart);
          window.showToast?.('Moved to cart 🛒', 'success', 1500);
        }
        removeFromWishlist(product.id);
      };

      /* Remove */
      card.querySelector(".remove-btn").onclick = () => {
        removeFromWishlist(product.id);
      };

      wishlistEl.appendChild(card);
    });
  }

  function removeFromWishlist(id) {
    const updated = getWishlist().filter(p => p.id !== id);
    saveWishlist(updated);
    renderWishlist();
    window.showToast?.('Removed from wishlist', 'info', 1500);
  }
}
