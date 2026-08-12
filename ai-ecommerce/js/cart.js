/* =========================
   CART PAGE LOGIC (Enhanced)
========================= */

const CART_KEY = "ai_shop_cart";

if (document.readyState === 'loading') {
  document.addEventListener("DOMContentLoaded", initCart);
} else {
  initCart();
}

function initCart() {
  const cartItems = document.getElementById("cartItems");
  const summaryContent = document.getElementById("summaryContent");
  const cartLayout = document.getElementById("cartLayout");
  
  console.log("initCart started", {cartItems, summaryContent});

  if (!cartItems || !summaryContent) {
    console.error("Missing required DOM elements");
    return;
  }

  normalizeCart();
  renderCart();

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
      console.error("Error parsing cart data", e);
      return [];
    }
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

  function renderCart() {
    const cart = getCart();
    cartItems.innerHTML = "";

    if (!cart.length) {
      cartItems.innerHTML = `
        <div class="empty-state">
          <div class="icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any products yet.</p>
          <a href="index.html"><button class="primary">Continue Shopping</button></a>
        </div>
      `;
      summaryContent.innerHTML = '';
      return;
    }

    let subtotal = 0;

    cart.forEach(product => {
      subtotal += product.price * product.qty;

      const item = document.createElement("div");
      item.className = "cart-item-card";

      item.innerHTML = `
        <div class="item-image">
          <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="item-details">
          <a href="product.html?id=${product.id}" class="item-title" style="color:var(--text-primary)">${product.title}</a>
          <div class="item-category">${product.category ? product.category.charAt(0).toUpperCase() + product.category.slice(1).replace(/-/g,' ') : ''}</div>
          <div class="item-price">₹${Math.round(product.price).toLocaleString('en-IN')}
            ${product.originalPrice ? `<span style="font-size:12px;color:var(--text-muted);text-decoration:line-through;margin-left:8px">₹${Math.round(product.originalPrice).toLocaleString('en-IN')}</span>` : ''}
          </div>
        </div>
        <div class="item-controls">
          <div class="qty-actions">
            <button class="qty-btn minus">−</button>
            <span class="qty">${product.qty}</span>
            <button class="qty-btn plus">+</button>
          </div>
          <button class="remove-btn">Remove</button>
        </div>
      `;

      item.querySelector(".plus").onclick = () => {
        if (product.qty < 10) {
          product.qty++;
          saveCart(cart);
          renderCart();
        }
      };

      item.querySelector(".minus").onclick = () => {
        if (product.qty > 1) {
          product.qty--;
          saveCart(cart);
          renderCart();
        } else {
          removeFromCart(product.id);
        }
      };

      item.querySelector(".remove-btn").onclick = () => {
        removeFromCart(product.id);
      };

      cartItems.appendChild(item);
    });

    /* Price breakdown */
    const itemCount = cart.reduce((sum, p) => sum + p.qty, 0);
    const shipping = subtotal > 500 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = Math.round(subtotal + shipping + tax);

    summaryContent.innerHTML = `
      <div class="summary-row">
        <span>Subtotal (${itemCount} items)</span>
        <span>₹${Math.round(subtotal).toLocaleString('en-IN')}</span>
      </div>
      <div class="summary-row">
        <span>Shipping</span>
        <span>${shipping === 0 ? '<span class="free-tag">FREE</span>' : '₹49'}</span>
      </div>
      <div class="summary-row">
        <span>Tax (18% GST)</span>
        <span>₹${tax.toLocaleString('en-IN')}</span>
      </div>
      <div class="summary-row total">
        <span>Total</span>
        <span>₹${total.toLocaleString('en-IN')}</span>
      </div>

      <div class="coupon-input" style="margin-top:16px">
        <input type="text" placeholder="Coupon code" id="couponInput">
        <button class="ghost" id="applyCoupon">Apply</button>
      </div>

      <button class="primary" style="width:100%;height:48px;font-size:15px;font-weight:600;margin-top:16px" id="checkoutBtn">
        Proceed to Checkout
      </button>

      <a href="index.html" style="display:block;text-align:center;margin-top:12px;font-size:13px;color:var(--text-muted)">
        ← Continue Shopping
      </a>
    `;

    document.getElementById('checkoutBtn').onclick = () => {
      window.location.href = 'checkout.html';
    };

    document.getElementById('applyCoupon').onclick = () => {
      const code = document.getElementById('couponInput').value.trim().toUpperCase();
      if (!code) return;
      window.showToast?.(`Coupon "${code}" applied! 🎉`, 'success');
    };
  }

  function removeFromCart(id) {
    const updated = getCart().filter(p => p.id !== id);
    saveCart(updated);
    renderCart();
    window.showToast?.('Item removed from cart', 'info', 1500);
  }
}
