'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  PanelTop, Save, RotateCcw, Upload, Image as ImageIcon, Trash2,
  CheckCircle2, Eye, HelpCircle, ArrowRight, Star, ShoppingCart,
  Heart, User, Search, Copy
} from 'lucide-react';

const DEFAULT_HEADER_CONFIG = {
  logo_url: '',
  logo_text: '',
  logo_tagline: '',
  logo_width: 200,
  logo_width_mobile: 150,
  show_tagline: false,
  announcement_bar: {
    enabled: true,
    shipping_text: 'Free Shipping on Orders Above ₹999',
    discount_text: 'Get 10% OFF on First Order | Use Code: TOY10',
    returns_text: 'Easy Returns | 100% Original Products'
  }
};

export default function HeaderSettingsPage() {
  const [config, setConfig] = useState(DEFAULT_HEADER_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [footerLogo, setFooterLogo] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // 1. Load Header settings
      const res = await adminApi.get('/header');
      if (res.success && res.data) {
        setConfig({
          ...DEFAULT_HEADER_CONFIG,
          ...res.data,
          announcement_bar: {
            ...DEFAULT_HEADER_CONFIG.announcement_bar,
            ...(res.data.announcement_bar || {})
          }
        });
      } else {
        // Fallback to /settings
        const setRes = await adminApi.get('/settings');
        if (setRes.success && setRes.data?.settings?.header_settings) {
          const raw = setRes.data.settings.header_settings;
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          setConfig({
            ...DEFAULT_HEADER_CONFIG,
            ...parsed,
            announcement_bar: {
              ...DEFAULT_HEADER_CONFIG.announcement_bar,
              ...(parsed.announcement_bar || {})
            }
          });
        }
      }

      // 2. Fetch footer logo if available for quick sync
      const fRes = await adminApi.get('/footer');
      if (fRes.success && fRes.data?.brand?.logo_url) {
        setFooterLogo(fRes.data.brand.logo_url);
      }
    } catch (err) {
      console.error('Failed to load header settings:', err);
      toast.error('Failed to load header settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let res = await adminApi.put('/admin/header', config);
      if (!res.success) {
        // Fallback to bulk settings
        res = await adminApi.put('/admin/settings', {
          settings: {
            header_settings: JSON.stringify(config)
          }
        });
      }

      if (res.success) {
        toast.success('Header settings saved successfully!');
      } else {
        toast.error(res.message || 'Failed to save header settings');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset header settings to default values?')) {
      setConfig(DEFAULT_HEADER_CONFIG);
      toast('Header settings reset to defaults. Click "Save Changes" to apply.', { icon: '🔄' });
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, SVG, JPG, WEBP)');
      return;
    }

    setUploadingLogo(true);
    try {
      const filename = `header-logo-${Date.now()}.${file.name.split('.').pop()}`;
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
          setConfig(prev => ({ ...prev, logo_url: finalUrl }));
          toast.success('Header logo uploaded successfully!');
        } else {
          toast.error('Storage upload failed');
        }
      } else {
        // Fallback: load as data URL
        const reader = new FileReader();
        reader.onload = () => {
          setConfig(prev => ({ ...prev, logo_url: reader.result }));
          toast.success('Header logo loaded!');
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

  const copyFromFooter = () => {
    if (!footerLogo) {
      toast.error('No footer logo configured yet');
      return;
    }
    setConfig(prev => ({ ...prev, logo_url: footerLogo }));
    toast.success('Copied logo from Footer Settings!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500">Loading Header Settings...</p>
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
            <PanelTop size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Header & Logo Manager</h1>
            <p className="text-slate-500 text-sm">
              Upload storefront header logo, brand title, tagline, and configure the announcement bar
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          {/* Logo Upload Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Header Logo & Branding</h3>
              <p className="text-xs text-slate-500">Upload your store's primary header logo image or set brand text</p>
            </div>

            {/* Logo Preview & Upload */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Header Logo Image
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                {config.logo_url ? (
                  <div className="relative group w-32 h-20 bg-white p-2 rounded-xl flex items-center justify-center border border-slate-300 shadow-sm">
                    <img
                      src={config.logo_url}
                      alt="Header Logo Preview"
                      className="max-h-full max-w-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setConfig(prev => ({ ...prev, logo_url: '' }))}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full shadow"
                      title="Remove Logo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-20 bg-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon size={30} />
                    <span className="text-[10px] mt-1 font-semibold">No Image Uploaded</span>
                  </div>
                )}

                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition">
                      <Upload size={14} />
                      <span>{uploadingLogo ? 'Uploading Image...' : 'Upload Logo File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                      />
                    </label>

                    {footerLogo && footerLogo !== config.logo_url && (
                      <button
                        type="button"
                        onClick={copyFromFooter}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-200 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-xl transition"
                      >
                        <Copy size={13} />
                        <span>Use Footer Logo</span>
                      </button>
                    )}

                    {config.logo_url && (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={15} /> Logo Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Recommended: Transparent PNG or SVG, horizontal aspect ratio (e.g. 180×48 px or 220×55 px).
                  </p>
                </div>
              </div>

              {/* Direct URL input */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Or Direct Logo Image URL
                </label>
                <input
                  type="text"
                  value={config.logo_url || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, logo_url: e.target.value }))}
                  placeholder="https://example.com/header-logo.png"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              {/* Logo Dimensions / Width Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Desktop Logo Width (px)
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {config.logo_width || 200}px
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="160"
                      max="450"
                      step="5"
                      value={config.logo_width || 200}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_width: Number(e.target.value) }))}
                      className="flex-1 accent-sky-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="160"
                      max="500"
                      value={config.logo_width || 200}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_width: Math.max(160, Number(e.target.value) || 200) }))}
                      className="w-20 text-xs p-2 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Min-width 200px on desktop with auto height.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Mobile Logo Width (px)
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {config.logo_width_mobile || 150}px
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="100"
                      max="260"
                      step="5"
                      value={config.logo_width_mobile || 150}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_width_mobile: Number(e.target.value) }))}
                      className="flex-1 accent-sky-600 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="100"
                      max="260"
                      value={config.logo_width_mobile || 150}
                      onChange={(e) => setConfig(prev => ({ ...prev, logo_width_mobile: Math.max(80, Number(e.target.value) || 150) }))}
                      className="w-20 text-xs p-2 border border-slate-300 rounded-lg text-center font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Scaled automatically for smartphone screens.
                  </p>
                </div>
              </div>
            </div>

            {/* Brand Title (Fallback) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brand Name (Text Fallback)
                </label>
                <input
                  type="text"
                  value={config.logo_text || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, logo_text: e.target.value }))}
                  placeholder="e.g. MyStore"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 font-semibold"
                />
                <p className="text-[11px] text-slate-400">
                  Optional. Displayed only if no logo image is set.
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tagline
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.show_tagline !== false}
                      onChange={(e) => setConfig(prev => ({ ...prev, show_tagline: e.target.checked }))}
                      className="w-3.5 h-3.5 text-sky-600 rounded"
                    />
                    <span className="text-[11px] text-slate-600 font-medium">Show Tagline</span>
                  </label>
                </div>
                <input
                  type="text"
                  value={config.logo_tagline || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, logo_tagline: e.target.value }))}
                  placeholder="e.g. DISCOVER • PLAY • LEARN"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500 font-medium"
                />
                <p className="text-[11px] text-slate-400">
                  Small subtitle under the brand text.
                </p>
              </div>
            </div>
          </div>

          {/* Announcement Bar Settings Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Announcement Bar</h3>
                <p className="text-xs text-slate-500">Configure top promotional ribbons and shipping alerts</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs font-semibold text-slate-600">Enable Bar</span>
                <input
                  type="checkbox"
                  checked={config.announcement_bar?.enabled !== false}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      announcement_bar: { ...prev.announcement_bar, enabled: e.target.checked }
                    }))
                  }
                  className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
                />
              </label>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Left Promo (Shipping alert)
                </label>
                <input
                  type="text"
                  value={config.announcement_bar?.shipping_text || ''}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      announcement_bar: { ...prev.announcement_bar, shipping_text: e.target.value }
                    }))
                  }
                  placeholder="e.g. Free Shipping on Orders Above ₹999"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Center Promo (Coupon / discount code)
                </label>
                <input
                  type="text"
                  value={config.announcement_bar?.discount_text || ''}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      announcement_bar: { ...prev.announcement_bar, discount_text: e.target.value }
                    }))
                  }
                  placeholder="e.g. Get 10% OFF on First Order | Use Code: TOY10"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Right Feature (Return / trust note)
                </label>
                <input
                  type="text"
                  value={config.announcement_bar?.returns_text || ''}
                  onChange={(e) =>
                    setConfig(prev => ({
                      ...prev,
                      announcement_bar: { ...prev.announcement_bar, returns_text: e.target.value }
                    }))
                  }
                  placeholder="e.g. Easy Returns | 100% Original Products"
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Info & Live Preview */}
        <div className="space-y-6">
          <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-sm">
              <HelpCircle size={18} />
              <span>Header Logo Tips</span>
            </div>
            <p className="text-xs text-sky-700 leading-relaxed">
              The header is rendered on a clean white background. Uploading a logo with a transparent background ensures it blends naturally with the page design.
            </p>
            <div className="p-3 bg-white/80 rounded-xl border border-sky-100 text-xs text-sky-900 space-y-1">
              <div><strong>Format:</strong> PNG, SVG, or WEBP</div>
              <div><strong>Height:</strong> 40px – 55px</div>
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Eye size={15} /> Header Live Preview
              </h4>
              <span className="text-[10px] text-slate-400">Interactive</span>
            </div>

            {/* Announcement bar preview */}
            {config.announcement_bar?.enabled !== false && (
              <div className="bg-[#071C2B] text-white text-[10px] py-1.5 px-3 rounded-lg flex items-center justify-between font-medium">
                <span className="truncate">{config.announcement_bar?.shipping_text || 'Free Shipping Above ₹999'}</span>
                <span className="truncate text-yellow-400 font-bold hidden sm:inline">
                  {config.announcement_bar?.discount_text || '10% OFF'}
                </span>
              </div>
            )}

            {/* Header navbar preview */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              {/* Brand logo in preview */}
              <div className="flex items-center gap-2">
                {config.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt={config.logo_text || 'Logo'}
                    className="h-auto object-contain block max-w-full"
                    style={{
                      width: `${Math.min(config.logo_width || 200, 240)}px`,
                      minWidth: '120px'
                    }}
                  />
                ) : config.logo_text ? (
                  <div className="flex flex-col">
                    <div className="text-base font-black tracking-tight text-slate-800 leading-none">
                      {config.logo_text}
                    </div>
                    {config.show_tagline && config.logo_tagline && (
                      <div className="text-[8px] font-bold text-slate-400 tracking-widest mt-0.5 uppercase">
                        {config.logo_tagline}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div
                      className="h-9 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-[10px] text-slate-400 font-semibold px-4"
                      style={{ width: `${Math.min(config.logo_width || 200, 180)}px` }}
                    >
                      Logo Skeleton
                    </div>
                  </div>
                )}
              </div>

              {/* Fake Search and Action Icons */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-slate-400 text-xs w-28">
                  <Search size={12} />
                  <span>Search...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Heart size={16} />
                  <ShoppingCart size={16} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
