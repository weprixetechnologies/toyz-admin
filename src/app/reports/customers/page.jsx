'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function CustomersReportPage() {
  const [data, setData] = useState({ total_customers: 0, new_this_month: 0, top_customers: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/customers');
        if (res.success) setData(res.data || { total_customers: 0, new_this_month: 0, top_customers: [] });
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
        <h1 className="text-2xl font-bold text-slate-800">Customer LTV & Segmentation Report</h1>
        <p className="text-slate-500 text-sm">Customer acquisition and highest value buyers</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Registered Customers</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_customers || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">New Registrations (This Month)</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{data.new_this_month || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="p-4 font-bold text-slate-800 border-b bg-slate-50 text-sm uppercase">Top Customers by Lifetime Value (LTV)</h2>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading top customers...</div>
        ) : (data.top_customers || []).length === 0 ? (
          <div className="p-8 text-center text-slate-500">No customer LTV data available.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Customer Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Total Orders</th>
                <th className="p-4">Total Spend (LTV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.top_customers.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{c.name}</td>
                  <td className="p-4 text-slate-600">{c.email}</td>
                  <td className="p-4 font-medium">{c.total_orders}</td>
                  <td className="p-4 font-bold text-emerald-700">₹{c.total_spend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
