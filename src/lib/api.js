const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.219.181:98111/api/v1';

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
      // Handle Token Expiry
      if (response.status === 401 && !isRetry) {
        const refreshToken = getAdminRefreshToken();
        if (refreshToken) {
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
                return fetchAdminApi(endpoint, options, true);
              }
            }
          } catch (e) {
            console.error('Refresh token failed', e);
          }
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
  get: (url, params = {}) => {
    const query = new URLSearchParams(params).toString();
    const fullUrl = query ? `${url}?${query}` : url;
    return fetchAdminApi(fullUrl, { method: 'GET' });
  },
  post: (url, body) => fetchAdminApi(url, { method: 'POST', body }),
  put: (url, body) => fetchAdminApi(url, { method: 'PUT', body }),
  delete: (url, options = {}) => fetchAdminApi(url, { method: 'DELETE', ...(options.data ? { body: options.data } : {}) })
};

export const api = adminApi;
export default adminApi;
