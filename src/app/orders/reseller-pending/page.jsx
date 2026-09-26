'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import { Briefcase, ArrowRight } from 'lucide-react';

export default function ResellerPendingQueuePage() {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPending() {
      setLoading(true);
      const res = await adminApi.get('/admin/orders/reseller-pending');
      if (res.success) {
        setPendingOrders(res.data?.orders || res.data || []);
      }
      setLoading(false);
    }
    loadPending();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full inline-flex items-center gap-1 mb-2">
          <Briefcase size={12} /> Reseller Approval Workflows
        </span>
        <h1 className="text-3xl font-black text-slate-900">Reseller Pending Approval Queue</h1>
        <p className="text-xs text-gray-500">Orders placed by retail partners requiring per-line item approval</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading pending reseller queue...</div>
        ) : pendingOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Reseller Business</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{o.order_number}</td>
                    <td className="p-4 text-slate-700">{o.reseller_name || o.shipping_name || 'Retailer'}</td>
                    <td className="p-4"><StatusBadge status={o.status} /></td>
                    <td className="p-4 font-bold text-slate-900">₹{parseFloat(o.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <Link href={`/orders/${o.id}/approve`} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1">
                        Approve Items <ArrowRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">No reseller orders currently pending approval.</div>
        )}
      </div>
    </div>
  );
}
