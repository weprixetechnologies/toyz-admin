'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function NewOfferPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    code: '',
    offer_type: 'percentage', // percentage, flat_discount, buy_x_get_y, free_shipping
    discount_value: '',
    min_order_amount: '',
    max_discount_amount: '',
    buy_qty: '',
    get_qty: '',
    start_time: '',
    end_time: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      
      // Map frontend form to backend expectations
      let mappedOfferType = form.offer_type;
      let mappedDiscountType = null;
      if (form.offer_type === 'percentage') {
        mappedOfferType = 'percent_off';
        mappedDiscountType = 'percent';
      } else if (form.offer_type === 'flat_discount') {
        mappedOfferType = 'flat_off';
        mappedDiscountType = 'flat';
      } else if (form.offer_type === 'buy_x_get_y') {
        mappedOfferType = 'bxgy';
      } else if (form.offer_type === 'free_shipping') {
        mappedOfferType = 'percent_off'; // Free shipping is not in enum, fallback or ignore
        mappedDiscountType = 'free';
      }

      const payload = {
        name: form.title,
        description: form.description || form.title,
        offer_type: mappedOfferType,
        discount_type: mappedDiscountType,
        discount_value: form.discount_value ? parseFloat(form.discount_value) : 0,
        min_cart_value: form.min_order_amount ? parseFloat(form.min_order_amount) : 0,
        max_discount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
        is_active: form.is_active ? 1 : 0
      };
      const res = await api.post('/admin/offers', payload);
      if (res.success) {
        router.push('/offers');
      } else {
        setErr(res.message || 'Failed to create offer');
      }
    } catch (error) {
      setErr(error.message || 'Error creating offer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Offer</h1>

        {err && <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 border border-red-200">{err}</div>}

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Offer Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Offer Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                rows="2"
                placeholder="E.g., Valid on all RC cars and accessories..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Offer Code (Optional)</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Offer Type</label>
            <select
              value={form.offer_type}
              onChange={(e) => setForm({ ...form, offer_type: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm bg-white"
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="flat_discount">Flat Discount Amount (₹)</option>
              <option value="buy_x_get_y">Buy X Get Y Free (BOGO)</option>
              <option value="free_shipping">Free Shipping</option>
            </select>
          </div>

          {(form.offer_type === 'percentage' || form.offer_type === 'flat_discount') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {form.offer_type === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              {form.offer_type === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.max_discount_amount}
                    onChange={(e) => setForm({ ...form, max_discount_amount: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          {form.offer_type === 'buy_x_get_y' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Buy Quantity (X)</label>
                <input
                  type="number"
                  value={form.buy_qty}
                  onChange={(e) => setForm({ ...form, buy_qty: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Get Free Quantity (Y)</label>
                <input
                  type="number"
                  value={form.get_qty}
                  onChange={(e) => setForm({ ...form, get_qty: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-700">Active Immediately</span>
              </label>
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
              {saving ? 'Creating...' : 'Create Offer'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
