'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { adminApi, downloadAdminFile } from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import { Package, Download, Truck, Edit2, Check, AlertCircle, Plus, Save, MapPin, User, Phone, CreditCard, Trash2, Calendar, ExternalLink, X } from 'lucide-react';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentStatusUpdating, setPaymentStatusUpdating] = useState(false);

  const [editItemId, setEditItemId] = useState(null);
  const [editShipping, setEditShipping] = useState(false);
  const [shippingInput, setShippingInput] = useState(0);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [carrier, setCarrier] = useState('Express Logistics');
  const [trackingNum, setTrackingNum] = useState('');
  const [selectedShipQty, setSelectedShipQty] = useState({});

  // Payment Tracker & Split Payments State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [adminRemarks, setAdminRemarks] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [downloadingSlip, setDownloadingSlip] = useState(false);
  const abortRef = useRef(null);

  const loadDetail = useCallback(async ({ forceFresh = false } = {}) => {
    if (!id) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const endpoint = `/admin/orders/${id}`;
    const cached = !forceFresh ? adminApi.getCached(endpoint) : null;
    if (cached && cached.success && cached.data) {
      setOrderData(cached.data);
      setStatus(cached.data.order?.status || 'pending');
      setPaymentStatus(cached.data.order?.payment_status || 'pending');
      setLoading(false);
    } else if (!orderData) {
      setLoading(true);
    }

    const res = await adminApi.get(endpoint, {}, {
      signal: controller.signal,
      skipCache: forceFresh
    });
    if (res?.aborted) return;

    if (res.success && res.data) {
      setOrderData(res.data);
      setStatus(res.data.order?.status || 'pending');
      setPaymentStatus(res.data.order?.payment_status || 'pending');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) loadDetail();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [id, loadDetail]);

  if (loading) return <div className="p-12 text-center text-xs text-gray-400">Loading order detail...</div>;
  if (!orderData || !orderData.order) return <div className="p-12 text-center text-xs text-gray-500">Order not found.</div>;

  const { order, items = [], shipments = [], payments = [], payment_summary = {} } = orderData;
  const grandTotal = parseFloat(order?.grand_total || 0);
  const totalPaid = payment_summary.total_paid !== undefined ? payment_summary.total_paid : payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
  const pendingAmount = payment_summary.payment_pending !== undefined ? payment_summary.payment_pending : Math.max(0, grandTotal - totalPaid);
  const percentCollected = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;

  const handleOpenAddPayment = () => {
    setEditingPayment(null);
    setPaymentAmount(pendingAmount > 0 ? pendingAmount.toString() : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setAdminRemarks('');
    setProofUrl('');
    setShowPaymentModal(true);
  };

  const handleOpenEditPayment = (p) => {
    setEditingPayment(p);
    setPaymentAmount(p.amount ? p.amount.toString() : '');
    setPaymentDate(p.payment_date ? p.payment_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setAdminRemarks(p.admin_remarks || '');
    setProofUrl(p.proof_url || '');
    setShowPaymentModal(true);
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProof(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const filename = `proof-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const res = await adminApi.post(`/storage/upload?key=${encodeURIComponent(`orders/payments/${filename}`)}&contentType=${encodeURIComponent(file.type)}`, {});

      if (res.success && res.data?.uploadUrl) {
        const fullUploadUrl = res.data.uploadUrl.startsWith('http')
          ? res.data.uploadUrl
          : adminApi.baseURL.replace('/api/v1', '') + res.data.uploadUrl;

        const uploadRes = await fetch(fullUploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (uploadRes.ok) {
          const publicUrl = res.data.fileUrl || res.data.publicUrl || res.data.url;
          setProofUrl(publicUrl);
          alert('Proof document uploaded successfully');
        } else {
          alert('Proof direct upload failed. Please try again.');
        }
      } else {
        alert(res.message || 'Failed to initialize proof upload');
      }
    } catch (err) {
      alert(err.message || 'Upload error');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(paymentAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Please enter a valid positive payment amount');
      return;
    }

    setSubmittingPayment(true);
    try {
      const payload = {
        amount: parsedAmount,
        payment_date: paymentDate || new Date().toISOString().slice(0, 10),
        admin_remarks: adminRemarks,
        proof_url: proofUrl || null
      };

      const res = editingPayment
        ? await adminApi.put(`/admin/orders/${id}/payments/${editingPayment.id}`, payload)
        : await adminApi.post(`/admin/orders/${id}/payments`, payload);

      if (res.success) {
        alert(editingPayment ? 'Payment split updated successfully' : 'Payment split recorded successfully');
        setShowPaymentModal(false);
        loadDetail({ forceFresh: true });
      } else {
        alert(res.message || 'Failed to save payment split');
      }
    } catch (err) {
      alert(err.message || 'Payment submission error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this payment split record?')) return;
    const res = await adminApi.delete(`/admin/orders/${id}/payments/${paymentId}`);
    if (res.success) {
      alert('Payment split record deleted');
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Failed to delete payment split');
    }
  };


  const handleUpdateShipping = async () => {
    if (!confirm('Are you sure you want to update the shipping cost? This will recalculate the grand total.')) return;
    const res = await adminApi.put(`/admin/orders/${id}/shipping`, { shipping_cost: shippingInput });
    if (res.success) {
      alert('Shipping cost updated successfully');
      setEditShipping(false);
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Failed to update shipping cost');
    }
  };

  const handleUpdateStatus = async () => {
    setStatusUpdating(true);
    const res = await adminApi.put(`/admin/orders/${id}/status`, { status });
    if (res.success) {
      setOrderData((prev) => prev ? { ...prev, order: { ...prev.order, status } } : prev);
      alert(`Order status updated to '${status}'`);
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Status update failed');
    }
    setStatusUpdating(false);
  };

  const handleUpdatePaymentStatus = async () => {
    setPaymentStatusUpdating(true);
    const res = await adminApi.put(`/admin/orders/${id}/payment-status`, { payment_status: paymentStatus });
    if (res.success) {
      setOrderData((prev) => prev ? { ...prev, order: { ...prev.order, payment_status: paymentStatus } } : prev);
      alert(`Payment status updated to '${paymentStatus}'`);
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Payment status update failed');
    }
    setPaymentStatusUpdating(false);
  };

  const handleSaveItem = async (itemId) => {
    const res = await adminApi.put(`/admin/orders/${id}/items/${itemId}`, {
      admin_unit_price: parseFloat(editPrice || 0),
      qty_approved: parseInt(editQty || 0, 10)
    });
    if (res.success) {
      setEditItemId(null);
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Failed to update item quantity & price');
    }
  };

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    const shipmentItems = Object.keys(selectedShipQty)
      .filter((itemId) => selectedShipQty[itemId] > 0)
      .map((itemId) => ({
        order_item_id: parseInt(itemId, 10),
        qty: selectedShipQty[itemId],
        qty_shipped: selectedShipQty[itemId]
      }));

    if (shipmentItems.length === 0) {
      alert('Please select at least one item quantity to ship.');
      return;
    }

    const res = await adminApi.post(`/admin/orders/${id}/shipments`, {
      carrier: carrier,
      tracking_carrier: carrier,
      tracking_number: trackingNum,
      items: shipmentItems
    });

    if (res.success) {
      alert('Shipment dispatch recorded successfully!');
      setShowShipmentModal(false);
      loadDetail({ forceFresh: true });
    } else {
      alert(res.message || 'Failed to create shipment');
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      await downloadAdminFile(`/admin/orders/${order.id}/invoice`, `Invoice-${order.order_number || order.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleDownloadPackingSlip = async () => {
    try {
      setDownloadingSlip(true);
      await downloadAdminFile(`/admin/orders/${order.id}/packing-slip`, `PackingSlip-${order.order_number || order.id}.pdf`);
    } catch (err) {
      alert(err.message || 'Failed to download packing slip');
    } finally {
      setDownloadingSlip(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-slate-900">{order.order_number}</h1>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order:</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment:</span>
              <StatusBadge status={order.payment_status || 'pending'} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed: {new Date(order.created_at || Date.now()).toLocaleString('en-IN')} | Role: <span className="font-bold uppercase">{order.placed_by_role}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-bold"
            >
              <option value="pending">Order: pending</option>
              <option value="pending_approval">Order: pending_approval</option>
              <option value="processing">Order: processing</option>
              <option value="partially_shipped">Order: partially_shipped</option>
              <option value="shipped">Order: shipped</option>
              <option value="delivered">Order: delivered</option>
              <option value="cancelled">Order: cancelled</option>
            </select>
            <button
              onClick={handleUpdateStatus}
              disabled={statusUpdating}
              className="bg-slate-900 text-white font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-sky-600 transition"
            >
              Update Order
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-bold"
            >
              <option value="pending">Payment: pending</option>
              <option value="paid">Payment: paid</option>
              <option value="partially_paid">Payment: partially_paid</option>
              <option value="failed">Payment: failed</option>
              <option value="refunded">Payment: refunded</option>
            </select>
            <button
              onClick={handleUpdatePaymentStatus}
              disabled={paymentStatusUpdating}
              className="bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Update Payment
            </button>
          </div>
        </div>
      </div>


      {/* Customer, Address & Payment Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="text-sky-600" size={16} /> Customer Details
          </h3>
          <div className="text-sm text-slate-600 space-y-1.5">
            <p><span className="font-semibold text-slate-800">Name:</span> {order?.shipping_name || order?.billing_name || 'N/A'}</p>
            <p className="flex items-center gap-1"><Phone size={14} className="text-slate-400" /> <span className="font-semibold text-slate-800">Phone:</span> {order?.shipping_phone || 'N/A'}</p>
            {order?.billing_gstin && <p><span className="font-semibold text-slate-800">GSTIN:</span> <span className="uppercase font-mono">{order?.billing_gstin}</span></p>}
            <p><span className="font-semibold text-slate-800">Role:</span> <span className="uppercase text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{order?.placed_by_role || 'Customer'}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="text-sky-600" size={16} /> Shipping Address
          </h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p className="font-medium text-slate-800">{order?.shipping_name || 'Recipient'}</p>
            <p>{order?.shipping_line1}</p>
            {order?.shipping_line2 && <p>{order?.shipping_line2}</p>}
            <p>{order?.shipping_city}, {order?.shipping_state} {order?.shipping_pin}</p>
            <p>{order?.shipping_country || 'India'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="text-sky-600" size={16} /> Payment & Billing
          </h3>
          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Payment Status:</span>
              <StatusBadge status={order?.payment_status || 'pending'} />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Method:</span>
              <span className="font-bold text-slate-900 uppercase text-xs bg-slate-100 px-2 py-0.5 rounded">
                {order?.payment_method || (order?.is_cod ? 'COD' : 'Online')}
              </span>
            </div>
            {order?.payment_gateway && (
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Gateway:</span>
                <span className="font-medium text-slate-700 capitalize text-xs">{order.payment_gateway}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Ref / Txn ID:</span>
              <span className="font-mono text-xs text-slate-700 truncate max-w-[140px]" title={order?.payment_ref || 'N/A'}>
                {order?.payment_ref || 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Paid At:</span>
              <span className="text-xs text-slate-700">
                {order?.paid_at ? new Date(order.paid_at).toLocaleString('en-IN') : 'Not paid'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Order Items, Quantities & Unit Pricing</h3>
              <span className="text-xs text-gray-400 font-semibold">Click Edit icon to adjust quantity or unit price</span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {items.map((item) => {
                const qtyApproved = item.qty_approved !== null ? item.qty_approved : item.qty_ordered;
                const isRejected = item.status === 'rejected' || qtyApproved === 0;
                const isEditing = editItemId === item.id;

                return (
                  <div key={item.id} className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isRejected ? 'bg-red-50/60 p-3 rounded-xl border border-red-100' : ''}`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-bold ${isRejected ? 'line-through text-red-700' : 'text-slate-900'}`}>{item.product_name}</h4>
                        {item.status && <StatusBadge status={item.status} />}
                      </div>
                      <p className="text-gray-400">SKU: {item.sku} | Ordered: <span className="font-bold text-slate-700">{item.qty_ordered} pcs</span> | Approved: <span className="font-bold text-slate-900">{qtyApproved} pcs</span></p>
                    </div>

                    <div className="flex items-center gap-4">
                      {isEditing ? (
                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-300">
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block">Approved Qty</label>
                            <input
                              type="number"
                              min="0"
                              max={item.qty_ordered}
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value)}
                              className="w-16 p-1 border border-gray-300 rounded text-xs text-center font-bold bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase block">Unit Price (₹)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="w-24 p-1 border border-gray-300 rounded text-xs font-bold bg-white"
                            />
                          </div>
                          <div className="flex items-center gap-1 pt-3">
                            <button
                              onClick={() => handleSaveItem(item.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
                              title="Save Quantity & Price"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditItemId(null)}
                              className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-bold text-slate-900 block">₹{parseFloat(item.admin_unit_price || item.unit_price).toLocaleString('en-IN')} / unit</span>
                            <span className="text-[10px] text-gray-400">Total: ₹{parseFloat(item.line_total || 0).toLocaleString('en-IN')}</span>
                          </div>
                          <button
                            onClick={() => {
                              setEditItemId(item.id);
                              setEditPrice(item.admin_unit_price !== null && item.admin_unit_price !== undefined ? item.admin_unit_price : item.unit_price);
                              setEditQty(qtyApproved);
                            }}
                            className="p-2 bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 rounded-lg transition"
                            title="Edit Approved Quantity & Unit Price"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Tracker (Split Payments Manager) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <CreditCard className="text-emerald-600" size={18} /> Payment Tracker (Split Payments)
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Track outside-the-website payments and split installments (NEFT / RTGS / UPI / Cash)
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAddPayment}
                className="bg-emerald-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-xs cursor-pointer w-fit"
              >
                <Plus size={14} /> Record Payment Split
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">TOTAL ORDER VALUE</span>
                <span className="text-base sm:text-lg font-black text-slate-900 mt-1 block">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">PAYMENT MADE</span>
                <span className="text-base sm:text-lg font-black text-emerald-700 mt-1 block">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
              </div>

              <div className={`p-3.5 rounded-xl border ${pendingAmount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-wider block ${pendingAmount > 0 ? 'text-amber-800' : 'text-slate-400'}`}>
                  PAYMENT PENDING
                </span>
                <span className={`text-base sm:text-lg font-black mt-1 block ${pendingAmount > 0 ? 'text-amber-800' : 'text-slate-700'}`}>
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">STATUS</span>
                <div className="mt-1">
                  <StatusBadge status={order?.payment_status || 'pending'} />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold">Collection Progress</span>
                <span className="font-bold text-slate-900">{percentCollected}% Collected</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    percentCollected >= 100
                      ? 'bg-emerald-600'
                      : percentCollected > 0
                      ? 'bg-amber-500'
                      : 'bg-slate-300'
                  }`}
                  style={{ width: `${percentCollected}%` }}
                />
              </div>
            </div>

            {/* Split Payments List / Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Payment Split Records ({payments.length})
              </h4>

              {payments && payments.length > 0 ? (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Admin Remarks</th>
                        <th className="py-2.5 px-3">Proof</th>
                        <th className="py-2.5 px-3">Logged By</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {payments.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-50/50">
                          <td className="py-3 px-3 font-bold text-slate-500">#{idx + 1}</td>
                          <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                            {new Date(p.payment_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="py-3 px-3 font-black text-emerald-700 whitespace-nowrap">
                            ₹{parseFloat(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 text-slate-600 max-w-xs truncate" title={p.admin_remarks || ''}>
                            {p.admin_remarks || <span className="text-slate-300 italic">None</span>}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {p.proof_url ? (
                              <a
                                href={p.proof_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 transition"
                              >
                                <ExternalLink size={11} /> Proof
                              </a>
                            ) : (
                              <span className="text-slate-300 italic text-[11px]">Optional</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                            {p.recorded_by_name || 'Admin'}
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditPayment(p)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-sky-600 transition cursor-pointer"
                                title="Edit Split"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePayment(p.id)}
                                className="p-1 hover:bg-red-50 rounded text-slate-400 hover:text-red-600 transition cursor-pointer"
                                title="Delete Split"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 space-y-2">
                  <CreditCard size={24} className="mx-auto text-slate-300" />
                  <p>No split payments recorded yet for this order.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddPayment}
                    className="text-emerald-600 font-bold hover:underline cursor-pointer"
                  >
                    + Record First Split Payment
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* §6.3 Admin Split-Shipment Manager */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Truck className="text-sky-600" size={18} /> Admin Shipment Dispatch Manager (§6.3 Logic)
              </h3>
              <button
                onClick={() => setShowShipmentModal(true)}
                className="bg-sky-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg hover:bg-sky-700 transition flex items-center gap-1"
              >
                <Plus size={14} /> Create Package Shipment
              </button>
            </div>

            {/* List existing shipments */}
            {shipments && shipments.length > 0 ? (
              <div className="space-y-3">
                {shipments.map((s, idx) => (
                  <div key={s.id || idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900">Package Shipment #{idx + 1} ({s.tracking_carrier || s.carrier || 'Express Logistics'})</span>
                      <p className="text-gray-500 font-mono mt-0.5">Tracking No: {s.tracking_number || 'N/A'}</p>
                    </div>
                    <StatusBadge status={s.status || 'shipped'} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 py-2">No shipments dispatched yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar Invoice & Details */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 h-fit space-y-6">
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3 mb-4">Financial Summary</h3>
          <div className="space-y-3 text-xs mb-6 pb-6 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Status</span>
              <StatusBadge status={order?.payment_status || 'pending'} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method</span>
              <span className="font-bold text-slate-900 uppercase">{order?.payment_method || (order?.is_cod ? 'COD' : 'Online')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Items Subtotal</span>
              <span className="font-bold text-slate-900">₹{parseFloat(order?.subtotal || 0).toLocaleString('en-IN')}</span>
            </div>
            {order?.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({order.coupon_code || 'Offer'})</span>
                <span className="font-bold">-₹{parseFloat(order.discount_amount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Shipping Cost</span>
              {editShipping ? (
                <div className="flex items-center gap-1">
                  <input type="number" value={shippingInput} onChange={e => setShippingInput(e.target.value)} className="w-16 p-1 border rounded text-xs text-right" />
                  <button onClick={handleUpdateShipping} className="text-emerald-600 hover:text-emerald-700 p-1"><Save size={14} /></button>
                  <button onClick={() => setEditShipping(false)} className="text-red-500 hover:text-red-600 p-1">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">₹{parseFloat(order?.shipping_cost || 0).toLocaleString('en-IN')}</span>
                  <button onClick={() => setEditShipping(true)} className="text-sky-600 hover:text-sky-700" title="Edit Shipping Cost"><Edit2 size={12} /></button>
                </div>
              )}
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-bold text-slate-900">Grand Total</span>
              <span className="text-sm font-black text-sky-600">₹{parseFloat(order?.grand_total || 0).toLocaleString('en-IN')}</span>
            </div>
            {totalPaid > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold pt-1">
                <span>Payment Made</span>
                <span>₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
            )}
            {pendingAmount > 0 && (
              <div className="flex justify-between text-amber-700 font-bold pt-1">
                <span>Payment Pending</span>
                <span>₹{pendingAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Order Documents</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Download size={14} /> {downloadingInvoice ? 'Generating Tax Invoice PDF...' : 'Download Tax Invoice (PDF)'}
            </button>
            <button
              type="button"
              onClick={handleDownloadPackingSlip}
              disabled={downloadingSlip}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Download size={14} /> {downloadingSlip ? 'Generating Packing Slip PDF...' : 'Download Warehouse Packing Slip (PDF)'}
            </button>
          </div>
        </div>
      </div>

      {/* Shipment Creation Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateShipment} className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-lg">Dispatch Package Shipment</h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Carrier Name</label>
              <input
                type="text"
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg text-xs"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Tracking Number</label>
              <input
                type="text"
                value={trackingNum}
                onChange={(e) => setTrackingNum(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Select Available Accepted Quantities to Ship:</label>
              <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 p-2 rounded-lg text-xs">
                {items
                  .filter((item) => (item.qty_approved !== 0 && item.status !== 'rejected'))
                  .map((item) => {
                    const maxAvailable = (item.qty_approved !== null ? item.qty_approved : item.qty_ordered) - (item.qty_shipped || 0);
                    return (
                      <div key={item.id} className="flex justify-between items-center">
                        <span className="truncate font-semibold">{item.product_name} (Available: {maxAvailable})</span>
                        <input
                          type="number"
                          min="0"
                          max={maxAvailable}
                          value={selectedShipQty[item.id] || 0}
                          onChange={(e) => setSelectedShipQty({ ...selectedShipQty, [item.id]: parseInt(e.target.value || 0, 10) })}
                          className="w-16 p-1 border rounded text-xs text-center"
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowShipmentModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold text-gray-600">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700">
                Dispatch Shipment
              </button>
            </div>
          </form>
        </div>
      )}
      {/* Split Payment Creation & Edit Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleSubmitPayment}
            className="bg-white max-w-md w-full p-6 sm:p-7 rounded-2xl shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CreditCard className="text-emerald-600" size={20} />
                {editingPayment ? 'Edit Payment Split' : 'Record Payment Split'}
              </h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Amount */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Payment Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-bold bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
                {pendingAmount > 0 && !editingPayment && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Pending balance for this order: <span className="font-bold text-amber-700">₹{pendingAmount.toLocaleString('en-IN')}</span>
                  </p>
                )}
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-medium bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Admin Remarks */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Admin Remarks / Notes
                </label>
                <textarea
                  rows="2"
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. 50% advance received via NEFT UTR #HDFC0012984, cash in hand, etc."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Proof (Optional) */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  Payment Proof (Optional)
                </label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleProofUpload}
                    disabled={uploadingProof}
                    className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  {uploadingProof && (
                    <p className="text-[11px] text-sky-600 animate-pulse font-medium">Uploading proof document...</p>
                  )}
                  <input
                    type="text"
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="Or paste receipt URL / document link"
                    className="w-full p-2 border border-slate-300 rounded-lg text-xs font-mono bg-white text-slate-700"
                  />
                  {proofUrl && (
                    <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                      <Check size={14} className="shrink-0" />
                      <span className="truncate flex-1">Proof attached</span>
                      <a href={proofUrl} target="_blank" rel="noreferrer" className="underline font-bold shrink-0">Preview ↗</a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingPayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submittingPayment ? 'Saving...' : editingPayment ? 'Update Split' : 'Save Payment Split'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
