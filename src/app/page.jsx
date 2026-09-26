'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import { Package, Briefcase, ShoppingBag, DollarSign, ArrowRight } from 'lucide-react';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [pendingResellers, setPendingResellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      const [ordRes, resRes] = await Promise.all([
        adminApi.get('/admin/orders', { limit: 10 }),
        adminApi.get('/admin/orders/reseller-pending')
      ]);

      if (ordRes.success) setOrders(ordRes.data?.orders || ordRes.data || []);
      if (resRes.success) setPendingResellers(resRes.data?.orders || resRes.data || []);
      setLoading(false);
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Executive Dashboard</h1>
        <p className="text-xs text-gray-500">Live platform operations overview</p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Total Orders</span>
            <Package size={18} className="text-sky-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{orders.length}</div>
        </div>

        <Link href="/orders/reseller-pending" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-500 transition space-y-2 block">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Pending Reseller Approvals</span>
            <Briefcase size={18} className="text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{pendingResellers.length}</div>
        </Link>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>Recent Orders Count</span>
            <ShoppingBag size={18} className="text-purple-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{orders.length}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
            <span>System Health</span>
            <DollarSign size={18} className="text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600">Active & Operational</div>
        </div>
      </div>

      {/* Orders Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-900 text-lg">Recent Platform Orders</h3>
          <Link href="/orders" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
            View All Orders &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-gray-400">Loading order feed...</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{o.order_number}</td>
                    <td className="p-4 text-slate-700">{o.shipping_name || o.user_name || 'Customer'}</td>
                    <td className="p-4 text-slate-500 uppercase font-semibold">{o.placed_by_role || 'customer'}</td>
                    <td className="p-4"><StatusBadge status={o.status} /></td>
                    <td className="p-4 font-bold text-slate-900">₹{parseFloat(o.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4">
                      <Link href={`/orders/${o.id}`} className="text-sky-600 font-bold hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-500">No recent orders.</div>
        )}
      </div>
    </div>
  );
}
