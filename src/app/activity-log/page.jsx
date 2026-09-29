'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get('/admin/activity-log');
        if (res.success) {
          setLogs(res.data?.logs || res.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Activity Audit Log</h1>
          <p className="text-slate-500 text-sm">Full audit trail of admin actions and JSON before/after state diffs</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading audit log...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No activity recorded yet.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-600">
                <th className="p-4">Timestamp</th>
                <th className="p-4">User</th>
                <th className="p-4">Module / Action</th>
                <th className="p-4">IP Address</th>
                <th className="p-4">Diff Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-500 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-4 font-bold text-slate-800">{log.user_name || `User #${log.user_id}`}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-700">{log.module}</span>: <span className="text-indigo-600">{log.action}</span>
                  </td>
                  <td className="p-4 font-mono text-xs text-slate-500">{log.ip_address || '127.0.0.1'}</td>
                  <td className="p-4">
                    {(log.before_state || log.after_state) ? (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold hover:bg-slate-200"
                      >
                        View Diff →
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
              <h2 className="text-lg font-bold text-slate-800">
                JSON Diff Inspection — Log #{selectedLog.id}
              </h2>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-bold text-xs uppercase text-red-600 mb-2">Before State</p>
                <pre className="bg-slate-900 text-red-400 p-4 rounded text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(selectedLog.before_state || {}, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-bold text-xs uppercase text-emerald-600 mb-2">After State</p>
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded text-xs font-mono overflow-x-auto max-h-96">
                  {JSON.stringify(selectedLog.after_state || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button onClick={() => setSelectedLog(null)} className="bg-slate-800 text-white px-4 py-2 rounded text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
