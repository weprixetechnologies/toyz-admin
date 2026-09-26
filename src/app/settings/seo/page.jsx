'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SeoSettingsPage() {
  const [form, setForm] = useState({ meta_title: '', meta_description: '', meta_keywords: '' });
  const [lastGenerated, setLastGenerated] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function loadSeo() {
      try {
        const res = await api.get('/admin/settings');
        if (res.success && res.data) {
          setForm({
            meta_title: res.data.seo_meta_title || '',
            meta_description: res.data.seo_meta_description || '',
            meta_keywords: res.data.seo_meta_keywords || ''
          });
          if (res.data.sitemap_generated_at) setLastGenerated(res.data.sitemap_generated_at);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSeo();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/admin/settings', {
        seo_meta_title: form.meta_title,
        seo_meta_description: form.meta_description,
        seo_meta_keywords: form.meta_keywords
      });
      if (res.success) alert('SEO meta settings saved!');
    } catch (err) {
      alert(err.message || 'Failed to save SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSitemap = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/admin/seo/generate-sitemap');
      if (res.success) {
        setLastGenerated(new Date().toISOString());
        alert('Sitemap generated successfully!');
      }
    } catch (err) {
      alert(err.message || 'Failed to generate sitemap');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div className="max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">SEO & Sitemap Configuration</h1>

        <form onSubmit={handleSave} className="bg-white p-6 rounded-lg border shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Global Meta Tags</h2>
          <div>
            <label className="block text-sm font-medium mb-1">Site Meta Title</label>
            <input
              type="text"
              value={form.meta_title}
              onChange={(e) => setForm({ ...form, meta_title: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Default Meta Description</label>
            <textarea
              rows="3"
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Meta Keywords</label>
            <input
              type="text"
              value={form.meta_keywords}
              onChange={(e) => setForm({ ...form, meta_keywords: e.target.value })}
              placeholder="e.g. ecommerce, wholesale, products"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Save Meta Tags'}
            </button>
          </div>
        </form>

        <div className="bg-white p-6 rounded-lg border shadow-sm flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">XML Sitemap Generator</h2>
            <p className="text-sm text-slate-500 mt-1">
              Last generated: <span className="font-semibold">{lastGenerated ? new Date(lastGenerated).toLocaleString() : 'Never'}</span>
            </p>
          </div>
          <button
            onClick={handleGenerateSitemap}
            disabled={generating}
            className="bg-slate-800 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-slate-900"
          >
            {generating ? 'Generating...' : 'Re-generate Sitemap'}
          </button>
        </div>
      </div>
    </>
  );
}
