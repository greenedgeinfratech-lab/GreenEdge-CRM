'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, ShoppingCart, Package, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import { customersApi } from '@/services/crmService';

export default function ReportsPage() {
  const { data: crmData } = useQuery({
    queryKey: CRM_KEYS.analytics(),
    queryFn: async () => {
      const { analyticsApi } = await import('@/services/crmService');
      return analyticsApi.get();
    },
  });

  const { data: customerData } = useQuery({
    queryKey: CRM_KEYS.customerSummary(),
    queryFn: () => customersApi.summary(),
  });

  const analytics: any = crmData?.data || {};
  const customerSummary: any = customerData?.data || {};

  const reportCategories = [
    {
      title: 'CRM & Leads',
      icon: Users,
      color: 'blue',
      href: '/reports/leads',
      reports: [
        { label: 'Lead Pipeline Report', desc: 'View leads by stage and source' },
        { label: 'Lead Conversion Report', desc: 'Track conversion rates' },
        { label: 'Follow-up Report', desc: 'Pending and completed follow-ups' },
      ],
    },
    {
      title: 'Sales & Orders',
      icon: ShoppingCart,
      color: 'green',
      href: '/reports/sales',
      reports: [
        { label: 'Sales Summary', desc: 'Total sales by period' },
        { label: 'Order Status Report', desc: 'Pending, delivered, cancelled orders' },
        { label: 'Customer-wise Sales', desc: 'Sales per customer' },
      ],
    },
    {
      title: 'Invoices & Recovery',
      icon: FileText,
      color: 'orange',
      href: '/reports/invoices',
      reports: [
        { label: 'Invoice Summary', desc: 'Paid, unpaid, overdue invoices' },
        { label: 'Recovery Report', desc: 'Outstanding amounts by customer' },
        { label: 'GST Report', desc: 'CGST, SGST, IGST breakdown' },
      ],
    },
    {
      title: 'Inventory',
      icon: Package,
      color: 'purple',
      href: '/reports/inventory',
      reports: [
        { label: 'Stock Summary', desc: 'Current stock levels' },
        { label: 'Low Stock Alert', desc: 'Items below minimum stock' },
        { label: 'Product-wise Sales', desc: 'Top selling products' },
      ],
    },
  ];

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Reports</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users className="w-4 h-4" /> Leads
          </div>
          <div className="text-2xl font-bold text-gray-800">{analytics.summary?.total_active ?? 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Users className="w-4 h-4" /> Customers
          </div>
          <div className="text-2xl font-bold text-green-600">{customerSummary.total || 0}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <TrendingUp className="w-4 h-4" /> Pipeline Value
          </div>
          <div className="text-2xl font-bold text-blue-600">
            ₹{(analytics.summary?.total_pipeline_value || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <BarChart3 className="w-4 h-4" /> Won Leads
          </div>
          <div className="text-2xl font-bold text-purple-600">{analytics.summary?.total_won || 0}</div>
        </div>
      </div>

      {/* Report Categories — now clickable */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCategories.map((cat) => (
          <div key={cat.title} className="bg-white border rounded-lg overflow-hidden">
            {/* Category header — links to report section */}
            <Link href={cat.href}>
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <cat.icon className={`w-5 h-5 text-${cat.color}-500`} />
                  <span className="font-semibold text-gray-800">{cat.title}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
            <div className="divide-y divide-gray-100">
              {cat.reports.map((report) => (
                <Link href={cat.href} key={report.label}>
                  <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex items-center justify-between group">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{report.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{report.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
