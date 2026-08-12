/* =========================
   ACCOUNT PAGE LOGIC
========================= */
const ORDERS_KEY = 'ai_shop_orders';

document.addEventListener('DOMContentLoaded', initAccount);

function initAccount() {
  const user = JSON.parse(localStorage.getItem('ai_shop_user'));

  /* Load user info */
  if (user) {
    document.getElementById('userAvatar').textContent = (user.name || 'U').charAt(0).toUpperCase();
    document.getElementById('userName').textContent = user.name || 'User';
    document.getElementById('userEmail').textContent = user.email || '';
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.phone || '';
    document.getElementById('profileSince').value = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long' })
      : 'Recently';
  }

  /* Section navigation */
  const hash = window.location.hash.replace('#', '') || 'profile';
  switchSection(hash);

  document.querySelectorAll('.account-nav a[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      const section = link.dataset.section;
      switchSection(section);
    });
  });

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'profile';
    switchSection(hash);
  });

  /* Save profile */
  document.getElementById('saveProfile')?.addEventListener('click', () => {
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    if (user) {
      user.name = name || user.name;
      user.phone = phone;
      localStorage.setItem('ai_shop_user', JSON.stringify(user));
      document.getElementById('userName').textContent = user.name;
      document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();
    }
    window.showToast?.('Profile saved! ✅', 'success');
  });

  /* Settings theme toggle */
  document.getElementById('settingsThemeToggle')?.addEventListener('click', () => {
    document.getElementById('themeToggle')?.click();
  });

  /* Delete account */
  document.getElementById('deleteAccount')?.addEventListener('click', () => {
    if (confirm('Are you sure? This will delete all your local data.')) {
      localStorage.clear();
      window.showToast?.('Account data cleared', 'info');
      setTimeout(() => window.location.href = 'index.html', 1000);
    }
  });

  /* Load orders */
  loadOrders();

  /* Load addresses */
  loadAddresses();

  /* Add new address */
  document.getElementById('addNewAddress')?.addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
}

function switchSection(section) {
  document.querySelectorAll('.account-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.account-nav a').forEach(a => a.classList.remove('active'));

  const sectionEl = document.getElementById(`section-${section}`);
  const navEl = document.querySelector(`.account-nav a[data-section="${section}"]`);

  if (sectionEl) sectionEl.classList.add('active');
  if (navEl) navEl.classList.add('active');

  if (section === 'orders') loadOrders();
}

function loadOrders() {
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  const container = document.getElementById('ordersList');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your order history will appear here.</p>
        <a href="index.html"><button class="primary">Start Shopping</button></a>
      </div>`;
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <div>
          <span class="order-id">${order.orderNo}</span>
          <span class="order-date" style="margin-left:12px">${new Date(order.date).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' })}</span>
        </div>
        <span class="order-status ${order.status}">${capitalize(order.status)}</span>
      </div>
      <div class="order-items">
        ${order.items.map(item => `
          <div class="order-item-mini">
            <img src="${item.image}" alt="${item.title}">
            <div>
              <div style="font-size:13px">${item.title}</div>
              <div style="font-size:12px;color:var(--text-muted)">Qty: ${item.qty} × ₹${Math.round(item.price).toLocaleString('en-IN')}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--border-subtle)">
        <span style="font-weight:600">Total: ₹${Math.round(order.total).toLocaleString('en-IN')}</span>
        <div style="display:flex;gap:8px">
          ${order.status === 'placed' ? `<button class="ghost" onclick="cancelOrder('${order.orderNo}')" style="font-size:12px;color:var(--danger)">Cancel</button>` : ''}
          ${order.status === 'delivered' ? `<button class="ghost" onclick="returnOrder('${order.orderNo}')" style="font-size:12px">Return/Exchange</button>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}

function loadAddresses() {
  const user = JSON.parse(localStorage.getItem('ai_shop_user'));
  const container = document.getElementById('addressesList');
  if (!container) return;

  const addresses = user?.addresses || [];
  if (addresses.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted)">No saved addresses. Add one during checkout.</p>`;
    return;
  }

  container.innerHTML = addresses.map(addr => `
    <div class="address-card">
      <span class="label-tag">${addr.label || 'Home'}</span>
      <p style="font-size:14px;line-height:1.6;color:var(--text-secondary)">
        <strong>${addr.fullName}</strong><br>
        ${addr.line1}${addr.line2 ? ', ' + addr.line2 : ''}<br>
        ${addr.city}, ${addr.state} - ${addr.pincode}<br>
        📞 ${addr.phone}
      </p>
    </div>
  `).join('');
}

/* Global order actions */
window.cancelOrder = function(orderNo) {
  if (!confirm('Cancel this order?')) return;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  const order = orders.find(o => o.orderNo === orderNo);
  if (order) {
    order.status = 'cancelled';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    loadOrders();
    window.showToast?.('Order cancelled', 'info');
  }
};

window.returnOrder = function(orderNo) {
  if (!confirm('Request return/exchange for this order?')) return;
  const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  const order = orders.find(o => o.orderNo === orderNo);
  if (order) {
    order.status = 'returned';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    loadOrders();
    window.showToast?.('Return request submitted', 'success');
  }
};

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ') : '';
}
