'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, getAdminToken, setAdminToken, getAdminProfile, setAdminProfile, setAdminRefreshToken } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAdminToken();
    const savedUser = getAdminProfile();

    if (savedUser) {
      setAdmin(savedUser);
    }
    
    // Instantly complete loading state on mount
    setLoading(false);

    // Verify token in background if token exists
    if (token) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      adminApi.get('/users/profile')
        .then((res) => {
          clearTimeout(timeoutId);
          if (res.success && res.data) {
            setAdmin(res.data);
            setAdminProfile(res.data);
          } else if (res.status === 401 || res.status === 403) {
            logout();
          }
        })
        .catch(() => {
          clearTimeout(timeoutId);
        });
    } else if (!savedUser) {
      setAdmin(null);
    }
  }, []);

  const login = (token, userData, refreshToken) => {
    if (refreshToken) setAdminRefreshToken(refreshToken);
    setAdminToken(token);
    setAdmin(userData);
    setAdminProfile(userData);
    setLoading(false);
  };

  const logout = () => {
    setAdminRefreshToken('');
    setAdminToken('');
    setAdminProfile(null);
    setAdmin(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AuthContext);
