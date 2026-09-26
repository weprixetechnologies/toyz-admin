'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Tag, Plus, Trash2, Edit2, Image as ImageIcon, X } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatImage, setNewCatImage] = useState('');
  const [newCatBanner, setNewCatBanner] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Edit Form State
  const [editingCat, setEditingCat] = useState(null);
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const [editUploadingBanner, setEditUploadingBanner] = useState(false);

  async function loadCategories() {
    setLoading(true);
    const res = await adminApi.get('/categories');
    if (res.success) setCategories(res.data?.raw || res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
  }, []);

  const handleUpload = async (file, prefix) => {
    const ext = file.name.split('.').pop();
    const filename = `${prefix}-${Date.now()}.${ext}`;
    const res = await adminApi.post(`/storage/upload?key=${encodeURIComponent(`categories/${filename}`)}&contentType=${encodeURIComponent(file.type)}`, {});
    if (res.success && res.data?.uploadUrl) {
      const fullUploadUrl = res.data.uploadUrl.startsWith('http') ? res.data.uploadUrl : adminApi.baseURL.replace('/api/v1', '') + res.data.uploadUrl;
      await fetch(fullUploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      return res.data.fileUrl || res.data.uploadUrl;
    }
    throw new Error('Upload failed');
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const slug = newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await adminApi.post('/categories', { 
      name: newCatName.trim(), 
      slug,
      image: newCatImage,
      banner_image: newCatBanner
    });
    if (res.success) {
      setNewCatName('');
      setNewCatImage('');
      setNewCatBanner('');
      loadCategories();
    } else {
      alert(res.message || 'Category creation failed');
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    if (!editingCat || !editingCat.name.trim()) return;

    const res = await adminApi.put(`/categories/${editingCat.id}`, { 
      name: editingCat.name.trim(), 
      image: editingCat.image,
      banner_image: editingCat.banner_image
    });
    
    if (res.success) {
      setEditingCat(null);
      loadCategories();
    } else {
      alert(res.message || 'Update failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    const res = await adminApi.delete(`/categories/${id}`);
    if (res.success) {
      loadCategories();
    } else {
      alert(res.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Categories Management</h1>
        <p className="text-xs text-gray-500">Manage categories, images, and banners</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={handleCreateCategory} className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Add New Category</h3>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Action Figures"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Category Image (Icon)</label>
            <div className="mt-1 flex items-center gap-3">
              {newCatImage ? (
                <div className="relative w-12 h-12 rounded border bg-gray-50 overflow-hidden">
                  <img src={newCatImage} alt="icon" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewCatImage('')} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12}/></button>
                </div>
              ) : (
                <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg px-4 py-2 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100">
                  {uploadingImage ? 'Uploading...' : 'Upload Image'}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      setUploadingImage(true);
                      try { const url = await handleUpload(e.target.files[0], 'icon'); setNewCatImage(url); } catch(err) { alert('Upload failed'); }
                      setUploadingImage(false);
                    }
                  }}/>
                </label>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Banner Image</label>
            <div className="mt-1 flex items-center gap-3">
              {newCatBanner ? (
                <div className="relative w-24 h-12 rounded border bg-gray-50 overflow-hidden">
                  <img src={newCatBanner} alt="banner" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewCatBanner('')} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12}/></button>
                </div>
              ) : (
                <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg px-4 py-2 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100">
                  {uploadingBanner ? 'Uploading...' : 'Upload Banner'}
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    if (e.target.files?.[0]) {
                      setUploadingBanner(true);
                      try { const url = await handleUpload(e.target.files[0], 'banner'); setNewCatBanner(url); } catch(err) { alert('Upload failed'); }
                      setUploadingBanner(false);
                    }
                  }}/>
                </label>
              )}
            </div>
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-sky-700">
            Create Category
          </button>
        </form>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Category List</h3>
          {loading ? (
            <p className="text-sm text-gray-400">Loading categories...</p>
          ) : categories.length > 0 ? (
            <div className="divide-y divide-slate-100 text-sm">
              {categories.map((c) => (
                <div key={c.id} className="py-3 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                      {c.image ? <img src={c.image} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="text-gray-400" />}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-gray-400 text-xs font-mono">/categories/{c.slug}</span>
                      {c.banner_image && <span className="ml-2 text-[10px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded">Has Banner</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingCat(c)} className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteCategory(c.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No categories created yet.</p>
          )}
        </div>
      </div>

      {editingCat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900">Edit Category</h3>
              <button onClick={() => setEditingCat(null)} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
            </div>
            <form onSubmit={handleUpdateCategory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category Name</label>
                <input
                  type="text"
                  required
                  value={editingCat.name}
                  onChange={(e) => setEditingCat({...editingCat, name: e.target.value})}
                  className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Category Image (Icon)</label>
                <div className="mt-1 flex items-center gap-3">
                  {editingCat.image ? (
                    <div className="relative w-12 h-12 rounded border bg-gray-50 overflow-hidden">
                      <img src={editingCat.image} alt="icon" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditingCat({...editingCat, image: null})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12}/></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg px-4 py-2 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100">
                      {editUploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          setEditUploadingImage(true);
                          try { const url = await handleUpload(e.target.files[0], 'icon'); setEditingCat({...editingCat, image: url}); } catch(err) { alert('Upload failed'); }
                          setEditUploadingImage(false);
                        }
                      }}/>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Banner Image</label>
                <div className="mt-1 flex items-center gap-3">
                  {editingCat.banner_image ? (
                    <div className="relative w-24 h-12 rounded border bg-gray-50 overflow-hidden">
                      <img src={editingCat.banner_image} alt="banner" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setEditingCat({...editingCat, banner_image: null})} className="absolute top-0 right-0 bg-red-500 text-white p-0.5"><X size={12}/></button>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-gray-50 border border-gray-300 border-dashed rounded-lg px-4 py-2 flex items-center justify-center text-xs text-gray-500 hover:bg-gray-100">
                      {editUploadingBanner ? 'Uploading...' : 'Upload Banner'}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          setEditUploadingBanner(true);
                          try { const url = await handleUpload(e.target.files[0], 'banner'); setEditingCat({...editingCat, banner_image: url}); } catch(err) { alert('Upload failed'); }
                          setEditUploadingBanner(false);
                        }
                      }}/>
                    </label>
                  )}
                </div>
              </div>
              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setEditingCat(null)} className="flex-1 bg-gray-100 text-gray-700 font-bold text-sm py-2.5 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
                <button type="submit" className="flex-1 bg-sky-600 text-white font-bold text-sm py-2.5 rounded-lg hover:bg-sky-700">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
