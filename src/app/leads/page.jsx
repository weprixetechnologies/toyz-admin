'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchAdminApi } from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Inbox,
  Search,
  Filter,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ExternalLink,
  Trash2,
  RefreshCw,
  User,
  ChevronRight,
  X,
  FileText,
  PhoneCall,
  Sparkles
} from 'lucide-react';

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    contacted: 0,
    in_progress: 0,
    converted: 0,
    closed: 0,
    today: 0
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Selected lead for detail modal
  const [selectedLead, setSelectedLead] = useState(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page);
      params.set('limit', 15);
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);

      const res = await fetchAdminApi(`/leads/admin?${params.toString()}`);
      if (res && res.success && res.data) {
        setLeads(res.data.leads || []);
        if (res.data.stats) setStats(res.data.stats);
        if (res.data.pagination) setPagination(res.data.pagination);
      } else {
        toast.error(res?.message || 'Failed to fetch leads');
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast.error('Network error loading leads');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter]);

  useEffect(() => {
    fetchLeads(1);
  }, [fetchLeads]);

  const handleStatusChange = async (leadId, newStatus) => {
    setUpdatingStatusId(leadId);
    try {
      const res = await fetchAdminApi(`/leads/admin/${leadId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      });
      if (res && res.success) {
        toast.success(`Status updated to ${newStatus}`);
        setLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
        );
        if (selectedLead && selectedLead.id === leadId) {
          setSelectedLead((prev) => ({ ...prev, status: newStatus }));
        }
        // Refresh counts
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedLead) return;
    setSavingNotes(true);
    try {
      const res = await fetchAdminApi(`/leads/admin/${selectedLead.id}/status`, {
        method: 'PATCH',
        body: { notes: notesDraft }
      });
      if (res && res.success) {
        toast.success('Admin notes saved');
        setSelectedLead((prev) => ({ ...prev, notes: notesDraft }));
        setLeads((prev) =>
          prev.map((l) => (l.id === selectedLead.id ? { ...l, notes: notesDraft } : l))
        );
      } else {
        toast.error(res?.message || 'Failed to save notes');
      }
    } catch (err) {
      toast.error('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetchAdminApi(`/leads/admin/${leadId}`, {
        method: 'DELETE'
      });
      if (res && res.success) {
        toast.success('Lead deleted');
        if (selectedLead?.id === leadId) setSelectedLead(null);
        fetchLeads(pagination.page);
      } else {
        toast.error(res?.message || 'Failed to delete lead');
      }
    } catch (err) {
      toast.error('Failed to delete lead');
    }
  };

  const openLeadDetail = (lead) => {
    setSelectedLead(lead);
    setNotesDraft(lead.notes || '');
  };

  const getStatusBadge = (status) => {
    const map = {
      new: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      contacted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      in_progress: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      converted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      closed: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border capitalize ${
          map[status] || 'bg-slate-800 text-slate-300'
        }`}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getSourceBadge = (source) => {
    if (source === 'contact_page') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
          Contact Page
        </span>
      );
    }
    if (source === 'chatbot') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-emerald-50 text-emerald-700 border border-emerald-100">
          Chatbot Lead
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded bg-sky-50 text-sky-700 border border-sky-100">
        Floating Widget
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Captures & Inquiries</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-sky-100 text-sky-700">
              Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time inquiries received from Floating Contact Form, Contact Us page, and Chatbot flows.
          </p>
        </div>

        <button
          onClick={() => fetchLeads(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition shadow-sm"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin text-sky-600' : 'text-slate-500'} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Leads</span>
            <Inbox size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">All recorded inquiries</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today</span>
            <Sparkles size={16} className="text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600">{stats.today}</div>
          <div className="text-[11px] text-sky-600 font-medium mt-1">Received today</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">New / Unread</span>
            <AlertCircle size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-500">{stats.new}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Action required</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Contacted</span>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600">{stats.contacted}</div>
          <div className="text-[11px] text-slate-500 mt-1">Followed up</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Converted</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.converted}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Orders/deals won</div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, phone, message..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="in_progress">In Progress</option>
              <option value="converted">Converted</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">All Sources</option>
              <option value="floating_widget">Floating Contact Form</option>
              <option value="contact_page">Contact Us Page</option>
              <option value="chatbot">Chatbot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Requirement / Message</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw size={24} className="animate-spin mx-auto text-sky-500 mb-2" />
                    <span>Loading inquiries...</span>
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Inbox size={32} className="mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No inquiries found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter !== 'all' || sourceFilter !== 'all'
                        ? 'Try clearing filters or search query.'
                        : 'New submissions from visitors will appear here in real time.'}
                    </p>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="hover:bg-slate-50/70 transition cursor-pointer"
                    onClick={() => openLeadDetail(lead)}
                  >
                    {/* Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{lead.name}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone size={11} className="text-slate-400" />
                        <span className="font-mono">{lead.phone}</span>
                      </div>
                      {lead.address && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate max-w-[200px]">
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">{lead.address}</span>
                        </div>
                      )}
                    </td>

                    {/* Source */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSourceBadge(lead.source)}
                    </td>

                    {/* Requirement */}
                    <td className="py-3.5 px-4 max-w-xs md:max-w-md">
                      <p className="text-slate-700 text-xs line-clamp-2 leading-relaxed">
                        {lead.requirement}
                      </p>
                      {lead.notes && (
                        <div className="text-[11px] text-sky-600 bg-sky-50 px-2 py-0.5 rounded mt-1 inline-flex items-center gap-1">
                          <FileText size={10} /> Note added
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDate(lead.created_at)}
                    </td>

                    {/* Status Select */}
                    <td className="py-3.5 px-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={lead.status}
                        disabled={updatingStatusId === lead.id}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                      >
                        <option value="new">🟡 New</option>
                        <option value="contacted">🔵 Contacted</option>
                        <option value="in_progress">🟣 In Progress</option>
                        <option value="converted">🟢 Converted</option>
                        <option value="closed">⚪ Closed</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openLeadDetail(lead)}
                          className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                          title="View Details"
                        >
                          <ChevronRight size={17} />
                        </button>
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Lead"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page <span className="font-semibold text-slate-800">{pagination.page}</span> of{' '}
              <span className="font-semibold text-slate-800">{pagination.totalPages}</span> ({pagination.total} leads)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchLeads(pagination.page - 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLeads(pagination.page + 1)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg font-medium hover:bg-slate-100 disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Details Modal / Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center font-bold text-sm">
                  {selectedLead.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-none">{selectedLead.name}</h3>
                  <span className="text-xs text-slate-400 mt-0.5 block">{getSourceBadge(selectedLead.source)}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition"
                >
                  <PhoneCall size={14} className="text-sky-600" />
                  <span>Call {selectedLead.phone}</span>
                </a>
                <a
                  href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>

              {/* Inquiry Details */}
              <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Requirement</span>
                  <span className="text-[11px] text-slate-400">{formatDate(selectedLead.created_at)}</span>
                </div>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedLead.requirement}
                </p>

                {selectedLead.address && (
                  <div className="pt-2 mt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-start gap-1.5">
                    <MapPin size={13} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-slate-700">Address: </span>
                      {selectedLead.address}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Update Lead Status
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {['new', 'contacted', 'in_progress', 'converted', 'closed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(selectedLead.id, st)}
                      className={`py-1.5 text-[11px] font-semibold rounded-lg border transition capitalize ${
                        selectedLead.status === st
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Admin Internal Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Record customer discussion notes, requested products, quotation price..."
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                  >
                    {savingNotes ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => handleDeleteLead(selectedLead.id)}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
              >
                <Trash2 size={13} /> Delete Lead
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
