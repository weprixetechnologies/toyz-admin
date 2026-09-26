'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function BulkGenerateCouponsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    prefix: 'PROMO',
    count: '10',
    discount_type: 'percentage',
    discount_value: '10',
    min_order_amount: '0',
    usage_limit: '1'
  });
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await api.post('/admin/coupons/bulk-generate', {
        ...form,
        count: parseInt(form.count),
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount || 0),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : 1
      });
      if (res.success) {
        setGenerated(res.data || []);
      } else {
        setErr(res.message || 'Bulk generation failed');
      }
    } catch (error) {
      setErr(error.message || 'Error generating bulk coupons');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Bulk Generate Coupons</h1>
        {err && <div className="bg-red-50 text-red-700 p-4 rounded mb-4">{err}</div>}

        {generated ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-emerald-700">Successfully Generated {generated.length} Coupons!</h2>
            <div className="max-h-60 overflow-y-auto font-mono text-sm bg-slate-50 p-4 rounded border">
              {generated.map((c, i) => (
                <div key={i} className="py-1 border-b border-slate-200 last:border-0">{c.code}</div>
              ))}
            </div>
            <button
              onClick={() => router.push('/coupons')}
              className="w-full bg-indigo-600 text-white font-medium py-2 rounded hover:bg-indigo-700"
            >
              Back to Coupons List
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code Prefix</label>
                <input
                  type="text"
                  value={form.prefix}
                  onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                  className="w-full border rounded px-3 py-2 font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Coupons to Generate</label>
                <input
                  type="number"
                  value={form.count}
                  onChange={(e) => setForm({ ...form, count: e.target.value })}
                  min="1"
                  max="500"
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm bg-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
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
                {saving ? 'Generating...' : 'Generate Batch'}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
