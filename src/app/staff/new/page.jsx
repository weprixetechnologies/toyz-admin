'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

const MODULES = ['orders', 'products', 'categories', 'brands', 'resellers', 'affiliates', 'reports', 'settings'];

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'support' });
  const [permissions, setPermissions] = useState({
    orders: { view: true, edit: true, delete: false },
    products: { view: true, edit: false, delete: false },
    categories: { view: true, edit: false, delete: false },
    brands: { view: true, edit: false, delete: false },
    resellers: { view: true, edit: false, delete: false },
    affiliates: { view: true, edit: false, delete: false },
    reports: { view: false, edit: false, delete: false },
    settings: { view: false, edit: false, delete: false },
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const togglePerm = (mod, action) => {
    setPermissions({
      ...permissions,
      [mod]: {
        ...permissions[mod],
        [action]: !permissions[mod]?.[action]
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await api.post('/admin/staff', {
        ...form,
        permissions
      });
      if (res.success) {
        router.push('/staff');
      } else {
        setErr(res.message || 'Failed to create staff account');
      }
    } catch (error) {
      setErr(error.message || 'Error creating staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Staff Account</h1>
        {err && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{err}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Role Title</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm bg-white"
              >
                <option value="support">Support Agent</option>
                <option value="inventory">Inventory Manager</option>
                <option value="finance">Finance Accountant</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-bold text-slate-800 mb-3">Granular Module Permissions Grid</h2>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="p-3">Module</th>
                    <th className="p-3 text-center">View</th>
                    <th className="p-3 text-center">Edit / Create</th>
                    <th className="p-3 text-center">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {MODULES.map((mod) => (
                    <tr key={mod}>
                      <td className="p-3 font-semibold capitalize">{mod}</td>
                      {['view', 'edit', 'delete'].map((action) => (
                        <td key={action} className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={!!permissions[mod]?.[action]}
                            onChange={() => togglePerm(mod, action)}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border rounded text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
            >
              {saving ? 'Creating...' : 'Create Staff User'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
