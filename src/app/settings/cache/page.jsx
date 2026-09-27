'use client';
import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Trash2 } from 'lucide-react';

export default function CacheSettingsPage() {
  const [form, setForm] = useState({
    products_ttl: '3600',
    categories_ttl: '86400',
    offers_ttl: '3600'
  });
  const [keys, setKeys] = useState([]);
  const [expandedKeys, setExpandedKeys] = useState({});
  const [loadingKeys, setLoadingKeys] = useState(false);
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
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoadingKeys(true);
    try {
      const res = await api.get('/cache/keys');
      if (res.success) setKeys(res.data || []);
    } catch (err) {
      console.error(err);
    }
    setLoadingKeys(false);
  }

  async function toggleExpandKey(key) {
    if (expandedKeys[key]) {
      setExpandedKeys(prev => ({ ...prev, [key]: null }));
      return;
    }
    setExpandedKeys(prev => ({ ...prev, [key]: { loading: true } }));
    try {
      const res = await api.get(`/cache/keys/${encodeURIComponent(key)}`);
      if (res.success) {
        setExpandedKeys(prev => ({ ...prev, [key]: { loading: false, data: res.data } }));
      } else {
        setExpandedKeys(prev => ({ ...prev, [key]: { loading: false, error: res.message } }));
      }
    } catch (err) {
      setExpandedKeys(prev => ({ ...prev, [key]: { loading: false, error: err.message } }));
    }
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        settings: {
          cache_ttl_products: form.products_ttl,
          cache_ttl_categories: form.categories_ttl,
          cache_ttl_offers: form.offers_ttl
        }
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
      const res = await api.delete('/cache/flush');
      if (res.success) {
        alert('Redis cache flushed completely!');
        fetchKeys();
      } else alert(res.message || 'Cache flush failed');
    } catch (err) {
      alert(err.message || 'Error flushing cache');
    } finally {
      setFlushing(false);
    }
  };

  const handleFlushKey = async (key) => {
    try {
      const res = await api.delete(`/cache/keys/${encodeURIComponent(key)}`);
      if (res.success) {
        fetchKeys();
      } else alert(res.message || 'Failed to flush key');
    } catch (err) {
      alert(err.message || 'Error flushing key');
    }
  };

  return (
    <>
      <div className="max-w-4xl space-y-6">
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
            <h2 className="text-lg font-bold text-red-800">Flush All Redis Cache</h2>
            <p className="text-sm text-slate-600 mt-1">
              Clears all cached product lists, categories, and offers from memory immediately.
            </p>
          </div>
          <button
            onClick={handleFlushCache}
            disabled={flushing}
            className="bg-red-600 text-white px-5 py-2.5 rounded text-sm font-bold hover:bg-red-700 shadow-sm"
          >
            {flushing ? 'Flushing...' : 'Flush All Cache'}
          </button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Available Cache Keys ({keys.length})</h2>
            <button onClick={fetchKeys} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
              Refresh Keys
            </button>
          </div>
          {loadingKeys ? (
            <div className="p-6 text-center text-slate-500">Loading cache keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-center text-slate-500">No cache keys found.</div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                  <tr className="border-b">
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Key</th>
                    <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-24 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {keys.map((key) => (
                    <React.Fragment key={key}>
                      <tr className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => toggleExpandKey(key)}>
                        <td className="p-4 text-sm font-mono text-slate-700 break-all select-none">
                          <span className="text-indigo-600 mr-2">{expandedKeys[key] ? '▼' : '▶'}</span>
                          {key}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleFlushKey(key); }}
                            className="text-red-500 hover:text-red-700 transition-colors p-1"
                            title="Flush this key"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      {expandedKeys[key] && (
                        <tr>
                          <td colSpan={2} className="p-0 border-b">
                            <div className="bg-slate-800 text-slate-300 p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
                              {expandedKeys[key].loading ? 'Loading...' : expandedKeys[key].error ? (
                                <span className="text-red-400">Error: {expandedKeys[key].error}</span>
                              ) : (
                                <pre>{JSON.stringify(expandedKeys[key].data, null, 2)}</pre>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
