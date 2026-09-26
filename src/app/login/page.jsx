'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../lib/api';
import { useAdminAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [email, setEmail] = useState('superadmin@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await adminApi.post('/auth/login', { email, password });
    if (res.success && res.data) {
      const token = res.data.tokens?.accessToken || res.data.tokens?.access_token;
      const refreshToken = res.data.tokens?.refreshToken || res.data.tokens?.refresh_token;
      login(token, res.data.user, refreshToken);
      router.push('/');
    } else {
      setError(res.message || 'Admin authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Admin Control Panel</h1>
          <p className="text-xs text-gray-500">Sign in with superadmin or staff credentials</p>
        </div>

        {error && <div className="p-3 bg-red-50 text-red-600 text-xs font-semibold rounded-lg">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-sky-600 transition"
          >
            {loading ? 'Authenticating...' : 'Sign In to Control Center'}
          </button>
        </form>
      </div>
    </div>
  );
}
