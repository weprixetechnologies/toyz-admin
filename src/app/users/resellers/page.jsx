'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import api from '@/lib/api';

export default function ResellersListPage() {
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResellers() {
      try {
        const res = await api.get('/admin/resellers');
        if (res.success) {
          const list = res.data?.resellers || (Array.isArray(res.data) ? res.data : []);
          setResellers(list);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadResellers();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Reseller Applications & Partners</h1>
          <p className="text-slate-500 text-sm">Manage B2B wholesale reseller profiles, credits & approvals</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading resellers...</div>
        ) : resellers.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No reseller applications submitted yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Business Name</th>
                <th className="p-4">GSTIN / PAN</th>
                <th className="p-4">Credit Limit</th>
                <th className="p-4">Status</th>
                <th className="p-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {resellers.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 font-bold text-slate-800">{r.business_name}</td>
                  <td className="p-4 font-mono text-slate-600">{r.gstin || r.pan || '-'}</td>
                  <td className="p-4 font-semibold text-slate-700">₹{r.credit_limit || 0}</td>
                  <td className="p-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/users/resellers/${r.id}`}
                      className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded text-xs font-bold hover:bg-indigo-100"
                    >
                      Manage & Approve →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
