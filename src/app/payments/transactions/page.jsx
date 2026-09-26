'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function PaymentTransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTxns() {
      try {
        const res = await api.get('/admin/payments/transactions');
        if (res.success) setTxns(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTxns();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Transactions Log</h1>
          <p className="text-slate-500 text-sm">Audit log of all processed payment transactions and webhooks</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading transactions...</div>
        ) : txns.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No payment transactions recorded yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Transaction Ref</th>
                <th className="p-4">Order #</th>
                <th className="p-4">Gateway</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {txns.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-slate-800">{t.transaction_id || t.id}</td>
                  <td className="p-4 font-mono text-indigo-600">#{t.order_id}</td>
                  <td className="p-4 font-semibold text-slate-700 capitalize">{t.gateway_key || 'COD'}</td>
                  <td className="p-4 font-bold text-slate-800">₹{t.amount}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${t.status === 'success' || t.status === 'captured' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500">{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
