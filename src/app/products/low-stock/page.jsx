'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function LowStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');

  const fetchLowStock = async () => {
    try {
      const res = await api.get('/products/low-stock');
      if (res.success) setProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleAdjustStock = async (productId) => {
    if (!adjustQty || isNaN(adjustQty)) return;
    try {
      const res = await api.post(`/products/${productId}/inventory/adjust`, {
        change: parseInt(adjustQty),
        reason: 'Restock via low-stock view'
      });
      if (res.success) {
        setAdjustingId(null);
        setAdjustQty('');
        fetchLowStock();
      }
    } catch (err) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Low Stock Inventory Alerts</h1>
          <p className="text-slate-500 text-sm">Products with stock at or below minimum threshold</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inventory alerts...</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-500">All products have healthy inventory levels!</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Product Name</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Current Stock</th>
                <th className="p-4">Low Stock Threshold</th>
                <th className="p-4">Quick Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{p.name}</td>
                  <td className="p-4 font-mono text-slate-500">{p.sku || '-'}</td>
                  <td className="p-4">
                    <span className="bg-red-100 text-red-800 font-bold px-2 py-1 rounded">
                      {p.stock_quantity}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{p.low_stock_threshold || 5}</td>
                  <td className="p-4">
                    {adjustingId === p.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="+Qty"
                          value={adjustQty}
                          onChange={(e) => setAdjustQty(e.target.value)}
                          className="w-20 border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleAdjustStock(p.id)}
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setAdjustingId(null)}
                          className="text-slate-500 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAdjustingId(p.id); setAdjustQty('10'); }}
                        className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded text-xs font-bold hover:bg-indigo-100"
                      >
                        + Restock
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
