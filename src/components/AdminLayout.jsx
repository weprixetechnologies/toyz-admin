'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Layers, Tag, CreditCard,
  Percent, Users, Briefcase, Award, Truck, BarChart3, ShieldCheck,
  Activity, MessageSquare, Database, LogOut, Star
} from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, loading, logout } = useAdminAuth();

  useEffect(() => {
    if (!loading && !admin && pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, admin, pathname, router]);

  if (pathname === '/login') return children;

  if (loading) {
    return (
      <div className="h-screen bg-slate-900 flex items-center justify-center text-slate-300 font-semibold text-sm">
        Authenticating Admin session...
      </div>
    );
  }

  if (!admin) return null;

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Orders Feed', href: '/orders', icon: Package },
    { label: 'Reseller Queue', href: '/orders/reseller-pending', icon: Briefcase },
    { label: 'Users & Customers', href: '/users', icon: Users, exact: true },
    { label: 'Products Catalog', href: '/products', icon: ShoppingBag },
    { label: 'CSV Import', href: '/products/import', icon: Layers },
    { label: 'Banners', href: '/banners', icon: Layers },
    { label: 'Section Tags', href: '/section-tags', icon: Tag },
    { label: 'Homepage Layout', href: '/homepage-layout', icon: Layers },
    { label: 'Categories', href: '/categories', icon: Tag },
    { label: 'Brands', href: '/brands', icon: Layers },
    { label: 'Badges Manager', href: '/badges', icon: Award },
    { label: 'Reviews', href: '/products/reviews', icon: Star },
    { label: 'Payment Gateways', href: '/payments/gateways', icon: CreditCard },
    { label: 'Offers Engine', href: '/offers', icon: Percent },
    { label: 'Coupons', href: '/coupons', icon: Tag },
    { label: 'Reseller Accounts', href: '/users/resellers', icon: Briefcase },
    { label: 'Affiliates Program', href: '/users/affiliates', icon: Award },
    { label: 'Shipping Presets', href: '/shipping/presets', icon: Truck },
    { label: 'Shipping Settings', href: '/shipping/settings', icon: Truck },
    { label: 'Sales Reports', href: '/reports/sales', icon: BarChart3 },
    { label: 'Staff & Roles', href: '/staff', icon: ShieldCheck },
    { label: 'Activity Audit Log', href: '/activity-log', icon: Activity },
    { label: 'SMS Admin', href: '/settings/sms', icon: MessageSquare },
    { label: 'Redis Cache', href: '/settings/cache', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-5 border-b border-slate-800">
          <Link href="/" className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <span className="text-sky-400">WePrixe</span> Admin Panel
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact
              ? pathname === item.href
              : (pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${active ? 'bg-sky-600 text-white shadow' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                  }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{admin?.name || 'Superadmin'}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{admin?.role || 'admin'}</div>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-400 transition" title="Logout">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-lg">System Control Panel</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-300">
              API Live: Port 4000
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
