'use client';
import { memo, useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

const PRESETS_ENDPOINT = '/admin/shipping/presets';
const PRESETS_CACHE_TTL_MS = 300000;

function extractPresetList(res) {
  if (!res?.success || !res?.data) return [];
  if (Array.isArray(res.data.presets)) return res.data.presets;
  if (Array.isArray(res.data)) return res.data;
  return [];
}

const PresetRow = memo(function PresetRow({ preset, onDelete }) {
  return (
    <tr className="hover:bg-slate-50">
      <td className="p-4 font-bold text-slate-800">{preset.label}</td>
      <td className="p-4 font-bold text-emerald-700">{Number(preset.cost) === 0 ? 'FREE' : `₹${preset.cost}`}</td>
      <td className="p-4 text-slate-600">{preset.estimated_days || 'Standard'}</td>
      <td className="p-4">
        <button
          onClick={() => onDelete(preset.id)}
          className="text-red-600 hover:underline font-medium text-xs"
        >
          Delete
        </button>
      </td>
    </tr>
  );
});

export default function ShippingPresetsPage() {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ label: '', cost: '', estimated_days: '', is_active: true });
  const [saving, setSaving] = useState(false);

  const fetchPresets = useCallback(async (signal) => {
    try {
      const res = await api.get(PRESETS_ENDPOINT, {}, {
        signal,
        cacheTtlMs: PRESETS_CACHE_TTL_MS
      });
      if (res?.aborted || signal?.aborted) return;
      if (res.success && res.data) {
        setPresets(extractPresetList(res));
      } else {
        setPresets((prev) => (prev.length > 0 ? prev : []));
      }
    } catch (err) {
      if (err?.name !== 'AbortError') console.error(err);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setSyncing(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cached = api.getCached(PRESETS_ENDPOINT);
    if (cached && cached.success && cached.data) {
      setPresets(extractPresetList(cached));
      setLoading(false);
      setSyncing(true);
    }
    fetchPresets(controller.signal);
    return () => controller.abort();
  }, [fetchPresets]);

  const syncCachedPresets = (nextList) => {
    api.setCached(
      PRESETS_ENDPOINT,
      {},
      { success: true, data: { presets: nextList } },
      PRESETS_CACHE_TTL_MS
    );
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(form.label.trim())) {
      alert('Enter a valid 6-digit pincode.');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post(PRESETS_ENDPOINT, {
        ...form,
        label: form.label.trim(),
        cost: parseFloat(form.cost),
      });
      if (res.success) {
        setForm({ label: '', cost: '', estimated_days: '', is_active: true });
        const createdPreset = res.data?.id ? res.data : res.data?.preset;
        if (createdPreset) {
          setPresets((prev) => {
            const exists = prev.some((p) => p.id === createdPreset.id || p.label === createdPreset.label);
            const next = exists
              ? prev.map((p) => (p.id === createdPreset.id || p.label === createdPreset.label ? createdPreset : p))
              : [...prev, createdPreset];
            syncCachedPresets(next);
            return next;
          });
        } else {
          setSyncing(true);
          fetchPresets();
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to create preset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!confirm('Delete this shipping option?')) return;
    try {
      const res = await api.delete(`${PRESETS_ENDPOINT}/${id}`);
      if (res.success) {
        setPresets((prev) => {
          const next = prev.filter((p) => p.id !== id);
          syncCachedPresets(next);
          return next;
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to delete preset');
    }
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Shipping Options & Presets</h1>
          <p className="text-slate-500 text-sm">Configure shipping options, costs, and delivery estimates for checkout</p>
        </div>
        {syncing && (
          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            Syncing...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Add Shipping Preset</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 700090"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <p className="text-[11px] text-slate-500">Use the exact 6-digit pincode as the label. Orders without a matching pincode use the global fallback fee.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Shipping Cost (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0 for Free Shipping"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estimated Days</label>
              <input
                type="text"
                placeholder="e.g. 2-3 business days"
                value={form.estimated_days}
                onChange={(e) => setForm({ ...form, estimated_days: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white font-medium py-2 rounded text-sm hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Add Preset'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading presets...</div>
          ) : presets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No pincode rates configured yet. Unmatched pincodes use the global fallback fee from Shipping Settings.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                  <th className="p-4">Label</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Estimated Delivery</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {(Array.isArray(presets) ? presets : []).map((p) => (
                  <PresetRow key={p.id} preset={p} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
