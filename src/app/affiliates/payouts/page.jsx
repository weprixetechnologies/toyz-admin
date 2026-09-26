'use client';
import { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

export default function AffiliatePayoutsPage() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayouts = async () => {
    try {
      const res = await api.get('/admin/affiliates/payouts');
      if (res.success) setPayouts(res.data || []);
    } catch (err) {
      console.error(err);
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
      const res = await api.put(`/admin/affiliates/payouts/${id}`, { status: action });
      if (res.success) fetchPayouts();
    } catch (err) {
      alert(err.message || 'Failed to update payout');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Affiliate Payout Requests</h1>
          <p className="text-slate-500 text-sm">Approve and process withdrawal payout requests from affiliates</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading payout requests...</div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No payout requests found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Affiliate</th>
                <th className="p-4">Amount Requested</th>
                <th className="p-4">Payment Details</th>
                <th className="p-4">Requested Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{p.affiliate_name || `ID #${p.affiliate_id}`}</td>
                  <td className="p-4 font-bold text-emerald-700">₹{p.amount}</td>
                  <td className="p-4 text-slate-600">{p.payment_details || 'UPI / Bank Transfer'}</td>
                  <td className="p-4 text-slate-500">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-4">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="p-4">
                    {p.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProcess(p.id, 'paid')}
                          className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => handleProcess(p.id, 'rejected')}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-700"
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
        )}
      </div>
    </>
  );
}
