'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, TrendingUp, AlertCircle, Loader2, CheckCircle, ChevronDown, Printer } from 'lucide-react';
import { invoicesApi } from '@/services/crmService';

const DATE_OPTIONS = ['All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year'];

export default function InvoicesReportPage() {
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['report-invoices'],
    queryFn: () => invoicesApi.list({ page_size: 200 } as any),
  });

  const allInvoices: any[] = (data?.data as any)?.data?.results || (data?.data as any)?.results || (data as any)?.results || [];

  const invoices = useMemo(() => {
    return allInvoices.filter((i: any) => {
      if (dateFilter === 'All Time') return true;
      const d = i.invoice_date ? new Date(i.invoice_date) : null;
      if (!d) return true;
      const now = new Date();
      if (dateFilter === 'This Month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (dateFilter === 'Last Month') {
        const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      }
      if (dateFilter === 'This Quarter') {
        const q = Math.floor(now.getMonth() / 3);
        return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
      }
      if (dateFilter === 'This Year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [allInvoices, dateFilter]);

  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.grand_total || 0), 0);
  const paid = invoices.filter(i => i.invoice_status === 'Paid');
  const unpaid = invoices.filter(i => i.invoice_status === 'Unpaid');
  const overdue = invoices.filter(i => i.invoice_status === 'Overdue');

  const paidAmt = paid.reduce((s, i) => s + Number(i.grand_total || 0), 0);
  const unpaidAmt = unpaid.reduce((s, i) => s + Number(i.grand_total || 0), 0);
  const overdueAmt = overdue.reduce((s, i) => s + Number(i.grand_total || 0), 0);

  const totalCGST = invoices.reduce((s, i) => s + Number(i.total_cgst || 0), 0);
  const totalSGST = invoices.reduce((s, i) => s + Number(i.total_sgst || 0), 0);
  const totalIGST = invoices.reduce((s, i) => s + Number(i.total_igst || 0), 0);
  const totalTax = totalCGST + totalSGST + totalIGST;

  const recoveryMap: Record<string, number> = {};
  invoices.filter(i => i.invoice_status !== 'Paid').forEach(i => {
    const name = i.customer_name || 'Unknown';
    const outstanding = Number(i.grand_total || 0) - Number(i.recovery_amt || 0);
    if (outstanding > 0) recoveryMap[name] = (recoveryMap[name] || 0) + outstanding;
  });
  const recovery = Object.entries(recoveryMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }));

  const statusColors: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    Unpaid: 'bg-yellow-100 text-yellow-700',
    Overdue: 'bg-red-100 text-red-700',
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const statusRows = [
      { status: 'Paid', count: paid.length, amount: paidAmt },
      { status: 'Unpaid', count: unpaid.length, amount: unpaidAmt },
      { status: 'Overdue', count: overdue.length, amount: overdueAmt },
    ].map(r => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><span style="padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:#f3f4f6">${r.status}</span></td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${r.count}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${r.amount.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const recoveryRows = recovery.map((r, i) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;color:#9ca3af">${i + 1}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${r.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700;color:#ea580c">₹${r.value.toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const invRows = invoices.slice(0, 20).map((inv: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-family:monospace">${inv.invoice_no || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${inv.customer_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(inv.total_taxable || 0).toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹${Number(inv.grand_total || 0).toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${inv.invoice_status || '-'}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Invoices Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:12px}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}h2{font-size:14px;margin:16px 0 8px;color:#1f2937}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}.kpi{display:inline-block;margin-right:24px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:6px}.kpi-label{font-size:11px;color:#6b7280}.kpi-value{font-size:18px;font-weight:700}</style></head><body>
        <h1>Invoices & Recovery Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Filter: ${dateFilter} | ${invoices.length} invoices</div>
        <div style="margin-bottom:16px">
          <div class="kpi"><div class="kpi-label">Total Invoiced</div><div class="kpi-value">₹${totalInvoiced.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Paid</div><div class="kpi-value" style="color:#16a34a">₹${paidAmt.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Unpaid</div><div class="kpi-value" style="color:#ca8a04">₹${unpaidAmt.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Overdue</div><div class="kpi-value" style="color:#ef4444">₹${overdueAmt.toLocaleString('en-IN')}</div></div>
        </div>
        <h2>Invoice Status Summary</h2>
        <table><thead><tr><th>Status</th><th style="text-align:right">Count</th><th style="text-align:right">Amount</th></tr></thead><tbody>${statusRows}</tbody></table>
        <h2>GST Summary</h2>
        <table><tbody>
          <tr><td style="padding:4px 8px">Total CGST</td><td style="padding:4px 8px;text-align:right">₹${totalCGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding:4px 8px">Total SGST</td><td style="padding:4px 8px;text-align:right">₹${totalSGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding:4px 8px">Total IGST</td><td style="padding:4px 8px;text-align:right">₹${totalIGST.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
          <tr><td style="padding:4px 8px;font-weight:700">Total Tax Collected</td><td style="padding:4px 8px;text-align:right;font-weight:700;color:#2563eb">₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        </tbody></table>
        <h2>Recovery — Outstanding by Customer</h2>
        <table><thead><tr><th>#</th><th>Customer</th><th style="text-align:right">Outstanding</th></tr></thead><tbody>${recoveryRows || '<tr><td colspan="3" style="padding:8px;text-align:center;color:#16a34a">All invoices settled!</td></tr>'}</tbody></table>
        <h2>Recent Invoices (Top 20)</h2>
        <table><thead><tr><th>Invoice #</th><th>Customer</th><th>Date</th><th style="text-align:right">Taxable</th><th style="text-align:right">Total</th><th>Status</th></tr></thead><tbody>${invRows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading invoice data…</span>
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
          <h1 className="text-xl text-gray-800 font-medium">Invoices & Recovery Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[130px] justify-between cursor-pointer hover:bg-gray-50">
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
          { label: 'Total Invoiced', value: `₹${totalInvoiced.toLocaleString('en-IN')}`, icon: FileText, color: 'text-gray-800' },
          { label: 'Paid', value: `₹${paidAmt.toLocaleString('en-IN')}`, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Unpaid', value: `₹${unpaidAmt.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-yellow-600' },
          { label: 'Overdue', value: `₹${overdueAmt.toLocaleString('en-IN')}`, icon: AlertCircle, color: 'text-red-600' },
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
        {/* Invoice Status Summary */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Invoice Status Summary</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { status: 'Paid', count: paid.length, amount: paidAmt },
                { status: 'Unpaid', count: unpaid.length, amount: unpaidAmt },
                { status: 'Overdue', count: overdue.length, amount: overdueAmt },
              ].map(row => (
                <tr key={row.status} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">{row.count}</td>
                  <td className="px-4 py-3 text-sm text-right">₹{row.amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* GST Report */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">GST Summary</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: 'Total CGST', value: totalCGST },
              { label: 'Total SGST', value: totalSGST },
              { label: 'Total IGST', value: totalIGST },
              { label: 'Total Tax Collected', value: totalTax },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className={`text-sm ${row.label === 'Total Tax Collected' ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>{row.label}</span>
                <span className={`text-sm font-medium ${row.label === 'Total Tax Collected' ? 'text-blue-700 font-bold text-base' : 'text-gray-700'}`}>
                  ₹{row.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Report */}
        <div className="bg-white border rounded-lg overflow-hidden md:col-span-2">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recovery Report — Outstanding by Customer</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Outstanding (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recovery.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-green-600 font-medium">No outstanding amounts — all invoices settled!</td></tr>
              ) : recovery.map((r, idx) => (
                <tr key={r.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-gray-400">{idx + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium">{r.name}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-orange-600">₹{r.value.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white border rounded-lg overflow-hidden md:col-span-2">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Recent Invoices</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Taxable</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">GST</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.slice(0, 20).map((inv: any) => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs font-mono">{inv.invoice_no || '—'}</td>
                  <td className="px-4 py-2.5 text-sm truncate max-w-[150px]">{inv.customer_name || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right">₹{Number(inv.total_taxable || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-xs text-right text-blue-600">
                    ₹{(Number(inv.total_cgst || 0) + Number(inv.total_sgst || 0) + Number(inv.total_igst || 0)).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right font-medium">₹{Number(inv.grand_total || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[inv.invoice_status] || 'bg-gray-100 text-gray-600'}`}>
                      {inv.invoice_status}
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