'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { adminApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Users, Search, ShoppingBag, Eye, Ban, CheckCircle2, MapPin,
  Briefcase, ShieldCheck, Mail, Phone, Calendar, CreditCard,
  X, ChevronRight, RefreshCw, Filter, Tag, ArrowUpRight, DollarSign,
  Percent, AlertCircle, Save, Check, XCircle
} from 'lucide-react';

function CustomersContent() {
  const searchParams = useSearchParams();
  const urlRole = searchParams.get('role');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(urlRole || ''); // '' (all), 'customer', 'retailer', 'admin'
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modals / Drawers
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Reseller detail inputs inside drawer
  const [resellerDiscount, setResellerDiscount] = useState('');
  const [resellerCreditLimit, setResellerCreditLimit] = useState('');
  const [resellerBusinessName, setResellerBusinessName] = useState('');
  const [resellerGstin, setResellerGstin] = useState('');
  const [resellerPan, setResellerPan] = useState('');
  const [resellerAddress, setResellerAddress] = useState('');
  const [resellerStatus, setResellerStatus] = useState('approved');
  const [savingReseller, setSavingReseller] = useState(false);
  const [showResellerFormForCustomer, setShowResellerFormForCustomer] = useState(false);

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
    setShowResellerFormForCustomer(false);
    const res = await adminApi.get(`/users/${userId}`);
    if (res.success && res.data?.user) {
      const u = res.data.user;
      setSelectedUser(u);
      const rp = u.reseller_profile;
      setResellerDiscount(rp?.global_discount_value !== undefined ? String(rp.global_discount_value) : '');
      setResellerCreditLimit(rp?.credit_limit !== undefined ? String(rp.credit_limit) : '');
      setResellerBusinessName(rp?.business_name || u.name || '');
      setResellerGstin(rp?.gstin || u.gstin || '');
      setResellerPan(rp?.pan || '');
      setResellerAddress(rp?.address || '');
      setResellerStatus(rp?.status || (u.role === 'retailer' ? 'approved' : 'pending'));
    } else {
      toast.error('Failed to load user details');
      setIsDetailDrawerOpen(false);
    }
    setUserDetailLoading(false);
  }

  async function handleSaveResellerSettings(overrideStatus = null, rejectionReason = null) {
    if (!selectedUser) return;
    setSavingReseller(true);
    try {
      const statusToUse = overrideStatus || resellerStatus;
      const payload = {
        global_discount_value: parseFloat(resellerDiscount || 0),
        discount_type: 'percent',
        credit_limit: parseFloat(resellerCreditLimit || 0),
        business_name: resellerBusinessName,
        gstin: resellerGstin,
        pan: resellerPan,
        address: resellerAddress,
        status: statusToUse,
        ...(rejectionReason && { rejection_reason: rejectionReason })
      };

      const res = await adminApi.put(`/users/${selectedUser.id}/reseller-profile`, payload);
      if (res.success) {
        toast.success(res.message || 'Reseller profile & % discount saved successfully!');
        if (res.data?.reseller_profile) {
          const updatedRp = res.data.reseller_profile;
          setSelectedUser(prev => ({
            ...prev,
            role: statusToUse === 'approved' ? 'retailer' : prev.role,
            reseller_profile: updatedRp
          }));
          setResellerStatus(updatedRp.status);
          setResellerDiscount(String(updatedRp.global_discount_value || 0));
          setResellerCreditLimit(String(updatedRp.credit_limit || 0));
        }
        fetchUsers();
      } else {
        toast.error(res.message || 'Failed to update reseller settings');
      }
    } catch (err) {
      toast.error(err.message || 'Error updating reseller profile');
    } finally {
      setSavingReseller(false);
    }
  }

  async function handleApproveReseller() {
    await handleSaveResellerSettings('approved');
  }

  async function handleRejectReseller() {
    const reason = prompt('Please enter rejection reason for this reseller application:');
    if (reason === null) return;
    await handleSaveResellerSettings('rejected', reason);
  }

  async function handleSuspendReseller() {
    if (!confirm('Are you sure you want to suspend this reseller account? Their role will revert to regular customer.')) return;
    await handleSaveResellerSettings('suspended');
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
            Manage retail customers, wholesale reseller profiles, discount percentages, credits & accounts
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
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: #{u.id} • Registered {new Date(u.created_at).toLocaleDateString('en-IN')}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Reseller Discount % */}
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${
                            isReseller ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                            isAdmin ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                            'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}>
                            {isReseller ? <Briefcase size={12} /> : isAdmin ? <ShieldCheck size={12} /> : <Users size={12} />}
                            {u.role === 'retailer' ? 'Reseller / B2B' : u.role}
                          </span>
                          {isReseller && (
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                              <Percent size={10} />
                              {u.reseller_discount_pct !== null && u.reseller_discount_pct !== undefined
                                ? `${parseFloat(u.reseller_discount_pct)}% Discount`
                                : '0% Set'}
                            </span>
                          )}
                        </div>
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
                            title="View Full Profile Details & Reseller Settings"
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

      {/* ─── CUSTOMER DETAIL & RESELLER SETTINGS DRAWER ─────────────────────────── */}
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
                  <div className={`w-14 h-14 rounded-full text-white font-black text-xl flex items-center justify-center uppercase shadow ${
                    selectedUser.role === 'retailer' ? 'bg-purple-600' : 'bg-sky-600'
                  }`}>
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
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedUser.role === 'retailer' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {selectedUser.role === 'retailer' ? 'Reseller / Retailer' : selectedUser.role}
                      </span>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        selectedUser.status === 'banned' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── RESELLER ACCOUNT DETAIL & DISCOUNT % CONFIGURATION ─── */}
                {(selectedUser.role === 'retailer' || selectedUser.reseller_profile || showResellerFormForCustomer) ? (
                  <div className="space-y-4 bg-purple-50/60 p-5 rounded-2xl border-2 border-purple-200 shadow-sm">
                    <div className="flex items-center justify-between border-b border-purple-200 pb-3">
                      <div className="flex items-center gap-2">
                        <Briefcase className="text-purple-700" size={18} />
                        <h5 className="text-sm font-black text-purple-900">Reseller Account Details & %</h5>
                      </div>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        resellerStatus === 'approved' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        resellerStatus === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        resellerStatus === 'suspended' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {resellerStatus}
                      </span>
                    </div>

                    {/* Reseller Discount % Input */}
                    <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm space-y-2">
                      <label className="block text-xs font-black text-purple-900 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Percent size={14} className="text-purple-600" />
                          Reseller Wholesale Discount Percentage (%)
                        </span>
                        <span className="text-[10px] text-purple-600 font-normal">Off Base Price</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          placeholder="e.g. 15 for 15% margin/discount"
                          value={resellerDiscount}
                          onChange={(e) => setResellerDiscount(e.target.value)}
                          className="w-full pl-3 pr-10 py-2 border border-purple-200 rounded-xl text-sm font-bold text-purple-900 focus:outline-none focus:border-purple-600 bg-purple-50/20"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-black text-purple-600 text-xs">%</span>
                      </div>
                      {/* Presets */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-medium">Quick set:</span>
                        {[5, 10, 15, 20, 25, 30].map(pct => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setResellerDiscount(String(pct))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              resellerDiscount === String(pct)
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Credit Limit & Used */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Credit Limit (₹)</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="e.g. 50000"
                          value={resellerCreditLimit}
                          onChange={(e) => setResellerCreditLimit(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-purple-200 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Credit Used</span>
                        <span className="text-sm font-black text-purple-900">
                          ₹{parseFloat(selectedUser.reseller_profile?.credit_used || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Business Profile Details */}
                    <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-sm space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Name</label>
                        <input
                          type="text"
                          placeholder="e.g. ABC Retail Enterprises"
                          value={resellerBusinessName}
                          onChange={(e) => setResellerBusinessName(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">GSTIN</label>
                          <input
                            type="text"
                            placeholder="GSTIN Number"
                            value={resellerGstin}
                            onChange={(e) => setResellerGstin(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">PAN</label>
                          <input
                            type="text"
                            placeholder="PAN Number"
                            value={resellerPan}
                            onChange={(e) => setResellerPan(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:outline-none focus:border-purple-500"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Business Address</label>
                        <textarea
                          rows={2}
                          placeholder="Registered commercial address"
                          value={resellerAddress}
                          onChange={(e) => setResellerAddress(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Reseller Application Approval Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {resellerStatus !== 'approved' && (
                        <button
                          type="button"
                          onClick={handleApproveReseller}
                          disabled={savingReseller}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 size={14} />
                          Approve Reseller
                        </button>
                      )}
                      {resellerStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={handleRejectReseller}
                          disabled={savingReseller}
                          className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      )}
                      {resellerStatus === 'approved' && (
                        <button
                          type="button"
                          onClick={handleSuspendReseller}
                          disabled={savingReseller}
                          className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                        >
                          <Ban size={14} />
                          Suspend Reseller
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleSaveResellerSettings()}
                        disabled={savingReseller}
                        className="ml-auto px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                      >
                        <Save size={14} />
                        {savingReseller ? 'Saving...' : 'Save Reseller Details & %'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Convert to Reseller / Set Wholesale %</h5>
                      <p className="text-[11px] text-slate-500">Configure wholesale discount % and credit limit for this customer</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowResellerFormForCustomer(true)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                    >
                      <Briefcase size={12} />
                      Enable Reseller
                    </button>
                  </div>
                )}

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

export default function CustomersAndResellersPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Accounts...</div>}>
      <CustomersContent />
    </Suspense>
  );
}
