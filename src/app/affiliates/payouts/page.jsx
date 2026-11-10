'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AffiliatePayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      // Try /affiliate/admin/payouts first, then fallback to /admin/affiliates/payouts
      let res = await api.get('/affiliate/admin/payouts');
      if (!res.success && res.status === 404) {
        res = await api.get('/admin/affiliates/payouts');
      }

      if (res.success && res.data) {
        const list = Array.isArray(res.data?.payouts)
          ? res.data.payouts
          : Array.isArray(res.data)
          ? res.data
          : [];
        setPayouts(list);
      } else {
        setPayouts([]);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
      toast.error('Failed to load payout requests');
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleProcess = async (id, action) => {
    if (!confirm(`Are you sure you want to mark this payout request as ${action}?`)) return;
    try {
      let res = await api.put(`/affiliate/admin/payouts/${id}`, { status: action });
      if (!res.success && res.status === 404) {
        res = await api.put(`/admin/affiliates/payouts/${id}`, { status: action });
      }

      if (res.success) {
        toast.success(`Payout marked as ${action}!`);
        fetchPayouts();
      } else {
        toast.error(res.message || 'Failed to update payout');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update payout');
    }
  };

  const safePayouts = Array.isArray(payouts) ? payouts : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/users/affiliates"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back to Affiliates
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Affiliate Payout Requests</h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Approve and process withdrawal payout requests from referral partners.
          </p>
        </div>

        <button
          onClick={fetchPayouts}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-sky-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading payout requests...
          </div>
        ) : safePayouts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Pending Payouts</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All affiliate commission balances are up to date. No withdrawal requests currently waiting.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Affiliate</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Details</th>
                  <th className="p-4">Requested Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safePayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">
                      {p.affiliate_name || `Affiliate #${p.affiliate_id}`}
                    </td>
                    <td className="p-4 font-bold text-emerald-700 font-mono text-sm">
                      ₹{p.amount}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">
                      {p.payment_details || 'UPI / Bank Transfer'}
                    </td>
                    <td className="p-4 text-slate-500">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-4 text-right">
                      {p.status === 'pending' && (
                        <div className="inline-flex gap-2 justify-end">
                          <button
                            onClick={() => handleProcess(p.id, 'paid')}
                            className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleProcess(p.id, 'rejected')}
                            className="bg-rose-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-rose-700 transition"
                          >
                            Reject
                          </button>
                        </div>
                      )}
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
