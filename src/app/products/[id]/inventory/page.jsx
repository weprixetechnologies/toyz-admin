'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function ProductInventoryLogPage() {
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adjustQty, setAdjustQty] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchLog = async () => {
    try {
      const prodRes = await api.get(`/products/${id}`);
      if (prodRes.success) setProduct(prodRes.data);
      const res = await api.get(`/products/${id}/inventory`);
      if (res.success) setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchLog();
  }, [id]);

  const handleAdjust = async (e) => {
    e.preventDefault();
    if (!adjustQty || isNaN(adjustQty)) return;
    setSaving(true);
    try {
      const res = await api.post(`/products/${id}/inventory/adjust`, {
        change: parseInt(adjustQty),
        reason: reason || 'Manual stock adjustment'
      });
      if (res.success) {
        setAdjustQty('');
        setReason('');
        fetchLog();
      }
    } catch (err) {
      alert(err.message || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Movement History</h1>
          <p className="text-slate-500 text-sm">
            Product: <span className="font-bold text-slate-800">{product?.name || `ID #${id}`}</span> (Current Stock: <span className="font-mono font-bold">{product?.stock_quantity ?? '-'}</span>)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:col-span-1">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Adjust Inventory Stock</h2>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity Change (+ / -)</label>
              <input
                type="number"
                placeholder="e.g. 15 or -5"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Reason / Reference</label>
              <input
                type="text"
                placeholder="e.g. Restock shipment #104"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-indigo-600 text-white font-medium py-2 rounded text-sm hover:bg-indigo-700"
            >
              {saving ? 'Saving...' : 'Submit Stock Movement'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Loading inventory movements...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No inventory movements recorded yet.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                  <th className="p-4">Date</th>
                  <th className="p-4">Change</th>
                  <th className="p-4">Reason</th>
                  <th className="p-4">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${log.change_amount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                        {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">{log.reason || '-'}</td>
                    <td className="p-4 text-slate-500">{log.user_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
