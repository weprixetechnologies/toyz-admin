'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { AlertTriangle, ArrowLeft, RefreshCw, CheckCircle2, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LowStockPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adjustingId, setAdjustingId] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLowStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/low-stock');
      if (res.success && res.data) {
        // Backend returns { success: true, data: { products: [...] } } or array
        const list = Array.isArray(res.data?.products)
          ? res.data.products
          : Array.isArray(res.data)
          ? res.data
          : [];
        setProducts(list);
      } else {
        setProducts([]);
        if (res.message) toast.error(res.message);
      }
    } catch (err) {
      console.error('Error fetching low stock:', err);
      toast.error('Failed to load low-stock items');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleAdjustStock = async (productId) => {
    const qtyVal = parseInt(adjustQty, 10);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error('Please enter a valid positive restock quantity');
      return;
    }

    setSaving(true);
    try {
      // Backend supports { qty, movement: 'in', note } as well as { change, reason }
      const res = await api.post(`/products/${productId}/inventory/adjust`, {
        qty: qtyVal,
        change: qtyVal,
        movement: 'in',
        note: `Restocked via low-stock view (+${qtyVal})`,
        reason: `Restocked via low-stock view (+${qtyVal})`
      });

      if (res.success) {
        toast.success(`Successfully added +${qtyVal} units!`);
        setAdjustingId(null);
        setAdjustQty('');
        fetchLowStock();
      } else {
        toast.error(res.message || 'Failed to adjust stock');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Catalog
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-rose-500" size={24} />
            Low Stock Inventory Alerts
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Catalog products with inventory at or below their minimum reorder threshold.
          </p>
        </div>

        <button
          onClick={fetchLowStock}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-sky-600' : 'text-slate-500'} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <RefreshCw size={20} className="animate-spin text-sky-500" />
            <span>Scanning inventory levels...</span>
          </div>
        ) : safeProducts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Healthy Inventory Levels</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All active catalog items currently exceed their low stock thresholds. No restock needed!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Product Details</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Current Stock</th>
                  <th className="p-4">Threshold</th>
                  <th className="p-4">Deficit</th>
                  <th className="p-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeProducts.map((p) => {
                  const currentStock = p.stock_qty ?? p.stock_quantity ?? 0;
                  const threshold = p.low_stock_threshold ?? 5;
                  const deficit = Math.max(0, threshold - currentStock);
                  const isZero = currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="font-bold text-slate-900 hover:text-sky-600 transition"
                        >
                          {p.name}
                        </Link>
                        <div className="text-[10px] text-slate-400 mt-0.5">ID #{p.id}</div>
                      </td>
                      <td className="p-4 font-mono text-slate-500 font-medium">
                        {p.sku || '—'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-full text-[11px] ${
                            isZero
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isZero ? 'bg-rose-500' : 'bg-amber-500'}`}
                          />
                          {currentStock} in stock
                        </span>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{threshold} units</td>
                      <td className="p-4">
                        <span className="text-rose-600 font-bold font-mono">
                          {deficit > 0 ? `-${deficit}` : 'At min'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {adjustingId === p.id ? (
                          <div className="inline-flex items-center gap-2 justify-end">
                            <input
                              type="number"
                              min="1"
                              placeholder="+Qty"
                              value={adjustQty}
                              onChange={(e) => setAdjustQty(e.target.value)}
                              className="w-20 border border-slate-300 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAdjustStock(p.id);
                                if (e.key === 'Escape') setAdjustingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleAdjustStock(p.id)}
                              disabled={saving}
                              className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                            >
                              {saving ? '...' : 'Save'}
                            </button>
                            <button
                              onClick={() => {
                                setAdjustingId(null);
                                setAdjustQty('');
                              }}
                              className="text-slate-400 hover:text-slate-600 text-xs px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => {
                                setAdjustingId(p.id);
                                setAdjustQty(String(Math.max(10, deficit + 10)));
                              }}
                              className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 px-3 py-1 rounded-lg text-xs font-bold transition"
                            >
                              <PackageCheck size={13} />
                              <span>+ Restock</span>
                            </button>
                            <Link
                              href={`/products/${p.id}/inventory`}
                              className="text-slate-400 hover:text-slate-700 text-xs underline font-medium"
                            >
                              History
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
