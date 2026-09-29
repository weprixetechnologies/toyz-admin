'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { adminApi } from '../../../lib/api';
import StatusBadge from '../../../components/StatusBadge';
import { Package, Download, Truck, Edit2, Check, AlertCircle, Plus, Save, MapPin, User, Phone } from 'lucide-react';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [editItemId, setEditItemId] = useState(null);
  const [editShipping, setEditShipping] = useState(false);
  const [shippingInput, setShippingInput] = useState(0);
  const [editPrice, setEditPrice] = useState('');
  const [editQty, setEditQty] = useState('');

  const [showShipmentModal, setShowShipmentModal] = useState(false);
  const [carrier, setCarrier] = useState('Express Logistics');
  const [trackingNum, setTrackingNum] = useState('');
  const [selectedShipQty, setSelectedShipQty] = useState({});

  async function loadDetail() {
    setLoading(true);
    const res = await adminApi.get(`/admin/orders/${id}`);
    if (res.success && res.data) {
      setOrderData(res.data);
      setStatus(res.data.order?.status || 'pending');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (id) loadDetail();
  }, [id]);

  if (loading) return <div className="p-12 text-center text-xs text-gray-400">Loading order detail...</div>;
  if (!orderData || !orderData.order) return <div className="p-12 text-center text-xs text-gray-500">Order not found.</div>;

  const { order, items = [], shipments = [] } = orderData;


  const handleUpdateShipping = async () => {
    if (!confirm('Are you sure you want to update the shipping cost? This will recalculate the grand total.')) return;
    const res = await adminApi.put(`/admin/orders/${id}/shipping`, { shipping_cost: shippingInput });
    if (res.success) {
      alert('Shipping cost updated successfully');
      setEditShipping(false);
      loadDetail(); // reload
    } else {
      alert(res.message || 'Failed to update shipping cost');
    }
  };

  const handleUpdateStatus = async () => {
    setStatusUpdating(true);
    const res = await adminApi.put(`/admin/orders/${id}/status`, { status });
    if (res.success) {
      alert(`Order status updated to '${status}'`);
      loadDetail();
    } else {
      alert(res.message || 'Status update failed');
    }
    setStatusUpdating(false);
  };

  const handleSaveItem = async (itemId) => {
    const res = await adminApi.put(`/admin/orders/${id}/items/${itemId}`, {
      admin_unit_price: parseFloat(editPrice || 0),
      qty_approved: parseInt(editQty || 0, 10)
    });
    if (res.success) {
      setEditItemId(null);
      loadDetail();
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
      loadDetail();
    } else {
      alert(res.message || 'Failed to create shipment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Action Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900">{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Placed: {new Date(order.created_at || Date.now()).toLocaleString('en-IN')} | Role: <span className="font-bold uppercase">{order.placed_by_role}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-xs bg-white font-bold"
          >
            <option value="pending">pending</option>
            <option value="pending_approval">pending_approval</option>
            <option value="processing">processing</option>
            <option value="partially_shipped">partially_shipped</option>
            <option value="shipped">shipped</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button
            onClick={handleUpdateStatus}
            disabled={statusUpdating}
            className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-sky-600 transition"
          >
            Update Status
          </button>
        </div>
      </div>


      {/* Customer & Address Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <User className="text-sky-600" size={16} /> Customer Details
          </h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p><span className="font-semibold text-slate-800">Name:</span> {order?.shipping_name || order?.billing_name || 'N/A'}</p>
            <p className="flex items-center gap-1"><Phone size={14} className="text-slate-400" /> <span className="font-semibold text-slate-800">Phone:</span> {order?.shipping_phone || 'N/A'}</p>
            {order?.billing_gstin && <p><span className="font-semibold text-slate-800">GSTIN:</span> <span className="uppercase font-mono">{order?.billing_gstin}</span></p>}
            <p><span className="font-semibold text-slate-800">Role:</span> <span className="uppercase text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{order?.placed_by_role || 'Customer'}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-2">
            <MapPin className="text-sky-600" size={16} /> Shipping Address
          </h3>
          <div className="text-sm text-slate-600 space-y-1">
            <p>{order?.shipping_line1}</p>
            {order?.shipping_line2 && <p>{order?.shipping_line2}</p>}
            <p>{order?.shipping_city}, {order?.shipping_state} {order?.shipping_pin}</p>
            <p>{order?.shipping_country}</p>
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
          </div>
          <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">Order Documents</h3>
          <div className="space-y-2">
            <a
              href={`http://72.60.219.181:46711/api/v1/orders/${order.id}/invoice`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Download size={14} /> Download Tax Invoice (HTML/PDF)
            </a>
            <a
              href={`http://72.60.219.181:46711/api/v1/admin/orders/${order.id}/packing-slip`}
              target="_blank"
              rel="noreferrer"
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <Download size={14} /> Download Warehouse Packing Slip
            </a>
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
    </div>
  );
}
