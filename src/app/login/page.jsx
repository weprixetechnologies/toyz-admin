'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../lib/api';
import { useAdminAuth, isAuthorizedAdminRole } from '../../context/AuthContext';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { admin, loading: authLoading, login } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated with an authorized role, redirect to dashboard
  useEffect(() => {
    if (!authLoading && admin && isAuthorizedAdminRole(admin.role)) {
      router.push('/');
    }
  }, [admin, authLoading, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please provide both email address and password.');
      return;
    }

    setLoading(true);

    try {
      const res = await adminApi.post('/auth/login', {
        email: cleanEmail,
        password
      });

      if (res.success && res.data) {
        const user = res.data.user;

        // Verify that the user has administrative privileges
        if (!user || !isAuthorizedAdminRole(user.role)) {
          setError('Access denied: This account does not have administrator privileges.');
          setLoading(false);
          return;
        }

        const token = res.data.tokens?.accessToken || res.data.tokens?.access_token;
        const refreshToken = res.data.tokens?.refreshToken || res.data.tokens?.refresh_token;

        if (!token) {
          setError('Authentication failed: Missing access token from server.');
          setLoading(false);
          return;
        }

        login(token, user, refreshToken);
        router.push('/');
      } else {
        setError(res.message || 'Invalid credentials. Please verify your email and password.');
        setLoading(false);
      }
    } catch (err) {
      setError(err?.message || 'A network error occurred. Please check your backend connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Admin Control Panel</h1>
          <p className="text-xs text-gray-500">Sign in with your administrative credentials</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-start gap-2.5">
            <AlertCircle size={18} className="shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
              Admin Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                autoComplete="email"
                disabled={loading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:bg-gray-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:bg-gray-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-md shadow-slate-900/10"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              'Sign In to Control Center'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
