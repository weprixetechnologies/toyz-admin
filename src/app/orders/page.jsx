'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Search, CheckSquare, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

const inrFormatter = new Intl.NumberFormat('en-IN');
const dateFormatter = new Intl.DateTimeFormat('en-IN');

const OrderRow = memo(function OrderRow({ order, isSelected, onToggleSelect, onPrefetch }) {
  return (
    <tr
      className="hover:bg-slate-50/50"
      onMouseEnter={() => onPrefetch(order.id)}
    >
      <td className="p-4">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(order.id)}
        />
      </td>
      <td className="p-4 font-bold text-slate-900">{order.order_number}</td>
      <td className="p-4 text-slate-700">{order.shipping_name || order.user_name || 'Customer'}</td>
      <td className="p-4 text-slate-500 uppercase font-semibold">{order.placed_by_role || 'customer'}</td>
      <td className="p-4"><StatusBadge status={order.status} /></td>
      <td className="p-4"><StatusBadge status={order.payment_status || 'pending'} /></td>
      <td className="p-4 font-bold text-slate-900">
        ₹{inrFormatter.format(parseFloat(order.grand_total || 0))}
      </td>
      <td className="p-4 text-slate-400">
        {dateFormatter.format(new Date(order.created_at || Date.now()))}
      </td>
      <td className="p-4">
        <Link
          href={`/orders/${order.id}`}
          onFocus={() => onPrefetch(order.id)}
          className="text-sky-600 font-bold hover:underline"
        >
          Details & Tracking
        </Link>
      </td>
    </tr>
  );
});

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkStatus, setBulkStatus] = useState('processing');
  const abortRef = useRef(null);

  // Debounce search input to avoid flooding the API per keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async ({ forceFresh = false } = {}) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    if (debouncedSearch) params.search = debouncedSearch;

    // Stale-While-Revalidate: show cached data immediately if present
    const cached = !forceFresh ? adminApi.getCached('/admin/orders', params) : null;
    if (cached && cached.success && cached.data) {
      const cachedList = Array.isArray(cached.data.orders) ? cached.data.orders : [];
      setOrders(cachedList);
      if (cached.data.pagination) setPagination(cached.data.pagination);
      setLoading(false);
      setRefreshing(true);
    } else if (orders.length === 0) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const res = await adminApi.get('/admin/orders', params, {
      signal: controller.signal,
      skipCache: forceFresh
    });

    if (res?.aborted) return;

    if (res.success && res.data) {
      const list = Array.isArray(res.data.orders)
        ? res.data.orders
        : Array.isArray(res.data)
        ? res.data
        : [];
      setOrders(list);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } else if (!cached) {
      setOrders([]);
    }
    setLoading(false);
    setRefreshing(false);
  }, [statusFilter, debouncedSearch, page]);

  useEffect(() => {
    loadOrders();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadOrders]);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(1);
    setSelectedIds(new Set());
  };

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [orders]);

  const handleToggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handlePrefetchOrder = useCallback((id) => {
    adminApi.prefetch(`/admin/orders/${id}`);
  }, []);

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    if (!confirm(`Are you sure you want to update ${idsArray.length} orders to '${bulkStatus}'?`)) return;

    const res = await adminApi.post('/admin/orders/bulk-status', {
      order_ids: idsArray,
      status: bulkStatus
    });

    if (res.success) {
      alert(`Bulk update successful for ${idsArray.length} orders!`);
      setSelectedIds(new Set());
      loadOrders({ forceFresh: true });
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

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order #, customer, phone..."
              className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-xs bg-white w-56 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Status Filter:</label>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
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

          <button
            type="button"
            onClick={() => loadOrders({ forceFresh: true })}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition"
            title="Refresh orders"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin text-sky-600' : 'text-gray-400'} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Bulk Status Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-sky-50 p-4 rounded-xl border border-sky-200 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
            <CheckSquare size={16} /> Selected {selectedIds.size} orders for bulk action
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === orders.length && orders.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-4">Order #</th>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4">Grand Total</th>
                    <th className="p-4">Date</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((o) => (
                    <OrderRow
                      key={o.id}
                      order={o}
                      isSelected={selectedIds.has(o.id)}
                      onToggleSelect={handleToggleSelect}
                      onPrefetch={handlePrefetchOrder}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
                  <span className="font-bold text-slate-900">{pagination.pages}</span> ({pagination.total} total orders)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    type="button"
                    disabled={page >= pagination.pages}
                    onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold disabled:opacity-40 hover:bg-slate-50"
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">No orders match the selected filter.</div>
        )}
      </div>
    </div>
  );
}
