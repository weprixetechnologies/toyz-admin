'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Search, Check, X, Tag, Package, Award, Sparkles, Filter, CheckSquare, Square } from 'lucide-react';

const PRESET_BG_COLORS = [
  { name: 'Red', hex: '#ef4444' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Dark Slate', hex: '#1e293b' },
];

const PRESET_TEXT_COLORS = [
  { name: 'White', hex: '#ffffff' },
  { name: 'Yellow', hex: '#fef08a' },
  { name: 'Light Cyan', hex: '#e0f2fe' },
  { name: 'Dark Slate', hex: '#0f172a' },
];

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Products state for assignment
  const [allProducts, setAllProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    badge_text: '',
    bg_color: '#ef4444',
    text_color: '#ffffff',
    description: '',
    is_active: true,
    product_ids: []
  });

  // Assign Products Dedicated Modal
  const [assignModalBadge, setAssignModalBadge] = useState(null);
  const [assignProductIds, setAssignProductIds] = useState([]);
  const [assignSearch, setAssignSearch] = useState('');

  useEffect(() => {
    fetchBadges();
    fetchProducts();
  }, []);

  async function fetchBadges() {
    setLoading(true);
    const res = await adminApi.get('/badges');
    if (res.success) {
      setBadges(res.data?.badges || []);
    } else {
      toast.error(res.message || 'Failed to fetch badges');
    }
    setLoading(false);
  }

  async function fetchProducts() {
    setProductsLoading(true);
    const res = await adminApi.get('/products?limit=100');
    if (res.success) {
      setAllProducts(res.data?.products || []);
    }
    setProductsLoading(false);
  }

  function handleOpenCreateModal() {
    setEditingBadge(null);
    setForm({
      name: '',
      badge_text: '',
      bg_color: '#ef4444',
      text_color: '#ffffff',
      description: '',
      is_active: true,
      product_ids: []
    });
    setIsModalOpen(true);
  }

  async function handleOpenEditModal(badge) {
    setEditingBadge(badge);
    // Fetch full badge detail with product IDs
    const res = await adminApi.get(`/badges/${badge.id}`);
    const productIds = res.success ? (res.data?.product_ids || []) : [];

    setForm({
      name: badge.name || '',
      badge_text: badge.badge_text || '',
      bg_color: badge.bg_color || '#ef4444',
      text_color: badge.text_color || '#ffffff',
      description: badge.description || '',
      is_active: Boolean(badge.is_active),
      product_ids: productIds
    });
    setIsModalOpen(true);
  }

  async function handleOpenAssignModal(badge) {
    setAssignModalBadge(badge);
    setAssignSearch('');
    const res = await adminApi.get(`/badges/${badge.id}`);
    if (res.success) {
      setAssignProductIds(res.data?.product_ids || []);
    } else {
      setAssignProductIds([]);
    }
  }

  async function handleSubmitBadge(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.badge_text.trim()) {
      toast.error('Badge Name and Display Text are required');
      return;
    }

    const payload = {
      name: form.name.trim(),
      badge_text: form.badge_text.trim(),
      bg_color: form.bg_color,
      text_color: form.text_color,
      description: form.description?.trim() || null,
      is_active: form.is_active ? 1 : 0,
      product_ids: form.product_ids,
      override_others: overrideOthers
    };

    let res;
    if (editingBadge) {
      res = await adminApi.put(`/badges/${editingBadge.id}`, payload);
    } else {
      res = await adminApi.post('/badges', payload);
    }

    if (res.success) {
      toast.success(editingBadge ? 'Badge updated successfully' : 'Badge created successfully');
      setIsModalOpen(false);
      setOverrideOthers(false);
      fetchBadges();
      fetchProducts(); // Refresh products to get updated badges
    } else {
      toast.error(res.message || 'Operation failed');
    }
  }

  async function handleSaveAssignments() {
    if (!assignModalBadge) return;
    const res = await adminApi.post(`/badges/${assignModalBadge.id}/products`, {
      product_ids: assignProductIds,
      override_others: overrideOthers
    });

    if (res.success) {
      toast.success('Assigned products updated successfully!');
      setAssignModalBadge(null);
      setOverrideOthers(false);
      fetchBadges();
      fetchProducts(); // Refresh products to get updated badges
    } else {
      toast.error(res.message || 'Failed to update assigned products');
    }
  }

  async function handleDeleteBadge(badge) {
    if (!confirm(`Are you sure you want to delete badge "${badge.name}"?`)) return;

    const res = await adminApi.delete(`/badges/${badge.id}`);
    if (res.success) {
      toast.success('Badge deleted');
      fetchBadges();
    } else {
      toast.error(res.message || 'Failed to delete badge');
    }
  }

  const [overrideOthers, setOverrideOthers] = useState(false);

  const checkOverride = (prod, currentBadgeId) => {
    if (!prod.badges || prod.badges.length === 0) return true;
    const hasOther = prod.badges.some(b => b.id !== currentBadgeId);
    if (hasOther) {
      const confirmOverride = window.confirm(`"${prod.name}" already has badges attached. Do you want to OVERRIDE them? (Clicking OK will remove its old badges when saving).`);
      if (confirmOverride) {
        setOverrideOthers(true);
      }
      return true; // we allow selection either way, but overrideOthers is set if they want it
    }
    return true;
  };

  const toggleProductSelect = (productId) => {
    const prod = allProducts.find(p => p.id === productId);
    setForm(prev => {
      const exists = prev.product_ids.includes(productId);
      if (!exists && prod) checkOverride(prod, editingBadge?.id);
      return {
        ...prev,
        product_ids: exists
          ? prev.product_ids.filter(id => id !== productId)
          : [...prev.product_ids, productId]
      };
    });
  };

  const toggleAssignProductSelect = (productId) => {
    const prod = allProducts.find(p => p.id === productId);
    setAssignProductIds(prev => {
      const exists = prev.includes(productId);
      if (!exists && prod) checkOverride(prod, assignModalBadge?.id);
      return exists
        ? prev.filter(id => id !== productId)
        : [...prev, productId];
    });
  };

  const filteredBadges = badges.filter(b =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.badge_text?.toLowerCase().includes(search.toLowerCase()) ||
    b.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFormProducts = allProducts.filter(p =>
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredAssignProducts = allProducts.filter(p =>
    p.name?.toLowerCase().includes(assignSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(assignSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            <Award className="text-sky-600" /> Badges Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create custom promotional & status badges and select products to display them on
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-2"
        >
          <Plus size={16} /> Create New Badge
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search badges by name or text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-sky-500"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Badges: <span className="text-slate-900 font-bold">{badges.length}</span>
        </div>
      </div>

      {/* Badges Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">Loading badge system...</div>
        ) : filteredBadges.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Badge Preview</th>
                  <th className="p-4">Internal Name</th>
                  <th className="p-4">Display Text</th>
                  <th className="p-4">Colors</th>
                  <th className="p-4">Assigned Products</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBadges.map((badge) => (
                  <tr key={badge.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <span
                        className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm"
                        style={{ backgroundColor: badge.bg_color || '#ef4444', color: badge.text_color || '#ffffff' }}
                      >
                        {badge.badge_text}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{badge.name}</td>
                    <td className="p-4 font-mono font-bold text-slate-700">{badge.badge_text}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                          style={{ backgroundColor: badge.bg_color }}
                          title={`BG: ${badge.bg_color}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-inner"
                          style={{ backgroundColor: badge.text_color }}
                          title={`Text: ${badge.text_color}`}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleOpenAssignModal(badge)}
                        className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                      >
                        <Package size={14} />
                        <span>{badge.product_count || 0} Products</span>
                      </button>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        badge.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {badge.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(badge)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="Edit Badge"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBadge(badge)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Badge"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">
            No badges found. Click "Create New Badge" to add one.
          </div>
        )}
      </div>

      {/* Create / Edit Badge Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Sparkles size={18} className="text-sky-600" />
                {editingBadge ? 'Edit Badge' : 'Create New Badge'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitBadge} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Internal Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Best Seller Summer"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-sky-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase">Display Text on Badge</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HOT DEAL or BEST SELLER"
                    value={form.badge_text}
                    onChange={e => setForm(p => ({ ...p, badge_text: e.target.value }))}
                    className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-xs font-black uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Live Badge Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Live Preview</span>
                  <span
                    className="inline-block px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm"
                    style={{ backgroundColor: form.bg_color, color: form.text_color }}
                  >
                    {form.badge_text || 'BADGE PREVIEW'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-xs font-bold text-slate-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Background Color</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={form.bg_color}
                      onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.bg_color}
                      onChange={e => setForm(p => ({ ...p, bg_color: e.target.value }))}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_BG_COLORS.map(c => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setForm(p => ({ ...p, bg_color: c.hex }))}
                        className={`w-6 h-6 rounded-full border border-slate-300 transition transform hover:scale-110 ${
                          form.bg_color === c.hex ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1 block">Text Color</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={form.text_color}
                      onChange={e => setForm(p => ({ ...p, text_color: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.text_color}
                      onChange={e => setForm(p => ({ ...p, text_color: e.target.value }))}
                      className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TEXT_COLORS.map(c => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setForm(p => ({ ...p, text_color: c.hex }))}
                        className={`w-6 h-6 rounded-full border border-slate-300 transition transform hover:scale-110 ${
                          form.text_color === c.hex ? 'ring-2 ring-sky-500 ring-offset-1' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase">Description (Optional)</label>
                <textarea
                  rows="2"
                  placeholder="Notes about where or why this badge is used..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full p-2.5 mt-1 border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Product Selection Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <Package size={14} className="text-sky-600" />
                    Select Products to display this badge on ({form.product_ids.length} selected)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, product_ids: allProducts.map(x => x.id) }))}
                      className="text-sky-600 font-bold hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setForm(p => ({ ...p, product_ids: [] }))}
                      className="text-slate-500 font-bold hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Filter products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div className="border border-slate-200 rounded-xl max-h-64 p-3 overflow-y-auto bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredFormProducts.length > 0 ? (
                    filteredFormProducts.map(prod => {
                      const isSelected = form.product_ids.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => toggleProductSelect(prod.id)}
                          className={`p-3 rounded-lg flex flex-col gap-2 cursor-pointer transition border ${
                            isSelected ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-500' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {isSelected ? (
                                <CheckSquare size={16} className="text-sky-600 flex-shrink-0" />
                              ) : (
                                <Square size={16} className="text-slate-300 flex-shrink-0" />
                              )}
                              <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                                {prod.name}
                              </span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">₹{parseFloat(prod.base_price || 0).toLocaleString('en-IN')}</span>
                          </div>
                          
                          <div className="flex items-center justify-between pl-6">
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                            {/* Display existing badges */}
                            {prod.badges && prod.badges.length > 0 && (
                              <div className="flex gap-1">
                                {prod.badges.map(b => (
                                  <span key={b.id} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm" style={{ backgroundColor: b.bg_color, color: b.text_color }}>
                                    {b.badge_text}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 col-span-full text-center text-slate-400 text-xs">No matching products</div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  {editingBadge ? 'Save Changes' : 'Create Badge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Products Dedicated Modal */}
      {assignModalBadge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Package size={18} className="text-sky-600" />
                  Assign Products to Badge
                </h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Badge:</span>
                  <span
                    className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase"
                    style={{ backgroundColor: assignModalBadge.bg_color, color: assignModalBadge.text_color }}
                  >
                    {assignModalBadge.badge_text}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setAssignModalBadge(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="relative flex-1 mr-3">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search product by name or SKU..."
                    value={assignSearch}
                    onChange={e => setAssignSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAssignProductIds(allProducts.map(x => x.id))}
                    className="text-sky-600 font-bold hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setAssignProductIds([])}
                    className="text-slate-500 font-bold hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96">
                {filteredAssignProducts.map(prod => {
                  const isSelected = assignProductIds.includes(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => toggleAssignProductSelect(prod.id)}
                      className={`p-3 rounded-lg flex flex-col gap-2 cursor-pointer transition border ${
                        isSelected ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-500' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {isSelected ? (
                            <CheckSquare size={16} className="text-sky-600 flex-shrink-0" />
                          ) : (
                            <Square size={16} className="text-slate-300 flex-shrink-0" />
                          )}
                          <span className={`text-xs font-bold line-clamp-1 ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                            {prod.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">₹{parseFloat(prod.base_price || 0).toLocaleString('en-IN')}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pl-6">
                        <span className="text-[10px] text-slate-400 font-mono">SKU: {prod.sku}</span>
                        {/* Display existing badges */}
                        {prod.badges && prod.badges.length > 0 && (
                          <div className="flex gap-1">
                            {prod.badges.map(b => (
                              <span key={b.id} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm" style={{ backgroundColor: b.bg_color, color: b.text_color }}>
                                {b.badge_text}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredAssignProducts.length === 0 && (
                  <div className="p-4 col-span-full text-center text-slate-400 text-xs">No matching products</div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">
                {assignProductIds.length} Products Selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAssignModalBadge(null)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAssignments}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow transition"
                >
                  Save Assignments
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
