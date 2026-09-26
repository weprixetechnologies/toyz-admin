'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function OrdersReportPage() {
  const [data, setData] = useState({ total_orders: 0, by_status: {}, cancellation_rate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/orders');
        if (res.success) setData(res.data || { total_orders: 0, by_status: {}, cancellation_rate: 0 });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, []);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Orders Analytics Report</h1>
        <p className="text-slate-500 text-sm">Status breakdown & cancellation statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Orders</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_orders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Cancellation Rate</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{data.cancellation_rate || 0}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Orders by Status</h2>
        {loading ? (
          <p className="text-slate-500">Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(data.by_status || {}).map(([status, count]) => (
              <div key={status} className="bg-slate-50 p-4 rounded-lg border">
                <p className="text-xs uppercase font-bold text-slate-500">{status}</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
