'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import { Percent, Plus, Tag, Trash2, Power, Pencil } from 'lucide-react';

export default function OffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOffers() {
      setLoading(true);
      const res = await adminApi.get('/admin/offers');
      if (res.success) setOffers(res.data?.offers || res.data || []);
      setLoading(false);
    }
    loadOffers();
  }, []);


  const toggleStatus = async (id, currentStatus) => {
    if (!confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this offer?`)) return;
    const res = await adminApi.put(`/admin/offers/${id}`, { is_active: !currentStatus });
    if (res.success) {
      setOffers(prev => prev.map(o => o.id === id ? { ...o, is_active: !currentStatus } : o));
    } else {
      alert(res.message || 'Failed to update offer status');
    }
  };

  const deleteOffer = async (id) => {
    if (!confirm('Are you sure you want to completely delete this offer? This action cannot be undone.')) return;
    const res = await adminApi.delete(`/admin/offers/${id}`);
    if (res.success) {
      setOffers(prev => prev.filter(o => o.id !== id));
    } else {
      alert(res.message || 'Failed to delete offer (Superadmin required)');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Offers & Promotion Engine</h1>
          <p className="text-xs text-gray-500">Configure automatic cart discounts, BOGO rules, and promo campaigns</p>
        </div>

        <Link href="/offers/new" className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5">
          <Plus size={14} /> Create Offer
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading promotion rules...</div>
        ) : offers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="p-4">Title</th>
                  <th className="p-4">Offer Type</th>
                  <th className="p-4">Discount Value</th>
                  <th className="p-4">Min Cart Value</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-bold text-slate-900">{o.title || o.name}</td>
                    <td className="p-4 text-slate-600 font-semibold uppercase">{o.offer_type}</td>
                    <td className="p-4 font-bold text-emerald-600">{o.discount_value || 'N/A'}</td>
                    <td className="p-4 font-bold text-slate-900">₹{parseFloat(o.min_cart_value || 0).toLocaleString('en-IN')}</td>
                    <td className="p-4"><StatusBadge status={o.is_active ? 'active' : 'inactive'} /></td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        href={`/offers/${o.id}/edit`}
                        className="inline-flex p-1.5 text-slate-400 hover:text-sky-600 border border-slate-200 hover:border-sky-200 rounded-lg transition-colors"
                        title="Edit Offer"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => toggleStatus(o.id, o.is_active)}
                        className={`p-1.5 rounded-lg border transition-colors ${o.is_active ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`}
                        title={o.is_active ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => deleteOffer(o.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                        title="Delete Offer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-gray-500">No promotion rules created yet.</div>
        )}
      </div>
    </div>
  );
}
