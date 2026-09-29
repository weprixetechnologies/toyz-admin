'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function BannersPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [shopBannerMode, setShopBannerMode] = useState('static');

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image_url: '',
    link_url: '',
    button_text: '',
    type: 'homepage_carousel',
    sort_order: 0,
    is_active: true
  });
  const [uploading, setUploading] = useState(false);


  useEffect(() => {
    loadBanners();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const res = await api.get('/admin/settings');
    if (res.success) {
      const mode = res.data?.settings?.shop_banner_mode;
      if (mode) setShopBannerMode(mode);
    }
  };



  const handleToggleMode = async (mode) => {
    setShopBannerMode(mode);
    await api.put('/admin/settings', { settings: { shop_banner_mode: mode } });
  };

  const loadBanners = async () => {
    setLoading(true);
    try {
      const res = await api.get('/banners?is_active=all');
      if (res.success) {
        setBanners(res.data.banners || []);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };


  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const key = `banners/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

      const res = await api.post(`/storage/upload?key=${encodeURIComponent(key)}&contentType=${encodeURIComponent(file.type)}`);

      if (res.success) {
        const { uploadUrl, fileUrl } = res.data;

        // Use raw fetch for PUTting the binary file
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://72.60.219.181:46711/api/v1';
        const fullUrl = uploadUrl.startsWith('http') ? uploadUrl : baseURL.replace('/api/v1', '') + uploadUrl;

        const token = localStorage.getItem('token');
        const uploadRes = await fetch(fullUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });

        if (uploadRes.ok) {
          setFormData(prev => ({ ...prev, image_url: fileUrl }));
        } else {
          throw new Error('Failed to PUT file to storage');
        }
      }
    } catch (err) {
      console.error('Upload failed', err);
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = (e) => {
    processFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Saving banner...');
    try {
      if (editingId) {
        await api.put(`/banners/${editingId}`, formData);
      } else {
        await api.post('/banners', formData);
      }
      setShowModal(false);
      loadBanners();
      toast.success('Banner saved successfully!', { id: loadingToast });
    } catch (err) {
      console.error('Save failed', err);
      toast.error('Failed to save banner.', { id: loadingToast });
    }
  };

  const handleEdit = (b) => {
    setEditingId(b.id);
    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      image_url: b.image_url || '',
      link_url: b.link_url || '',
      button_text: b.button_text || '',
      type: b.type || 'hero',
      sort_order: b.sort_order || 0,
      is_active: b.is_active === 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure?')) {
      const loadingToast = toast.loading('Deleting banner...');
      try {
        await api.delete(`/banners/${id}`);
        loadBanners();
        toast.success('Banner deleted!', { id: loadingToast });
      } catch (e) {
        toast.error('Failed to delete', { id: loadingToast });
      }
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({
      title: '', subtitle: '', image_url: '', link_url: '', button_text: '', type: 'hero', sort_order: 0, is_active: true
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banners Management</h1>
        <div className="flex gap-4 items-center">
          <div className="bg-white border rounded-lg p-1 flex text-sm">
            <button
              onClick={() => handleToggleMode('static')}
              className={`px-3 py-1 rounded ${shopBannerMode === 'static' ? 'bg-slate-100 font-bold' : 'text-gray-500'}`}>
              Shop Static
            </button>
            <button
              onClick={() => handleToggleMode('carousel')}
              className={`px-3 py-1 rounded ${shopBannerMode === 'carousel' ? 'bg-slate-100 font-bold' : 'text-gray-500'}`}>
              Shop Carousel
            </button>
          </div>
          <button onClick={openNewModal} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
            <Plus size={16} /> Add Banner
          </button>
        </div>
      </div>


      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-600 text-sm">
            <tr>
              <th className="py-3 px-4 font-semibold">Image</th>
              <th className="py-3 px-4 font-semibold">Title</th>
              <th className="py-3 px-4 font-semibold">Type</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Order</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {banners.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">
                  <img src={b.image_url} alt="banner" className="h-12 w-24 object-cover rounded border" />
                </td>
                <td className="py-3 px-4 font-medium text-gray-900">{b.title || '-'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs capitalize">{b.type}</span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 rounded text-xs ${b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {b.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">{b.sort_order}</td>
                <td className="py-3 px-4 text-right space-x-2">
                  <button onClick={() => handleEdit(b)} className="text-sky-600 hover:text-sky-800 p-1"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-800 p-1"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {banners.length === 0 && !loading && (
              <tr>
                <td colSpan="6" className="py-8 text-center text-gray-500">No banners found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Banner' : 'New Banner'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full border rounded-lg p-2">
                    <option value="homepage_carousel">Homepage Carousel</option>
                    <option value="shop_page_banner">Shop Page Banner/Carousel</option>
                    <option value="offers_page_banner">Offers Page Banner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={formData.sort_order} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} className="w-full border rounded-lg p-2" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input type="text" value={formData.subtitle} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                <input type="text" value={formData.button_text} onChange={e => setFormData({ ...formData, button_text: e.target.value })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input type="text" value={formData.link_url} onChange={e => setFormData({ ...formData, link_url: e.target.value })} className="w-full border rounded-lg p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>

                <div
                  className={`mt-1 relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-sky-500 bg-sky-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} disabled={uploading} />

                  {uploading ? (
                    <div className="text-sm font-semibold text-sky-600 flex flex-col items-center gap-2">
                      <span className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
                      Uploading to BunnyCDN...
                    </div>
                  ) : (
                    <div className="text-center">
                      <UploadCloud size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-bold text-gray-700">DRAG OR DROP OR CLICK TO SELECT IMAGE</p>
                      <p className="text-xs text-gray-500 mt-1">Supports JPG, PNG, WEBP</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-3 hidden">
                  <input type="text" required value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="flex-1 border rounded-lg p-2 text-sm" placeholder="https://..." />
                </div>
                {formData.image_url && <div className="mt-3 relative inline-block">
                  <img src={formData.image_url} alt="preview" className="h-32 object-contain bg-white rounded-lg border p-1 shadow-sm" />
                </div>}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input type="checkbox" id="active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4 rounded" />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded-lg text-sm font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700">Save Banner</button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
