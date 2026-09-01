'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, HelpCircle,
  Users, FileText, ShoppingCart, Receipt, Briefcase,
  Settings, Monitor, Truck, ClipboardList, Database,
  ListChecks, Search, BarChart3, Store, LogOut, WalletCards
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import NotificationWidget from '@/components/dashboard/widgets/NotificationWidget';
import GlobalSearchBar from '@/components/dashboard/widgets/GlobalSearchBar';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Lightweight poll of notification data for the header badge
  const { data: dashData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    refetchInterval: 60000, // 60-second refresh
    staleTime: 30000,
  });

  const companyName = user?.company?.name ?? 'GreenEdge CRM';
  const userName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email : '';
  const initials = (userName.split(' ').map(w => w[0]).join('').slice(0, 2) || 'GE').toUpperCase();

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-800 font-sans">
      {/* Sidebar - Dark Navy */}
      <aside className="w-56 bg-[#162032] text-gray-300 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        <div className="h-14 flex flex-col justify-center px-4 bg-white">
          <div className="flex items-center text-[#ff7900] font-bold text-xl tracking-tight">
            <span className="italic mr-1">GreenEdge CRM</span>
          </div>
        </div>

        {/* Top Icons */}
        <div className="flex px-4 py-2 space-x-4 border-b border-gray-700 pb-3 mt-2 text-gray-400">
          <Link href="/dashboard">
            <Home className="w-5 h-5 cursor-pointer hover:text-white" />
          </Link>
          <HelpCircle className="w-5 h-5 cursor-pointer hover:text-white" />
          <Monitor className="w-5 h-5 cursor-pointer hover:text-white" />
          <Link href="/settings">
            <Settings className="w-5 h-5 cursor-pointer hover:text-white" />
          </Link>
        </div>

        <nav className="flex-1 py-4 text-[13px]">
          {/* Sales Section */}
          <div className="px-4 mb-1">
            <h3 className="text-[#f97316] font-semibold text-sm mb-2 uppercase">Sales</h3>
            <div className="space-y-1">
              <NavItem href="/crm"       icon={<Users className="w-4 h-4" />}       label="CRM"       pathname={pathname} />
              <NavItem href="/quotes"    icon={<FileText className="w-4 h-4" />}    label="Quotes"    pathname={pathname} />
              <NavItem href="/orders"    icon={<ShoppingCart className="w-4 h-4" />} label="Orders"   pathname={pathname} />
              <NavItem href="/invoices"  icon={<Receipt className="w-4 h-4" />}     label="Invoices"  pathname={pathname} />
              <NavItem href="/recovery"  icon={<Monitor className="w-4 h-4" />}     label="Recovery"  pathname={pathname} />
              <NavItem href="/contracts" icon={<ClipboardList className="w-4 h-4" />} label="Contracts" pathname={pathname} />
              <NavItem href="/support"   icon={<HelpCircle className="w-4 h-4" />}  label="Support"   pathname={pathname} />
              <NavItem href="/customers" icon={<Users className="w-4 h-4" />}       label="Customers" pathname={pathname} />
            </div>
          </div>

          {/* Operations Section */}
          <div className="px-4 mt-6 mb-1">
            <h3 className="text-[#f97316] font-semibold text-sm mb-2 uppercase">Operations</h3>
            <div className="space-y-1">
              <NavItem href="/accounts"      icon={<Briefcase className="w-4 h-4" />}    label="Accounts"    pathname={pathname} />
              <NavItem href="/purchases"     icon={<ShoppingCart className="w-4 h-4" />}  label="Purchases"   pathname={pathname} />
              <NavItem href="/purch-orders"  icon={<ClipboardList className="w-4 h-4" />} label="Purch Orders" pathname={pathname} />
              <NavItem href="/inventory"     icon={<Database className="w-4 h-4" />}      label="Inventory"   pathname={pathname} />
              <NavItem href="/manufacturing" icon={<Settings className="w-4 h-4" />}      label="Manufacturing" pathname={pathname} />
              <NavItem href="/operations/executives" icon={<Users className="w-4 h-4" />}    label="Our Executives" pathname={pathname} />
              <NavItem href="/operations/salary-management" icon={<WalletCards className="w-4 h-4" />} label="Salary Management" pathname={pathname} />
              <NavItem href="/tasks"         icon={<ListChecks className="w-4 h-4" />}    label="Tasks"       pathname={pathname} />
              <NavItem href="/suppliers"     icon={<Truck className="w-4 h-4" />}         label="Suppliers"   pathname={pathname} />
            </div>
          </div>

          {/* Network Section */}
          <div className="px-4 mt-6 mb-1">
            <h3 className="text-[#f97316] font-semibold text-sm mb-2 uppercase">Network</h3>
            <div className="space-y-1">
              <NavItem href="/connections" icon={<Users className="w-4 h-4" />}     label="Connections" pathname={pathname} />
              <NavItem href="/store"       icon={<Store className="w-4 h-4" />}     label="Your Store"  pathname={pathname} />
              <NavItem href="/search"      icon={<Search className="w-4 h-4" />}    label="Search"      pathname={pathname} />
              <NavItem href="/reports"     icon={<BarChart3 className="w-4 h-4" />} label="Reports"     pathname={pathname} />
            </div>
          </div>
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white truncate font-medium">{userName || 'User'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ''}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors w-full"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f0f2f5]">
        {/* Header */}
        <header className="h-16 flex items-center px-6 bg-white border-b border-gray-200 justify-between shadow-sm z-10">
          {/* Company info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold border-2 border-green-600">
              {initials}
            </div>
            <div>
              <div className="text-xs text-gray-500">Smart Business Dashboard for</div>
              <div className="text-base font-bold text-gray-800 leading-tight">{companyName}</div>
            </div>
          </div>

          {/* Search + actions */}
          <div className="flex items-center gap-3 flex-1 justify-end max-w-2xl">
            <GlobalSearchBar />

            {/* Notification bell */}
            <NotificationWidget
              data={dashData?.notifications}
              isLoading={false}
            />

            {/* Financial year badge */}
            {dashData?.company?.financial_year && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium whitespace-nowrap">
                FY {dashData.company.financial_year}
              </span>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  pathname,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  pathname: string | null;
}) {
  const isActive = pathname?.startsWith(href) && href !== '/';

  return (
    <Link href={href}>
      <div
        className={`flex items-center space-x-3 px-2 py-1.5 rounded transition-colors text-[13px] ${
          isActive
            ? 'bg-[#1e3a5f] text-white'
            : 'hover:text-white hover:bg-[#1e3a5f]/40'
        }`}
      >
        {icon}
        <span>{label}</span>
      </div>
    </Link>
  );
}
