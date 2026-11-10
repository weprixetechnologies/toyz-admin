'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Share2, RefreshCw, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AffiliatesReportPage() {
  const [data, setData] = useState({
    total_clicks: 0,
    total_conversions: 0,
    total_earned: 0,
    affiliates: []
  });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/affiliates');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          let clicks = 0;
          let conversions = 0;
          let earned = 0;

          res.data.forEach((a) => {
            clicks += parseInt(a.clicks || 0, 10);
            conversions += parseInt(a.conversions || 0, 10);
            earned += parseFloat(a.total_earned || 0);
          });

          setData({
            total_clicks: clicks,
            total_conversions: conversions,
            total_earned: earned,
            affiliates: res.data
          });
        } else {
          setData({
            total_clicks: res.data.total_clicks || 0,
            total_conversions: res.data.total_conversions || 0,
            total_earned: parseFloat(res.data.total_payouts_due || res.data.total_earned || 0),
            affiliates: res.data.top_affiliates || []
          });
        }
      }
    } catch (err) {
      console.error('Error loading affiliates report:', err);
      toast.error('Failed to load affiliates report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const safeAffiliates = Array.isArray(data.affiliates) ? data.affiliates : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Share2 size={24} className="text-sky-600" />
            Affiliate Program Performance Report
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Referral traffic, conversion rates, and accrued commission earnings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadReport}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : 'text-slate-400'} />
            <span>Refresh</span>
          </button>
          <Link
            href="/affiliates/payouts"
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <span>Payout Requests</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Referral Link Clicks</p>
          <p className="text-3xl font-black text-slate-900">{data.total_clicks}</p>
          <span className="text-[10px] text-slate-400">Unique clicks from affiliate referral links</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Converted Orders</p>
          <p className="text-3xl font-black text-indigo-600">{data.total_conversions}</p>
          <span className="text-[10px] text-slate-400">Completed purchases attributed to affiliates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Earned Commissions</p>
          <p className="text-3xl font-black text-emerald-700 font-mono">
            ₹{data.total_earned.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-[10px] text-slate-400">Total commissions credited to affiliates</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">Registered Referral Affiliates</h2>
          <span className="text-xs text-slate-400 font-mono">{safeAffiliates.length} partners</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading affiliate performance...
          </div>
        ) : safeAffiliates.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No affiliate performance records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Partner Name</th>
                  <th className="p-4">Referral Code</th>
                  <th className="p-4">Clicks</th>
                  <th className="p-4">Conversions</th>
                  <th className="p-4 text-right">Commission Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeAffiliates.map((a, i) => (
                  <tr key={a.id || i} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {a.full_name || a.user_name || a.name || `User #${a.user_id}`}
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600">
                      {a.referral_code || '—'}
                    </td>
                    <td className="p-4 font-medium">{a.clicks || 0}</td>
                    <td className="p-4 font-medium text-slate-700">{a.conversions || 0}</td>
                    <td className="p-4 font-bold text-emerald-700 font-mono text-sm text-right">
                      ₹{parseFloat(a.total_earned || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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
