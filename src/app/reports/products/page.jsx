'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { ShoppingBag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductsReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/products');
      if (res.success && res.data) {
        const list = Array.isArray(res.data?.products)
          ? res.data.products
          : Array.isArray(res.data)
          ? res.data
          : [];
        setData(list);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error('Error loading product performance report:', err);
      toast.error('Failed to load products report');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const safeData = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag size={24} className="text-sky-600" />
            Product Sales & Revenue Performance
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Top performing catalog items, units sold & gross revenue generation.
          </p>
        </div>

        <button
          onClick={loadReport}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : 'text-slate-400'} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Ranked Products by Revenue</h2>
          <span className="text-xs text-slate-400 font-mono">{safeData.length} catalog items</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading product sales data...
          </div>
        ) : safeData.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No sales recorded yet. Once customers place orders, product ranks will appear here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Product Name</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">In Stock</th>
                  <th className="p-4">Units Sold</th>
                  <th className="p-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeData.map((p, i) => (
                  <tr key={p.id || i} className="hover:bg-slate-50/60 transition">
                    <td className="p-4">
                      <Link href={`/products/${p.id}/edit`} className="font-bold text-slate-900 hover:text-sky-600 transition">
                        {p.name}
                      </Link>
                    </td>
                    <td className="p-4 font-mono text-slate-500">{p.sku || '—'}</td>
                    <td className="p-4 font-mono text-slate-700">{p.stock_qty ?? 0}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {p.total_units_sold ?? p.units_sold ?? 0} pcs
                    </td>
                    <td className="p-4 font-bold text-emerald-700 font-mono text-sm text-right">
                      ₹{parseFloat(p.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
