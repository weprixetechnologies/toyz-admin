'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function BulkGenerateCouponsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    count: '10',
    prefix: 'PROMO',
    discount_type: 'percent',
    discount_value: '10',
    min_order_amount: '0',
    usage_limit: '1'
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [generated, setGenerated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const res = await api.post('/admin/coupons/bulk-generate', {
        ...form,
        count: parseInt(form.count, 10),
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount || 0),
        min_cart_value: parseFloat(form.min_order_amount || 0),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : 1
      });

      if (res.success && res.data) {
        // Backend returns data: { coupons: ['CODE1', 'CODE2', ...] }
        const list = Array.isArray(res.data.coupons)
          ? res.data.coupons
          : Array.isArray(res.data)
          ? res.data
          : [];
        setGenerated(list);
        toast.success(`Generated ${list.length} coupons!`);
      } else {
        setErr(res.message || 'Bulk generation failed');
        toast.error(res.message || 'Bulk generation failed');
      }
    } catch (error) {
      setErr(error.message || 'Error generating bulk coupons');
      toast.error(error.message || 'Error generating bulk coupons');
    } finally {
      setSaving(false);
    }
  };

  const safeGenerated = Array.isArray(generated) ? generated : [];

  return (
    <>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Bulk Generate Coupons</h1>
        {err && <div className="bg-red-50 text-red-700 p-4 rounded mb-4 text-xs font-semibold">{err}</div>}

        {generated !== null ? (
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-emerald-700">Successfully Generated {safeGenerated.length} Coupons!</h2>
            <div className="max-h-60 overflow-y-auto font-mono text-xs bg-slate-50 p-4 rounded border">
              {safeGenerated.map((c, i) => {
                const codeStr = typeof c === 'string' ? c : c?.code || JSON.stringify(c);
                return (
                  <div key={i} className="py-1 border-b border-slate-200 last:border-0 font-bold text-slate-800">
                    {codeStr}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => router.push('/coupons')}
              className="w-full bg-indigo-600 text-white font-medium py-2 rounded hover:bg-indigo-700 text-xs"
            >
              Back to Coupons List
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Number of Coupons to Generate</label>
              <input
                type="number"
                min="1"
                max="500"
                value={form.count}
                onChange={(e) => setForm({ ...form, count: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code Prefix</label>
              <input
                type="text"
                value={form.prefix}
                onChange={(e) => setForm({ ...form, prefix: e.target.value.toUpperCase() })}
                className="w-full border rounded px-3 py-2 text-sm uppercase"
                placeholder="e.g. FLASH, PROMO"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Discount Type</label>
                <select
                  value={form.discount_type}
                  onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="percent">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  value={form.min_order_amount}
                  onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Per Coupon Usage Limit</label>
                <input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-1/3 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-2/3 bg-indigo-600 text-white font-medium py-2 rounded text-sm hover:bg-indigo-700"
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
