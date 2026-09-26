'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '../../../../lib/api';
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

export default function ResellerOrderApprovalPage() {
  const { id } = useParams();
  const router = useRouter();

  const [orderData, setOrderData] = useState(null);
  const [approvalItems, setApprovalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      setLoading(true);
      const res = await adminApi.get(`/admin/orders/${id}`);
      if (res.success && res.data) {
        setOrderData(res.data);
        const list = (res.data.items || []).map((i) => ({
          id: i.id,
          product_name: i.product_name,
          qty_ordered: i.qty_ordered,
          qty_approved: i.qty_ordered,
          admin_note: ''
        }));
        setApprovalItems(list);
      }
      setLoading(false);
    }
    if (id) loadOrder();
  }, [id]);

  const handleQtyChange = (itemId, val) => {
    setApprovalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty_approved: parseInt(val || 0, 10) } : item))
    );
  };

  const handleNoteChange = (itemId, val) => {
    setApprovalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, admin_note: val } : item))
    );
  };

  const handleRejectItem = (itemId) => {
    setApprovalItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, qty_approved: 0, admin_note: 'Out of stock' } : item))
    );
  };

  const handleSubmitDecisions = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      items: approvalItems.map((i) => ({
        id: i.id,
        qty_approved: i.qty_approved,
        admin_note: i.admin_note
      }))
    };

    const res = await adminApi.post(`/admin/orders/${id}/approve`, payload);
    if (res.success) {
      alert('Per-item approval decisions recorded successfully!');
      router.push('/orders/reseller-pending');
    } else {
      alert(res.message || 'Approval submission failed');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-12 text-center text-xs text-gray-400">Loading order items for decision...</div>;
  if (!orderData) return <div className="p-12 text-center text-xs text-gray-500">Order not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1 font-bold">
          <ArrowLeft size={14} /> Back to Pending Queue
        </button>
        <span className="font-mono text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full">
          Reseller Approval Flow
        </span>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Per-Item Approval Decisions for {orderData.order?.order_number}</h1>
          <p className="text-xs text-gray-500 mt-1">Review line items, adjust approved quantities, or record rejection notes.</p>
        </div>

        <form onSubmit={handleSubmitDecisions} className="space-y-4">
          <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
            {approvalItems.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                <div className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-sm">{item.product_name}</h4>
                  <p className="text-xs text-gray-500">Ordered Quantity: <span className="font-bold text-slate-900">{item.qty_ordered} pcs</span></p>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block">Approved Qty</label>
                    <input
                      type="number"
                      min="0"
                      max={item.qty_ordered}
                      value={item.qty_approved}
                      onChange={(e) => handleQtyChange(item.id, e.target.value)}
                      className="w-20 p-1.5 border border-gray-300 rounded text-xs text-center font-bold"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Admin Note / Reason"
                    value={item.admin_note}
                    onChange={(e) => handleNoteChange(item.id, e.target.value)}
                    className="p-1.5 border border-gray-300 rounded text-xs w-44"
                  />

                  <button
                    type="button"
                    onClick={() => handleRejectItem(item.id)}
                    className="p-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-bold hover:bg-red-200"
                    title="Reject Item"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 text-slate-950 font-bold text-xs px-6 py-3 rounded-xl hover:bg-amber-400 transition shadow"
            >
              {submitting ? 'Submitting Decisions...' : 'Confirm & Commit Decisions'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
