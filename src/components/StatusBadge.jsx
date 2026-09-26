'use client';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  const colorMap = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    pending_approval: 'bg-amber-100 text-amber-800 border-amber-300',
    processing: 'bg-blue-100 text-blue-800 border-blue-300',
    approved: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    partially_approved: 'bg-teal-100 text-teal-800 border-teal-300',
    partially_shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    shipped: 'bg-purple-100 text-purple-800 border-purple-300',
    delivered: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
    rejected: 'bg-red-100 text-red-800 border-red-300',
    active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    inactive: 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const style = colorMap[normalized] || 'bg-gray-100 text-gray-800 border-gray-300';
  const label = normalized.replace(/_/g, ' ').toUpperCase();

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
      {label}
    </span>
  );
}
