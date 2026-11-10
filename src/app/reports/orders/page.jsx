'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrdersReportPage() {
  const [data, setData] = useState({ total_orders: 0, by_status: {}, cancellation_rate: 0 });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/orders');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          // Backend returns array [{ status, count, total_value }]
          const statusMap = {};
          let total = 0;
          let cancelled = 0;
          res.data.forEach((item) => {
            const count = parseInt(item.count || 0, 10);
            statusMap[item.status] = count;
            total += count;
            if (item.status === 'cancelled') cancelled += count;
          });
          const cancelRate = total > 0 ? ((cancelled / total) * 100).toFixed(1) : 0;
          setData({
            total_orders: total,
            by_status: statusMap,
            cancellation_rate: cancelRate
          });
        } else {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error('Error loading orders report:', err);
      toast.error('Failed to load orders report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const statusEntries = Object.entries(data.by_status || {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package size={24} className="text-sky-600" />
            Orders Analytics & Status Breakdown
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Status distribution, completion pipeline & cancellation metrics.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Orders in System</p>
          <p className="text-3xl font-black text-slate-900">{data.total_orders || 0}</p>
          <span className="text-[10px] text-slate-400">All historical orders</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Cancellation Rate</p>
          <p className="text-3xl font-black text-rose-600">{data.cancellation_rate || 0}%</p>
          <span className="text-[10px] text-slate-400">Ratio of cancelled orders</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Orders Breakdown by Workflow Status
        </h2>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            <RefreshCw size={16} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading status breakdown...
          </div>
        ) : statusEntries.length === 0 ? (
          <p className="text-xs text-slate-500 p-4">No order records found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {statusEntries.map(([status, count]) => (
              <div key={status} className="bg-slate-50/80 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">
                  {status}
                </p>
                <p className="text-2xl font-black text-slate-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
