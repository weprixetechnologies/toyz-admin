'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';

const MODULES = ['orders', 'products', 'categories', 'brands', 'resellers', 'affiliates', 'reports', 'settings'];

export default function StaffEditPage() {
  const { id } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', role: 'support' });
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadStaff() {
      try {
        const res = await api.get(`/admin/staff/${id}`);
        if (res.success) {
          setForm({
            name: res.data.name || '',
            email: res.data.email || '',
            role: res.data.role || 'support'
          });
          setPermissions(res.data.permissions || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadStaff();
  }, [id]);

  const togglePerm = (mod, action) => {
    setPermissions({
      ...permissions,
      [mod]: {
        ...permissions[mod],
        [action]: !permissions[mod]?.[action]
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put(`/admin/staff/${id}`, {
        ...form,
        permissions
      });
      if (res.success) {
        router.push('/staff');
      } else {
        alert(res.message || 'Failed to update staff');
      }
    } catch (err) {
      alert(err.message || 'Error updating staff');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to remove this staff account?')) return;
    try {
      const res = await api.delete(`/admin/staff/${id}`);
      if (res.success) router.push('/staff');
    } catch (err) {
      alert(err.message || 'Failed to delete staff');
    }
  };

  return (
    <>
      <div className="max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Edit Staff Account & Permissions</h1>
          <button onClick={handleDelete} className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-100">
            Delete Account
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading staff member...</div>
        ) : (
          <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border shadow-sm space-y-6">
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
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
