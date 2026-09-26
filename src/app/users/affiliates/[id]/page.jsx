'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

export default function AffiliateDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [affiliate, setAffiliate] = useState(null);
  const [commRate, setCommRate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAffiliate = async () => {
    try {
      const res = await api.get(`/admin/affiliates/${id}`);
      if (res.success) {
        setAffiliate(res.data);
        setCommRate(res.data.commission_rate || '5');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchAffiliate();
  }, [id]);

  const handleSaveRate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/admin/affiliates/${id}/commission`, { commission_rate: parseFloat(commRate) });
      if (res.success) {
        alert('Commission rate updated!');
        fetchAffiliate();
      }
    } catch (err) {
      alert(err.message || 'Failed to update commission rate');
    }
  };

  return (
    <>
      <div className="max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Affiliate Profile</h1>
            <p className="text-slate-500 text-sm">Affiliate ID #{id}</p>
          </div>
          <button onClick={() => router.back()} className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50">
            ← Back
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading affiliate...</div>
        ) : !affiliate ? (
          <div className="p-8 text-center text-red-500">Affiliate not found</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">{affiliate.user_name || `User #${affiliate.user_id}`}</h2>
                <p className="text-slate-600 text-sm mt-1">Referral Code: <span className="font-mono font-bold text-indigo-600">{affiliate.referral_code}</span></p>
                <div className="flex gap-6 mt-4 text-sm">
                  <div>Clicks: <span className="font-bold">{affiliate.clicks || 0}</span></div>
                  <div>Conversions: <span className="font-bold">{affiliate.conversions || 0}</span></div>
                  <div>Total Earned: <span className="font-bold text-emerald-700">₹{affiliate.total_earned || 0}</span></div>
                </div>
              </div>
              <StatusBadge status={affiliate.status || 'active'} />
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Default Commission Rate Config</h3>
              <form onSubmit={handleSaveRate} className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={commRate}
                    onChange={(e) => setCommRate(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-indigo-700"
                >
                  Update Rate
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
