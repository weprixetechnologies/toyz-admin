'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Plus, Download, Upload, Search, Trash } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const res = await adminApi.get('/products', { limit: 50 });
      if (res.success) {
        setProducts(res.data?.products || res.data || []);
      }
      setLoading(false);
    }
    loadProducts();
  }, []);


  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) return;
    setIsDeleting(true);
    let successCount = 0;
    for (const id of selectedProductIds) {
      const res = await adminApi.delete(`/products/${id}`);
      if (res.success) successCount++;
    }
    alert(`Successfully deleted ${successCount} products.`);
    setSelectedProductIds([]);
    setIsDeleting(false);
    // Reload products
    const res = await adminApi.get('/products', { limit: 50 });
    if (res.success) {
      setProducts(res.data?.products || res.data || []);
    }
  };

  const handleExportCsv = async () => {
    window.open('http://72.60.219.181:98111/api/v1/products/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Products Catalog</h1>
          <p className="text-xs text-gray-500">Manage catalog items, pricing, inventory stock, and variants</p>
        </div>

        <div className="flex items-center gap-3">

          {selectedProductIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <Trash size={14} /> {isDeleting ? 'Deleting...' : `Bulk Delete (${selectedProductIds.length})`}
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
          <Link
            href="/products/import"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Upload size={14} /> Import CSV
          </Link>
          <Link
            href="/products/new"
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Plus size={14} /> Create Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading catalog items...</div>
        ) : products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedProductIds(products.map(p => p.id));
                        else setSelectedProductIds([]);
                      }}
                      checked={products.length > 0 && selectedProductIds.length === products.length}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                  </th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">Stock Qty</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                          else setSelectedProductIds(selectedProductIds.filter(id => id !== p.id));
                        }}
                        className="rounded text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-700">{p.sku}</td>
                    <td className="p-4 font-bold text-slate-900">{p.name}</td>
                    <td className="p-4 font-bold text-slate-900">₹{parseFloat(p.base_price || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-slate-700">{p.stock_qty} pcs</td>
                    <td className="p-4"><StatusBadge status={p.is_active ? 'active' : 'inactive'} /></td>
                    <td className="p-4">
                      <Link href={`/products/${p.id}/edit`} className="text-sky-600 font-bold hover:underline">
                        Edit Item
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">No products available.</div>
        )}
      </div>
    </div>
  );
}
