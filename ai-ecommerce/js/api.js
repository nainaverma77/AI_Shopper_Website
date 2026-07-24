/* =========================
   API MODULE — Connects to Express backend
========================= */

const BASE_URL = '/api';

/* Simple in-memory cache */
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch with error handling, caching, and auth headers
 */
async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const cacheKey = `${options.method || 'GET'}:${url}`;

  /* Check cache for GET requests */
  if ((!options.method || options.method === 'GET') && cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    cache.delete(cacheKey);
  }

  /* Add auth header if token exists */
  const token = localStorage.getItem('ai_shop_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, { ...options, headers });

    /* Handle token expiration */
    if (res.status === 401) {
      const data = await res.json();
      if (data.code === 'TOKEN_EXPIRED') {
        const refreshed = await refreshToken();
        if (refreshed) {
          /* Retry original request */
          headers.Authorization = `Bearer ${localStorage.getItem('ai_shop_token')}`;
          const retry = await fetch(url, { ...options, headers });
          return retry.json();
        }
      }
      return data;
    }

    const data = await res.json();

    /* Cache successful GET responses */
    if ((!options.method || options.method === 'GET') && res.ok) {
      cache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;

  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

/**
 * Refresh access token
 */
async function refreshToken() {
  const refreshTk = localStorage.getItem('ai_shop_refresh_token');
  if (!refreshTk) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTk })
    });

    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('ai_shop_token', data.accessToken);
      localStorage.setItem('ai_shop_refresh_token', data.refreshToken);
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }

  /* Clear auth on failure */
  localStorage.removeItem('ai_shop_token');
  localStorage.removeItem('ai_shop_refresh_token');
  localStorage.removeItem('ai_shop_user');
  return false;
}

/**
 * Clear API cache
 */
export function clearCache() {
  cache.clear();
}

/* =========================
   PUBLIC API METHODS
========================= */

/**
 * Get all products with pagination & filters
 */
export async function getAllProducts(params = {}) {
  const query = new URLSearchParams(params).toString();
  const data = await apiFetch(`/products?${query}`);
  return data;
}

/**
 * Get product by ID
 */
export async function getProductById(id) {
  const data = await apiFetch(`/products/${id}`);
  return data;
}

/**
 * Smart search
 */
export async function smartSearch(query) {
  const data = await apiFetch(`/products/search/smart?q=${encodeURIComponent(query)}`);
  return data;
}

/**
 * Get categories
 */
export async function getCategories() {
  const data = await apiFetch('/products/categories');
  return data;
}

/**
 * Get recommended products
 */
export async function getRecommended(limit = 8) {
  const data = await apiFetch(`/products/recommended?limit=${limit}`);
  return data;
}

/**
 * Get deals
 */
export async function getDeals() {
  const data = await apiFetch('/products/deals');
  return data;
}

/* =========================
   AUTH API
========================= */
export async function loginUser(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerUser(name, email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  });
}

export async function logoutUser() {
  const result = await apiFetch('/auth/logout', { method: 'POST' });
  localStorage.removeItem('ai_shop_token');
  localStorage.removeItem('ai_shop_refresh_token');
  localStorage.removeItem('ai_shop_user');
  clearCache();
  return result;
}

export async function getMe() {
  return apiFetch('/auth/me');
}
