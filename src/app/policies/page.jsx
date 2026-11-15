'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck, Plus, Search, Filter, Edit3, Trash2, Eye,
  Copy, ExternalLink, CheckCircle2, Clock, FileText,
  AlertCircle, Sparkles, RefreshCw, Layers, Globe, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/AdminLayout';
import PolicyEditor from './PolicyEditor';
import { adminApi } from '../../lib/api';

const POLICY_TYPE_BADGES = {
  privacy: { label: 'Privacy', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  refund: { label: 'Refund & Returns', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  terms: { label: 'Terms & Conditions', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  shipping: { label: 'Shipping & Delivery', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  cookie: { label: 'Cookies', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  custom: { label: 'Custom Policy', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Editor state
  const [editingPolicy, setEditingPolicy] = useState(null); // null = table view, 'new' = new policy, { ... } = edit
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Fetch all policies
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await adminApi.get('/policies/admin/all');
      if (res.success && Array.isArray(res.data)) {
        setPolicies(res.data);
      }
    } catch (err) {
      console.error('Error fetching policies:', err);
      toast.error(err.message || 'Failed to fetch legal policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  // Toggle Policy Published Status
  const handleToggleStatus = async (policy, e) => {
    e.stopPropagation();
    const newStatus = !policy.is_published;
    try {
      // Optimistic update
      setPolicies(prev =>
        prev.map(p => (p.id === policy.id ? { ...p, is_published: newStatus ? 1 : 0 } : p))
      );

      const res = await adminApi.put(`/policies/admin/${policy.id}`, {
        is_published: newStatus ? 1 : 0
      });

      if (res.success) {
        toast.success(`Policy marked as ${newStatus ? 'Published' : 'Draft'}`);
      }
    } catch (err) {
      fetchPolicies();
      toast.error('Failed to update status');
    }
  };

  // Delete Policy
  const handleDeletePolicy = async (id) => {
    try {
      const res = await adminApi.delete(`/policies/admin/${id}`);
      if (res.success) {
        toast.success('Policy deleted successfully');
        setPolicies(prev => prev.filter(p => p.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete policy');
    }
  };

  // Save Policy (Create or Update)
  const handleSavePolicy = async (formData) => {
    setSaving(true);
    try {
      if (editingPolicy?.id) {
        // Update
        const res = await adminApi.put(`/policies/admin/${editingPolicy.id}`, formData);
        if (res.success) {
          toast.success('Policy saved successfully!');
          setEditingPolicy(null);
          fetchPolicies();
        }
      } else {
        // Create
        const res = await adminApi.post('/policies/admin', formData);
        if (res.success) {
          toast.success('Policy created successfully!');
          setEditingPolicy(null);
          fetchPolicies();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  // Copy public policy link
  const handleCopyLink = (slug, e) => {
    e.stopPropagation();
    const url = `${window.location.origin.replace('3001', '3000')}/policies/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Public policy link copied to clipboard!');
  };

  // Filtered Policies
  const filteredPolicies = policies.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'published' && p.is_published) ||
      (filterStatus === 'draft' && !p.is_published);

    return matchesSearch && matchesType && matchesStatus;
  });

  const stats = {
    total: policies.length,
    published: policies.filter(p => p.is_published).length,
    drafts: policies.filter(p => !p.is_published).length
  };

  // If in editor view, render PolicyEditor
  if (editingPolicy) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto py-4">
          <PolicyEditor
            initialPolicy={editingPolicy === 'new' ? null : editingPolicy}
            onSave={handleSavePolicy}
            onCancel={() => setEditingPolicy(null)}
            saving={saving}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#F51F2D]/10 text-[#F51F2D] rounded-xl">
                <ShieldCheck size={22} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Policy Maker & Legal Documents
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Create, edit, and publish store policies. Paste formatted rich text directly from Microsoft Word / Google Docs or write custom HTML.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchPolicies}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setEditingPolicy('new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#F51F2D] hover:bg-[#d91926] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition active:scale-[0.98]"
            >
              <Plus size={16} />
              <span>Create New Policy</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Policies</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
            </div>
            <span className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <FileText size={20} />
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Live & Published</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.published}</h3>
            </div>
            <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={20} />
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Drafts</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-1">{stats.drafts}</h3>
            </div>
            <span className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policies by title or slug..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#F51F2D]/20 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 outline-none w-full sm:w-auto"
              >
                <option value="all">All Categories</option>
                <option value="privacy">Privacy</option>
                <option value="refund">Refund & Returns</option>
                <option value="terms">Terms & Conditions</option>
                <option value="shipping">Shipping</option>
                <option value="cookie">Cookies</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 outline-none w-full sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Policy Cards Grid / Table */}
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="inline-block animate-spin text-[#F51F2D]">
              <RefreshCw size={24} />
            </div>
            <p className="text-xs text-slate-500 mt-2">Loading policies...</p>
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
            <Shield size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No policies found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'Try adjusting your search terms.' : 'Create your first store policy or load standard templates.'}
            </p>
            <button
              onClick={() => setEditingPolicy('new')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F51F2D] text-white text-xs font-bold rounded-xl shadow-sm"
            >
              <Plus size={14} />
              <span>Create Policy</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {filteredPolicies.map((policy) => {
              const badge = POLICY_TYPE_BADGES[policy.type] || POLICY_TYPE_BADGES.custom;

              return (
                <div
                  key={policy.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[11px] font-medium text-slate-400">
                            v{policy.version || '1.0'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 hover:text-[#F51F2D] transition">
                          {policy.title}
                        </h3>
                      </div>

                      {/* Status Toggle Switch */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleStatus(policy, e)}
                        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                          policy.is_published ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                        title={policy.is_published ? 'Published (click to unpublish)' : 'Draft (click to publish)'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            policy.is_published ? 'translate-x-4' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {policy.summary && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {policy.summary}
                      </p>
                    )}

                    {/* Slug URL badge */}
                    <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-700">
                      <span className="truncate">/policies/{policy.slug}</span>
                      <div className="flex items-center gap-1.5 ml-2 shrink-0">
                        <button
                          onClick={(e) => handleCopyLink(policy.slug, e)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                          title="Copy public link"
                        >
                          <Copy size={13} />
                        </button>
                        <a
                          href={`/policies/${policy.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-blue-600 hover:text-blue-800 rounded transition"
                          title="Open public page"
                        >
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      <span>Effective: </span>
                      <strong className="text-slate-700">
                        {policy.effective_date ? new Date(policy.effective_date).toLocaleDateString() : 'Immediate'}
                      </strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const full = await adminApi.get(`/policies/admin/${policy.id}`);
                            setEditingPolicy(full.data || policy);
                          } catch (_) {
                            setEditingPolicy(policy);
                          }
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeleteConfirmId(policy.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete policy"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-rose-600">
                <span className="p-2 bg-rose-100 rounded-xl">
                  <AlertCircle size={22} />
                </span>
                <h3 className="text-base font-bold text-slate-900">Delete Legal Policy?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete this policy? Any customer links pointing to this policy will return 404 until recreated.
              </p>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePolicy(deleteConfirmId)}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
