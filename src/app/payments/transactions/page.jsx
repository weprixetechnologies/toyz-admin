'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { CreditCard, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PaymentTransactionsPage() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTxns = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/payments/transactions');
      if (res.success && res.data) {
        const list = Array.isArray(res.data?.transactions)
          ? res.data.transactions
          : Array.isArray(res.data)
          ? res.data
          : [];
        setTxns(list);
      } else {
        setTxns([]);
      }
    } catch (err) {
      console.error('Error loading payment transactions:', err);
      toast.error('Failed to load transaction log');
      setTxns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTxns();
  }, []);

  const safeTxns = Array.isArray(txns) ? txns : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard size={24} className="text-sky-600" />
            Payment Transactions Log
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Audit log of all processed payment transactions, webhooks & gateway statuses.
          </p>
        </div>

        <button
          onClick={loadTxns}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : 'text-slate-400'} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading transaction logs...
          </div>
        ) : safeTxns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No payment transactions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Transaction Ref</th>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Gateway</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {t.transaction_id || t.id}
                    </td>
                    <td className="p-4 font-mono text-sky-600 font-bold">#{t.order_id}</td>
                    <td className="p-4 font-semibold text-slate-700 capitalize">
                      {t.gateway || t.gateway_key || 'COD'}
                    </td>
                    <td className="p-4 font-bold text-slate-900 font-mono">
                      ₹{parseFloat(t.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          t.status === 'success' || t.status === 'captured'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'failed' || t.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {t.created_at ? new Date(t.created_at).toLocaleString() : '—'}
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
