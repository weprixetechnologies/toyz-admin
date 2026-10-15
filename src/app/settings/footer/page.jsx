'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  PanelBottom, PanelTop, Save, RotateCcw, Upload, Image as ImageIcon, Trash2,
  Plus, ArrowUp, ArrowDown, ExternalLink, Eye, Share2, Menu,
  Layers, Gift, Facebook, Twitter, Instagram, Youtube, Linkedin,
  MessageCircle, HelpCircle, AlertCircle, CheckCircle2
} from 'lucide-react';

const DEFAULT_FOOTER_CONFIG = {
  brand: {
    logo_url: '',
    logo_text: 'ToyWorld',
    about_text: 'Bringing joy to kids of all ages with premium toys, next-level RC cars, and educational games. Playtime never stops!',
    show_brand_column: true
  },
  column_count: 4,
  columns: [
    {
      id: 'col-shop',
      heading: 'Shop',
      type: 'links',
      custom_content: '',
      links: [
        { id: 'l-1', label: 'All Products', url: '/products', target: '_self', highlight: false },
        { id: 'l-2', label: 'RC Cars & Trucks', url: '/categories/rc-cars', target: '_self', highlight: false },
        { id: 'l-3', label: 'Action Figures', url: '/categories/action-figures', target: '_self', highlight: false },
        { id: 'l-4', label: 'Puzzles & Games', url: '/categories/puzzles', target: '_self', highlight: false },
        { id: 'l-5', label: 'Educational Toys', url: '/categories/educational', target: '_self', highlight: false },
        { id: 'l-6', label: 'Baby & Toddler', url: '/categories/toddler', target: '_self', highlight: false },
        { id: 'l-7', label: 'Apply as Reseller', url: '/account/apply-reseller', target: '_self', highlight: true }
      ]
    },
    {
      id: 'col-care',
      heading: 'Customer Care',
      type: 'links',
      custom_content: '',
      links: [
        { id: 'l-8', label: 'Track Your Order', url: '/account/orders', target: '_self', highlight: false },
        { id: 'l-9', label: 'Shipping & Returns', url: '/shipping-returns', target: '_self', highlight: false },
        { id: 'l-10', label: 'FAQ', url: '/faq', target: '_self', highlight: false },
        { id: 'l-11', label: 'Contact Us', url: '/contact', target: '_self', highlight: false }
      ]
    },
    {
      id: 'col-contact',
      heading: 'Contact Us',
      type: 'custom',
      custom_content: 'Email: hello@toyworld.com\nPhone: +1 (800) TOY-WORLD\nAddress: 123 Playtime Avenue, Fun City, TX 75001',
      links: []
    }
  ],
  social_media: {
    enabled: true,
    title: 'Follow Us',
    links: [
      { id: 'soc-fb', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com', enabled: true },
      { id: 'soc-tw', platform: 'twitter', label: 'Twitter / X', url: 'https://twitter.com', enabled: true },
      { id: 'soc-ig', platform: 'instagram', label: 'Instagram', url: 'https://instagram.com', enabled: true },
      { id: 'soc-yt', platform: 'youtube', label: 'YouTube', url: 'https://youtube.com', enabled: true },
      { id: 'soc-wa', platform: 'whatsapp', label: 'WhatsApp', url: '', enabled: false },
      { id: 'soc-li', platform: 'linkedin', label: 'LinkedIn', url: '', enabled: false }
    ]
  },
  bottom_bar: {
    enabled: true,
    copyright_text: '© {year} ToyWorld Inc. All rights reserved.',
    links: [
      { id: 'bot-1', label: 'Privacy Policy', url: '/privacy', target: '_self' },
      { id: 'bot-2', label: 'Terms of Service', url: '/terms', target: '_self' }
    ]
  }
};

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'twitter', label: 'Twitter / X', icon: Twitter },
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin }
];

export default function FooterSettingsPage() {
  const [config, setConfig] = useState(DEFAULT_FOOTER_CONFIG);
  const [activeTab, setActiveTab] = useState('brand');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadFooterSettings();
  }, []);

  const loadFooterSettings = async () => {
    setLoading(true);
    try {
      // First try dedicated footer endpoint
      const res = await adminApi.get('/footer');
      if (res.success && res.data) {
        mergeConfig(res.data);
      } else {
        // Fallback to /settings
        const setRes = await adminApi.get('/settings');
        if (setRes.success && setRes.data?.settings?.footer_settings) {
          try {
            const parsed = typeof setRes.data.settings.footer_settings === 'string'
              ? JSON.parse(setRes.data.settings.footer_settings)
              : setRes.data.settings.footer_settings;
            mergeConfig(parsed);
          } catch (e) {
            console.error('Failed to parse footer_settings', e);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load footer settings:', err);
      toast.error('Could not load current footer settings');
    } finally {
      setLoading(false);
    }
  };

  const mergeConfig = (data) => {
    if (!data || typeof data !== 'object') return;
    setConfig({
      brand: {
        ...DEFAULT_FOOTER_CONFIG.brand,
        ...(data.brand || {})
      },
      column_count: data.column_count || DEFAULT_FOOTER_CONFIG.column_count,
      columns: Array.isArray(data.columns) ? data.columns : DEFAULT_FOOTER_CONFIG.columns,
      social_media: {
        ...DEFAULT_FOOTER_CONFIG.social_media,
        ...(data.social_media || {}),
        links: Array.isArray(data.social_media?.links)
          ? data.social_media.links
          : DEFAULT_FOOTER_CONFIG.social_media.links
      },
      bottom_bar: {
        ...DEFAULT_FOOTER_CONFIG.bottom_bar,
        ...(data.bottom_bar || {}),
        links: Array.isArray(data.bottom_bar?.links)
          ? data.bottom_bar.links
          : DEFAULT_FOOTER_CONFIG.bottom_bar.links
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Attempt saving via dedicated /admin/footer endpoint
      let res = await adminApi.put('/admin/footer', config);
      if (!res.success) {
        // Fallback to bulk settings
        res = await adminApi.put('/admin/settings', {
          settings: {
            footer_settings: JSON.stringify(config)
          }
        });
      }

      if (res.success) {
        toast.success('Footer settings saved successfully!');
      } else {
        toast.error(res.message || 'Failed to save footer settings');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all footer settings to defaults? Any unsaved edits will be lost.')) {
      setConfig(DEFAULT_FOOTER_CONFIG);
      toast('Footer configuration reset to defaults. Click "Save Changes" to publish.', { icon: '🔄' });
    }
  };

  // ─── Logo File Upload ──────────────────────────────────────────────────────────
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    setUploadingLogo(true);
    try {
      const filename = `footer-logo-${Date.now()}.${file.name.split('.').pop()}`;
      const res = await adminApi.post(`/storage/upload?key=${encodeURIComponent(`site/${filename}`)}&contentType=${encodeURIComponent(file.type)}`, {});

      if (res.success && res.data?.uploadUrl) {
        const fullUploadUrl = res.data.uploadUrl.startsWith('http')
          ? res.data.uploadUrl
          : adminApi.baseURL.replace('/api/v1', '') + res.data.uploadUrl;

        const uploadRes = await fetch(fullUploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (uploadRes.ok) {
          const finalUrl = res.data.fileUrl || res.data.uploadUrl;
          setConfig(prev => ({
            ...prev,
            brand: { ...prev.brand, logo_url: finalUrl }
          }));
          toast.success('Logo uploaded successfully!');
        } else {
          toast.error('Failed to upload file to storage');
        }
      } else {
        // Fallback: create base64 data URL for preview and saving
        const reader = new FileReader();
        reader.onload = () => {
          setConfig(prev => ({
            ...prev,
            brand: { ...prev.brand, logo_url: reader.result }
          }));
          toast.success('Logo image loaded!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Logo upload error:', err);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

  // ─── Column Handlers ─────────────────────────────────────────────────────────
  const addColumn = () => {
    const newCol = {
      id: `col-${Date.now()}`,
      heading: 'New Menu Heading',
      type: 'links',
      custom_content: '',
      links: [
        { id: `l-${Date.now()}-1`, label: 'New Link', url: '/products', target: '_self', highlight: false }
      ]
    };
    setConfig(prev => ({
      ...prev,
      columns: [...prev.columns, newCol]
    }));
  };

  const removeColumn = (colIdx) => {
    if (confirm('Delete this footer column and all its links?')) {
      setConfig(prev => ({
        ...prev,
        columns: prev.columns.filter((_, idx) => idx !== colIdx)
      }));
    }
  };

  const moveColumn = (colIdx, direction) => {
    const targetIdx = colIdx + direction;
    if (targetIdx < 0 || targetIdx >= config.columns.length) return;
    const updated = [...config.columns];
    const temp = updated[colIdx];
    updated[colIdx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setConfig(prev => ({ ...prev, columns: updated }));
  };

  const updateColumn = (colIdx, field, val) => {
    setConfig(prev => {
      const updated = [...prev.columns];
      updated[colIdx] = { ...updated[colIdx], [field]: val };
      return { ...prev, columns: updated };
    });
  };

  // ─── Link Handlers within Column ─────────────────────────────────────────────
  const addLinkToColumn = (colIdx) => {
    const newLink = {
      id: `l-${Date.now()}`,
      label: 'New Link',
      url: '/',
      target: '_self',
      highlight: false
    };
    setConfig(prev => {
      const updated = [...prev.columns];
      const curCol = updated[colIdx];
      updated[colIdx] = {
        ...curCol,
        links: [...(curCol.links || []), newLink]
      };
      return { ...prev, columns: updated };
    });
  };

  const removeLinkFromColumn = (colIdx, linkIdx) => {
    setConfig(prev => {
      const updated = [...prev.columns];
      const curCol = updated[colIdx];
      updated[colIdx] = {
        ...curCol,
        links: curCol.links.filter((_, idx) => idx !== linkIdx)
      };
      return { ...prev, columns: updated };
    });
  };

  const moveLinkInColumn = (colIdx, linkIdx, direction) => {
    const col = config.columns[colIdx];
    const targetIdx = linkIdx + direction;
    if (targetIdx < 0 || targetIdx >= col.links.length) return;
    setConfig(prev => {
      const updated = [...prev.columns];
      const links = [...updated[colIdx].links];
      const temp = links[linkIdx];
      links[linkIdx] = links[targetIdx];
      links[targetIdx] = temp;
      updated[colIdx] = { ...updated[colIdx], links };
      return { ...prev, columns: updated };
    });
  };

  const updateLinkInColumn = (colIdx, linkIdx, field, val) => {
    setConfig(prev => {
      const updated = [...prev.columns];
      const links = [...updated[colIdx].links];
      links[linkIdx] = { ...links[linkIdx], [field]: val };
      updated[colIdx] = { ...updated[colIdx], links };
      return { ...prev, columns: updated };
    });
  };

  // ─── Bottom Bar Links ────────────────────────────────────────────────────────
  const addBottomLink = () => {
    setConfig(prev => ({
      ...prev,
      bottom_bar: {
        ...prev.bottom_bar,
        links: [
          ...(prev.bottom_bar.links || []),
          { id: `bot-${Date.now()}`, label: 'New Link', url: '/', target: '_self' }
        ]
      }
    }));
  };

  const removeBottomLink = (idx) => {
    setConfig(prev => ({
      ...prev,
      bottom_bar: {
        ...prev.bottom_bar,
        links: prev.bottom_bar.links.filter((_, i) => i !== idx)
      }
    }));
  };

  const updateBottomLink = (idx, field, val) => {
    setConfig(prev => {
      const links = [...(prev.bottom_bar.links || [])];
      links[idx] = { ...links[idx], [field]: val };
      return {
        ...prev,
        bottom_bar: { ...prev.bottom_bar, links }
      };
    });
  };

  // ─── Social Media Link Handlers ──────────────────────────────────────────────
  const updateSocialLink = (platformKey, field, val) => {
    setConfig(prev => {
      const links = [...(prev.social_media.links || [])];
      const existingIdx = links.findIndex(l => l.platform === platformKey);
      if (existingIdx !== -1) {
        links[existingIdx] = { ...links[existingIdx], [field]: val };
      } else {
        links.push({
          id: `soc-${platformKey}`,
          platform: platformKey,
          label: platformKey,
          url: '',
          enabled: false,
          [field]: val
        });
      }
      return {
        ...prev,
        social_media: { ...prev.social_media, links }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Footer Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center shadow-inner">
            <PanelBottom size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dynamic Footer Manager</h1>
            <p className="text-slate-500 text-sm">
              Control logo, menus, column counts, custom content, social links, and bottom copyright
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-md shadow-sky-600/20 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { key: 'brand', label: 'Brand & Logo', icon: ImageIcon },
          { key: 'columns', label: `Menu Columns (${config.columns.length})`, icon: Menu },
          { key: 'social', label: 'Social Media', icon: Share2 },
          { key: 'bottom', label: 'Bottom Bar & Legal', icon: PanelBottom },
          { key: 'preview', label: 'Live Preview', icon: Eye }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Brand & Logo */}
      {activeTab === 'brand' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Brand Column & Logo</h3>
                  <p className="text-xs text-slate-500">First column branding details displayed in the footer</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-600">Show Brand Column</span>
                  <input
                    type="checkbox"
                    checked={config.brand?.show_brand_column !== false}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        brand: { ...prev.brand, show_brand_column: e.target.checked }
                      }))
                    }
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                  />
                </label>
              </div>

              {/* Logo Upload Section */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Store Logo (Footer)
                </label>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  {config.brand?.logo_url ? (
                    <div className="relative group w-24 h-24 bg-[#17202A] p-2 rounded-xl flex items-center justify-center border border-slate-300">
                      <img
                        src={config.brand.logo_url}
                        alt="Footer Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfig(prev => ({
                            ...prev,
                            brand: { ...prev.brand, logo_url: '' }
                          }))
                        }
                        className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                        title="Remove Logo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon size={32} />
                      <span className="text-[10px] mt-1 font-semibold">No Logo</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition">
                        <Upload size={14} />
                        <span>{uploadingLogo ? 'Uploading...' : 'Upload Logo File'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                        />
                      </label>

                      {config.brand?.logo_url && (
                        <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 size={14} /> Logo active
                        </span>
                      )}

                      <Link
                        href="/settings/header"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                      >
                        <PanelTop size={13} />
                        <span>Header Logo Settings &rarr;</span>
                      </Link>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Supported formats: PNG, SVG, WEBP, JPG. Transparent background recommended for dark footer.
                    </p>
                  </div>
                </div>

                {/* Direct URL input */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Or Enter Logo Direct Image URL
                  </label>
                  <input
                    type="text"
                    value={config.brand?.logo_url || ''}
                    onChange={(e) =>
                      setConfig(prev => ({
                        ...prev,
                        brand: { ...prev.brand, logo_url: e.target.value }
                      }))
                    }
                    placeholder="https://example.com/logo.png"
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Fallback Brand Text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brand Name (Fallback when logo image not loaded)
                </label>
                <input
                  type="text"
                  value={config.brand?.logo_text || ''}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      brand: { ...prev.brand, logo_text: e.target.value }
                    }))
                  }
                  placeholder="e.g. ToyWorld"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* About description text */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  About / Bio Description Text
                </label>
                <textarea
                  rows={4}
                  value={config.brand?.about_text || ''}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      brand: { ...prev.brand, about_text: e.target.value }
                    }))
                  }
                  placeholder="Brief story or tagline displayed below the logo..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="space-y-6">
            <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
                <HelpCircle size={18} />
                <span>Footer Brand Column</span>
              </div>
              <p className="text-xs text-sky-700 leading-relaxed">
                The brand column is rendered on the left of your footer. It includes your logo, company tagline, and social media icons (if enabled in the Social Media tab).
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-sky-100 text-xs text-sky-900">
                <strong>Tip:</strong> If you upload a white or light-colored SVG/PNG logo, it will stand out beautifully against the dark footer background.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Menu Columns */}
      {activeTab === 'columns' && (
        <div className="space-y-6">
          {/* Column Layout Settings */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Grid Column Count</h3>
              <p className="text-xs text-slate-500">
                Choose how many columns the footer grid displays on desktop screens
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Columns:</span>
              <select
                value={config.column_count || 4}
                onChange={(e) => setConfig(prev => ({ ...prev, column_count: parseInt(e.target.value, 10) }))}
                className="text-xs font-bold p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              >
                <option value={2}>2 Columns</option>
                <option value={3}>3 Columns</option>
                <option value={4}>4 Columns (Recommended)</option>
                <option value={5}>5 Columns</option>
              </select>

              <button
                type="button"
                onClick={addColumn}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition ml-2"
              >
                <Plus size={14} />
                <span>Add Column</span>
              </button>
            </div>
          </div>

          {/* Columns List */}
          <div className="space-y-6">
            {config.columns.map((col, colIdx) => (
              <div
                key={col.id || colIdx}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
              >
                {/* Column Card Header */}
                <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center font-black text-xs">
                      #{colIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={col.heading || ''}
                      onChange={(e) => updateColumn(colIdx, 'heading', e.target.value)}
                      placeholder="Column Heading (e.g. Shop, Customer Care)"
                      className="text-sm font-bold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500 w-64"
                    />
                    <select
                      value={col.type || 'links'}
                      onChange={(e) => updateColumn(colIdx, 'type', e.target.value)}
                      className="text-xs font-semibold bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-sky-500"
                    >
                      <option value="links">Links List</option>
                      <option value="custom">Custom Info / Contact</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveColumn(colIdx, -1)}
                      disabled={colIdx === 0}
                      className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveColumn(colIdx, 1)}
                      disabled={colIdx === config.columns.length - 1}
                      className="p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeColumn(colIdx)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition ml-2"
                      title="Delete Column"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Column Body */}
                <div className="p-6">
                  {col.type === 'custom' ? (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Custom Info Content (Multi-line text, phone, email, address)
                      </label>
                      <textarea
                        rows={4}
                        value={col.custom_content || ''}
                        onChange={(e) => updateColumn(colIdx, 'custom_content', e.target.value)}
                        placeholder="e.g.&#10;Email: hello@example.com&#10;Phone: +1 800 123 4567&#10;Address: 123 Street Name"
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-slate-50 font-mono focus:ring-2 focus:ring-sky-500"
                      />
                      <p className="text-[11px] text-slate-400">
                        Lines will be formatted cleanly in the footer column.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Links in this Menu ({col.links?.length || 0})
                        </span>
                        <button
                          type="button"
                          onClick={() => addLinkToColumn(colIdx)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition"
                        >
                          <Plus size={14} />
                          <span>Add Link</span>
                        </button>
                      </div>

                      {(!col.links || col.links.length === 0) ? (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                          No links in this column yet. Click "Add Link" above.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {col.links.map((link, linkIdx) => (
                            <div
                              key={link.id || linkIdx}
                              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition"
                            >
                              <div className="flex items-center gap-1 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => moveLinkInColumn(colIdx, linkIdx, -1)}
                                  disabled={linkIdx === 0}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveLinkInColumn(colIdx, linkIdx, 1)}
                                  disabled={linkIdx === col.links.length - 1}
                                  className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>

                              <input
                                type="text"
                                value={link.label || ''}
                                onChange={(e) => updateLinkInColumn(colIdx, linkIdx, 'label', e.target.value)}
                                placeholder="Link Label (e.g. All Products)"
                                className="text-xs font-medium p-2 bg-white border border-slate-300 rounded-lg w-full sm:w-48 focus:ring-1 focus:ring-sky-500"
                              />

                              <input
                                type="text"
                                value={link.url || ''}
                                onChange={(e) => updateLinkInColumn(colIdx, linkIdx, 'url', e.target.value)}
                                placeholder="Target URL (e.g. /products or https://...)"
                                className="text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg flex-1 w-full focus:ring-1 focus:ring-sky-500"
                              />

                              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer whitespace-nowrap px-2">
                                <input
                                  type="checkbox"
                                  checked={link.target === '_blank'}
                                  onChange={(e) =>
                                    updateLinkInColumn(colIdx, linkIdx, 'target', e.target.checked ? '_blank' : '_self')
                                  }
                                  className="w-3.5 h-3.5 text-sky-600 rounded"
                                />
                                <span className="text-[11px]">New Tab</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-xs text-amber-700 cursor-pointer whitespace-nowrap px-2">
                                <input
                                  type="checkbox"
                                  checked={!!link.highlight}
                                  onChange={(e) =>
                                    updateLinkInColumn(colIdx, linkIdx, 'highlight', e.target.checked)
                                  }
                                  className="w-3.5 h-3.5 text-amber-500 rounded"
                                />
                                <span className="text-[11px] font-semibold">Highlight (Amber)</span>
                              </label>

                              <button
                                type="button"
                                onClick={() => removeLinkFromColumn(colIdx, linkIdx)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Remove Link"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Social Media */}
      {activeTab === 'social' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Social Media Channels</h3>
                <p className="text-xs text-slate-500">Configure store social platform links and icons</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-600">Enable Social Media</span>
                <input
                  type="checkbox"
                  checked={config.social_media?.enabled !== false}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      social_media: { ...prev.social_media, enabled: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
              </label>
            </div>

            <div className="space-y-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const linkObj = config.social_media?.links?.find(l => l.platform === platform.key) || {
                  enabled: false,
                  url: ''
                };

                return (
                  <div
                    key={platform.key}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border transition ${
                      linkObj.enabled ? 'bg-sky-50/40 border-sky-200' : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700">
                        <Icon size={18} />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{platform.label}</span>
                    </div>

                    <div className="flex items-center gap-3 flex-1 sm:max-w-md">
                      <input
                        type="text"
                        value={linkObj.url || ''}
                        onChange={(e) => updateSocialLink(platform.key, 'url', e.target.value)}
                        placeholder={`https://${platform.key}.com/yourpage`}
                        className="text-xs p-2.5 bg-white border border-slate-300 rounded-lg flex-1 focus:ring-1 focus:ring-sky-500"
                      />

                      <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={!!linkObj.enabled}
                          onChange={(e) => updateSocialLink(platform.key, 'enabled', e.target.checked)}
                          className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                        />
                        <span className="text-xs font-semibold text-slate-600">Active</span>
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Bottom Bar & Legal */}
      {activeTab === 'bottom' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bottom Copyright Bar</h3>
                <p className="text-xs text-slate-500">Legal notices, copyright, and sub-footer links</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-600">Show Bottom Bar</span>
                <input
                  type="checkbox"
                  checked={config.bottom_bar?.enabled !== false}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      bottom_bar: { ...prev.bottom_bar, enabled: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
              </label>
            </div>

            {/* Copyright text */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Copyright Notice Text
              </label>
              <input
                type="text"
                value={config.bottom_bar?.copyright_text || ''}
                onChange={(e) =>
                  setConfig(prev => ({
                    ...prev,
                    bottom_bar: { ...prev.bottom_bar, copyright_text: e.target.value }
                  }))
                }
                placeholder="© {year} ToyWorld Inc. All rights reserved."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
              />
              <p className="text-[11px] text-slate-400">
                Use <code className="bg-slate-100 text-sky-700 px-1 py-0.5 rounded font-mono font-bold">{'{year}'}</code> to automatically insert the current calendar year.
              </p>
            </div>

            {/* Bottom Bar Links */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Legal / Sub-Footer Links
                </span>
                <button
                  type="button"
                  onClick={addBottomLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-lg border border-sky-200 transition"
                >
                  <Plus size={14} />
                  <span>Add Legal Link</span>
                </button>
              </div>

              <div className="space-y-2">
                {config.bottom_bar?.links?.map((blink, bIdx) => (
                  <div
                    key={blink.id || bIdx}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <input
                      type="text"
                      value={blink.label || ''}
                      onChange={(e) => updateBottomLink(bIdx, 'label', e.target.value)}
                      placeholder="Label (e.g. Privacy Policy)"
                      className="text-xs font-medium p-2 bg-white border border-slate-300 rounded-lg w-full sm:w-48 focus:ring-1 focus:ring-sky-500"
                    />

                    <input
                      type="text"
                      value={blink.url || ''}
                      onChange={(e) => updateBottomLink(bIdx, 'url', e.target.value)}
                      placeholder="URL (e.g. /privacy)"
                      className="text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg flex-1 w-full focus:ring-1 focus:ring-sky-500"
                    />

                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={blink.target === '_blank'}
                        onChange={(e) => updateBottomLink(bIdx, 'target', e.target.checked ? '_blank' : '_self')}
                        className="w-3.5 h-3.5 text-sky-600 rounded"
                      />
                      <span className="text-[11px]">New Tab</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeBottomLink(bIdx)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Live Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Eye size={16} /> Live Visual Preview (Storefront Rendering)
            </h3>
            <span className="text-xs text-slate-400">Interactive live replica of storefront footer</span>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
            <footer className="bg-[#17202A] text-white pt-16 pb-8 border-t-[8px] border-[#F51F2D] font-sans">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${
                    config.column_count || 4
                  } gap-12 mb-12`}
                >
                  {/* Brand Column */}
                  {config.brand?.show_brand_column !== false && (
                    <div className="space-y-6">
                      <div className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                        {config.brand?.logo_url ? (
                          <img
                            src={config.brand.logo_url}
                            alt={config.brand.logo_text || 'Store Logo'}
                            className="max-h-12 w-auto object-contain"
                          />
                        ) : (
                          <>
                            <Gift size={32} className="text-[#F51F2D]" />
                            <span>{config.brand?.logo_text || 'ToyWorld'}</span>
                          </>
                        )}
                      </div>

                      {config.brand?.about_text && (
                        <p className="text-[#E7EBEF] text-sm font-medium leading-relaxed">
                          {config.brand.about_text}
                        </p>
                      )}

                      {/* Social icons */}
                      {config.social_media?.enabled !== false && (
                        <div className="flex gap-4 pt-2">
                          {config.social_media?.links
                            ?.filter(l => l.enabled && l.url)
                            .map((s) => {
                              const found = SOCIAL_PLATFORMS.find(p => p.key === s.platform);
                              const Icon = found?.icon || Share2;
                              return (
                                <a
                                  key={s.id || s.platform}
                                  href={s.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#F51F2D] transition-colors"
                                >
                                  <Icon size={18} />
                                </a>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Menu Columns */}
                  {config.columns?.map((col) => (
                    <div key={col.id}>
                      <h4 className="text-lg font-black mb-6 text-white uppercase tracking-wider">
                        {col.heading}
                      </h4>

                      {col.type === 'custom' ? (
                        <div className="space-y-3 text-sm font-medium text-[#E7EBEF] whitespace-pre-line leading-relaxed">
                          {col.custom_content || 'No contact details configured'}
                        </div>
                      ) : (
                        <ul className="space-y-4 text-sm font-medium text-[#E7EBEF]">
                          {col.links?.map((link) => (
                            <li key={link.id}>
                              <a
                                href={link.url}
                                target={link.target || '_self'}
                                className={`transition-colors hover:text-[#F51F2D] ${
                                  link.highlight ? 'text-amber-400 font-semibold' : ''
                                }`}
                              >
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {/* Bottom Bar */}
                {config.bottom_bar?.enabled !== false && (
                  <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm font-medium text-[#5F6872]">
                      {(config.bottom_bar?.copyright_text || '© {year} ToyWorld Inc. All rights reserved.').replace(
                        '{year}',
                        new Date().getFullYear().toString()
                      )}
                    </p>
                    <div className="flex gap-4 text-sm font-medium text-[#5F6872]">
                      {config.bottom_bar?.links?.map((blink) => (
                        <a
                          key={blink.id}
                          href={blink.url}
                          target={blink.target || '_self'}
                          className="hover:text-white transition-colors"
                        >
                          {blink.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
