'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SalesReportPage() {
  const [data, setData] = useState({ total_gmv: 0, total_orders: 0, avg_order_value: 0, rows: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/sales');
        if (res.success) setData(res.data || { total_gmv: 0, total_orders: 0, avg_order_value: 0, rows: [] });
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Analytics Report</h1>
          <p className="text-slate-500 text-sm">GMV, revenue breakdown & order metrics</p>
        </div>
        <button
          onClick={() => window.open(`${api.baseURL}/admin/reports/sales/export`, '_blank')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700"
        >
          Export CSV / Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Gross Merchandise Value (GMV)</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">₹{data.total_gmv || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Orders Processed</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_orders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Average Order Value (AOV)</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">₹{data.avg_order_value || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading report data...</div>
        ) : (data.rows || []).length === 0 ? (
          <div className="p-8 text-center text-slate-500">No sales data available for this timeframe.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Date / Period</th>
                <th className="p-4">Orders</th>
                <th className="p-4">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{row.date || row.period}</td>
                  <td className="p-4 font-medium">{row.order_count}</td>
                  <td className="p-4 font-bold text-emerald-700">₹{row.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
