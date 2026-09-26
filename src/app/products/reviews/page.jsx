'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ReviewModerationPage() {
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('pending'); // pending, approved, rejected
  const [loading, setLoading] = useState(true);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reviews?status=${tab}`);
      if (res.success) setReviews(res.data?.reviews || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [tab]);

  const handleApprove = async (id) => {
    try {
      const res = await api.put(`/reviews/${id}/approve`);
      if (res.success) fetchReviews();
    } catch (err) {
      alert(err.message || 'Failed to approve review');
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await api.put(`/reviews/${id}/reject`);
      if (res.success) fetchReviews();
    } catch (err) {
      alert(err.message || 'Failed to reject review');
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Product Reviews Moderation</h1>
          <p className="text-slate-500 text-sm">Approve or reject customer submitted reviews</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-200">
        {['pending', 'approved', 'rejected'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 transition ${tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No {tab} reviews found.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((r) => (
              <div key={r.id} className="p-6 flex flex-col md:flex-row justify-between gap-4 hover:bg-slate-50">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-800">{r.reviewer_name || 'Customer'}</span>
                    <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                      ★ {r.rating} / 5
                    </span>
                    <span className="text-xs text-slate-400">
                      {r.product_name || `Product #${r.product_id}`}
                    </span>
                  </div>
                  <p className="text-slate-700 font-medium text-sm mb-1">{r.title}</p>
                  <p className="text-slate-600 text-sm">{r.body}</p>
                  <p className="text-xs text-slate-400 mt-2">{new Date(r.created_at).toLocaleString()}</p>
                </div>

                <div className="flex items-center gap-2">
                  {tab !== 'approved' && (
                    <button
                      onClick={() => handleApprove(r.id)}
                      className="bg-emerald-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  )}
                  {tab !== 'rejected' && (
                    <button
                      onClick={() => handleReject(r.id)}
                      className="bg-red-600 text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-red-700"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
