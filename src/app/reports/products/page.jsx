'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ProductsReportPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/products');
        if (res.success) setData(res.data || []);
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
        <h1 className="text-2xl font-bold text-slate-800">Product Sales & Revenue Report</h1>
        <p className="text-slate-500 text-sm">Top performing catalog items and revenue share</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading product report...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No product performance data available.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Product Name</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Units Sold</th>
                <th className="p-4">Total Revenue Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {data.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{p.name}</td>
                  <td className="p-4 font-mono text-slate-500">{p.sku || '-'}</td>
                  <td className="p-4 font-semibold">{p.units_sold || 0}</td>
                  <td className="p-4 font-bold text-emerald-700">₹{p.total_revenue || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
