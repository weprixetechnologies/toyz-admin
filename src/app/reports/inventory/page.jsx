'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function InventoryReportPage() {
  const [data, setData] = useState({ total_items: 0, total_valuation: 0, out_of_stock_count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/inventory');
        if (res.success) setData(res.data || { total_items: 0, total_valuation: 0, out_of_stock_count: 0 });
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
        <h1 className="text-2xl font-bold text-slate-800">Inventory Valuation Report</h1>
        <p className="text-slate-500 text-sm">Stock asset value, item counts & depletion metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Stock Valuation</p>
          <p className="text-3xl font-bold text-emerald-700 mt-2">₹{data.total_valuation || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total SKUs in Catalog</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_items || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Out of Stock SKUs</p>
          <p className="text-3xl font-bold text-red-600 mt-2">{data.out_of_stock_count || 0}</p>
        </div>
      </div>
    </>
  );
}
