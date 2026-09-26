'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '../../lib/api';
import { Layers, Plus, Trash2 } from 'lucide-react';

export default function BrandsPage() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBrandName, setNewBrandName] = useState('');

  async function loadBrands() {
    setLoading(true);
    const res = await adminApi.get('/brands');
    if (res.success) setBrands(res.data?.brands || res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadBrands();
  }, []);

  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const slug = newBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await adminApi.post('/brands', { name: newBrandName.trim(), slug });
    if (res.success) {
      setNewBrandName('');
      loadBrands();
    } else {
      alert(res.message || 'Brand creation failed');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!confirm('Are you sure you want to delete this brand?')) return;
    const res = await adminApi.delete(`/brands/${id}`);
    if (res.success) {
      loadBrands();
    } else {
      alert(res.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Brands Management</h1>
        <p className="text-xs text-gray-500">Configure catalog brand profiles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={handleCreateBrand} className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Add New Brand</h3>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase">Brand Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Sony"
              value={newBrandName}
              onChange={(e) => setNewBrandName(e.target.value)}
              className="w-full p-2.5 mt-1 border border-gray-300 rounded-lg text-xs"
            />
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white font-bold text-xs py-2.5 rounded-lg hover:bg-sky-700">
            Create Brand
          </button>
        </form>

        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Registered Brands</h3>
          {loading ? (
            <p className="text-xs text-gray-400">Loading brands...</p>
          ) : brands.length > 0 ? (
            <div className="divide-y divide-slate-100 text-xs">
              {brands.map((b) => (
                <div key={b.id} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="text-gray-400 text-[10px] ml-2 font-mono">/brands/{b.slug}</span>
                  </div>
                  <button onClick={() => handleDeleteBrand(b.id)} className="text-gray-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500">No brands created yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
