'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Printer, FileText, Calendar, Bell, Edit3, HelpCircle, FileVideo, Trash2, Loader2, Download, X, BarChart3, ArrowRightLeft, FileDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { quotationsApi, invoicesApi } from '@/services/crmService';
import { usersApi } from '@/services/userService';
import type { Quotation } from '@/interfaces/crm';

function QuotationsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All Status',
    executive: 'All Executives',
    date_range: 'All Time',
  });
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printSettings, setPrintSettings] = useState({
    showLetterhead: true,
    showCompanyLogo: true,
    showSignature: true,
    footerText: 'Thank you for your business!',
    paperSize: 'A4' as 'A4' | 'Letter',
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch quotations from API
  const { data: quotesResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => quotationsApi.list({
      search: filters.search,
      type: filters.type,
      status: filters.status,
      executive: filters.executive,
      date_range: filters.date_range,
    }),
    staleTime: 10000,
  });

  // Fetch executives from API
  const { data: executivesResponse } = useQuery({
    queryKey: ['executives'],
    queryFn: () => usersApi.listEmployees({ page_size: 100 }),
    staleTime: 60000,
  });

  const executives: { id: string; first_name: string; last_name: string }[] =
    (executivesResponse as any)?.data?.data?.results ?? [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast('Quotation deleted successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Failed to delete quotation.', 'error');
    }
  });

  // Convert to Invoice mutation
  const convertToInvoiceMutation = useMutation({
    mutationFn: (quotationId: string) => invoicesApi.convertToInvoice(quotationId),
    onSuccess: (res: any) => {
      const detail = res?.data?.detail || 'Quotation converted to invoice successfully!';
      showToast(detail, 'success');
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Failed to convert quotation to invoice.', 'error');
    }
  });

  const handleConvertToInvoice = (quote: Quotation) => {
    if (quote.status === 'Converted') {
      showToast('This quotation has already been converted.', 'error');
      return;
    }
    convertToInvoiceMutation.mutate(quote.id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendNotification = (quoteNo: string) => {
    showToast(`Notification for Quote No. ${quoteNo} sent successfully!`, 'success');
  };

  // Export quotations to CSV
  const handleExportCSV = () => {
    if (quotations.length === 0) {
      showToast('No quotations to export', 'error');
      return;
    }
    const headers = ['Quote No', 'Customer', 'Amount', 'Valid Till', 'Issued On', 'Issued By', 'Type', 'Executive', 'Status'];
    const rows = quotations.map(q => [
      q.quote_number || '-',
      q.lead_name || q.customer_name || '-',
      Number(q.grand_total).toFixed(2),
      q.valid_till || '-',
      q.quote_date || '-',
      q.issued_by_name || '-',
      q.type || '-',
      q.sales_credit || '-',
      q.status || '-',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quotations_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${quotations.length} quotations to CSV`, 'success');
  };

  // Print quotations list
  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = quotations.map(q => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:600">${q.quote_number || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${q.lead_name || q.customer_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹ ${Number(q.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${q.quote_date || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${q.status || '-'}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Quotations Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
        .summary { font-size: 13px; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #f3f4f6; padding: 6px 8px; border-bottom: 2px solid #d1d5db; text-align: left; }
        .footer { margin-top: 20px; font-size: 11px; color: #888; text-align: center; }
      </style></head><body>
        <h1>${printSettings.showCompanyLogo ? '📊 ' : ''}Quotations Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Paper: ${printSettings.paperSize}</div>
        <div class="summary">
          Total: ${count} | Pre-Tax: ₹ ${preTaxSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Grand Total: ₹ ${totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <table>
          <thead><tr><th>Quote No</th><th>Customer</th><th style="text-align:right">Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${printSettings.showSignature ? '<div style="margin-top:40px;border-top:1px solid #ccc;padding-top:8px;width:200px;font-size:12px">Authorized Signatory</div>' : ''}
        <div class="footer">${printSettings.footerText}</div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
    showToast('Print preview opened', 'success');
  };

  // Convert quote to order
  const handleConvertToOrder = async (quote: Quotation) => {
    try {
      const res = await quotationsApi.get(quote.id);
      const quoteData: any = (res.data as any)?.data || res.data;
      localStorage.setItem('quote-to-order-data', JSON.stringify(quoteData));
      router.push('/orders/new?from_quote=true');
      showToast('Quote data loaded into new order form', 'success');
    } catch {
      showToast('Failed to load quote data', 'error');
    }
  };

  // Download quote as PDF (via print dialog)
  const handleDownloadPdf = async (quote: Quotation) => {
    try {
      const res = await quotationsApi.get(quote.id);
      const q: any = (res.data as any)?.data || res.data;
      const items = q.items || [];
      const grandTotal = Number(q.grand_total) || 0;
      const isIgst = items.some((i: any) => (i.igst_amt || 0) > 0);

      const itemRows = items.map((item: any, idx: number) => `
        <tr>
          <td style="padding:5px;border:1px solid #333;text-align:center">${idx + 1}</td>
          <td style="padding:5px;border:1px solid #333;font-weight:500">${item.item_description || '-'}</td>
          <td style="padding:5px;border:1px solid #333;text-align:center">${item.hsn_sac || '-'}</td>
          <td style="padding:5px;border:1px solid #333;text-align:center">${item.qty}</td>
          <td style="padding:5px;border:1px solid #333">${item.unit || 'Nos'}</td>
          <td style="padding:5px;border:1px solid #333;text-align:right">₹${Number(item.rate || 0).toFixed(2)}</td>
          <td style="padding:5px;border:1px solid #333;text-align:right">₹${Number(item.taxable || 0).toFixed(2)}</td>
          ${isIgst
            ? `<td style="padding:5px;border:1px solid #333;text-align:right">₹${Number(item.igst_amt || 0).toFixed(2)} <small>(${item.igst_percent}%)</small></td>`
            : `<td style="padding:5px;border:1px solid #333;text-align:right">₹${Number(item.cgst_amt || 0).toFixed(2)} <small>(${item.cgst_percent}%)</small></td>
               <td style="padding:5px;border:1px solid #333;text-align:right">₹${Number(item.sgst_amt || 0).toFixed(2)} <small>(${item.sgst_percent}%)</small></td>`
          }
          <td style="padding:5px;border:1px solid #333;text-align:right;font-weight:700">₹${Number(item.amt || 0).toFixed(2)}</td>
        </tr>
      `).join('');

      const pw = window.open('', '_blank');
      if (!pw) return;
      pw.document.write(`
        <html><head><title>${q.quote_number || 'Quotation'}</title>
        <style>body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:11px}h1{font-size:18px;margin:0}h2{font-size:13px;text-align:center;margin:8px 0;text-transform:uppercase;letter-spacing:1px}.meta{display:flex;justify-content:space-between;border-top:1px solid #999;border-bottom:1px solid #999;padding:6px 0;margin:8px 0;font-size:11px}.addr{display:grid;grid-template-columns:1fr 1fr;border:1px solid #333;margin-bottom:12px}.addr>div{padding:8px}.addr>div:first-child{border-right:1px solid #333}.addr .lbl{font-weight:700;text-decoration:underline;font-size:10px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{background:#f0f0f0;border:1px solid #333;padding:5px;font-size:10px;text-transform:uppercase}.summary{display:grid;grid-template-columns:5fr 3fr 4fr;border:1px solid #333;margin-bottom:12px}.summary>div{padding:8px;font-size:10px}.summary>div:not(:last-child){border-right:1px solid #333}.row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee}.total{font-weight:700;font-size:12px;border-top:2px solid #333;padding-top:4px;margin-top:4px}.sig{text-align:right;margin-top:40px;font-size:10px}</style></head><body>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #333;padding-bottom:8px">
            <div><h1>Greenedge Infratech Pvt. Ltd.</h1><p style="margin:2px 0;font-size:10px">8/140, Raguvir Puri GT Road Aligarh, 202001</p><p style="margin:2px 0;font-size:10px">Ph: 9837067681 | greenedgeinfratech@gmail.com</p></div>
            <div style="text-align:right;font-size:10px"><div style="border:2px solid #16a34a;border-radius:50%;width:70px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;color:#16a34a;font-size:9px"><span style="font-size:11px">Greenedge</span>INFRATECH</div></div>
          </div>
          <h2>${q.type || 'Quotation'}</h2>
          <div class="meta"><div>GSTIN: <strong>09AAGCG2802H1ZS</strong></div><div><strong>${q.quote_number || 'Draft'}</strong> &nbsp;|&nbsp; ${q.quote_date || '-'}</div></div>
          <div class="addr">
            <div><div class="lbl">Billing Address</div><strong>${q.lead_name || q.customer_name || 'N/A'}</strong><br/>${q.address || q.billing_address || 'N/A'}</div>
            <div><div class="lbl">Shipping Address</div><strong>${q.lead_name || q.customer_name || 'N/A'}</strong><br/>${q.shipping_address || q.address || 'N/A'}</div>
          </div>
          <table><thead><tr><th>#</th><th>Item & Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th style="text-align:right">Rate</th><th style="text-align:right">Taxable</th>${isIgst ? '<th style="text-align:right">IGST</th>' : '<th style="text-align:right">CGST</th><th style="text-align:right">SGST</th>'}<th style="text-align:right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
          <div class="summary">
            <div><strong>Bank Details:</strong><br/>${(q.bank_details || 'State Bank of India\nA/C: 43279551326\nIFSC: SBIN0001234').replace(/\n/g, '<br/>')}</div>
            <div><strong>Amount in Words:</strong><br/>Rupees ${grandTotal.toFixed(0)} only</div>
            <div>
              <div class="row"><span>Total Before Tax</span><span>₹${Number(q.total_taxable || 0).toFixed(2)}</span></div>
              ${isIgst ? `<div class="row"><span>Add IGST</span><span>₹${Number(q.total_igst || 0).toFixed(2)}</span></div>`
                : `<div class="row"><span>Add CGST</span><span>₹${Number(q.total_cgst || 0).toFixed(2)}</span></div>
                   <div class="row"><span>Add SGST</span><span>₹${Number(q.total_sgst || 0).toFixed(2)}</span></div>`}
              <div class="total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
          <div class="sig"><p style="margin-bottom:30px">For, Greenedge Infratech Pvt. Ltd.</p><div style="border-top:1px solid #333;width:150px;display:inline-block;padding-top:4px">Authorised Signatory</div></div>
        </body></html>
      `);
      pw.document.close();
      setTimeout(() => pw.print(), 400);
      showToast('PDF preview opened — use Save as PDF in print dialog', 'success');
    } catch {
      showToast('Failed to generate PDF', 'error');
    }
  };

  const quotations: Quotation[] = (quotesResponse?.data as any)?.results || (quotesResponse?.data as any)?.data?.results || [];

  // Summary Metrics calculations
  const count = quotations.length;
  const preTaxSum = quotations.reduce((acc, q) => acc + Number(q.total_taxable), 0);
  const totalSum = quotations.reduce((acc, q) => acc + Number(q.grand_total), 0);

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Quotations</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => setShowPrintModal(true)}
            className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]"
          >
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => showToast(`Showing ${count} quotations | Total ₹${totalSum.toLocaleString('en-IN')}`, 'info')}
            className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]"
            title="View Summary"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-[#f0f2f5] p-2 rounded">
        <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'All' }))}
            className={`${filters.type === 'All' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1`}
          >
            All
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'Quotations' }))}
            className={`${filters.type === 'Quotations' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1 border-l border-[#c85a17]`}
          >
            Quotations
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'Proforma Invoices' }))}
            className={`${filters.type === 'Proforma Invoices' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1 border-l border-[#c85a17]`}
          >
            Proforma Invoices
          </button>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <Calendar className="w-4 h-4 text-gray-500 mr-2" />
          <select 
            value={filters.date_range}
            onChange={e => setFilters(f => ({ ...f, date_range: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Time">All Time</option>
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <select 
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Status">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <select 
            value={filters.executive}
            onChange={e => setFilters(f => ({ ...f, executive: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Executives">All Executives</option>
            {executives.map((emp) => (
              <option key={emp.id} value={`${emp.first_name} ${emp.last_name}`}>
                {emp.first_name} {emp.last_name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1"></div>

        <Link href="/quotes/new">
          <button className="flex items-center bg-[#e86c00] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#d96500]">
            + Create Quotation
          </button>
        </Link>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Count {count}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Pre-Tax ₹ {preTaxSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Total ₹ {totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading quotations...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 font-semibold">
            Failed to load quotations from database.
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-semibold">
            No quotations found. Click "+ Create Quotation" to get started.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Quote No.</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">Valid till</th>
                <th className="px-4 py-3">Issued on</th>
                <th className="px-4 py-3">Issued by</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Executive</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3 font-semibold">{quote.quote_number || '-'}</td>
                  <td className="px-4 py-3">{quote.lead_name || quote.customer_name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {Number(quote.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">{quote.valid_till || '-'}</td>
                  <td className="px-4 py-3">{quote.quote_date || '-'}</td>
                  <td className="px-4 py-3">{quote.issued_by_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.type === 'Proforma Invoice' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {quote.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{quote.sales_credit || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      quote.status === 'Declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-end space-x-1 items-center">
                    <button 
                      onClick={() => handleDownloadPdf(quote)}
                      title="Download PDF"
                      className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    >
                      <FileDown className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleConvertToOrder(quote)}
                      title="Convert to Order"
                      className="p-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleConvertToInvoice(quote)}
                      title={quote.status === 'Converted' ? 'Already converted' : 'Convert to Invoice'}
                      disabled={quote.status === 'Converted' || convertToInvoiceMutation.isPending}
                      className={`p-1 rounded ${quote.status === 'Converted' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                    >
                      {convertToInvoiceMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => handleSendNotification(quote.quote_number || 'Draft')}
                      title="Send Notification"
                      className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/quotes/new?id=${quote.id}`)}
                      title="Edit"
                      className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(quote.id)}
                      title="Delete"
                      className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Materials */}
      <div className="mt-4">
        <h3 className="text-gray-800 font-medium mb-2">Training Materials</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Quotations - Generate, Edit, Delete, Print, Send
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to convert Quotation into P.I.?
          </button>
        </div>

        <h3 className="text-gray-800 font-medium mb-2">Help Materials</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileText className="w-4 h-4 mr-2 text-blue-600" /> Quotations
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-600" /> How to create a Quotation?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-600" /> How to generate Invoice from a Quotation?
          </button>
        </div>
        
        <div>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-gray-700" /> Need Help
          </button>
        </div>
      </div>

      {/* ── Print Settings Modal ─────────────────────────────────────────── */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-[#c85a17]" /> Print Settings
              </h3>
              <button onClick={() => setShowPrintModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Company Logo</label>
                <input
                  type="checkbox"
                  checked={printSettings.showCompanyLogo}
                  onChange={(e) => setPrintSettings(p => ({ ...p, showCompanyLogo: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#c85a17] focus:ring-[#c85a17]"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Letterhead</label>
                <input
                  type="checkbox"
                  checked={printSettings.showLetterhead}
                  onChange={(e) => setPrintSettings(p => ({ ...p, showLetterhead: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#c85a17] focus:ring-[#c85a17]"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-700">Show Signature Line</label>
                <input
                  type="checkbox"
                  checked={printSettings.showSignature}
                  onChange={(e) => setPrintSettings(p => ({ ...p, showSignature: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-[#c85a17] focus:ring-[#c85a17]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                <select
                  value={printSettings.paperSize}
                  onChange={(e) => setPrintSettings(p => ({ ...p, paperSize: e.target.value as 'A4' | 'Letter' }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#c85a17]"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                <input
                  type="text"
                  value={printSettings.footerText}
                  onChange={(e) => setPrintSettings(p => ({ ...p, footerText: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#c85a17]"
                  placeholder="Thank you for your business!"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowPrintModal(false); handlePrintList(); }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10]"
              >
                <Printer className="w-4 h-4" /> Print Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-4 font-semibold text-gray-500">Loading quotations...</div>}>
      <QuotationsContent />
    </Suspense>
  );
}
