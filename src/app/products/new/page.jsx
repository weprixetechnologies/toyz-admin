'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminApi } from '../../../lib/api';
import { Plus, Trash2, Image as ImageIcon, RefreshCw, ChevronDown } from 'lucide-react';

// ─── Utility ──────────────────────────────────────────────────────────────────
function generateSKU() { return `SKU-${Math.floor(100000 + Math.random() * 900000)}`; }
function slugify(v) { return v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }

// Cross-product of attribute groups to generate variant rows
function crossProduct(groups) {
  if (!groups.length) return [];
  const nonEmpty = groups.filter(g => g.name && g.values.some(v => v.trim()));
  if (!nonEmpty.length) return [];
  let result = [[]];
  for (const group of nonEmpty) {
    const vals = group.values.filter(v => v.trim());
    result = result.flatMap(combo => vals.map(v => [...combo, { group_name: group.name, value: v.trim() }]));
  }
  return result;
}

// ─── Tab Components ────────────────────────────────────────────────────────────
function BasicInfoTab({ form, setForm, categories, brands }) {
  const handleNameChange = (val) => {
    setForm(prev => ({
      ...prev,
      name: val,
      slug: slugify(val),
      sku: prev.sku || generateSKU()
    }));
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Product Name</label>
        <input type="text" required value={form.name} onChange={e => handleNameChange(e.target.value)}
          className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">URL Slug</label>
          <input type="text" required value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Product Type</label>
          <select value={form.product_type} onChange={e => setForm(p => ({ ...p, product_type: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-sky-500">
            <option value="simple">Simple Product</option>
            <option value="variable">Variable Product (with Variants)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">SKU Code</label>
        <input type="text" required value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
          className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-sky-500" />
      </div>

      {/* Base Price & Sale Price — shown for both simple and variable products.
          For variable products these serve as the standard listing price displayed
          on product cards when the full variant list hasn't been loaded yet. */}
      <div className={`grid grid-cols-1 gap-4 ${form.product_type === 'simple' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Base Price (₹)</label>
          {form.product_type === 'variable' && (
            <p className="text-[10px] text-sky-600 mt-0.5 mb-0.5">Standard listing price shown on product cards</p>
          )}
          <input type="number" step="0.01" required={form.product_type === 'simple'} value={form.base_price}
            onChange={e => setForm(p => ({ ...p, base_price: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Sale Price (₹)</label>
          {form.product_type === 'variable' && (
            <p className="text-[10px] text-sky-600 mt-0.5 mb-0.5">Optional — shown crossed-out on product cards</p>
          )}
          <input type="number" step="0.01" value={form.sale_price}
            onChange={e => setForm(p => ({ ...p, sale_price: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500" />
        </div>
        {form.product_type === 'simple' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Stock Quantity</label>
            <input type="number" required value={form.stock_qty}
              onChange={e => setForm(p => ({ ...p, stock_qty: e.target.value }))}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Category</label>
          <select value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase">Brand</label>
          <select value={form.brand_id} onChange={e => setForm(p => ({ ...p, brand_id: e.target.value }))}
            className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm bg-white">
            <option value="">Select Brand</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Short Description</label>
        <textarea rows="2" value={form.short_desc} onChange={e => setForm(p => ({ ...p, short_desc: e.target.value }))}
          className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500" />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-500 uppercase">Product Description (HTML Supported)</label>
        <div className="grid grid-cols-2 gap-4 mt-1">
          <textarea rows="8" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-sky-500 font-mono"
            placeholder="<h1>Key Features</h1><ul><li>...</li></ul>" />
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-y-auto max-h-64">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Live Preview</h4>
            <div className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: form.description || '<p class="text-gray-400">No description yet.</p>' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variants Tab ──────────────────────────────────────────────────────────────
function VariantsTab({ variants, setVariants }) {
  const [groups, setGroups] = useState([{ name: 'Color', values: [''] }, { name: 'Size', values: [''] }]);

  const addGroup = () => setGroups(g => [...g, { name: '', values: [''] }]);
  const removeGroup = (gi) => setGroups(g => g.filter((_, i) => i !== gi));
  const updateGroupName = (gi, name) => setGroups(g => g.map((grp, i) => i === gi ? { ...grp, name } : grp));
  const addValue = (gi) => setGroups(g => g.map((grp, i) => i === gi ? { ...grp, values: [...grp.values, ''] } : grp));
  const removeValue = (gi, vi) => setGroups(g => g.map((grp, i) => i === gi ? { ...grp, values: grp.values.filter((_, j) => j !== vi) } : grp));
  const updateValue = (gi, vi, val) => setGroups(g => g.map((grp, i) => i === gi ? { ...grp, values: grp.values.map((v, j) => j === vi ? val : v) } : grp));

  const generateVariants = () => {
    const combos = crossProduct(groups);
    if (!combos.length) { alert('Add at least one group with values.'); return; }
    const base_price = '';
    const newVars = combos.map(attrs => ({
      _key: Math.random().toString(36).slice(2),
      variant_label: attrs.map(a => a.value).join(' / '),
      sku: generateSKU(),
      price: base_price,
      sale_price: '',
      stock_qty: '0',
      image: '',
      is_active: true,
      attributes: attrs
    }));
    setVariants(newVars);
  };

  const updateVariant = (key, field, value) => {
    setVariants(vs => vs.map(v => v._key === key ? { ...v, [field]: value } : v));
  };

  const removeVariant = (key) => setVariants(vs => vs.filter(v => v._key !== key));

  const [uploading, setUploading] = useState({});
  const handleImageUpload = async (key, file) => {
    setUploading(u => ({ ...u, [key]: true }));
    const formData = new FormData();
    formData.append('file', file);
    try {
      const ext = file.name.split('.').pop();
      const filename = `variant-${Date.now()}.${ext}`;
      const res = await adminApi.post(`/storage/upload?key=${encodeURIComponent(`products/variants/${filename}`)}&contentType=${encodeURIComponent(file.type)}`, {});
      if (res.success && res.data?.uploadUrl) {
        const fullUploadUrl = res.data.uploadUrl.startsWith('http') ? res.data.uploadUrl : adminApi.baseURL.replace('/api/v1', '') + res.data.uploadUrl;
        await fetch(fullUploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        updateVariant(key, 'image', res.data.fileUrl || res.data.uploadUrl);
      }
    } catch (e) {
      console.error('Upload failed', e);
    }
    setUploading(u => ({ ...u, [key]: false }));
  };

  const [bulkAction, setBulkAction] = useState('update_base_price');
  const [bulkValue, setBulkValue] = useState('');

  const handleBulkApply = () => {
    if (!bulkValue || isNaN(bulkValue)) return alert('Enter a valid number for bulk action.');
    const val = parseFloat(bulkValue);

    setVariants(vs => vs.map(v => {
      let nv = { ...v };
      const currPrice = parseFloat(nv.price) || 0;
      const currSale = parseFloat(nv.sale_price) || 0;

      switch (bulkAction) {
        case 'update_base_price': nv.price = val; break;
        case 'update_sale_price': nv.sale_price = val; break;
        case 'update_stock': nv.stock_qty = Math.round(val); break;
        case 'increase_base_pct': nv.price = (currPrice + (currPrice * val / 100)).toFixed(2); break;
        case 'decrease_base_pct': nv.price = (currPrice - (currPrice * val / 100)).toFixed(2); break;
        case 'increase_sale_pct': nv.sale_price = (currSale + (currSale * val / 100)).toFixed(2); break;
        case 'decrease_sale_pct': nv.sale_price = (currSale - (currSale * val / 100)).toFixed(2); break;
      }
      return nv;
    }));
    setBulkValue('');
  };

  return (
    <div className="space-y-6">
      {/* Attribute Groups Builder */}
      <div className="bg-sky-50 border border-sky-100 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sky-900 text-sm">Attribute Groups</h3>
          <button type="button" onClick={addGroup}
            className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1">
            <Plus size={14} /> Add Group
          </button>
        </div>

        {groups.map((group, gi) => (
          <div key={gi} className="bg-white rounded-lg border border-sky-100 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="text" placeholder="Group name (e.g. Color)" value={group.name}
                onChange={e => updateGroupName(gi, e.target.value)}
                className="flex-1 p-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:border-sky-500" />
              <button type="button" onClick={() => removeGroup(gi)} className="text-red-400 hover:text-red-600">
                <Trash2 size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              {group.values.map((val, vi) => (
                <div key={vi} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                  <input type="text" placeholder={`Value ${vi + 1}`} value={val}
                    onChange={e => updateValue(gi, vi, e.target.value)}
                    className="bg-transparent text-xs font-semibold outline-none w-20" />
                  <button type="button" onClick={() => removeValue(gi, vi)} className="text-gray-400 hover:text-red-500 ml-1">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addValue(gi)}
                className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 bg-sky-50 px-2 py-1 rounded-full">
                <Plus size={12} /> Add Value
              </button>
            </div>
          </div>
        ))}

        <button type="button" onClick={generateVariants}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold transition">
          <RefreshCw size={16} /> Generate Variants
        </button>
      </div>

      {/* Variant Rows Table */}
      {variants.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <h3 className="font-bold text-gray-800 text-sm">{variants.length} Variants Generated</h3>
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Bulk Update:</span>
              <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className="text-xs p-1.5 border border-gray-200 rounded focus:outline-none focus:border-sky-500">
                <option value="update_base_price">Update Base Price (Flat)</option>
                <option value="update_sale_price">Update Sale Price (Flat)</option>
                <option value="update_stock">Update Stock Qty (Flat)</option>
                <option value="increase_base_pct">Increase Base Price by %</option>
                <option value="decrease_base_pct">Decrease Base Price by %</option>
                <option value="increase_sale_pct">Increase Sale Price by %</option>
                <option value="decrease_sale_pct">Decrease Sale Price by %</option>
              </select>
              <input type="number" value={bulkValue} onChange={e => setBulkValue(e.target.value)} placeholder="Value" className="w-20 text-xs p-1.5 border border-gray-200 rounded focus:outline-none focus:border-sky-500" />
              <button type="button" onClick={handleBulkApply} className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded hover:bg-slate-900 transition">Apply</button>
            </div>
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="py-3 px-3 text-left font-semibold">Variant</th>
                  <th className="py-3 px-3 text-left font-semibold">SKU</th>
                  <th className="py-3 px-3 text-left font-semibold">Price (₹)</th>
                  <th className="py-3 px-3 text-left font-semibold">Sale (₹)</th>
                  <th className="py-3 px-3 text-left font-semibold">Stock</th>
                  <th className="py-3 px-3 text-left font-semibold">Image</th>
                  <th className="py-3 px-3 text-left font-semibold">Active</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map(v => (
                  <tr key={v._key} className="hover:bg-gray-50">
                    <td className="py-3 px-3">
                      <span className="font-bold text-gray-900">{v.variant_label}</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {v.attributes?.map((a, i) => (
                          <span key={i} className="bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">{a.group_name}: {a.value}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <input value={v.sku} onChange={e => updateVariant(v._key, 'sku', e.target.value)}
                        className="w-28 p-1.5 border border-gray-200 rounded text-xs font-mono focus:border-sky-400 focus:outline-none" />
                    </td>
                    <td className="py-3 px-3">
                      <input type="number" value={v.price} onChange={e => updateVariant(v._key, 'price', e.target.value)}
                        className="w-20 p-1.5 border border-gray-200 rounded text-xs focus:border-sky-400 focus:outline-none" placeholder="0" />
                    </td>
                    <td className="py-3 px-3">
                      <input type="number" value={v.sale_price} onChange={e => updateVariant(v._key, 'sale_price', e.target.value)}
                        className="w-20 p-1.5 border border-gray-200 rounded text-xs focus:border-sky-400 focus:outline-none" placeholder="0" />
                    </td>
                    <td className="py-3 px-3">
                      <input type="number" value={v.stock_qty} onChange={e => updateVariant(v._key, 'stock_qty', e.target.value)}
                        className="w-16 p-1.5 border border-gray-200 rounded text-xs focus:border-sky-400 focus:outline-none" />
                    </td>
                    <td className="py-3 px-3">
                      <label className="cursor-pointer flex flex-col items-center gap-1 relative group">
                        {uploading[v._key] ? (
                          <div className="w-12 h-12 bg-sky-50 rounded border border-sky-200 flex flex-col items-center justify-center text-sky-600">
                            <RefreshCw size={14} className="animate-spin mb-1" />
                            <span className="text-[8px] font-bold">UPLOADING</span>
                          </div>
                        ) : v.image ? (
                          <div className="relative w-12 h-12">
                            <img src={v.image} alt="variant" className="w-12 h-12 object-contain border border-gray-200 rounded group-hover:border-sky-400 transition" />
                            <div className="absolute inset-0 bg-black/40 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white">
                              <RefreshCw size={14} />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 bg-gray-50 hover:bg-gray-100 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:text-sky-600 hover:border-sky-400 transition">
                            <ImageIcon size={14} className="mb-0.5" />
                            <span className="text-[8px] font-bold">ADD IMG</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*"
                          onChange={e => {
                            if (e.target.files[0]) {
                              handleImageUpload(v._key, e.target.files[0]);
                              e.target.value = null; // reset so same file can be selected again
                            }
                          }} />
                      </label>
                    </td>
                    <td className="py-3 px-3">
                      <input type="checkbox" checked={v.is_active}
                        onChange={e => updateVariant(v._key, 'is_active', e.target.checked)}
                        className="w-4 h-4 accent-sky-600 cursor-pointer" />
                    </td>
                    <td className="py-3 px-3">
                      <button type="button" onClick={() => removeVariant(v._key)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">💡 Tip: Leave "Image" blank for non-color variants. Images are optional.</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function CreateProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('basic');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [variants, setVariants] = useState([]);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    sku: '',
    base_price: '',
    sale_price: '',
    stock_qty: '0',
    short_desc: '',
    description: '',
    category_id: '',
    brand_id: '',
    product_type: 'simple',
    is_active: true,
    is_featured: false,
  });

  useEffect(() => {
    async function loadMeta() {
      const [catRes, brandRes] = await Promise.all([adminApi.get('/categories'), adminApi.get('/brands')]);
      if (catRes.success) setCategories(catRes.data?.categories || catRes.data || []);
      if (brandRes.success) setBrands(brandRes.data?.brands || brandRes.data || []);
    }
    loadMeta();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    // For variable products, base_price comes from the cheapest variant
    let submitForm = { ...form };
    if (form.product_type === 'variable' && variants.length > 0) {
      const prices = variants.map(v => parseFloat(v.price)).filter(p => !isNaN(p) && p > 0);
      submitForm.base_price = prices.length ? Math.min(...prices) : '0';
      submitForm.stock_qty = variants.reduce((sum, v) => sum + (parseInt(v.stock_qty) || 0), 0);
    }

    const res = await adminApi.post('/products', submitForm);
    if (!res.success) {
      alert(res.message || 'Product creation failed');
      setSubmitting(false);
      return;
    }

    const productId = res.data.id;

    // Create variants if variable
    if (form.product_type === 'variable' && variants.length > 0) {
      for (const v of variants) {
        await adminApi.post(`/products/${productId}/variants`, {
          sku: v.sku,
          variant_label: v.variant_label,
          price: parseFloat(v.price) || 0,
          sale_price: parseFloat(v.sale_price) || null,
          stock_qty: parseInt(v.stock_qty) || 0,
          image: v.image || null,
          is_active: v.is_active ? 1 : 0,
          attributes: v.attributes
        });
      }
    }

    alert('Product created successfully!');
    router.push('/products');
    setSubmitting(false);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'variants', label: `Variants${variants.length ? ` (${variants.length})` : ''}`, disabled: form.product_type !== 'variable' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Create New Product</h1>
        <p className="text-xs text-gray-500 mt-1">Configure product details, pricing, variants, and images</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              type="button"
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-700'
                  : tab.disabled
                    ? 'border-transparent text-gray-300 cursor-not-allowed'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md">
          {activeTab === 'basic' && (
            <BasicInfoTab form={form} setForm={setForm} categories={categories} brands={brands} />
          )}
          {activeTab === 'variants' && (
            <VariantsTab variants={variants} setVariants={setVariants} />
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
            <div className="text-xs text-gray-500">
              {form.product_type === 'variable' && variants.length === 0 && (
                <span className="text-amber-600 font-semibold">⚠ Switch to Variants tab to add variants before saving.</span>
              )}
            </div>
            <div className="flex gap-3">
              {form.product_type === 'variable' && activeTab === 'basic' && (
                <button type="button" onClick={() => setActiveTab('variants')}
                  className="border border-sky-600 text-sky-600 font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-sky-50 transition">
                  Next: Configure Variants →
                </button>
              )}
              <button type="submit" disabled={submitting}
                className="bg-sky-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl hover:bg-sky-700 transition disabled:opacity-60">
                {submitting ? 'Saving Product...' : 'Create & Save Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
