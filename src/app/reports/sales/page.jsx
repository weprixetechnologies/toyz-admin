'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BarChart3, Download, RefreshCw, ShoppingCart, DollarSign, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SalesReportPage() {
  const [data, setData] = useState({
    total_gmv: 0,
    total_orders: 0,
    avg_order_value: 0,
    rows: []
  });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/sales');
      if (res.success && res.data) {
        // Backend returns { summary: { net_gmv, total_orders }, daily_breakdown: [...] }
        const summary = res.data.summary || res.data;
        const gmv = parseFloat(summary.net_gmv ?? summary.total_gmv ?? 0);
        const orderCount = parseInt(summary.total_orders ?? 0, 10);
        const aov = orderCount > 0 ? (gmv / orderCount) : 0;

        const breakdown = Array.isArray(res.data.daily_breakdown)
          ? res.data.daily_breakdown.map((r) => ({
              period: r.date,
              order_count: r.orders_count,
              revenue: r.daily_revenue
            }))
          : Array.isArray(res.data.rows)
          ? res.data.rows
          : Array.isArray(res.data)
          ? res.data
          : [];

        setData({
          total_gmv: gmv,
          total_orders: orderCount,
          avg_order_value: aov,
          rows: breakdown
        });
      }
    } catch (err) {
      console.error('Error loading sales report:', err);
      toast.error('Failed to load sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const safeRows = Array.isArray(data.rows) ? data.rows : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 size={24} className="text-sky-600" />
            Sales Analytics & Revenue Report
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Gross merchandise value (GMV), order volume, and daily revenue breakdown.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : 'text-slate-400'} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => window.open(`${api.baseURL}/admin/reports/sales/export`, '_blank')}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Net GMV Revenue</span>
            <DollarSign size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{data.total_gmv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Total non-cancelled gross revenue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total Orders Placed</span>
            <ShoppingCart size={16} className="text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{data.total_orders}</p>
          <span className="text-[10px] text-slate-400">Lifetime orders count</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Average Order Value (AOV)</span>
            <TrendingUp size={16} className="text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₹{data.avg_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Mean basket checkout size</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Daily Sales Breakdown</h3>
          <span className="text-xs text-slate-400 font-mono">{safeRows.length} recorded days</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading report data...
          </div>
        ) : safeRows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No orders recorded yet. As orders are placed, daily GMV will populate here.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Date / Period</th>
                  <th className="p-4">Orders Count</th>
                  <th className="p-4 text-right">Daily Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-mono font-bold text-slate-800">
                      {row.date || row.period || '—'}
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {row.orders_count || row.order_count || 0} orders
                    </td>
                    <td className="p-4 font-bold text-emerald-700 font-mono text-sm text-right">
                      ₹{parseFloat(row.daily_revenue || row.revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
