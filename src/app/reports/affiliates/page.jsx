'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function AffiliatesReportPage() {
  const [data, setData] = useState({ total_clicks: 0, total_conversions: 0, total_payouts_due: 0, top_affiliates: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        const res = await api.get('/admin/reports/affiliates');
        if (res.success) setData(res.data || { total_clicks: 0, total_conversions: 0, total_payouts_due: 0, top_affiliates: [] });
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
        <h1 className="text-2xl font-bold text-slate-800">Affiliate Program Performance Report</h1>
        <p className="text-slate-500 text-sm">Conversion rates, clicks and commission metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Referral Clicks</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{data.total_clicks || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Total Conversions</p>
          <p className="text-3xl font-bold text-indigo-600 mt-2">{data.total_conversions || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Pending Payout Balance</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">₹{data.total_payouts_due || 0}</p>
        </div>
      </div>
    </>
  );
}
