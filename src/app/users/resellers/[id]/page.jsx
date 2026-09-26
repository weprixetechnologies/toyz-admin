'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

export default function ResellerDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [reseller, setReseller] = useState(null);
  const [creditLimit, setCreditLimit] = useState('');
  const [globalDiscount, setGlobalDiscount] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReseller = async () => {
    try {
      const res = await api.get(`/admin/resellers/${id}`);
      if (res.success && res.data) {
        const profile = res.data.reseller || res.data;
        setReseller(profile);
        setCreditLimit(profile.credit_limit !== undefined ? String(profile.credit_limit) : '0');
        setGlobalDiscount(profile.global_discount_value !== undefined ? String(profile.global_discount_value) : '0');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchReseller();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/resellers/${id}/approve`);
      if (res.success) {
        alert('Reseller application approved successfully!');
        fetchReseller();
      } else {
        alert(res.message || 'Failed to approve');
      }
    } catch (err) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/resellers/${id}/reject`, { reason });
      if (res.success) {
        alert('Reseller application rejected.');
        fetchReseller();
      } else {
        alert(res.message || 'Failed to reject');
      }
    } catch (err) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this reseller account?')) return;
    setActionLoading(true);
    try {
      const res = await api.put(`/admin/resellers/${id}/suspend`);
      if (res.success) {
        alert('Reseller account suspended.');
        fetchReseller();
      } else {
        alert(res.message || 'Failed to suspend');
      }
    } catch (err) {
      alert(err.message || 'Failed to suspend');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveLimits = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const credRes = await api.put(`/admin/resellers/${id}/credit`, {
        credit_limit: parseFloat(creditLimit || 0)
      });
      const discRes = await api.put(`/admin/resellers/${id}/discount`, {
        discount_type: 'percentage',
        discount_value: parseFloat(globalDiscount || 0),
        has_special_price: true
      });

      if (credRes.success && discRes.success) {
        alert('Credit limit and wholesale discount saved successfully!');
        fetchReseller();
      } else {
        alert(credRes.message || discRes.message || 'Failed to save settings');
      }
    } catch (err) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Reseller Profile Details</h1>
            <p className="text-slate-500 text-sm">Reseller Profile ID #{id}</p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50"
          >
            ← Back to List
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 font-medium">Loading reseller profile...</div>
        ) : !reseller ? (
          <div className="p-8 text-center text-red-500 font-bold">Reseller profile not found</div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-slate-800">{reseller.business_name}</h2>
                  <StatusBadge status={reseller.status} />
                </div>
                <p className="text-slate-600 text-sm">
                  GSTIN: <span className="font-mono font-semibold">{reseller.gstin || 'N/A'}</span> | PAN: <span className="font-mono font-semibold">{reseller.pan || 'N/A'}</span>
                </p>
                <p className="text-slate-600 text-sm mt-1">Address: {reseller.address || 'N/A'}</p>
                <p className="text-slate-500 text-xs mt-2">Owner User ID: #{reseller.user_id}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {reseller.status !== 'approved' && (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="bg-emerald-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-emerald-700 transition"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Partner'}
                  </button>
                )}
                {reseller.status !== 'rejected' && (
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-red-700 transition"
                  >
                    Reject Application
                  </button>
                )}
                {reseller.status === 'approved' && (
                  <button
                    onClick={handleSuspend}
                    disabled={actionLoading}
                    className="bg-amber-600 text-white px-4 py-2 rounded text-sm font-bold hover:bg-amber-700 transition"
                  >
                    Suspend Account
                  </button>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-slate-800 border-b pb-3">Credit & Wholesale Discount Config</h3>
              <form onSubmit={handleSaveLimits} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Assigned Credit Limit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">Maximum allowed credit balance for B2B orders</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Global Wholesale Discount (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={globalDiscount}
                      onChange={(e) => setGlobalDiscount(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">Default percentage discount applied across catalog</p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
                  >
                    {actionLoading ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
