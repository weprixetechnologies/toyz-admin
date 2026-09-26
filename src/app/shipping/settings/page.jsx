'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ShippingSettingsPage() {
  const [appliesTo, setAppliesTo] = useState('all'); // all or customer_only
  const [globalFee, setGlobalFee] = useState('50');
  const [dispatchNote, setDispatchNote] = useState('Shipped within 2-3 business days');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && res.data && res.data.settings) {
          const dict = {};
          res.data.settings.forEach(s => dict[s.setting_key] = s.setting_value);
          if (dict.shipping_applies_to) setAppliesTo(dict.shipping_applies_to);
          if (dict.global_shipping_fee) setGlobalFee(dict.global_shipping_fee);
          if (dict.dispatch_note) setDispatchNote(dict.dispatch_note);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', { settings: { shipping_applies_to: appliesTo, global_shipping_fee: globalFee, dispatch_note: dispatchNote } });
      if (res.success) alert('Shipping rules saved!');
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">Shipping Rule Settings</h1>
        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-800">Shipping Cost Scope Application</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={appliesTo === 'all'}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="font-bold text-sm text-slate-800">Apply to All Customers (Retail & Reseller B2B)</p>
                  <p className="text-xs text-slate-500">Shipping presets/costs calculated for all orders</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="radio"
                  name="scope"
                  value="customer_only"
                  checked={appliesTo === 'customer_only'}
                  onChange={(e) => setAppliesTo(e.target.value)}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <p className="font-bold text-sm text-slate-800">Retail Customers Only (Free for Resellers)</p>
                  <p className="text-xs text-slate-500">B2B Reseller orders skip shipping presets at checkout</p>
                </div>
              </label>
            </div>
          </div>
          <div className="pt-4">
            <label className="block text-sm font-medium mb-2 text-slate-800">Global Fallback Shipping Fee (₹)</label>
            <p className="text-xs text-slate-500 mb-2">Applied to normal orders if pincode matches no preset label.</p>
            <input type="number" value={globalFee} onChange={e => setGlobalFee(e.target.value)} className="w-full p-2 border rounded-lg text-sm" />
          </div>

          <div className="pt-4">
            <label className="block text-sm font-medium mb-2 text-slate-800">Dispatch / Shipping Timeline Message</label>
            <p className="text-xs text-slate-500 mb-2">This text appears on every product page in the Delivery Information section.</p>
            <input type="text" value={dispatchNote} onChange={e => setDispatchNote(e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="e.g. Shipped within 24 hours" />
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
