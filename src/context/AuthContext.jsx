'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { adminApi, getAdminToken, setAdminToken, getAdminProfile, setAdminProfile, setAdminRefreshToken } from '../lib/api';

export const ADMIN_ROLES = ['superadmin', 'admin', 'inventory_manager', 'support_agent'];

export const isAuthorizedAdminRole = (role) => ADMIN_ROLES.includes(role);

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setAdminRefreshToken('');
    setAdminToken('');
    setAdminProfile(null);
    setAdmin(null);
    setLoading(false);
  };

  useEffect(() => {
    const token = getAdminToken();
    const rawSaved = getAdminProfile();
    const savedUser = rawSaved?.user || rawSaved;

    if (savedUser && isAuthorizedAdminRole(savedUser.role)) {
      setAdmin(savedUser);
    } else if (savedUser) {
      // Non-admin user profile stored in admin panel storage
      logout();
    }
    
    // Instantly complete initial loading state on mount
    setLoading(false);

    // Verify token in background if token exists
    if (token) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      adminApi.get('/users/profile')
        .then((res) => {
          clearTimeout(timeoutId);
          if (res.success && res.data) {
            const userData = res.data.user || res.data;
            if (userData && isAuthorizedAdminRole(userData.role)) {
              setAdmin(userData);
              setAdminProfile(userData);
            } else {
              logout();
            }
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
    const cleanUser = userData?.user || userData;
    if (refreshToken) setAdminRefreshToken(refreshToken);
    setAdminToken(token);
    setAdmin(cleanUser);
    setAdminProfile(cleanUser);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ admin, loading, login, logout, isAuthorizedAdminRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAdminAuth = () => useContext(AuthContext);
