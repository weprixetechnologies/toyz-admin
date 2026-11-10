'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CustomersReportPage() {
  const [data, setData] = useState({ total_customers: 0, new_this_month: 0, top_customers: [] });
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports/customers');
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          // Backend returns customers array [{ id, name, email, total_orders, lifetime_value }]
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();

          let thisMonthCount = 0;
          const mapped = res.data.map((c) => {
            if (c.created_at) {
              const d = new Date(c.created_at);
              if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                thisMonthCount++;
              }
            }
            return {
              id: c.id,
              name: c.name || 'Customer',
              email: c.email || '—',
              total_orders: parseInt(c.total_orders || 0, 10),
              total_spend: parseFloat(c.lifetime_value || 0)
            };
          });

          setData({
            total_customers: mapped.length,
            new_this_month: thisMonthCount,
            top_customers: mapped
          });
        } else {
          setData(res.data);
        }
      }
    } catch (err) {
      console.error('Error loading customers report:', err);
      toast.error('Failed to load customers report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const safeTopCustomers = Array.isArray(data.top_customers) ? data.top_customers : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={24} className="text-sky-600" />
            Customer LTV & Segmentation Report
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm">
            Customer acquisition metrics and highest lifetime-value buyers.
          </p>
        </div>

        <button
          onClick={loadReport}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-sky-600' : 'text-slate-400'} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">Total Active Buyers</p>
          <p className="text-3xl font-black text-slate-900">{data.total_customers || 0}</p>
          <span className="text-[10px] text-slate-400">Registered customers with account</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <p className="text-xs font-bold text-slate-400 uppercase">New Registrations This Month</p>
          <p className="text-3xl font-black text-indigo-600">{data.new_this_month || 0}</p>
          <span className="text-[10px] text-slate-400">Current calendar month signups</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">
            Top Customers by Lifetime Value (LTV)
          </h2>
          <span className="text-xs text-slate-400 font-mono">{safeTopCustomers.length} ranked customers</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw size={18} className="animate-spin text-sky-500 mx-auto mb-2" />
            Loading customer LTV ranks...
          </div>
        ) : safeTopCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No customer purchase data available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500">
                  <th className="p-4">Customer</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Total Orders</th>
                  <th className="p-4 text-right">Lifetime Spend (LTV)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {safeTopCustomers.map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 font-bold text-slate-900">{c.name}</td>
                    <td className="p-4 font-mono text-slate-500">{c.email}</td>
                    <td className="p-4 font-medium">{c.total_orders} orders</td>
                    <td className="p-4 font-bold text-emerald-700 font-mono text-sm text-right">
                      ₹{parseFloat(c.total_spend || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
