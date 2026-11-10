'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth, isAuthorizedAdminRole } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, Tag, CreditCard,
  Percent, Users, Briefcase, Award, Truck, BarChart3, ShieldCheck,
  Activity, Database, LogOut, Star, Search, PanelBottom, PanelTop, BookOpen,
  Inbox, Bot, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Menu, X,
  ExternalLink, Sparkles, Clock, Share2, FolderTree, FileSpreadsheet,
  Ticket, Image, PanelsTopLeft, Hash, Compass, Smartphone, AlertTriangle,
  Globe, Store, Radio
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview & Insights',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
      { label: 'Sales Reports', href: '/reports/sales', icon: BarChart3 },
      { label: 'Activity Audit Log', href: '/activity-log', icon: Activity },
    ],
  },
  {
    id: 'commerce',
    title: 'Orders & Customers',
    items: [
      { label: 'Orders Feed', href: '/orders', icon: Package, exact: true },
      { label: 'Reseller Queue', href: '/orders/reseller-pending', icon: Clock, badge: 'Queue', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
      { label: 'Users & Customers', href: '/users', icon: Users, exact: true },
      { label: 'Inquiries & Leads', href: '/leads', icon: Inbox, badge: 'New', badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30' },
      { label: 'Reseller Accounts', href: '/users/resellers', icon: Briefcase },
      { label: 'Affiliates Program', href: '/users/affiliates', icon: Share2 },
    ],
  },
  {
    id: 'catalog',
    title: 'Catalog & Inventory',
    items: [
      { label: 'Products Catalog', href: '/products', icon: ShoppingBag, exact: true },
      { label: 'Low Stock Alerts', href: '/products/low-stock', icon: AlertTriangle, badge: 'Alert', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
      { label: 'Categories', href: '/categories', icon: FolderTree },
      { label: 'Brands', href: '/brands', icon: Sparkles },
      { label: 'CSV Bulk Import', href: '/products/import', icon: FileSpreadsheet },
      { label: 'Customer Reviews', href: '/products/reviews', icon: Star },
      { label: 'Badges Manager', href: '/badges', icon: Award },
    ],
  },
  {
    id: 'marketing',
    title: 'Marketing & Promotions',
    items: [
      { label: 'Offers Engine', href: '/offers', icon: Percent, badge: 'Live', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
      { label: 'Discount Coupons', href: '/coupons', icon: Ticket },
      { label: 'Hero Banners', href: '/banners', icon: Image },
      { label: 'Blogs & Articles', href: '/blogs', icon: BookOpen },
    ],
  },
  {
    id: 'storefront',
    title: 'Storefront & Design',
    items: [
      { label: 'Homepage Layout', href: '/homepage-layout', icon: PanelsTopLeft },
      { label: 'Section Tags', href: '/section-tags', icon: Hash },
      { label: 'Header & Logo', href: '/settings/header', icon: PanelTop },
      { label: 'Footer Settings', href: '/settings/footer', icon: PanelBottom },
      { label: 'Chatbot & Widgets', href: '/settings/chatbot', icon: Bot },
    ],
  },
  {
    id: 'system',
    title: 'Operations & Settings',
    items: [
      { label: 'Store Defaults', href: '/settings/store', icon: Store },
      { label: 'Payment Gateways', href: '/payments/gateways', icon: CreditCard },
      { label: 'Shipping Presets', href: '/shipping/presets', icon: Truck },
      { label: 'Shipping Settings', href: '/shipping/settings', icon: Compass },
      { label: 'Staff & Roles', href: '/staff', icon: ShieldCheck },
      { label: 'SMS Notifications', href: '/settings/sms', icon: Smartphone },
      { label: 'Search & Catalog', href: '/settings/search', icon: Search },
      { label: 'SEO Settings', href: '/settings/seo', icon: Globe },
      { label: 'Redis Cache', href: '/settings/cache', icon: Database },
    ],
  },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, logout } = useAdminAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Read saved sidebar collapse preference on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('weprixe_admin_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsed(saved === 'true');
      }
    } catch (e) {
      // Ignore localStorage read errors
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('weprixe_admin_sidebar_collapsed', String(next));
      } catch (e) {}
      return next;
    });
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const isItemActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
  };

  // Find current active item title and category for header breadcrumb
  const currentNavInfo = useMemo(() => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (isItemActive(item)) {
          return { section: section.title, item: item.label };
        }
      }
    }
    // Fallback based on pathname
    const clean = pathname.replace(/^\//, '').split('/')[0];
    const fallbackTitle = clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Dashboard';
    return { section: 'Admin Center', item: fallbackTitle };
  }, [pathname]);

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return NAV_SECTIONS;

    return NAV_SECTIONS.map((section) => {
      const matchingItems = section.items.filter((item) => {
        return (
          item.label.toLowerCase().includes(query) ||
          item.href.toLowerCase().includes(query) ||
          section.title.toLowerCase().includes(query)
        );
      });
      return {
        ...section,
        items: matchingItems,
      };
    }).filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const totalFilteredCount = useMemo(() => {
    return filteredSections.reduce((acc, s) => acc + s.items.length, 0);
  }, [filteredSections]);

  useEffect(() => {
    if (!loading && pathname !== '/login') {
      if (!admin || !isAuthorizedAdminRole(admin.role)) {
        router.push('/login');
      }
    }
  }, [loading, admin, pathname, router]);

  if (pathname === '/login') return children;

  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 font-medium text-sm space-y-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-2xl bg-sky-500/20 animate-ping"></div>
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-sky-500/25">
            W
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <div className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></div>
          Authenticating secure admin session...
        </div>
      </div>
    );
  }

  if (!admin || !isAuthorizedAdminRole(admin.role)) return null;

  // Extract initials for user avatar
  const adminName = admin?.name || 'Administrator';
  const adminRole = admin?.role || 'admin';
  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'AD';

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-sans antialiased text-slate-900">
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Modern Executive Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 lg:static flex flex-col bg-slate-950 border-r border-slate-800/80 text-slate-300 transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isSidebarCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Top Brand Header */}
        <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0 bg-slate-950/90 backdrop-blur">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-extrabold text-lg tracking-wider">
                  W
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight">WePrixe</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20 tracking-wider">
                    ADMIN
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-medium">Enterprise Suite</span>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-extrabold text-lg">
                W
              </div>
            </div>
          )}

          {/* Sidebar Collapse Toggle (Desktop) / Close (Mobile) */}
          <div className="flex items-center">
            <button
              onClick={toggleSidebarCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Quick Search / Filter Bar (Expanded Mode) */}
        {!isSidebarCollapsed && (
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Quick jump (e.g. orders, offers)..."
                className="w-full bg-slate-900/90 text-slate-200 placeholder-slate-400 text-xs rounded-xl pl-8.5 pr-8 py-2 border border-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            {searchQuery && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1.5">
                <span>Found {totalFilteredCount} matches</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sky-400 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 admin-scrollbar">
          {filteredSections.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-500">
                <Search size={16} />
              </div>
              <p className="text-xs font-semibold text-slate-300">No matching menu items</p>
              <p className="text-[11px] text-slate-500 mt-1">Try another keyword or clear search filter</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs text-sky-400 hover:text-sky-300 font-medium"
              >
                Reset Search
              </button>
            </div>
          ) : (
            filteredSections.map((section) => {
              const isCollapsed = !searchQuery && collapsedSections[section.id];
              const hasActiveChild = section.items.some((item) => isItemActive(item));

              return (
                <div key={section.id} className="space-y-1">
                  {/* Category Header */}
                  {!isSidebarCollapsed && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400 hover:text-slate-200 transition-colors select-none rounded group"
                    >
                      <span className={`group-hover:text-slate-300 ${hasActiveChild ? 'text-sky-400 font-extrabold' : ''}`}>
                        {section.title}
                      </span>
                      <span className="text-slate-400 group-hover:text-slate-400 transition-transform">
                        {isCollapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                      </span>
                    </button>
                  )}

                  {/* Section Divider in collapsed sidebar rail */}
                  {isSidebarCollapsed && (
                    <div className="w-8 h-px bg-slate-800/80 mx-auto my-2" title={section.title} />
                  )}

                  {/* Category Items */}
                  {(!isCollapsed || isSidebarCollapsed) && (
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            title={isSidebarCollapsed ? `${item.label} (${section.title})` : undefined}
                            className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                              active
                                ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-semibold shadow-md shadow-sky-600/25'
                                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
                            } ${isSidebarCollapsed ? 'justify-center px-0 py-2.5' : ''}`}
                          >
                            <Icon
                              size={17}
                              className={`flex-shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                                active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                              }`}
                            />

                            {!isSidebarCollapsed && (
                              <div className="flex-1 flex items-center justify-between truncate">
                                <span className="truncate">{item.label}</span>
                                {item.badge && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border tracking-wide uppercase ${
                                      active
                                        ? 'bg-white/20 text-white border-white/30'
                                        : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Active Indicator bar in rail mode */}
                            {isSidebarCollapsed && active && (
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-sky-400 rounded-l-full shadow-sm shadow-sky-400/50" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </nav>

        {/* Storefront Link & System Health */}
        {!isSidebarCollapsed && (
          <div className="px-3 pt-2 pb-1 flex-shrink-0">
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-400 hover:text-white transition-all group"
            >
              <div className="flex items-center gap-2">
                <Store size={14} className="text-emerald-400" />
                <span className="font-semibold text-slate-300 group-hover:text-white">Customer Store</span>
              </div>
              <ExternalLink size={13} className="text-slate-400 group-hover:text-slate-300" />
            </a>
          </div>
        )}

        {/* User Profile & Session Controls */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950 flex-shrink-0">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between gap-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {adminInitials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate leading-snug">{adminName}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {adminRole}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                title="Sign out of session"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="relative" title={`${adminName} (${adminRole})`}>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                  {adminInitials}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-950" />
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                title="Sign out of session"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between flex-shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Info */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>WePrixe Control</span>
                <span>/</span>
                <span className="text-slate-600">{currentNavInfo.section}</span>
              </div>
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight">
                {currentNavInfo.item}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live API Status Pill */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>API Live : 4000</span>
            </div>

            {/* Storefront Link */}
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg transition-colors border border-slate-200"
            >
              <Store size={14} className="text-sky-600" />
              <span>Live Store</span>
              <ExternalLink size={12} className="text-slate-400" />
            </a>

            {/* User Avatar Chip */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                {adminInitials}
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight">{adminName}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">{adminRole}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/70 admin-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
