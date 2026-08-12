/* =========================
   AISHOPPER — API CLIENT
   Auth-aware, with token refresh
========================= */

const API_BASE = '/api';
const PRODUCTS_API = 'https://dummyjson.com/products?limit=100';

/* =========================
   TOKEN HELPERS
========================= */
function getToken() {
  return localStorage.getItem('ai_shop_token');
}

function getRefreshTokenValue() {
  return localStorage.getItem('ai_shop_refresh_token');
}

function setTokens(access, refresh) {
  localStorage.setItem('ai_shop_token', access);
  localStorage.setItem('ai_shop_refresh_token', refresh);
}

function clearTokens() {
  localStorage.removeItem('ai_shop_token');
  localStorage.removeItem('ai_shop_refresh_token');
  localStorage.removeItem('ai_shop_user');
}

/* =========================
   AUTH-AWARE FETCH
========================= */
async function apiFetch(url, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  /* Auto-refresh on 401 */
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${getToken()}`;
      res = await fetch(`${API_BASE}${url}`, { ...options, headers });
    }
  }

  return res.json();
}

/* =========================
   AUTH ENDPOINTS
========================= */
export async function loginUser(email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('ai_shop_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    return { error: 'Network error. Please try again.' };
  }
}

export async function registerUser(name, email, password) {
  try {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      localStorage.setItem('ai_shop_user', JSON.stringify(data.user));
    }
    return data;
  } catch (err) {
    return { error: 'Network error. Please try again.' };
  }
}

export async function logoutUser() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch (e) { /* ignore */ }
  clearTokens();
}

export async function getMe() {
  return apiFetch('/auth/me');
}

export async function refreshToken() {
  const rt = getRefreshTokenValue();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt })
    });
    const data = await res.json();
    if (data.accessToken) {
      setTokens(data.accessToken, data.refreshToken);
      return true;
    }
    clearTokens();
    return false;
  } catch (e) {
    clearTokens();
    return false;
  }
}

/* =========================
   PROFILE / ADDRESS
========================= */
export async function updateProfile(data) {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function addAddress(address) {
  return apiFetch('/auth/addresses', {
    method: 'POST',
    body: JSON.stringify(address)
  });
}

export async function updateAddress(id, address) {
  return apiFetch(`/auth/addresses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(address)
  });
}

export async function deleteAddress(id) {
  return apiFetch(`/auth/addresses/${id}`, { method: 'DELETE' });
}

/* =========================
   PRODUCT ENDPOINTS
========================= */
export async function getAllProducts() {
  try {
    const res = await fetch(PRODUCTS_API);
    const data = await res.json();

    return data.products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price * 80,
      originalPrice: Math.round(p.price * 80 * (1 + (p.discountPercentage || 10) / 100)),
      discount: Math.round(p.discountPercentage || 0),
      category: p.category,
      image: p.thumbnail,
      images: p.images || [p.thumbnail],
      rating: p.rating,
      brand: p.brand || 'AiShopper',
      description: p.description || '',
      stock: Math.floor(Math.random() * 200) + 10,
      reviewCount: Math.floor(Math.random() * 500) + 10,
      tags: p.tags || []
    }));
  } catch (err) {
    console.error("API ERROR:", err);
    return [];
  }
}

export async function getProductById(id) {
  try {
    const res = await fetch(`https://dummyjson.com/products/${id}`);
    const p = await res.json();
    return {
      id: p.id,
      title: p.title,
      price: p.price * 80,
      originalPrice: Math.round(p.price * 80 * (1 + (p.discountPercentage || 10) / 100)),
      discount: Math.round(p.discountPercentage || 0),
      category: p.category,
      image: p.thumbnail,
      images: p.images || [p.thumbnail],
      rating: p.rating,
      brand: p.brand || 'AiShopper',
      description: p.description || '',
      stock: Math.floor(Math.random() * 200) + 10,
      reviewCount: Math.floor(Math.random() * 500) + 10,
      tags: p.tags || [],
      weight: p.weight,
      dimensions: p.dimensions,
      warrantyInformation: p.warrantyInformation || '1 Year Warranty',
      returnPolicy: p.returnPolicy || '7 Day Return Policy',
      shippingInformation: p.shippingInformation || 'Ships in 3-5 days',
      reviews: (p.reviews || []).map(r => ({
        user: r.reviewerName,
        email: r.reviewerEmail,
        rating: r.rating,
        text: r.comment,
        date: r.date
      }))
    };
  } catch (err) {
    console.error("API ERROR:", err);
    return null;
  }
}

/* =========================
   CART ENDPOINTS (SERVER-BACKED)
========================= */
export async function getServerCart() {
  return apiFetch('/cart');
}

export async function addToServerCart(productId, quantity = 1) {
  return apiFetch('/cart/add', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity })
  });
}

export async function updateServerCartItem(productId, quantity) {
  return apiFetch('/cart/update', {
    method: 'PUT',
    body: JSON.stringify({ productId, quantity })
  });
}

export async function removeFromServerCart(productId) {
  return apiFetch(`/cart/remove/${productId}`, { method: 'DELETE' });
}

export async function clearServerCart() {
  return apiFetch('/cart/clear', { method: 'DELETE' });
}

/* =========================
   ORDER ENDPOINTS
========================= */
export async function placeOrder(orderData) {
  return apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  });
}

export async function getOrders() {
  return apiFetch('/orders');
}

export async function getOrderById(id) {
  return apiFetch(`/orders/${id}`);
}

export async function cancelOrder(id) {
  return apiFetch(`/orders/${id}/cancel`, { method: 'PUT' });
}

export async function requestReturn(id, reason) {
  return apiFetch(`/orders/${id}/return`, {
    method: 'PUT',
    body: JSON.stringify({ reason })
  });
}

/* =========================
   REVIEW ENDPOINTS
========================= */
export async function getReviews(productId) {
  return apiFetch(`/reviews/${productId}`);
}

export async function submitReview(productId, reviewData) {
  return apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify({ productId, ...reviewData })
  });
}

export async function markReviewHelpful(reviewId) {
  return apiFetch(`/reviews/${reviewId}/helpful`, { method: 'POST' });
}

/* =========================
   GLOBAL HELPERS
========================= */
export function isLoggedIn() {
  return !!getToken() && !!localStorage.getItem('ai_shop_user');
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('ai_shop_user'));
  } catch { return null; }
}
