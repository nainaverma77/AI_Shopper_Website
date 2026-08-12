/* =========================
   CHECKOUT PAGE LOGIC
========================= */
const CART_KEY = 'ai_shop_cart';
const ORDERS_KEY = 'ai_shop_orders';

document.addEventListener('DOMContentLoaded', initCheckout);

function initCheckout() {
  const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
  if (cart.length === 0) {
    document.getElementById('checkoutMain').innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products before checking out.</p>
        <a href="index.html"><button class="primary">Go Shopping</button></a>
      </div>`;
    document.getElementById('checkoutSummary').style.display = 'none';
    return;
  }

  let currentStep = 1;
  let selectedPayment = 'cod';
  let addressData = {};

  renderSummary(cart);
  setupSteps();

  function renderSummary(cart) {
    const content = document.getElementById('checkoutSummaryContent');
    let subtotal = 0;
    let itemCount = 0;

    const itemsHTML = cart.map(p => {
      subtotal += p.price * p.qty;
      itemCount += p.qty;
      return `
        <div style="display:flex;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
          <img src="${p.image}" alt="${p.title}" style="width:48px;height:48px;object-fit:contain;background:var(--bg-primary);border-radius:6px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.title}</div>
            <div style="font-size:12px;color:var(--text-muted)">Qty: ${p.qty}</div>
          </div>
          <div style="font-size:13px;font-weight:600">₹${Math.round(p.price * p.qty).toLocaleString('en-IN')}</div>
        </div>
      `;
    }).join('');

    const shipping = subtotal > 500 ? 0 : 49;
    const tax = Math.round(subtotal * 0.18);
    const total = Math.round(subtotal + shipping + tax);

    content.innerHTML = `
      <div style="max-height:250px;overflow-y:auto;margin-bottom:16px">${itemsHTML}</div>
      <div class="summary-row"><span>Subtotal (${itemCount} items)</span><span>₹${Math.round(subtotal).toLocaleString('en-IN')}</span></div>
      <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? '<span class="free-tag">FREE</span>' : '₹49'}</span></div>
      <div class="summary-row"><span>Tax (18% GST)</span><span>₹${tax.toLocaleString('en-IN')}</span></div>
      <div class="summary-row total"><span>Total</span><span>₹${total.toLocaleString('en-IN')}</span></div>
    `;
  }

  function setupSteps() {
    /* Payment method selection */
    document.querySelectorAll('.payment-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedPayment = opt.dataset.method;
      });
    });

    /* Step 1 → Step 2 */
    document.getElementById('toPaymentBtn').addEventListener('click', () => {
      const name = document.getElementById('addrName').value.trim();
      const phone = document.getElementById('addrPhone').value.trim();
      const line1 = document.getElementById('addrLine1').value.trim();
      const city = document.getElementById('addrCity').value.trim();
      const state = document.getElementById('addrState').value.trim();
      const pincode = document.getElementById('addrPincode').value.trim();

      if (!name || !phone || !line1 || !city || !state || !pincode) {
        window.showToast?.('Please fill in all required address fields', 'warning');
        return;
      }

      addressData = {
        fullName: name,
        phone,
        line1,
        line2: document.getElementById('addrLine2').value.trim(),
        city, state, pincode,
        country: document.getElementById('addrCountry').value.trim() || 'India'
      };

      goToStep(2);
    });

    /* Step 2 → Step 3 */
    document.getElementById('toConfirmBtn').addEventListener('click', () => {
      renderOrderReview();
      goToStep(3);
    });

    /* Back buttons */
    document.getElementById('backToAddress').addEventListener('click', () => goToStep(1));
    document.getElementById('backToPayment').addEventListener('click', () => goToStep(2));

    /* Place Order */
    document.getElementById('placeOrderBtn').addEventListener('click', placeOrder);
  }

  function goToStep(step) {
    currentStep = step;

    document.getElementById('addressSection').style.display = step === 1 ? 'block' : 'none';
    document.getElementById('paymentSection').style.display = step === 2 ? 'block' : 'none';
    document.getElementById('confirmSection').style.display = step === 3 ? 'block' : 'none';

    ['step1', 'step2', 'step3'].forEach((id, i) => {
      const el = document.getElementById(id);
      el.classList.remove('active', 'done');
      if (i + 1 < step) el.classList.add('done');
      if (i + 1 === step) el.classList.add('active');
    });
  }

  function renderOrderReview() {
    const paymentNames = { cod: 'Cash on Delivery', upi: 'UPI', card: 'Credit/Debit Card', netbanking: 'Net Banking' };

    document.getElementById('orderReview').innerHTML = `
      <div style="background:var(--surface-1);padding:16px;border-radius:var(--radius-lg);margin-bottom:16px">
        <h4 style="font-size:14px;margin-bottom:8px">📍 Delivery Address</h4>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6">
          <strong>${addressData.fullName}</strong><br>
          ${addressData.line1}${addressData.line2 ? ', ' + addressData.line2 : ''}<br>
          ${addressData.city}, ${addressData.state} - ${addressData.pincode}<br>
          📞 ${addressData.phone}
        </p>
      </div>
      <div style="background:var(--surface-1);padding:16px;border-radius:var(--radius-lg)">
        <h4 style="font-size:14px;margin-bottom:8px">💳 Payment Method</h4>
        <p style="font-size:14px;color:var(--text-secondary)">${paymentNames[selectedPayment] || selectedPayment}</p>
      </div>
    `;
  }

  function placeOrder() {
    const btn = document.getElementById('placeOrderBtn');
    btn.disabled = true;
    btn.textContent = 'Placing Order...';

    setTimeout(() => {
      /* Generate order */
      const orderNo = 'AIS-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
      const order = {
        orderNo,
        items: cart.map(p => ({ id: p.id, title: p.title, image: p.image, price: p.price, qty: p.qty })),
        address: addressData,
        payment: selectedPayment,
        status: 'placed',
        date: new Date().toISOString(),
        total: cart.reduce((sum, p) => sum + p.price * p.qty, 0)
      };

      /* Save to localStorage */
      const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
      orders.unshift(order);
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

      /* Clear cart */
      localStorage.removeItem(CART_KEY);
      window.updateBadges?.();

      /* Show success */
      document.getElementById('addressSection').style.display = 'none';
      document.getElementById('paymentSection').style.display = 'none';
      document.getElementById('confirmSection').style.display = 'none';
      document.getElementById('checkoutSummary').style.display = 'none';
      document.querySelector('.checkout-steps').style.display = 'none';
      document.getElementById('successSection').style.display = 'block';
      document.getElementById('orderNoText').textContent = `Order No: ${orderNo}`;

      window.showToast?.('Order placed successfully! 🎉', 'success');
    }, 1500);
  }
}
