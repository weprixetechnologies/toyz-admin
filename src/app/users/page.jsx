'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Users, Search, ShoppingBag, Eye, Ban, CheckCircle2, MapPin,
  Briefcase, ShieldCheck, Mail, Phone, Calendar, CreditCard,
  X, ChevronRight, RefreshCw, Filter, Tag, ArrowUpRight, DollarSign
} from 'lucide-react';

export default function CustomersAndResellersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(''); // '' (all), 'customer', 'retailer', 'admin'
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals / Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Orders Modal State
  const [ordersModalUser, setOrdersModalUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [userOrdersSummary, setUserOrdersSummary] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, page]);

  async function fetchUsers() {
    setLoading(true);
    const params = {
      page,
      limit: 25,
      ...(roleFilter && { role: roleFilter }),
      ...(statusFilter && { status: statusFilter }),
      ...(search && { search: search.trim() })
    };

    const res = await adminApi.get('/users', params);
    if (res.success) {
      setUsers(res.data?.users || []);
      setTotalCount(res.data?.pagination?.total || 0);
      setTotalPages(res.data?.pagination?.pages || 1);
    } else {
      toast.error(res.message || 'Failed to fetch customer list');
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  async function handleViewCustomerDetails(userId) {
    setIsDetailDrawerOpen(true);
    setUserDetailLoading(true);
    const res = await adminApi.get(`/users/${userId}`);
    if (res.success) {
      setSelectedUser(res.data?.user || null);
    } else {
      toast.error('Failed to load user details');
      setIsDetailDrawerOpen(false);
    }
    setUserDetailLoading(false);
  }

  async function handleFetchAccountOrders(userId, userName, userEmail, userRole) {
    setOrdersModalUser({ id: userId, name: userName, email: userEmail, role: userRole });
    setOrdersLoading(true);
    setUserOrders([]);
    setUserOrdersSummary(null);

    const res = await adminApi.get(`/users/${userId}/orders`);
    if (res.success) {
      setUserOrders(res.data?.orders || []);
      setUserOrdersSummary({
        total_orders: res.data?.total_orders || 0,
        total_spent: res.data?.total_spent || 0
      });
    } else {
      toast.error(res.message || 'Failed to fetch user account orders');
    }
    setOrdersLoading(false);
  }

  async function handleBanUser(userId, currentStatus) {
    const action = currentStatus === 'banned' ? 'unban' : 'ban';
    if (!confirm(`Are you sure you want to ${action} this account?`)) return;

    let res;
    if (currentStatus === 'banned') {
      res = await adminApi.put(`/users/${userId}`, { status: 'active' });
    } else {
      res = await adminApi.post(`/users/${userId}/ban`);
    }

    if (res.success) {
      toast.success(`User ${action}ned successfully`);
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, status: currentStatus === 'banned' ? 'active' : 'banned' }));
      }
    } else {
      toast.error(res.message || `Failed to ${action} user`);
    }
  }

  async function handleChangeRole(userId, newRole) {
    if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

    const res = await adminApi.put(`/users/${userId}`, { role: newRole });
    if (res.success) {
      toast.success('User role updated successfully');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => ({ ...prev, role: newRole }));
      }
    } else {
      toast.error(res.message || 'Failed to update role');
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="text-sky-600" /> Customers & Account Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Overview of all registered retail customers, reseller profiles, and administrative accounts
          </p>
        </div>
      </div>

      {/* Role Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { label: 'All Accounts', value: '' },
          { label: 'Retail Customers', value: 'customer' },
          { label: 'Resellers & Retailers', value: 'retailer' },
          { label: 'Admins & Staff', value: 'admin' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setRoleFilter(tab.value); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              roleFilter === tab.value
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Status Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or GSTIN..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 font-medium"
            />
          </div>
          <button
            type="submit"
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={14} />
            <span className="font-semibold">Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="p-2 border border-slate-200 rounded-xl text-xs bg-white font-semibold focus:outline-none focus:border-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Accounts</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Main Customers / Resellers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">Fetching accounts...</div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Customer Info</th>
                  <th className="p-4">Role / Type</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Orders & Spend</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-center">Fetch Orders</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isReseller = u.role === 'retailer';
                  const isAdmin = u.role === 'admin' || u.role === 'superadmin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      {/* Customer Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm uppercase shadow-sm ${
                            isReseller ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            isAdmin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}>
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              u.name?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              {u.name}
                              {u.gstin && (
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono" title={`GSTIN: ${u.gstin}`}>
                                  GST
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">ID: #{u.id} • Registered {new Date(u.created_at).toLocaleDateString('en-IN')}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                          isReseller ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                          isAdmin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          'bg-sky-100 text-sky-800 border border-sky-200'
                        }`}>
                          {isReseller ? <Briefcase size={12} /> : isAdmin ? <ShieldCheck size={12} /> : <Users size={12} />}
                          {u.role === 'retailer' ? 'Reseller / B2B' : u.role}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="p-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Mail size={12} className="text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                            <Phone size={12} className="text-slate-400" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Orders & Spend */}
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{u.total_orders || 0} Orders</div>
                        <div className="text-[11px] font-bold text-emerald-700">
                          ₹{parseFloat(u.total_spend || 0).toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          u.status === 'banned' ? 'bg-red-100 text-red-800 border border-red-200' :
                          u.status === 'inactive' ? 'bg-slate-100 text-slate-500' :
                          'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {u.status || 'active'}
                        </span>
                      </td>

                      {/* FETCH ORDERS BUTTON */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleFetchAccountOrders(u.id, u.name, u.email, u.role)}
                          className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition transform active:scale-95"
                          title="Fetch all orders for this customer"
                        >
                          <ShoppingBag size={14} />
                          <span>Fetch Orders</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewCustomerDetails(u.id)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="View Full Profile Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleBanUser(u.id, u.status)}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === 'banned'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-50 text-red-600 hover:bg-red-100'
                            }`}
                            title={u.status === 'banned' ? 'Unban User' : 'Ban User'}
                          >
                            <Ban size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-slate-400">No customer accounts found matching your search.</div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Page {page} of {totalPages} ({totalCount} Total Accounts)</span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── FETCH ORDERS MODAL ─────────────────────────────────────────────────── */}
      {ordersModalUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                  <ShoppingBag size={22} />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white flex items-center gap-2">
                    Orders Feed — {ordersModalUser.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {ordersModalUser.email} • ID #{ordersModalUser.id} ({ordersModalUser.role})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOrdersModalUser(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {/* Account Orders Metrics Banner */}
              {userOrdersSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Orders</span>
                    <span className="text-lg font-black text-slate-900">{userOrdersSummary.total_orders} Orders</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Account Spend</span>
                    <span className="text-lg font-black text-emerald-700">₹{parseFloat(userOrdersSummary.total_spent || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Average Order Value</span>
                    <span className="text-lg font-black text-sky-700">
                      ₹{userOrdersSummary.total_orders > 0
                        ? Math.round(userOrdersSummary.total_spent / userOrdersSummary.total_orders).toLocaleString('en-IN')
                        : 0}
                    </span>
                  </div>
                </div>
              )}

              {/* Orders List Table */}
              {ordersLoading ? (
                <div className="p-12 text-center text-xs text-slate-400 font-semibold flex flex-col items-center justify-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-sky-600" />
                  Fetching order records for this user...
                </div>
              ) : userOrders.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-3">Order Number</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Items Summary</th>
                        <th className="p-3">Payment</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Grand Total</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {userOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3 font-mono font-bold text-sky-600">
                            {ord.order_number}
                          </td>
                          <td className="p-3 text-slate-500 font-medium">
                            {new Date(ord.created_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{ord.items_count || ord.items?.length || 0} Products</div>
                            <div className="text-[10px] text-slate-400 line-clamp-1">
                              {ord.items?.map(i => i.product_name).join(', ')}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ord.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.payment_status || 'pending'}
                            </span>
                            <div className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">{ord.payment_method || 'COD'}</div>
                          </td>
                          <td className="p-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              ord.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                              ord.status === 'shipped' ? 'bg-sky-100 text-sky-800' :
                              ord.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 text-sm">
                            ₹{parseFloat(ord.grand_total || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center">
                            <Link
                              href={`/orders/${ord.id}`}
                              className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-800 font-bold text-xs hover:underline"
                              target="_blank"
                            >
                              <span>View Order</span>
                              <ArrowUpRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No orders found for this account.
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setOrdersModalUser(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER DETAIL DRAWER / MODAL ────────────────────────────────────── */}
      {isDetailDrawerOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-end">
          <div className="bg-white w-full max-w-xl h-full flex flex-col shadow-2xl overflow-hidden border-l border-slate-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Users size={18} className="text-sky-600" /> Account Profile Details
              </h3>
              <button
                onClick={() => setIsDetailDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body */}
            {userDetailLoading ? (
              <div className="p-12 text-center text-xs text-slate-400 font-medium">Loading user details...</div>
            ) : selectedUser ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* User Header Profile */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="w-14 h-14 rounded-full bg-sky-600 text-white font-black text-xl flex items-center justify-center uppercase shadow">
                    {selectedUser.avatar ? (
                      <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      selectedUser.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 text-lg">{selectedUser.name}</h4>
                    <div className="text-xs text-slate-500 font-medium">{selectedUser.email}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full">
                        {selectedUser.role}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedUser.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
                    <span className="text-[10px] font-bold text-sky-700 uppercase block">Total Orders</span>
                    <span className="text-xl font-black text-sky-900">{selectedUser.total_orders || 0}</span>
                  </div>
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase block">Total Spend</span>
                    <span className="text-xl font-black text-emerald-900">₹{parseFloat(selectedUser.total_spend || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Contact & Identifiers */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Identifiers</h5>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Phone Number:</span>
                      <span className="font-bold text-slate-900">{selectedUser.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">GSTIN:</span>
                      <span className="font-mono font-bold text-slate-900">{selectedUser.gstin || 'None'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Referral Code:</span>
                      <span className="font-mono font-bold text-sky-600">{selectedUser.referral_code || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Registration Date:</span>
                      <span className="font-bold text-slate-900">{new Date(selectedUser.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role Management</h5>
                  <div className="text-xs">
                    <label className="block text-slate-500 mb-1">Change User Role:</label>
                    <select
                      value={selectedUser.role || 'customer'}
                      onChange={(e) => handleChangeRole(selectedUser.id, e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-slate-50 font-semibold focus:outline-none focus:border-sky-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="retailer">Reseller / Retailer</option>
                      <option value="admin">Admin</option>
                      <option value="superadmin">Superadmin</option>
                      <option value="inventory_manager">Inventory Manager</option>
                      <option value="support_agent">Support Agent</option>
                    </select>
                  </div>
                </div>

                {/* Reseller Profile details if applicable */}
                {selectedUser.reseller_profile && (
                  <div className="space-y-3 bg-purple-50/50 p-4 rounded-xl border border-purple-200">
                    <h5 className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Briefcase size={14} /> Reseller Profile Details
                    </h5>
                    <div className="text-xs space-y-2">
                      <div className="flex justify-between border-b border-purple-100 pb-2">
                        <span className="text-purple-700">Business Name:</span>
                        <span className="font-bold text-purple-900">{selectedUser.reseller_profile.business_name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b border-purple-100 pb-2">
                        <span className="text-purple-700">Approval Status:</span>
                        <span className="font-bold uppercase text-purple-900">{selectedUser.reseller_profile.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-purple-700">Credit Limit / Used:</span>
                        <span className="font-bold text-purple-900">₹{selectedUser.reseller_profile.credit_used} / ₹{selectedUser.reseller_profile.credit_limit}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Saved User Addresses */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Shipping Addresses</h5>
                  {selectedUser.addresses?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.addresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                          <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                            <span>{addr.label || 'Address'} — {addr.name} ({addr.phone})</span>
                            {addr.is_default ? (
                              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">Default</span>
                            ) : null}
                          </div>
                          <div className="text-slate-600">
                            {addr.line1}, {addr.line2 ? `${addr.line2}, ` : ''}{addr.city}, {addr.state} - {addr.pin_code}, {addr.country}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">No saved addresses</div>
                  )}
                </div>

                {/* Primary Action Button inside Drawer */}
                <button
                  onClick={() => {
                    setIsDetailDrawerOpen(false);
                    handleFetchAccountOrders(selectedUser.id, selectedUser.name, selectedUser.email, selectedUser.role);
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={16} />
                  <span>Fetch All Account Orders</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
