'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Building2, Save, RotateCcw, Upload, Image as ImageIcon,
  CheckCircle2, FileText, Phone, Mail, MapPin, Receipt, ShieldCheck
} from 'lucide-react';

const DEFAULT_STORE_CONFIG = {
  store_name: 'Provoke Playtech',
  store_tagline: 'Premium Toys & Hobby Goods',
  logo_url: '',
  gstin: '',
  email: 'support@provokeplaytech.com',
  phone: '+91 98765 43210',
  address_line1: '123 Playtime Avenue',
  address_line2: 'Sector 5, Industrial Area',
  city: 'Bengaluru',
  state: 'Karnataka',
  pin_code: '560001',
  country: 'India',
  invoice_footer: 'Thank you for shopping with us! For warranty, returns, or support, please contact support@provokeplaytech.com. This is a computer generated invoice and requires no physical signature.'
};

export default function StoreBrandSettingsPage() {
  const [config, setConfig] = useState(DEFAULT_STORE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/admin/settings/store-brand');
      if (res.success && res.data) {
        setConfig({
          ...DEFAULT_STORE_CONFIG,
          ...res.data
        });
      } else {
        // Fallback to public store-brand
        const pubRes = await adminApi.get('/settings/store-brand');
        if (pubRes.success && pubRes.data) {
          setConfig({
            ...DEFAULT_STORE_CONFIG,
            ...pubRes.data
          });
        }
      }
    } catch (err) {
      console.error('Failed to load store brand settings:', err);
      toast.error('Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.put('/admin/settings/store-brand', config);
      if (res.success) {
        toast.success('Store brand & invoice settings saved & cached in Redis!');
        if (res.data) {
          setConfig({ ...DEFAULT_STORE_CONFIG, ...res.data });
        }
      } else {
        toast.error(res.message || 'Failed to save store settings');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset store & invoice settings to default values?')) {
      setConfig(DEFAULT_STORE_CONFIG);
      toast('Settings reset to defaults. Click "Save Changes" to apply.', { icon: '🔄' });
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
      const filename = `brand-logo-${Date.now()}.${file.name.split('.').pop()}`;
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
          const publicUrl = res.data.publicUrl || res.data.url;
          setConfig((prev) => ({ ...prev, logo_url: publicUrl }));
          toast.success('Logo uploaded successfully!');
        } else {
          toast.error('Direct upload failed');
        }
      } else {
        // Fallback: Read as data URL for quick local usage
        const reader = new FileReader();
        reader.onload = () => {
          setConfig((prev) => ({ ...prev, logo_url: reader.result }));
          toast.success('Logo loaded as data URL');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error uploading logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const copyFromHeader = async () => {
    try {
      const res = await adminApi.get('/header');
      if (res.success && res.data?.logo_url) {
        setConfig((prev) => ({
          ...prev,
          logo_url: res.data.logo_url,
          store_name: res.data.logo_text || prev.store_name,
          store_tagline: res.data.logo_tagline || prev.store_tagline
        }));
        toast.success('Copied store brand from Header settings!');
      } else {
        toast.error('No logo found in Header settings');
      }
    } catch {
      toast.error('Failed to read header settings');
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm font-semibold text-slate-400">
        Loading Store Brand & Invoice settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center">
            <Building2 size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Store Brand & Tax Invoice Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your brand logo, legal GSTIN, registered address, and PDF invoice footer. Caches automatically in Redis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
          >
            <Save size={15} /> {saving ? 'Saving & Caching...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Brand & Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building2 className="text-sky-600" size={18} /> Brand Identity & Logo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Store Brand Name *</label>
              <input
                type="text"
                required
                value={config.store_name}
                onChange={(e) => setConfig({ ...config, store_name: e.target.value })}
                placeholder="e.g. Provoke Playtech"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">Displayed in PDF headers, order confirmations, and invoices.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Store Tagline</label>
              <input
                type="text"
                value={config.store_tagline}
                onChange={(e) => setConfig({ ...config, store_tagline: e.target.value })}
                placeholder="e.g. Premium Toys & Hobby Goods"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">Subtitle printed directly below brand title on documents.</p>
            </div>
          </div>

          {/* Logo Field & Live Preview */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Brand Logo URL</label>
              <button
                type="button"
                onClick={copyFromHeader}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                Sync with Header Logo
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="flex-1 space-y-2 w-full">
                <input
                  type="url"
                  value={config.logo_url}
                  onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition">
                    <Upload size={13} /> {uploadingLogo ? 'Uploading...' : 'Upload Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>
                  {config.logo_url && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, logo_url: '' })}
                      className="text-xs text-red-500 hover:underline font-semibold"
                    >
                      Clear Logo
                    </button>
                  )}
                </div>
              </div>

              {/* Logo Preview */}
              <div className="w-full md:w-56 h-24 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center p-3 relative overflow-hidden">
                {config.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={config.logo_url}
                    alt="Logo Preview"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-center text-slate-400">
                    <ImageIcon size={20} className="mx-auto mb-1 opacity-50" />
                    <span className="text-[10px] font-bold uppercase">No Logo Set</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Legal & GST Details */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="text-emerald-600" size={18} /> Legal & Tax Compliance (GSTIN)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt size={14} className="text-sky-600" /> GSTIN Number
              </label>
              <input
                type="text"
                value={config.gstin}
                onChange={(e) => setConfig({ ...config, gstin: e.target.value.toUpperCase() })}
                placeholder="29ABCDE1234F1Z5"
                maxLength={15}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">15-digit Goods & Services Tax Identification Number.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={14} className="text-sky-600" /> Support / Billing Email
              </label>
              <input
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                placeholder="billing@provokeplaytech.com"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">Printed on invoice header for customer support.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={14} className="text-sky-600" /> Contact Phone
              </label>
              <input
                type="text"
                value={config.phone}
                onChange={(e) => setConfig({ ...config, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <p className="text-[11px] text-slate-400">Store helpline printed on invoice and shipping slips.</p>
            </div>
          </div>
        </div>

        {/* Business & Dispatch Address */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin className="text-rose-500" size={18} /> Registered Business & Dispatch Address
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address Line 1</label>
              <input
                type="text"
                value={config.address_line1}
                onChange={(e) => setConfig({ ...config, address_line1: e.target.value })}
                placeholder="Building / Flat / Plot No., Street Name"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={config.address_line2}
                onChange={(e) => setConfig({ ...config, address_line2: e.target.value })}
                placeholder="Locality / Landmark / Area"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">City</label>
              <input
                type="text"
                value={config.city}
                onChange={(e) => setConfig({ ...config, city: e.target.value })}
                placeholder="e.g. Bengaluru"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">State</label>
              <input
                type="text"
                value={config.state}
                onChange={(e) => setConfig({ ...config, state: e.target.value })}
                placeholder="e.g. Karnataka"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">PIN Code</label>
              <input
                type="text"
                value={config.pin_code}
                onChange={(e) => setConfig({ ...config, pin_code: e.target.value })}
                placeholder="e.g. 560001"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Country</label>
              <input
                type="text"
                value={config.country}
                onChange={(e) => setConfig({ ...config, country: e.target.value })}
                placeholder="India"
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Tax Invoice Footer & Notes */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="text-amber-500" size={18} /> Invoice Footer & Legal Disclaimers
          </h2>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Invoice Terms & Footer Text</label>
            <textarea
              rows={4}
              value={config.invoice_footer}
              onChange={(e) => setConfig({ ...config, invoice_footer: e.target.value })}
              placeholder="e.g. Thank you for shopping with us! Terms & conditions..."
              className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white leading-relaxed"
            />
            <p className="text-[11px] text-slate-400">
              This message appears at the bottom of every generated Tax Invoice and Packing Slip.
            </p>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            <Save size={15} /> {saving ? 'Saving & Caching in Redis...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
