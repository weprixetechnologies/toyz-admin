'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CacheSettingsPage() {
  const [form, setForm] = useState({
    products_ttl: '3600',
    categories_ttl: '86400',
    offers_ttl: '3600'
  });
  const [flushing, setFlushing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadCache() {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && res.data) {
          setForm({
            products_ttl: res.data.cache_ttl_products || '3600',
            categories_ttl: res.data.cache_ttl_categories || '86400',
            offers_ttl: res.data.cache_ttl_offers || '3600'
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadCache();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        cache_ttl_products: form.products_ttl,
        cache_ttl_categories: form.categories_ttl,
        cache_ttl_offers: form.offers_ttl
      });
      if (res.success) alert('Cache TTL settings saved!');
    } catch (err) {
      alert(err.message || 'Failed to save cache settings');
    } finally {
      setSaving(false);
    }
  };

  const handleFlushCache = async () => {
    if (!confirm('WARNING: Flushing all Redis cache may cause a brief spike in database load. Proceed?')) return;
    setFlushing(true);
    try {
      const res = await api.post('/admin/settings/cache/flush');
      if (res.success) alert('Redis cache flushed completely!');
      else alert(res.message || 'Cache flush failed');
    } catch (err) {
      alert(err.message || 'Error flushing cache');
    } finally {
      setFlushing(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Redis Cache Management</h1>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Cache Expiry TTL Rules (Seconds)</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Products Catalog TTL</label>
              <input
                type="number"
                value={form.products_ttl}
                onChange={(e) => setForm({ ...form, products_ttl: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Categories Tree TTL</label>
              <input
                type="number"
                value={form.categories_ttl}
                onChange={(e) => setForm({ ...form, categories_ttl: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promotions / Offers TTL</label>
              <input
                type="number"
                value={form.offers_ttl}
                onChange={(e) => setForm({ ...form, offers_ttl: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save TTL Settings'}
            </button>
          </div>
        </form>

        <div className="bg-white p-6 rounded-lg border border-red-200 shadow-sm flex justify-between items-center bg-red-50/30">
          <div>
            <h2 className="text-lg font-bold text-red-800">Flush Redis Cache</h2>
            <p className="text-sm text-slate-600 mt-1">
              Clears all cached product lists, categories, and offers from memory immediately.
            </p>
          </div>
          <button
            onClick={handleFlushCache}
            disabled={flushing}
            className="bg-red-600 text-white px-5 py-2.5 rounded text-sm font-bold hover:bg-red-700 shadow-sm"
          >
            {flushing ? 'Flushing...' : 'Flush Cache Now'}
          </button>
        </div>
      </div>
    </>
  );
}
