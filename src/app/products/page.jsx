'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { adminApi } from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import {
  Plus, Download, Upload, Search, Trash, Filter, RefreshCw,
  ChevronDown, ChevronUp, X, Check, ArrowUpDown, Tag, Sparkles,
  ShoppingBag, AlertTriangle, Eye, Edit3, Power, CheckCircle,
  XCircle, Layers, Calendar, DollarSign, Package
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, pages: 1 });
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Filter options data
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [badges, setBadges] = useState([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [skuSearch, setSkuSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [stockStatusFilter, setStockStatusFilter] = useState(''); // '', 'in_stock', 'low_stock', 'out_of_stock'
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedBadgeId, setSelectedBadgeId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at_desc');
  const [page, setPage] = useState(1);

  // UI State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // Load filter options on mount
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [catRes, brandRes, badgeRes] = await Promise.all([
          adminApi.get('/categories'),
          adminApi.get('/brands'),
          adminApi.get('/badges')
        ]);

        if (catRes.success) {
          const catList = Array.isArray(catRes.data?.categories)
            ? catRes.data.categories
            : Array.isArray(catRes.data)
              ? catRes.data
              : [];
          setCategories(catList);
        }

        if (brandRes.success) {
          const bList = Array.isArray(brandRes.data?.brands)
            ? brandRes.data.brands
            : Array.isArray(brandRes.data)
              ? brandRes.data
              : [];
          setBrands(bList);
        }

        if (badgeRes.success) {
          const bdList = Array.isArray(badgeRes.data?.badges)
            ? badgeRes.data.badges
            : Array.isArray(badgeRes.data)
              ? badgeRes.data
              : [];
          setBadges(bdList);
        }
      } catch (err) {
        console.warn('Could not load all filter options:', err);
      }
    }
    loadFilterOptions();
  }, []);

  // Close category dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(e.target)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch products whenever filters or page change
  useEffect(() => {
    fetchProducts();
  }, [
    page,
    statusFilter,
    stockStatusFilter,
    selectedCategoryIds,
    selectedBrandId,
    selectedBadgeId,
    sortBy,
    createdFrom,
    createdTo
  ]);

  async function fetchProducts() {
    setLoading(true);
    const params = {
      page,
      limit: 25,
      sort: sortBy,
      status: statusFilter,
      ...(search.trim() && { search: search.trim() }),
      ...(skuSearch.trim() && { sku: skuSearch.trim() }),
      ...(stockStatusFilter && { stock_status: stockStatusFilter }),
      ...(selectedCategoryIds.length > 0 && { category_id: selectedCategoryIds.join(',') }),
      ...(selectedBrandId && { brand_id: selectedBrandId }),
      ...(selectedBadgeId && { badge_id: selectedBadgeId }),
      ...(minPrice && { min_price: minPrice }),
      ...(maxPrice && { max_price: maxPrice }),
      ...(createdFrom && { created_from: createdFrom }),
      ...(createdTo && { created_to: createdTo })
    };

    const res = await adminApi.get('/products', params);
    if (res.success && res.data) {
      const list = Array.isArray(res.data.products)
        ? res.data.products
        : Array.isArray(res.data)
          ? res.data
          : [];
      setProducts(list);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } else {
      setProducts([]);
      toast.error(res.message || 'Failed to load products');
    }
    setLoading(false);
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSkuSearch('');
    setStatusFilter('all');
    setStockStatusFilter('');
    setSelectedCategoryIds([]);
    setSelectedBrandId('');
    setSelectedBadgeId('');
    setMinPrice('');
    setMaxPrice('');
    setCreatedFrom('');
    setCreatedTo('');
    setSortBy('created_at_desc');
    setPage(1);
  };

  // Toggle category in multi-select
  const handleToggleCategory = (catId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
    setPage(1);
  };

  // CHANGE STATUS button toggle
  const handleToggleStatus = async (productId, currentIsActive) => {
    setTogglingId(productId);
    const newStatus = currentIsActive ? 0 : 1;
    try {
      const res = await adminApi.patch(`/products/${productId}/status`, { is_active: newStatus });
      if (res.success) {
        toast.success(
          `Product status changed to ${newStatus === 1 ? 'ACTIVE' : 'INACTIVE'}`,
          { icon: newStatus === 1 ? '🟢' : '⚪' }
        );
        // Optimistic update
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, is_active: newStatus } : p))
        );
      } else {
        toast.error(res.message || 'Failed to update product status');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to change status');
    } finally {
      setTogglingId(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) return;
    setIsDeleting(true);
    let successCount = 0;
    for (const id of selectedProductIds) {
      const res = await adminApi.delete(`/products/${id}`);
      if (res.success) successCount++;
    }
    toast.success(`Successfully deleted ${successCount} products.`);
    setSelectedProductIds([]);
    setIsDeleting(false);
    fetchProducts();
  };

  const handleExportCsv = async () => {
    window.open('https://backend.provokeplaytech.com/api/v1/products/export', '_blank');
  };

  const activeFilterCount =
    (statusFilter !== 'all' ? 1 : 0) +
    (stockStatusFilter ? 1 : 0) +
    selectedCategoryIds.length +
    (selectedBrandId ? 1 : 0) +
    (selectedBadgeId ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (createdFrom || createdTo ? 1 : 0) +
    (skuSearch ? 1 : 0);

  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <div className="space-y-6">
      {/* ─── Header & Top Actions ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="text-sky-600" /> Products Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage catalog items, pricing, inventory stock, categories, badges, and statuses
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedProductIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Trash size={14} /> {isDeleting ? 'Deleting...' : `Delete Selected (${selectedProductIds.length})`}
            </button>
          )}
          <button
            onClick={handleExportCsv}
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <Download size={14} /> Export CSV
          </button>
          <Link
            href="/products/import"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-slate-200"
          >
            <Upload size={14} /> Import CSV
          </Link>
          <Link
            href="/products/new"
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-sky-600/20"
          >
            <Plus size={14} /> Create Product
          </Link>
        </div>
      </div>

      {/* ─── Search & Quick Controls Bar ─────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Product Name or Description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* SKU Search */}
          <div className="relative w-full md:w-56">
            <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Sort Selector */}
          <div className="w-full md:w-56">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-white text-slate-700 focus:outline-none focus:border-sky-500"
            >
              <option value="created_at_desc">Sort: Newest First</option>
              <option value="created_at_asc">Sort: Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="sku_asc">SKU: A to Z</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
          >
            Search
          </button>

          {/* Toggle Advanced Filters Button */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${isFiltersOpen || activeFilterCount > 0
              ? 'bg-sky-50 border-sky-300 text-sky-700'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
          >
            <Filter size={14} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-sky-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
            {isFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {/* Clear Filters Button */}
          {(activeFilterCount > 0 || search || skuSearch) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </form>

        {/* ─── Expandable Advanced Filter Panel ───────────────────────────── */}
        {isFiltersOpen && (
          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
            {/* Multi-category Selector */}
            <div className="space-y-1 relative" ref={categoryDropdownRef}>
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <Layers size={12} /> Categories ({selectedCategoryIds.length} selected)
              </label>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen((prev) => !prev)}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-left font-medium flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedCategoryIds.length === 0
                    ? 'All Categories'
                    : `${selectedCategoryIds.length} Category Selected`}
                </span>
                <ChevronDown size={14} className="text-slate-400 shrink-0" />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-30 max-h-56 overflow-y-auto space-y-1">
                  <div className="p-1 border-b border-slate-100 flex justify-between items-center text-[11px]">
                    <span className="font-bold text-slate-600">Select Categories</span>
                    {selectedCategoryIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategoryIds([])}
                        className="text-red-500 font-bold hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {categories.map((c) => {
                    const isChecked = selectedCategoryIds.includes(String(c.id));
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${isChecked ? 'bg-sky-50 text-sky-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCategory(String(c.id))}
                          className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{c.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Brand Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <Sparkles size={12} /> Brand
              </label>
              <select
                value={selectedBrandId}
                onChange={(e) => {
                  setSelectedBrandId(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="">All Brands</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Badge Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <Tag size={12} /> Badge
              </label>
              <select
                value={selectedBadgeId}
                onChange={(e) => {
                  setSelectedBadgeId(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="">All Badges</option>
                {badges.map((bd) => (
                  <option key={bd.id} value={bd.id}>
                    {bd.badge_text || bd.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600">Product Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="all">All (Active & Inactive)</option>
                <option value="active">Active Products Only</option>
                <option value="inactive">Inactive Products Only</option>
              </select>
            </div>

            {/* Stock Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <Package size={12} /> Stock Availability
              </label>
              <select
                value={stockStatusFilter}
                onChange={(e) => {
                  setStockStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
              >
                <option value="">All Stock Levels</option>
                <option value="in_stock">In Stock (&gt; 0)</option>
                <option value="low_stock">Low Stock (≤ Threshold)</option>
                <option value="out_of_stock">Out of Stock (0)</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <DollarSign size={12} /> Price Range (₹)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-1/2 p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-1/2 p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Creation Date Range */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[11px] font-bold uppercase text-slate-600 flex items-center gap-1">
                <Calendar size={12} /> Date of Creation
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={createdFrom}
                  onChange={(e) => {
                    setCreatedFrom(e.target.value);
                    setPage(1);
                  }}
                  className="w-1/2 p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
                />
                <span className="text-slate-400 text-xs">to</span>
                <input
                  type="date"
                  value={createdTo}
                  onChange={(e) => {
                    setCreatedTo(e.target.value);
                    setPage(1);
                  }}
                  className="w-1/2 p-2 border border-slate-200 rounded-xl text-xs bg-white font-medium focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selected Categories Chips */}
        {selectedCategoryIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold">Active Categories:</span>
            {selectedCategoryIds.map((catId) => {
              const cat = categories.find((c) => String(c.id) === String(catId));
              return (
                <span
                  key={catId}
                  className="inline-flex items-center gap-1 bg-sky-100 text-sky-800 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                >
                  {cat?.name || `Category #${catId}`}
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(catId)}
                    className="hover:text-red-600 ml-0.5"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Main Products Catalog Table ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 font-medium flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-sky-600" />
            Loading catalog items...
          </div>
        ) : safeProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedProductIds(safeProducts.map((p) => p.id));
                        else setSelectedProductIds([]);
                      }}
                      checked={
                        safeProducts.length > 0 && selectedProductIds.length === safeProducts.length
                      }
                      className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-full min-w-[280px]">Product Details</th>
                  <th className="p-4 whitespace-nowrap w-36">SKU & Brand</th>
                  <th className="p-4 whitespace-nowrap w-36">Category</th>
                  <th className="p-4 whitespace-nowrap w-36">Price & Sale Price</th>
                  <th className="p-4 whitespace-nowrap w-40">Status</th>
                  <th className="p-4 text-right whitespace-nowrap w-40">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {safeProducts.map((p) => {
                  const hasSalePrice = p.sale_price && parseFloat(p.sale_price) > 0;
                  const basePriceVal = parseFloat(p.base_price || 0);
                  const salePriceVal = parseFloat(p.sale_price || 0);
                  const discountPct =
                    hasSalePrice && basePriceVal > salePriceVal
                      ? Math.round(((basePriceVal - salePriceVal) / basePriceVal) * 100)
                      : 0;
                  const isLowStock = p.stock_qty <= (p.low_stock_threshold || 5);
                  const isOutOfStock = p.stock_qty <= 0;
                  const isToggling = togglingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedProductIds.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedProductIds([...selectedProductIds, p.id]);
                            else setSelectedProductIds(selectedProductIds.filter((id) => id !== p.id));
                          }}
                          className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Product Thumbnail & Name */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                            {p.primary_image ? (
                              <img
                                src={p.primary_image}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ShoppingBag size={20} className="text-slate-300" />
                            )}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <Link
                              href={`/products/${p.id}/edit`}
                              className="font-bold text-slate-900 text-sm hover:text-sky-600 transition line-clamp-2 leading-snug"
                              title={p.name}
                            >
                              {p.name}
                            </Link>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 whitespace-nowrap">
                                {p.product_type || 'simple'}
                              </span>
                              {p.badges &&
                                p.badges.map((b) => (
                                  <span
                                    key={b.id}
                                    style={{
                                      backgroundColor: b.bg_color || '#e0f2fe',
                                      color: b.text_color || '#0369a1'
                                    }}
                                    className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap"
                                  >
                                    {b.badge_text || b.name}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Brand */}
                      <td className="p-4 space-y-0.5 whitespace-nowrap w-36">
                        <div className="font-mono font-bold text-slate-800 text-xs">{p.sku || '-'}</div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          {p.brand_name ? (
                            <span className="text-sky-700">{p.brand_name}</span>
                          ) : (
                            <span className="text-slate-400">No brand</span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 whitespace-nowrap w-36">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                          {p.category_name || 'Uncategorized'}
                        </span>
                      </td>

                      {/* Pricing: Base Price & Sale Price */}
                      <td className="p-4 whitespace-nowrap w-36">
                        <div className="space-y-0.5 whitespace-nowrap">
                          {/* Base Price */}
                          <div
                            className={`font-black text-xs whitespace-nowrap ${hasSalePrice ? 'text-slate-400 line-through' : 'text-slate-900 text-sm'
                              }`}
                          >
                            ₹{basePriceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>

                          {/* Sale Price under Base Price */}
                          {hasSalePrice ? (
                            <div className="text-xs font-black text-emerald-600 flex items-center gap-1.5 whitespace-nowrap">
                              <span>
                                ₹{salePriceVal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              {discountPct > 0 && (
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5 rounded whitespace-nowrap">
                                  -{discountPct}%
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="text-[10px] text-slate-400 font-medium whitespace-nowrap">No sale price</div>
                          )}
                        </div>
                      </td>

                      {/* Status Badge & Stock Info (Under Status) */}
                      <td className="p-4 whitespace-nowrap w-40">
                        <div className="flex flex-col items-start gap-1.5 whitespace-nowrap">
                          <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap ${isOutOfStock
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">
                              ({p.stock_qty || 0})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Action Buttons: CHANGE STATUS + Edit */}
                      <td className="p-4 text-right whitespace-nowrap w-40">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {/* CHANGE STATUS BUTTON (Toggles between Inactive and Active) */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p.id, p.is_active)}
                            disabled={isToggling}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 border whitespace-nowrap shadow-2xs ${p.is_active
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300'
                              } disabled:opacity-50`}
                            title={p.is_active ? 'Click to make INACTIVE' : 'Click to make ACTIVE'}
                          >
                            {isToggling ? (
                              <RefreshCw size={12} className="animate-spin" />
                            ) : (
                              <Power size={12} />
                            )}
                            <span>{p.is_active ? 'Set Inactive' : 'Set Active'}</span>
                          </button>

                          {/* Edit Item Link */}
                          <Link
                            href={`/products/${p.id}/edit`}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            title="Edit Product Details"
                          >
                            <Edit3 size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center text-xs text-slate-400 font-medium">
            No products match the selected criteria or search term.
          </div>
        )}

        {/* ─── Pagination Footer ─────────────────────────────────────────── */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} Total Products)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition shadow-xs"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-7 h-7 rounded-lg font-bold text-xs transition ${page === pageNum
                        ? 'bg-sky-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-50 hover:bg-slate-100 transition shadow-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
