'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { Plus, Edit2, Trash2, X, RefreshCw, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SectionTagsManager() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  
  // Tag Modal
  const [showTagModal, setShowTagModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', is_active: true });

  // Bulk Product Table
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [productsLoading, setProductsLoading] = useState(false);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/section-tags', { _t: Date.now() });
      if (res.success) {
        setTags(res.data);
        if (res.data.length > 0 && !selectedTag) {
          setSelectedTag(res.data[0]);
        } else if (selectedTag) {
          const updated = res.data.find(t => t.id === selectedTag.id);
          if (updated) setSelectedTag(updated);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      // Fetching max 50 for the bulk UI, could add real pagination later
      const res = await adminApi.get(`/products?search=${productSearch}&limit=50`);
      if (res.success) setProducts(res.data.products || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    const delay = setTimeout(fetchProducts, 500);
    return () => clearTimeout(delay);
  }, [productSearch]);

  // Handle Form
  useEffect(() => {
    if (!editingId && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }));
    }
  }, [formData.name, editingId]);

  const saveTag = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving Tag...');
    try {
      if (editingId) {
        await adminApi.put(`/section-tags/${editingId}`, formData);
      } else {
        await adminApi.post('/section-tags', formData);
      }
      toast.success(editingId ? 'Tag updated successfully!' : 'Tag created successfully!', { id: loadingToast });
      setShowTagModal(false);
      fetchTags();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save', { id: loadingToast });
    }
  };

  const deleteTag = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this tag?')) return;
    const loadingToast = toast.loading('Deleting Tag...');
    try {
      await adminApi.delete(`/section-tags/${id}`);
      toast.success('Tag deleted!', { id: loadingToast });
      if (selectedTag?.id === id) setSelectedTag(null);
      fetchTags();
    } catch (err) {
      toast.error('Failed to delete tag', { id: loadingToast });
    }
  };

  const openNewTag = () => {
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', is_active: true });
    setShowTagModal(true);
  };

  const openEditTag = (t, e) => {
    e.stopPropagation();
    setEditingId(t.id);
    setFormData({ name: t.name, slug: t.slug, description: t.description || '', is_active: t.is_active });
    setShowTagModal(true);
  };

  // Bulk Actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProductIds(new Set(products.map(p => p.id)));
    } else {
      setSelectedProductIds(new Set());
    }
  };

  const handleSelectOne = (id) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProductIds(next);
  };

  const bulkAdd = async () => {
    if (!selectedTag || selectedProductIds.size === 0) return;
    const loadingToast = toast.loading('Adding products...');
    try {
      await adminApi.post(`/section-tags/${selectedTag.id}/products`, { productIds: Array.from(selectedProductIds) });
      toast.success('Products added successfully!', { id: loadingToast });
      setSelectedProductIds(new Set());
      fetchTags();
    } catch (err) {
      toast.error('Failed to add products', { id: loadingToast });
    }
  };

  const bulkRemove = async () => {
    if (!selectedTag || selectedProductIds.size === 0) return;
    const loadingToast = toast.loading('Removing products...');
    try {
      await adminApi.delete(`/section-tags/${selectedTag.id}/products`, { data: { productIds: Array.from(selectedProductIds) } });
      toast.success('Products removed successfully!', { id: loadingToast });
      setSelectedProductIds(new Set());
      fetchTags();
    } catch (err) {
      toast.error('Failed to remove products', { id: loadingToast });
    }
  };

  const removeSingle = async (prodId) => {
    if (!selectedTag) return;
    const loadingToast = toast.loading('Removing product...');
    try {
      await adminApi.delete(`/section-tags/${selectedTag.id}/products`, { data: { productIds: [prodId] } });
      toast.success('Product removed!', { id: loadingToast });
      fetchTags();
    } catch (err) {
      toast.error('Failed to remove product', { id: loadingToast });
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto min-h-screen pb-12">
      {/* TOP HALF: Sidebar + Live Preview */}
      <div className="flex flex-col md:flex-row gap-6 min-h-[400px] h-auto">
        {/* Left Sidebar: Tags List */}
        <div className="w-1/3 flex flex-col bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span className="text-sky-500">🏷️</span> Section Tags
            </h2>
            <button onClick={openNewTag} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1 transition">
              <Plus size={14} /> New Section
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="p-4 text-center text-gray-500">Loading...</div> : tags.map(tag => (
              <div 
                key={tag.id} 
                onClick={() => setSelectedTag(tag)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition flex justify-between items-center group ${selectedTag?.id === tag.id ? 'bg-[#FDF4FF] border-l-4 border-l-[#D946EF]' : 'bg-white hover:bg-gray-50 border-l-4 border-l-transparent'}`}
              >
                <div>
                  <div className="font-bold text-gray-900">{tag.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono bg-purple-100 text-purple-700 px-1.5 rounded">#{tag.slug}</span>
                    <span className="text-xs text-gray-500">({tag.products?.length || 0} products)</span>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => openEditTag(tag, e)} className="text-gray-400 hover:text-sky-600"><Edit2 size={14}/></button>
                  <button onClick={(e) => deleteTag(tag.id, e)} className="text-gray-400 hover:text-red-600"><Trash2 size={14}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Area: Live Preview */}
        <div className="w-2/3 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
            <h2 className="font-bold flex items-center gap-2">
              <span className="text-emerald-500">👁️</span> Live Section Preview: 
              {selectedTag && <span className="text-purple-600 font-mono text-sm bg-purple-50 px-2 rounded">[{selectedTag.slug}]</span>}
            </h2>
            <button onClick={fetchTags} className="text-sm text-sky-600 hover:text-sky-800 flex items-center gap-1">
              <RefreshCw size={14} /> Refresh Preview
            </button>
          </div>
          <div className="flex-1 p-6 bg-gray-50 flex gap-4 overflow-x-auto items-start">
            {!selectedTag ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Select a section tag from the left</div>
            ) : selectedTag.products?.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No products assigned yet. Use the bulk table below.</div>
            ) : (
              selectedTag.products.map(p => (
                <div key={p.id} className="w-48 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-shrink-0 flex flex-col">
                  <div className="h-48 bg-gray-100 relative">
                    {p.primary_image && <img src={p.primary_image} className="w-full h-full object-cover" />}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-gray-800 line-clamp-1">{p.name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mb-1">{p.sku || `ID: ${p.id}`}</div>
                      <div className="text-sm font-bold text-emerald-600">${p.sale_price || p.base_price}</div>
                    </div>
                    <button onClick={() => removeSingle(p.id)} className="w-full mt-3 py-1 bg-red-50 text-red-500 hover:bg-red-100 text-xs font-semibold rounded flex items-center justify-center gap-1 transition">
                      <X size={12}/> Remove Tag
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM HALF: Bulk Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-800">
            Bulk Tag Products for Section: <span className="text-gray-500 font-normal">"{selectedTag?.name || 'Select a tag'}" {selectedTag && `(${selectedTag.slug})`}</span>
          </h2>
          
          <div className="mt-4 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search product by name or ID..." 
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-sky-500 outline-none"
                />
              </div>
              <button className="px-3 py-1.5 border border-gray-300 rounded text-sm flex items-center gap-2 hover:bg-gray-50 text-gray-600">
                <Filter size={14}/> Filters
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded">{selectedProductIds.size} Selected</span>
              <button onClick={bulkAdd} disabled={!selectedTag || selectedProductIds.size===0} className="bg-[#A78BFA] hover:bg-[#8B5CF6] disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2">
                ✓ Bulk Add Tag
              </button>
              <button onClick={bulkRemove} disabled={!selectedTag || selectedProductIds.size===0} className="bg-[#FDA4AF] hover:bg-[#F43F5E] disabled:opacity-50 text-white px-4 py-1.5 rounded text-sm font-semibold flex items-center gap-2">
                × Bulk Remove Tag
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-50/50 p-4 rounded-b-xl">
          
          <div className="mb-4 flex items-center gap-2">
            <input type="checkbox" id="selectAll" onChange={handleSelectAll} checked={products.length > 0 && selectedProductIds.size === products.length} className="rounded w-4 h-4 text-sky-600" />
            <label htmlFor="selectAll" className="text-sm font-semibold text-gray-700 cursor-pointer">Select All on Page</label>
          </div>

          {productsLoading ? (
            <div className="p-8 text-center text-gray-400 w-full">Loading products...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.map(p => {
                const assignedTags = tags.filter(t => t.products?.some(tp => tp.id === p.id));
                const isSelected = selectedProductIds.has(p.id);
                
                return (
                  <div 
                    key={p.id} 
                    onClick={() => handleSelectOne(p.id)}
                    className={`relative bg-white rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${isSelected ? 'border-sky-500 shadow-md ring-2 ring-sky-200' : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'}`}
                  >
                    <div className="absolute top-2 left-2 z-10">
                      <input 
                        type="checkbox" 
                        checked={isSelected} 
                        onChange={() => {}} 
                        className={`w-5 h-5 rounded border-gray-300 ${isSelected ? 'text-sky-600' : 'opacity-70'}`} 
                      />
                    </div>
                    
                    <div className="h-40 bg-gray-100 relative w-full">
                      {p.primary_image ? (
                        <img src={p.primary_image} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                      )}
                    </div>
                    
                    <div className="p-3 flex flex-col gap-1">
                      <div className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight h-10">{p.name}</div>
                      <div className="text-xs font-mono text-gray-400">{p.sku || `ID: ${p.id}`}</div>
                      <div className="font-bold text-emerald-600">${p.sale_price || p.base_price}</div>
                      
                      <div className="flex flex-wrap gap-1 mt-2 h-10 overflow-hidden">
                        {assignedTags.length > 0 ? assignedTags.map(at => (
                          <span key={at.id} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${at.id === selectedTag?.id ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                            {at.name}
                          </span>
                        )) : <span className="text-[10px] text-gray-300">No tags</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showTagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={saveTag} className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-lg">{editingId ? 'Edit Section Tag' : 'New Section Tag'}</h2>
              <button type="button" onClick={() => setShowTagModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Section Title</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Section Tag Slug</label>
                <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 outline-none font-mono text-sm" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description (Optional)</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-sky-500 outline-none h-20" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="rounded text-sky-600" />
                <label htmlFor="active" className="text-sm font-semibold">Active</label>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
              <button type="button" onClick={() => setShowTagModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm text-white bg-sky-600 hover:bg-sky-700 rounded font-bold">Save Tag</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
