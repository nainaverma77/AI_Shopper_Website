/* =========================
   CART PAGE LOGIC (Enhanced)
========================= */

const CART_KEY = 'ai_shop_cart';

document.addEventListener('DOMContentLoaded', initCart);

function initCart() {
  const cartEl = document.getElementById('cartItems');
  const totalEl = document.getElementById('totalPrice');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const footerEl = document.getElementById('cartFooter');
  const couponInput = document.getElementById('couponInput');
  const applyCouponBtn = document.getElementById('applyCouponBtn');

  if (!cartEl || !totalEl) return;

  normalizeCart();
  renderCart();

  /* =========================
     HELPERS
  ========================= */
  function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.updateBadges?.();
  }

  function normalizeCart() {
    const cart = getCart().map(p => ({
      ...p,
      qty: p.qty || 1
    }));
    saveCart(cart);
  }

  /* =========================
     RENDER
  ========================= */
  function renderCart() {
    const cart = getCart();
    cartEl.innerHTML = '';
    let total = 0;

    if (!cart.length) {
      cartEl.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any products yet.</p>
          <a href="index.html" class="primary" style="display:inline-flex;padding:12px 24px;border-radius:var(--radius-md);text-decoration:none;margin-top:8px">🛍 Start Shopping</a>
        </div>
      `;
      if (footerEl) footerEl.style.display = 'none';
      totalEl.textContent = '';
      return;
    }

    if (footerEl) footerEl.style.display = 'flex';

    cart.forEach(product => {
      total += product.price * product.qty;
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
          <span class="price-discount" style="margin-left:8px">×${product.qty} = ₹${Math.round(product.price * product.qty).toLocaleString()}</span>
        </div>

        <div class="card-actions qty-actions" style="margin-top:auto;padding-top:12px">
          <button class="qty-btn minus" type="button">−</button>
          <span class="qty">${product.qty}</span>
          <button class="qty-btn plus" type="button">+</button>
          <button class="ghost remove-btn" type="button" style="margin-left:auto;color:var(--danger)">🗑 Remove</button>
        </div>
      `;

      /* ➕ */
      card.querySelector('.plus').onclick = () => {
        if (product.qty < 10) {
          product.qty++;
          saveCart(cart);
          renderCart();
        } else {
          window.showToast?.('Maximum quantity is 10', 'warning');
        }
      };

      /* ➖ */
      card.querySelector('.minus').onclick = () => {
        if (product.qty > 1) {
          product.qty--;
          saveCart(cart);
          renderCart();
        } else {
          removeFromCart(product._id || product.id);
        }
      };

      /* REMOVE */
      card.querySelector('.remove-btn').onclick = () => {
        removeFromCart(product._id || product.id);
      };

      cartEl.appendChild(card);
    });

    const shipping = total > 500 ? 0 : 49;
    const tax = Math.round(total * 0.18);
    const grandTotal = total + shipping + tax;

    totalEl.innerHTML = `₹${Math.round(grandTotal).toLocaleString()}`;
  }

  /* =========================
     ACTIONS
  ========================= */
  function removeFromCart(id) {
    const updated = getCart().filter(p => (p._id || p.id) !== id);
    saveCart(updated);
    renderCart();
    window.showToast?.('Removed from cart', 'info');
  }

  if (checkoutBtn) {
    checkoutBtn.onclick = () => {
      const user = JSON.parse(localStorage.getItem('ai_shop_user'));
      if (!user) {
        window.showToast?.('Please login to checkout', 'warning');
        setTimeout(() => window.location.href = 'login.html', 1000);
        return;
      }
      window.showToast?.('Checkout successful! 🎉 (Demo)', 'success');
      localStorage.removeItem(CART_KEY);
      window.updateBadges?.();
      renderCart();
    };
  }

  if (applyCouponBtn && couponInput) {
    applyCouponBtn.onclick = () => {
      const code = couponInput.value.trim().toUpperCase();
      if (!code) {
        window.showToast?.('Enter a coupon code', 'warning');
        return;
      }
      /* Demo coupons */
      const coupons = { 'WELCOME10': 10, 'AI30': 30, 'SUMMER15': 15 };
      if (coupons[code]) {
        window.showToast?.(`Coupon applied! ${coupons[code]}% off 🎉`, 'success');
      } else {
        window.showToast?.('Invalid coupon code', 'error');
      }
    };
  }
}
