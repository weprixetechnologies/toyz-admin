'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

export default function AffiliatesListPage() {
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAffiliates() {
      try {
        const res = await api.get('/admin/affiliates');
        if (res.success) {
          const list = res.data?.affiliates || (Array.isArray(res.data) ? res.data : []);
          setAffiliates(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAffiliates();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Affiliate Partners & Program</h1>
          <p className="text-slate-500 text-sm">Manage registered referral affiliates & commission structures</p>
        </div>
        <Link
          href="/affiliates/payouts"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition"
        >
          Process Payout Requests
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading affiliates...</div>
        ) : affiliates.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No registered affiliates yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Affiliate Name</th>
                <th className="p-4">Referral Code</th>
                <th className="p-4">Total Clicks</th>
                <th className="p-4">Conversions</th>
                <th className="p-4">Earned Commission</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {affiliates.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{a.user_name || a.name || `User #${a.user_id}`}</td>
                  <td className="p-4 font-mono font-bold text-indigo-600">{a.referral_code}</td>
                  <td className="p-4">{a.clicks || 0}</td>
                  <td className="p-4 font-medium text-slate-700">{a.conversions || 0}</td>
                  <td className="p-4 font-bold text-emerald-700">₹{a.total_earned || 0}</td>
                  <td className="p-4">
                    <StatusBadge status={a.status || 'active'} />
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/users/affiliates/${a.id}`}
                      className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-100"
                    >
                      View & Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
