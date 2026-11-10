'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Package, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryReportPage() {
  const [data, setData] = useState({
    total_items: 0,
    total_units: 0,
    total_valuation: 0,
    low_stock_count: 0,
    out_of_stock_count: 0
  });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/inventory');
      if (res.success && res.data) {
        setData({
          total_items: res.data.total_products ?? res.data.total_items ?? 0,
          total_units: res.data.total_units ?? 0,
          total_valuation: parseFloat(res.data.valuation ?? res.data.total_valuation ?? 0),
          low_stock_count: res.data.low_stock_count ?? 0,
          out_of_stock_count: res.data.out_of_stock_count ?? 0
        });
      }
    } catch (err) {
      console.error('Error loading inventory report:', err);
      toast.error('Failed to load inventory valuation report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package size={24} className="text-sky-600" />
            Inventory Asset & Valuation Report
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Stock asset value, total catalog SKUs & inventory depletion metrics.
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Inventory Valuation</p>
          <p className="text-2xl font-black text-emerald-700 font-mono">
            ₹{data.total_valuation.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Sum of (Stock Qty × Base Price)</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Catalog SKUs</p>
          <p className="text-2xl font-black text-slate-900">{data.total_items}</p>
          <span className="text-[10px] text-slate-400">Total active products in database</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Physical Units in Stock</p>
          <p className="text-2xl font-black text-sky-600 font-mono">{data.total_units}</p>
          <span className="text-[10px] text-slate-400">Total items across all inventory</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Out of Stock SKUs</p>
          <p className="text-2xl font-black text-rose-600">{data.out_of_stock_count}</p>
          <span className="text-[10px] text-slate-400">Products with 0 stock units</span>
        </div>
      </div>

      {data.low_stock_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 text-sm">
                {data.low_stock_count} products have reached minimum reorder threshold!
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                Restock these items to prevent orders from failing or getting backlogged.
              </p>
            </div>
          </div>
          <Link
            href="/products/low-stock"
            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-xs"
          >
            <span>View Low Stock Alerts</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
}
