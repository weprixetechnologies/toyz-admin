const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.provokeplaytech.com/api/v1';

// O(1) bounded LRU cache for GET responses + L2 sessionStorage SWR persistence + in-flight coalescing
const MAX_CACHE_ENTRIES = 120;
const DEFAULT_CACHE_TTL_MS = 30000;
const SESSION_CACHE_PREFIX = 'weprixe_api_cache:';
const responseCache = new Map();
const inflightRequests = new Map();
let refreshPromise = null;

function buildEndpointUrl(url, params = {}) {
  const entries = Object.entries(params || {}).filter(
    ([, val]) => val !== undefined && val !== null && val !== ''
  );
  if (entries.length === 0) return url;
  entries.sort(([a], [b]) => a.localeCompare(b));
  const query = new URLSearchParams(entries).toString();
  return query ? `${url}?${query}` : url;
}

function readSessionCache(key) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(SESSION_CACHE_PREFIX + key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSessionCache(key, entry) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(SESSION_CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Ignore sessionStorage quota or private-browsing errors
  }
}

function clearSessionCache(prefix = '') {
  if (typeof window === 'undefined') return;
  try {
    const matchPrefix = SESSION_CACHE_PREFIX + prefix;
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(prefix ? matchPrefix : SESSION_CACHE_PREFIX)) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

function getCacheEntry(key) {
  let entry = responseCache.get(key);
  if (entry) {
    if (entry.expiresAt <= Date.now()) {
      responseCache.delete(key);
      entry = null;
    } else {
      // Move to MRU tail in O(1)
      responseCache.delete(key);
      responseCache.set(key, entry);
      return entry.data;
    }
  }

  const sessionEntry = readSessionCache(key);
  if (!sessionEntry) return null;
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  responseCache.set(key, sessionEntry);
  return sessionEntry.data;
}

function setCacheEntry(key, data, ttlMs = DEFAULT_CACHE_TTL_MS) {
  if (responseCache.has(key)) {
    responseCache.delete(key);
  } else if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey !== undefined) responseCache.delete(oldestKey);
  }
  const entry = { data, expiresAt: Date.now() + ttlMs };
  responseCache.set(key, entry);
  writeSessionCache(key, entry);
}

function invalidateCache(prefix = '') {
  if (!prefix) {
    responseCache.clear();
    clearSessionCache('');
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
  clearSessionCache(prefix);
}

export function getAdminToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_access_token') || '';
  }
  return '';
}

export function getAdminRefreshToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_refresh_token') || '';
  }
  return '';
}

export function setAdminRefreshToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('admin_refresh_token', token);
    } else {
      localStorage.removeItem('admin_refresh_token');
    }
  }
}

export function setAdminToken(token) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('admin_access_token', token);
    } else {
      localStorage.removeItem('admin_access_token');
    }
  }
}

export function getAdminProfile() {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('admin_profile');
    if (userStr) {
      try { return JSON.parse(userStr); } catch (e) { }
    }
  }
  return null;
}

export function setAdminProfile(user) {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem('admin_profile', JSON.stringify(user));
    } else {
      localStorage.removeItem('admin_profile');
    }
  }
}

async function refreshAdminSession() {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getAdminRefreshToken();
    if (!refreshToken) return false;
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data && refreshData.data.tokens) {
          setAdminToken(refreshData.data.tokens.accessToken || refreshData.data.tokens.access_token);
          setAdminRefreshToken(refreshData.data.tokens.refreshToken || refreshData.data.tokens.refresh_token);
          return true;
        }
      }
      setAdminToken('');
      setAdminRefreshToken('');
      setAdminProfile(null);
      return false;
    } catch (e) {
      console.error('Refresh token failed', e);
      setAdminToken('');
      setAdminRefreshToken('');
      setAdminProfile(null);
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function fetchAdminApi(endpoint, options = {}, isRetry = false) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const config = {
    method: options.method || 'GET',
    headers,
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.body ? { body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) } : {})
  };

  try {
    const response = await fetch(url, config);
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // Handle Token Expiry (skip refreshing for auth endpoints)
      if (response.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
        const refreshed = await refreshAdminSession();
        if (refreshed) {
          return fetchAdminApi(endpoint, options, true);
        }
      }

      const errorMessage = typeof data === 'object' && data.message ? data.message : `HTTP error ${response.status}`;
      return {
        success: false,
        status: response.status,
        message: errorMessage,
        error: errorMessage,
        data: null
      };
    }

    return typeof data === 'object' ? data : { success: true, data };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { success: false, aborted: true, status: 0, message: 'Request aborted', data: null };
    }
    console.error(`[Admin API Error] ${endpoint}:`, err);
    return {
      success: false,
      status: 500,
      message: err.message || 'Network error, please check backend connection.',
      error: err.message
    };
  }
}

export const adminApi = {
  baseURL: API_BASE_URL,
  getCached: (url, params = {}) => {
    const fullUrl = buildEndpointUrl(url, params);
    return getCacheEntry(fullUrl);
  },
  setCached: (url, params = {}, data = null, ttlMs = DEFAULT_CACHE_TTL_MS) => {
    const fullUrl = buildEndpointUrl(url, params);
    if (data !== null) setCacheEntry(fullUrl, data, ttlMs);
  },
  invalidateCache,
  clearCache: () => invalidateCache(''),
  prefetch: (url, params = {}, ttlMs = DEFAULT_CACHE_TTL_MS) => {
    const fullUrl = buildEndpointUrl(url, params);
    if (getCacheEntry(fullUrl) || inflightRequests.has(fullUrl)) return;
    const req = fetchAdminApi(fullUrl, { method: 'GET' })
      .then((res) => {
        if (res && res.success) {
          setCacheEntry(fullUrl, res, ttlMs);
        }
        return res;
      })
      .finally(() => {
        inflightRequests.delete(fullUrl);
      });
    inflightRequests.set(fullUrl, req);
  },
  get: (url, params = {}, options = {}) => {
    const fullUrl = buildEndpointUrl(url, params);
    const { signal, skipCache = false, cacheTtlMs = DEFAULT_CACHE_TTL_MS } = options;

    // Coalesce concurrent GETs without an AbortSignal (or run directly with signal)
    if (!signal && inflightRequests.has(fullUrl)) {
      return inflightRequests.get(fullUrl);
    }

    const reqPromise = fetchAdminApi(fullUrl, { method: 'GET', signal }).then((res) => {
      if (res && res.success && !skipCache) {
        setCacheEntry(fullUrl, res, cacheTtlMs);
      }
      return res;
    });

    if (!signal) {
      inflightRequests.set(fullUrl, reqPromise);
      reqPromise.finally(() => inflightRequests.delete(fullUrl));
    }

    return reqPromise;
  },
  post: async (url, body) => {
    const res = await fetchAdminApi(url, { method: 'POST', body });
    if (res && res.success) {
      const resourcePrefix = '/' + url.split('/').filter(Boolean).slice(0, 2).join('/');
      invalidateCache(resourcePrefix);
    }
    return res;
  },
  put: async (url, body) => {
    const res = await fetchAdminApi(url, { method: 'PUT', body });
    if (res && res.success) {
      const resourcePrefix = '/' + url.split('/').filter(Boolean).slice(0, 2).join('/');
      invalidateCache(resourcePrefix);
    }
    return res;
  },
  delete: async (url, options = {}) => {
    const res = await fetchAdminApi(url, { method: 'DELETE', ...(options.data ? { body: options.data } : {}) });
    if (res && res.success) {
      const resourcePrefix = '/' + url.split('/').filter(Boolean).slice(0, 2).join('/');
      invalidateCache(resourcePrefix);
    }
    return res;
  }
};

export async function downloadAdminFile(endpoint, defaultFilename = 'document.pdf') {
  const token = getAdminToken();
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });

  if (!response.ok) {
    let errMsg = 'Failed to download file';
    try {
      const errJson = await response.json();
      errMsg = errJson.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(blobUrl);
}

export const api = adminApi;
export default adminApi;
