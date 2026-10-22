'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  BookOpen, Plus, Search, Eye, Edit3, Trash2, CheckCircle2,
  XCircle, Filter, Calendar, Clock, User, ExternalLink, Image as ImageIcon,
  UploadCloud, ArrowUpDown, Sparkles, RefreshCw
} from 'lucide-react';

export default function BlogsAdminPage() {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('edit'); // 'edit' or 'preview'

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featured_image: '',
    category_name: 'RC Cars',
    category_slug: 'rc-cars',
    author_name: 'Provoke Playtech Team',
    reading_time: '5 min read',
    is_published: 1,
    meta_title: '',
    meta_desc: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [blogsRes, catsRes] = await Promise.all([
        adminApi.get('/blogs/admin/all'),
        adminApi.get('/blogs/categories')
      ]);

      if (blogsRes.success && blogsRes.data) {
        setBlogs(blogsRes.data);
      }
      if (catsRes.success && catsRes.data) {
        setCategories(catsRes.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load blog data');
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-generate slug from title
  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (e) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      // Auto-generate slug if not editing an existing custom slug or if slug was empty
      slug: editingBlog ? prev.slug : generateSlug(title),
      meta_title: prev.meta_title ? prev.meta_title : `${title} — Provoke Playtech`
    }));
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    // Auto-calculate reading time (approx 200 words per minute)
    const words = content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));
    setFormData(prev => ({
      ...prev,
      content,
      reading_time: `${minutes} min read`
    }));
  };

  const openCreateModal = () => {
    setEditingBlog(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image: '',
      category_name: categories[0]?.name || 'RC Cars',
      category_slug: categories[0]?.slug || 'rc-cars',
      author_name: 'Provoke Playtech Team',
      reading_time: '5 min read',
      is_published: 1,
      meta_title: '',
      meta_desc: ''
    });
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setFormData({
      title: blog.title || '',
      slug: blog.slug || '',
      excerpt: blog.excerpt || '',
      content: blog.content || '',
      featured_image: blog.featured_image || '',
      category_name: blog.category_name || 'General',
      category_slug: blog.category_slug || 'general',
      author_name: blog.author_name || 'Provoke Playtech Team',
      reading_time: blog.reading_time || '5 min read',
      is_published: blog.is_published ? 1 : 0,
      meta_title: blog.meta_title || '',
      meta_desc: blog.meta_desc || ''
    });
    setActiveTab('edit');
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WEBP)');
      return;
    }

    setUploadingImage(true);
    try {
      const filename = `blog-cover-${Date.now()}.${file.name.split('.').pop()}`;
      const res = await adminApi.post(`/storage/upload?key=${encodeURIComponent(`blogs/${filename}`)}&contentType=${encodeURIComponent(file.type)}`, {});

      if (res.success && res.data?.uploadUrl) {
        const fullUploadUrl = res.data.uploadUrl.startsWith('http')
          ? res.data.uploadUrl
          : adminApi.baseURL.replace('/api/v1', '') + res.data.uploadUrl;

        const uploadRes = await fetch(fullUploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        });

        if (uploadRes.ok) {
          const finalUrl = res.data.fileUrl || res.data.uploadUrl;
          setFormData(prev => ({ ...prev, featured_image: finalUrl }));
          toast.success('Cover image uploaded successfully!');
        } else {
          toast.error('Storage upload failed');
        }
      } else {
        // Fallback: load as data URL
        const reader = new FileReader();
        reader.onload = () => {
          setFormData(prev => ({ ...prev, featured_image: reader.result }));
          toast.success('Cover image loaded!');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Blog title is required');
      return;
    }
    if (!formData.slug.trim()) {
      toast.error('URL slug is required');
      return;
    }
    if (!formData.content.trim()) {
      toast.error('Blog content is required');
      return;
    }

    setSaving(true);
    try {
      if (editingBlog) {
        // Update
        const res = await adminApi.put(`/blogs/admin/${editingBlog.id}`, formData);
        if (res.success) {
          toast.success('Blog post updated successfully!');
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error(res.message || 'Failed to update blog');
        }
      } else {
        // Create
        const res = await adminApi.post('/blogs/admin', formData);
        if (res.success) {
          toast.success('Blog post published successfully!');
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error(res.message || 'Failed to create blog');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error saving blog post');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (blog) => {
    try {
      const newStatus = blog.is_published ? 0 : 1;
      const res = await adminApi.put(`/blogs/admin/${blog.id}`, { is_published: newStatus });
      if (res.success) {
        toast.success(newStatus ? 'Article published!' : 'Article moved to drafts');
        setBlogs(prev =>
          prev.map(b => (b.id === blog.id ? { ...b, is_published: newStatus } : b))
        );
      } else {
        toast.error('Failed to change status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Status update failed');
    }
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await adminApi.delete(`/blogs/admin/${id}`);
      if (res.success) {
        toast.success('Blog deleted successfully');
        setBlogs(prev => prev.filter(b => b.id !== id));
      } else {
        toast.error(res.message || 'Failed to delete blog');
      }
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  };

  // Filtered Blogs
  const filteredBlogs = blogs.filter((b) => {
    const matchesSearch =
      !searchQuery.trim() ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.excerpt && b.excerpt.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'all' ||
      b.category_slug === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'published' && b.is_published) ||
      (selectedStatus === 'draft' && !b.is_published);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const totalBlogs = blogs.length;
  const publishedCount = blogs.filter(b => b.is_published).length;
  const draftsCount = totalBlogs - publishedCount;
  const totalViews = blogs.reduce((sum, b) => sum + (Number(b.views_count) || 0), 0);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-100 text-[#F51F2D] rounded-xl flex items-center justify-center shadow-inner">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Blogs & Articles</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                {totalBlogs} Total
              </span>
            </div>
            <p className="text-slate-500 text-sm">
              Create, edit, and publish engaging articles, parenting tips, and guides for Provoke Playtech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh List"
          >
            <RefreshCw size={16} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F51F2D] hover:bg-[#d41828] text-white text-sm font-bold shadow-md shadow-red-500/20 transition"
          >
            <Plus size={18} />
            <span>New Blog Post</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center font-bold">
            📚
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Posts</div>
            <div className="text-xl font-black text-slate-900">{totalBlogs}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Published</div>
            <div className="text-xl font-black text-emerald-600">{publishedCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Drafts</div>
            <div className="text-xl font-black text-amber-600">{draftsCount}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 text-sky-600 rounded-lg flex items-center justify-center font-bold">
            <Eye size={20} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Total Views</div>
            <div className="text-xl font-black text-sky-600">{totalViews.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, slug, excerpt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1 text-xs text-slate-600">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F51F2D]/20"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#F51F2D]/20"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
        </div>
      </div>

      {/* Blogs List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-3 border-[#F51F2D] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-semibold">Loading blogs catalog...</span>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-700">No blog posts found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or create a new blog post.</p>
            <button
              onClick={openCreateModal}
              className="mt-4 px-4 py-2 bg-[#F51F2D] text-white text-xs font-bold rounded-xl hover:bg-[#d41828] transition"
            >
              + Create First Blog
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4 text-center">Views</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50/60 transition group">
                    {/* Thumbnail & Title */}
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 relative">
                          {blog.featured_image ? (
                            <img
                              src={blog.featured_image}
                              alt={blog.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <ImageIcon size={18} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 group-hover:text-[#F51F2D] transition line-clamp-1">
                            {blog.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">
                            /blogs/{blog.slug}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {blog.category_name || 'General'}
                      </span>
                    </td>

                    {/* Author & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-700">{blog.author_name || 'Provoke Playtech'}</div>
                      <div className="text-[10px] text-slate-400">{blog.reading_time || '5 min read'}</div>
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-700">
                        {(Number(blog.views_count) || 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(blog)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${blog.is_published
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          }`}
                        title="Click to toggle publish status"
                      >
                        {blog.is_published ? (
                          <>
                            <CheckCircle2 size={12} />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Live link to storefront */}
                        <a
                          href={`http://localhost:3000/blogs/${blog.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition"
                          title="View on Storefront"
                        >
                          <ExternalLink size={14} />
                        </a>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditModal(blog)}
                          className="p-1.5 text-slate-400 hover:text-[#F51F2D] rounded-lg hover:bg-red-50 transition"
                          title="Edit Article"
                        >
                          <Edit3 size={14} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(blog.id, blog.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                          title="Delete Article"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* CREATE / EDIT SLIDE-OVER MODAL                                */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex justify-center items-start p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-6 overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-[#F51F2D] rounded-xl flex items-center justify-center font-bold">
                  {editingBlog ? <Edit3 size={20} /> : <Plus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingBlog ? 'Edit Blog Article' : 'Create New Blog Article'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingBlog ? `Editing ID: #${editingBlog.id}` : 'Draft a new story for the Provoke Playtech storefront'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex border border-slate-200 rounded-xl p-0.5 bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('edit')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${activeTab === 'edit' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${activeTab === 'preview' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Live Preview
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 flex-1 overflow-y-auto max-h-[75vh]">
              {activeTab === 'edit' ? (
                <>
                  {/* Title & Slug */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Article Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="e.g. How to Choose the Best RC Car for Kids"
                        required
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] font-bold text-slate-900"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        URL Slug *
                      </label>
                      <div className="flex items-center">
                        <span className="text-[11px] bg-slate-100 text-slate-500 px-3 py-3 border border-r-0 border-slate-300 rounded-l-xl font-mono">
                          /blogs/
                        </span>
                        <input
                          type="text"
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }))}
                          placeholder="how-to-choose-best-rc-car"
                          required
                          className="w-full text-xs p-3 border border-slate-300 rounded-r-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20 focus:border-[#F51F2D] font-mono text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Category, Author & Reading Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Category *
                      </label>
                      <select
                        value={formData.category_slug}
                        onChange={(e) => {
                          const catSlug = e.target.value;
                          const found = categories.find(c => c.slug === catSlug);
                          setFormData(prev => ({
                            ...prev,
                            category_slug: catSlug,
                            category_name: found ? found.name : 'General'
                          }));
                        }}
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20"
                      >
                        {categories.map((c) => (
                          <option key={c.id || c.slug} value={c.slug}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Author Name
                      </label>
                      <input
                        type="text"
                        value={formData.author_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                        placeholder="e.g. Provoke Playtech Team"
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Reading Time
                      </label>
                      <input
                        type="text"
                        value={formData.reading_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, reading_time: e.target.value }))}
                        placeholder="e.g. 5 min read"
                        className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white"
                      />
                    </div>
                  </div>

                  {/* Featured Cover Image */}
                  <div className="space-y-2 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Featured Cover Image
                    </label>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {formData.featured_image ? (
                        <div className="w-28 h-20 rounded-xl overflow-hidden bg-white border border-slate-300 relative flex-shrink-0">
                          <img
                            src={formData.featured_image}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, featured_image: '' }))}
                            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-[10px]"
                            title="Remove Cover"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-28 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 bg-white">
                          <ImageIcon size={24} />
                          <span className="text-[9px] mt-1">No Cover</span>
                        </div>
                      )}

                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition">
                            <UploadCloud size={14} />
                            <span>{uploadingImage ? 'Uploading...' : 'Upload Image File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </label>
                          <span className="text-[11px] text-slate-400">or enter image URL below</span>
                        </div>
                        <input
                          type="text"
                          value={formData.featured_image}
                          onChange={(e) => setFormData(prev => ({ ...prev, featured_image: e.target.value }))}
                          placeholder="https://images.unsplash.com/... or upload"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Short Excerpt / Summary
                    </label>
                    <textarea
                      rows={2}
                      value={formData.excerpt}
                      onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                      placeholder="A short, catchy overview of the article shown on blog cards..."
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-[#F51F2D]/20"
                    />
                  </div>

                  {/* Content (HTML supported) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Article Content (HTML supported) *
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Supports &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;li&gt;, &lt;strong&gt;, etc.
                      </span>
                    </div>
                    <textarea
                      rows={10}
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="<p class='lead'>Write your article here...</p>&#10;&#10;<h2>Why RC Cars are Fun</h2>&#10;<p>Explanation paragraph...</p>"
                      required
                      className="w-full text-xs p-3 border border-slate-300 rounded-xl font-mono bg-white focus:ring-2 focus:ring-[#F51F2D]/20 leading-relaxed"
                    />
                  </div>

                  {/* SEO Fields Accordion */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      <span>SEO Metadata (Optional)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.meta_title}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                          placeholder="e.g. Top RC Cars for Kids in 2026 — Provoke Playtech"
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Meta Description
                        </label>
                        <input
                          type="text"
                          value={formData.meta_desc}
                          onChange={(e) => setFormData(prev => ({ ...prev, meta_desc: e.target.value }))}
                          placeholder="e.g. Find the safest and fastest remote control vehicles..."
                          className="w-full text-xs p-2.5 border border-slate-300 rounded-xl bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Publish Status Toggle */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_published === 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_published: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4 text-[#F51F2D] rounded focus:ring-[#F51F2D]"
                      />
                      <span className="text-xs font-bold text-slate-800">
                        Publish Immediately (Make visible on storefront)
                      </span>
                    </label>
                  </div>
                </>
              ) : (
                /* LIVE PREVIEW TAB */
                <div className="space-y-6">
                  {/* Preview Banner */}
                  {formData.featured_image && (
                    <div className="w-full h-64 rounded-2xl overflow-hidden border border-slate-200">
                      <img
                        src={formData.featured_image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <span className="inline-block px-3 py-1 bg-red-100 text-[#F51F2D] font-bold text-xs rounded-full">
                      {formData.category_name}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                      {formData.title || 'Untitled Article'}
                    </h1>
                    <div className="flex items-center gap-4 text-xs text-slate-500 pt-1 border-b border-slate-100 pb-3">
                      <span>By {formData.author_name}</span>
                      <span>•</span>
                      <span>{formData.reading_time}</span>
                    </div>
                  </div>

                  {formData.excerpt && (
                    <div className="p-4 bg-slate-50 border-l-4 border-[#F51F2D] rounded-r-xl text-xs text-slate-700 italic">
                      {formData.excerpt}
                    </div>
                  )}

                  {/* Rendered HTML Body */}
                  <div
                    className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-400 italic">No content written yet...</p>' }}
                  />
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F51F2D] hover:bg-[#d41828] text-white text-xs font-bold shadow-md shadow-red-500/20 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving Article...</span>
                    </>
                  ) : (
                    <span>{editingBlog ? 'Save Changes' : 'Publish Article'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
