'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, RefreshCw, Package, History } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductInventoryLogPage() {
  const { id } = useParams();
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustQty, setAdjustQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const prodRes = await api.get(`/products/${id}`);
      if (prodRes.success && prodRes.data) {
        setProduct(prodRes.data.product || prodRes.data);
      }

      const res = await api.get(`/products/${id}/inventory`);
      if (res.success && res.data) {
        const list = Array.isArray(res.data?.logs)
          ? res.data.logs
          : Array.isArray(res.data)
          ? res.data
          : [];
        setLogs(list);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error loading inventory log:', err);
      toast.error('Failed to load inventory history');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLog();
  }, [id]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    const qtyVal = parseInt(adjustQty, 10);
    if (isNaN(qtyVal) || qtyVal === 0) {
      toast.error('Enter a valid non-zero quantity change (+/-)');
      return;
    }

    setSaving(true);
    try {
      const movement = qtyVal < 0 ? 'out' : 'in';
      const res = await api.post(`/products/${id}/inventory/adjust`, {
        qty: Math.abs(qtyVal),
        change: qtyVal,
        movement,
        note: reason || 'Manual stock adjustment',
        reason: reason || 'Manual stock adjustment'
      });

      if (res.success) {
        toast.success(`Inventory updated: ${qtyVal > 0 ? `+${qtyVal}` : qtyVal} units`);
        setAdjustQty('');
        setReason('');
        fetchLog();
      } else {
        toast.error(res.message || 'Failed to adjust stock');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const safeLogs = Array.isArray(logs) ? logs : [];
  const currentStock = product?.stock_qty ?? product?.stock_quantity ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.back()}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span className="text-slate-300">/</span>
            <Link href="/products/low-stock" className="text-xs text-rose-600 hover:underline">
              Low Stock Alerts
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <History size={24} className="text-sky-600" />
            Inventory Movement History
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Product:{' '}
            <span className="font-bold text-slate-800">
              {product?.name || `Product #${id}`}
            </span>{' '}
            (Current Stock:{' '}
            <span className="font-mono font-bold text-sky-600">
              {currentStock} units
            </span>
            )
          </p>
        </div>

        <button
          onClick={fetchLog}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-sky-600' : 'text-slate-500'} />
          <span>Refresh Log</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Movement Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Package size={18} className="text-indigo-600" />
            <h3>Manual Stock Adjustment</h3>
          </div>
          <p className="text-xs text-slate-500">
            Log inventory changes with an audit trail note for physical counts or restocks.
          </p>

          <form onSubmit={handleAdjust} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Quantity Change (+ / -)
              </label>
              <input
                type="number"
                placeholder="e.g. 25 or -5"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                required
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Positive number to add stock, negative to subtract.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Reason / Reference Note
              </label>
              <input
                type="text"
                placeholder="e.g. Restock shipment #104"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
            >
              {saving ? 'Recording movement...' : 'Submit Movement'}
            </button>
          </form>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden lg:col-span-2">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
              Loading movement history...
            </div>
          ) : safeLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No inventory movements recorded yet for this product.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                    <th className="p-4">Date & Time</th>
                    <th className="p-4">Movement</th>
                    <th className="p-4">Before / After</th>
                    <th className="p-4">Reason / Note</th>
                    <th className="p-4">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {safeLogs.map((log) => {
                    const isPositive =
                      log.movement === 'in' ||
                      log.movement === 'released' ||
                      (log.qty > 0 && log.movement !== 'out');
                    const displayQty = log.qty ?? log.change_amount ?? 0;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="p-4 text-slate-500 font-mono text-[11px]">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-mono font-bold px-2.5 py-1 rounded-md text-[11px] ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {isPositive ? `+${Math.abs(displayQty)}` : `-${Math.abs(displayQty)}`}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-600 text-[11px]">
                          {log.qty_before !== undefined && log.qty_after !== undefined ? (
                            <span>
                              {log.qty_before} &rarr;{' '}
                              <strong className="text-slate-900">{log.qty_after}</strong>
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-4 text-slate-700">
                          {log.note || log.reason || '—'}
                        </td>
                        <td className="p-4 text-slate-500 text-[11px]">
                          {log.performed_by_name || log.user_name || 'System'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
