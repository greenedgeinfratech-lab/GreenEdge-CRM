'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingCart, TrendingUp, Package, Loader2, AlertCircle, ChevronDown, Printer } from 'lucide-react';
import { ordersApi, customersApi } from '@/services/crmService';

const DATE_OPTIONS = ['All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year'];

export default function SalesReportPage() {
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const { data: orderData, isLoading: ordersLoading } = useQuery({
    queryKey: ['report-orders'],
    queryFn: () => ordersApi.list({ page_size: 100 } as any),
  });

  const { data: customerData, isLoading: customersLoading } = useQuery({
    queryKey: ['report-customers-summary'],
    queryFn: () => customersApi.summary(),
  });

  const isLoading = ordersLoading || customersLoading;
  const allOrders: any[] = (orderData?.data as any)?.data?.results || (orderData?.data as any)?.results || (orderData as any)?.results || [];
  const customerSummary: any = customerData?.data || {};

  const orders = useMemo(() => {
    return allOrders.filter((o: any) => {
      if (dateFilter === 'All Time') return true;
      const d = o.order_date ? new Date(o.order_date) : null;
      if (!d) return true;
      const now = new Date();
      if (dateFilter === 'This Month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'Last Month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      } else if (dateFilter === 'This Quarter') {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      } else if (dateFilter === 'This Year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [allOrders, dateFilter]);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((s, o) => s + Number(o.grand_total || 0), 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const byStatus = (['Received', 'Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'] as const).map(st => ({
    status: st,
    count: orders.filter(o => o.status === st).length,
    value: orders.filter(o => o.status === st).reduce((s, o) => s + Number(o.grand_total || 0), 0),
  }));

  const customerMap: Record<string, number> = {};
  orders.forEach(o => {
    const name = o.customer_name || 'Unknown';
    customerMap[name] = (customerMap[name] || 0) + Number(o.grand_total || 0);
  });
  const customerWise = Object.entries(customerMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const statusColors: Record<string, string> = {
    Delivered: 'bg-green-100 text-green-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Processing: 'bg-orange-100 text-orange-700',
    Dispatched: 'bg-purple-100 text-purple-700',
    Received: 'bg-blue-100 text-blue-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const statusRows = byStatus.map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:#f3f4f6">${r.status}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${r.count}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${r.value.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const customerRows = customerWise.map((c, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#9ca3af">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${c.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;color:#16a34a">₹${c.value.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const orderRows = orders.slice(0, 15).map((o: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${o.order_number || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.customer_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600">₹${Number(o.grand_total || 0).toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.status || '-'}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Sales Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:12px}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}h2{font-size:14px;margin:16px 0 8px;color:#1f2937}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}.kpi{display:inline-block;margin-right:24px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:6px}.kpi-label{font-size:11px;color:#6b7280}.kpi-value{font-size:18px;font-weight:700}</style></head><body>
        <h1>Sales & Orders Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Filter: ${dateFilter} | ${totalOrders} orders</div>
        <div style="margin-bottom:16px">
          <div class="kpi"><div class="kpi-label">Total Orders</div><div class="kpi-value">${totalOrders}</div></div>
          <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="color:#16a34a">₹${totalRevenue.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Avg. Order Value</div><div class="kpi-value" style="color:#ea580c">₹${Math.round(avgOrderValue).toLocaleString('en-IN')}</div></div>
        </div>
        <h2>Order Status Breakdown</h2>
        <table><thead><tr><th>Status</th><th style="text-align:right">Count</th><th style="text-align:right">Value</th></tr></thead><tbody>${statusRows}</tbody></table>
        <h2>Top 10 Customers by Sales</h2>
        <table><thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Revenue</th></tr></thead><tbody>${customerRows}</tbody></table>
        <h2>Recent Orders (Top 15)</h2>
        <table><thead><tr><th>Order #</th><th>Customer</th><th>Date</th><th style="text-align:right">Total</th><th>Status</th></tr></thead><tbody>${orderRows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading sales data…</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl text-gray-800 font-medium">Sales & Orders Report</h1>
        </div>
        <div className="flex items-center gap-2">
          {/* Date filter */}
          <div className="relative">
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[130px] justify-between cursor-pointer hover:bg-gray-50"
            >
              <span>{dateFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showDateDropdown && (
              <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
                {DATE_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setDateFilter(opt); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${dateFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handlePrint} className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: totalOrders, icon: ShoppingCart, color: 'text-blue-600' },
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Avg. Order Value', value: `₹${Math.round(avgOrderValue).toLocaleString('en-IN')}`, icon: Package, color: 'text-orange-600' },
          { label: 'Total Customers', value: customerSummary.total || 0, icon: AlertCircle, color: 'text-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <kpi.icon className="w-4 h-4" /> {kpi.label}
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Status Breakdown */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Order Status Breakdown</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byStatus.map(row => (
                <tr key={row.status} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[row.status] || 'bg-gray-100 text-gray-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium">{row.count}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{row.value.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Customers by Sales */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Top 10 Customers by Sales</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customerWise.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No sales data yet</td></tr>
              ) : customerWise.map((c, idx) => (
                <tr key={c.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium truncate max-w-[150px]">{c.name}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium text-green-600">₹{c.value.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Orders */}
        <div className="bg-white border rounded-lg overflow-hidden md:col-span-2">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total (₹)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.slice(0, 15).map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-mono">{o.order_number || '—'}</td>
                  <td className="px-4 py-2.5 text-sm truncate max-w-[180px]">{o.customer_name}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{o.due_date ? new Date(o.due_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium">₹{Number(o.grand_total || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}