'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Search, Filter, CheckSquare } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('processing');

  async function loadOrders() {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    const res = await adminApi.get('/admin/orders', params);
    if (res.success) {
      setOrders(res.data?.orders || res.data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedOrderIds(orders.map((o) => o.id));
    else setSelectedOrderIds([]);
  };

  const handleToggleSelect = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkUpdate = async () => {
    if (selectedOrderIds.length === 0) return;
    if (!confirm(`Are you sure you want to update ${selectedOrderIds.length} orders to '${bulkStatus}'?`)) return;

    const res = await adminApi.post('/admin/orders/bulk-status', {
      order_ids: selectedOrderIds,
      status: bulkStatus
    });

    if (res.success) {
      alert(`Bulk update successful for ${selectedOrderIds.length} orders!`);
      setSelectedOrderIds([]);
      loadOrders();
    } else {
      alert(res.message || 'Bulk update failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Orders Management</h1>
          <p className="text-xs text-gray-500">Filter, inspect, and update order statuses across the platform</p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-gray-500 uppercase">Status Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bulk Status Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckSquare size={16} /> Selected {selectedOrderIds.length} orders for bulk action
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="border border-sky-300 rounded-lg px-2.5 py-1.5 text-xs bg-white"
            >
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={handleBulkUpdate}
              className="bg-sky-600 text-white font-bold text-xs px-4 py-1.5 rounded-lg hover:bg-sky-700 transition"
            >
              Apply Bulk Status Update
            </button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading orders catalog...</div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length === orders.length && orders.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer Name</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Grand Total</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.includes(o.id)}
                        onChange={() => handleToggleSelect(o.id)}
                      />
                    </td>
                    <td className="p-4 font-bold text-slate-900">{o.order_number}</td>
                    <td className="p-4 text-slate-700">{o.shipping_name || o.user_name || 'Customer'}</td>
                    <td className="p-4 text-slate-500 uppercase font-semibold">{o.placed_by_role || 'customer'}</td>
                    <td className="p-4"><StatusBadge status={o.status} /></td>
                    <td className="p-4 font-bold text-slate-900">₹{parseFloat(o.grand_total || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4 text-slate-400">{new Date(o.created_at || Date.now()).toLocaleDateString('en-IN')}</td>
                    <td className="p-4">
                      <Link href={`/orders/${o.id}`} className="text-sky-600 font-bold hover:underline">
                        Details & Tracking
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">No orders match the selected filter.</div>
        )}
      </div>
    </div>
  );
}
