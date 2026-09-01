'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Printer, Filter, RefreshCw, FileText, ChevronDown,
  MessageCircle, Edit3, AlertCircle, Loader2, Download, FileDown
} from 'lucide-react';
import { ordersApi } from '@/services/crmService';

const STATUS_OPTIONS = ['All Status', 'Received', 'Pending', 'Processing', 'Dispatched', 'Delivered', 'Cancelled'];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Received:   'bg-blue-100 text-blue-700',
    Pending:    'bg-yellow-100 text-yellow-700',
    Processing: 'bg-orange-100 text-orange-700',
    Dispatched: 'bg-purple-100 text-purple-700',
    Delivered:  'bg-green-100 text-green-700',
    Cancelled:  'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [view, setView]         = useState<'commitment' | 'item' | 'summary'>('item');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders', search, statusFilter],
    queryFn: () =>
      ordersApi.list({
        search: search || undefined,
        status: statusFilter !== 'All Status' ? statusFilter : undefined,
      }),
    staleTime: 30000,
  });

  const orders: any[] = (data?.data as any)?.data?.results || (data?.data as any)?.results || (Array.isArray(data?.data?.data) ? data.data.data : []);
  const total = (data?.data as any)?.data?.count ?? (data?.data as any)?.count ?? orders.length;

  const handleExport = () => {
    if (orders.length === 0) return;
    const headers = ['Contact', 'Order No', 'Cstr PO', 'Items', 'Due Date', 'Amount', 'Status'];
    const rows = orders.map(o => [
      o.customer_name || '',
      o.order_number || '',
      o.customer_po_number || '',
      (o.items || []).map((i: any) => i.item_description).join('; '),
      o.due_date || '',
      Number(o.grand_total || 0).toFixed(2),
      o.status || 'Pending',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = orders.map(o => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.customer_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.order_number || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.items?.[0]?.item_description || '-'}${o.items?.length > 1 ? ` +${o.items.length - 1} more` : ''}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.due_date || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹ ${Number(o.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.status || 'Pending'}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Orders Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}</style></head><body>
        <h1>Orders Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | ${orders.length} orders</div>
        <table><thead><tr><th>Contact</th><th>Order No</th><th>Items</th><th>Due Date</th><th style="text-align:right">Amount</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  // Download single order as PDF (via print dialog)
  const handleDownloadOrderPdf = async (order: any) => {
    try {
      const res = await ordersApi.get(order.id);
      const o: any = (res.data as any)?.data || res.data;
      const items = o.items || [];
      const grandTotal = Number(o.grand_total) || 0;
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
        <html><head><title>${o.order_number || 'Order'}</title>
        <style>body{font-family:Arial,sans-serif;padding:30px;color:#111;font-size:11px}h1{font-size:18px;margin:0}h2{font-size:13px;text-align:center;margin:8px 0;text-transform:uppercase;letter-spacing:1px}.meta{display:flex;justify-content:space-between;border-top:1px solid #999;border-bottom:1px solid #999;padding:6px 0;margin:8px 0;font-size:11px}.addr{display:grid;grid-template-columns:1fr 1fr;border:1px solid #333;margin-bottom:12px}.addr>div{padding:8px}.addr>div:first-child{border-right:1px solid #333}.addr .lbl{font-weight:700;text-decoration:underline;font-size:10px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-bottom:12px}th{background:#f0f0f0;border:1px solid #333;padding:5px;font-size:10px;text-transform:uppercase}.summary{display:grid;grid-template-columns:5fr 3fr 4fr;border:1px solid #333;margin-bottom:12px}.summary>div{padding:8px;font-size:10px}.summary>div:not(:last-child){border-right:1px solid #333}.row{display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #eee}.total{font-weight:700;font-size:12px;border-top:2px solid #333;padding-top:4px;margin-top:4px}.sig{text-align:right;margin-top:40px;font-size:10px}</style></head><body>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #333;padding-bottom:8px">
            <div><h1>Greenedge Infratech Pvt. Ltd.</h1><p style="margin:2px 0;font-size:10px">8/140, Raguvir Puri GT Road Aligarh, 202001</p><p style="margin:2px 0;font-size:10px">Ph: 9837067681 | greenedgeinfratech@gmail.com</p></div>
            <div style="text-align:right;font-size:10px"><div style="border:2px solid #16a34a;border-radius:50%;width:70px;height:70px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;color:#16a34a;font-size:9px"><span style="font-size:11px">Greenedge</span>INFRATECH</div></div>
          </div>
          <h2>PURCHASE ORDER</h2>
          <div class="meta"><div>GSTIN: <strong>09AAGCG2802H1ZS</strong></div><div><strong>${o.order_number || 'Draft'}</strong> &nbsp;|&nbsp; ${o.order_date || '-'}</div></div>
          <div class="addr">
            <div><div class="lbl">Supplier / Billing Address</div><strong>${o.customer_name || 'N/A'}</strong><br/>${o.address || 'N/A'}</div>
            <div><div class="lbl">Shipping Address</div><strong>${o.customer_name || 'N/A'}</strong><br/>${o.shipping_address || o.address || 'N/A'}</div>
          </div>
          <table><thead><tr><th>#</th><th>Item & Description</th><th>HSN</th><th>Qty</th><th>Unit</th><th style="text-align:right">Rate</th><th style="text-align:right">Taxable</th>${isIgst ? '<th style="text-align:right">IGST</th>' : '<th style="text-align:right">CGST</th><th style="text-align:right">SGST</th>'}<th style="text-align:right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
          <div class="summary">
            <div><strong>Bank Details:</strong><br/>${(o.bank_details || 'State Bank of India\nA/C: 43279551326\nIFSC: SBIN0001234').replace(/\n/g, '<br/>')}</div>
            <div><strong>Amount in Words:</strong><br/>Rupees ${grandTotal.toFixed(0)} only</div>
            <div>
              <div class="row"><span>Total Before Tax</span><span>₹${Number(o.total_taxable || 0).toFixed(2)}</span></div>
              ${isIgst ? `<div class="row"><span>Add IGST</span><span>₹${Number(o.total_igst || 0).toFixed(2)}</span></div>`
                : `<div class="row"><span>Add CGST</span><span>₹${Number(o.total_cgst || 0).toFixed(2)}</span></div>
                   <div class="row"><span>Add SGST</span><span>₹${Number(o.total_sgst || 0).toFixed(2)}</span></div>`}
              <div class="total"><span>Grand Total</span><span>₹${grandTotal.toFixed(2)}</span></div>
            </div>
          </div>
          <div class="sig"><p style="margin-bottom:30px">For, Greenedge Infratech Pvt. Ltd.</p><div style="border-top:1px solid #333;width:150px;display:inline-block;padding-top:4px">Authorised Signatory</div></div>
        </body></html>
      `);
      pw.document.close();
      setTimeout(() => pw.print(), 400);
    } catch {
      alert('Failed to generate PDF');
    }
  };

  // Compute due-date summary badges
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const overdue = orders.filter(o => o.due_date && new Date(o.due_date) < today && o.status !== 'Delivered').length;
  const dueToday = orders.filter(o => {
    if (!o.due_date) return false;
    const d = new Date(o.due_date); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  }).length;
  const dueTomorrow = orders.filter(o => {
    if (!o.due_date) return false;
    const d = new Date(o.due_date); d.setHours(0, 0, 0, 0);
    return d.getTime() === tomorrow.getTime();
  }).length;

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">

      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Orders</span>
          {!isLoading && (
            <span className="text-sm text-gray-400 font-normal">({total} total)</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-52 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="relative flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none bg-transparent pr-6 focus:outline-none text-gray-700"
            >
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2 text-gray-400 pointer-events-none" />
          </div>

          <button onClick={handlePrint} className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          <button onClick={() => refetch()} className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm hover:bg-[#1a2b4c]" title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={handleExport} className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm hover:bg-[#1a2b4c]" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>

          <Link href="/orders/new">
            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              + Enter Order
            </button>
          </Link>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
          {(['commitment', 'item', 'summary'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 capitalize ${view === v ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} border-r border-[#c85a17] last:border-r-0`}
            >
              {v === 'commitment' ? 'Commitment View' : v === 'item' ? 'Item View' : 'Summary View'}
            </button>
          ))}
        </div>

        {/* Due-date badges */}
        <div className="ml-2 flex gap-2">
          <span className="bg-[#c85a17] text-white px-3 py-1 rounded text-sm font-medium">Overdue {overdue}</span>
          <span className="bg-[#c85a17] text-white px-3 py-1 rounded text-sm font-medium">Today {dueToday}</span>
          <span className="bg-[#c85a17] text-white px-3 py-1 rounded text-sm font-medium">Tomorrow {dueTomorrow}</span>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Order No.</th>
              <th className="px-4 py-3">Cstr P.O.</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Grand Total (₹)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">

            {/* Loading */}
            {isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading orders…
                </td>
              </tr>
            )}

            {/* Error */}
            {isError && !isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-red-500">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                  Failed to load orders. <button className="underline ml-1" onClick={() => refetch()}>Retry</button>
                </td>
              </tr>
            )}

            {/* Empty */}
            {!isLoading && !isError && orders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                  No orders found{search ? ` matching "${search}"` : ''}.
                  <div className="mt-2">
                    <Link href="/orders/new">
                      <button className="text-sm bg-[#c85a17] text-white px-4 py-1.5 rounded hover:bg-[#b04a10]">+ Enter First Order</button>
                    </Link>
                  </div>
                </td>
              </tr>
            )}

            {/* Real rows */}
            {!isLoading && !isError && orders.map((order: any) => {
              const isOverdue = order.due_date && new Date(order.due_date) < today && order.status !== 'Delivered';
              return (
                <tr key={order.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3 w-48 leading-tight">
                    <div className="font-medium truncate">{order.customer_name || '—'}</div>
                    {order.contact_person && (
                      <div className="text-xs text-gray-400 truncate">{order.contact_person}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{order.order_number || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{order.customer_po_number || '—'}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {order.items && order.items.length > 0 ? (
                      <div>
                        <div className="truncate text-xs leading-tight">{order.items[0].item_description}</div>
                        {order.items.length > 1 && (
                          <div className="text-[10px] text-gray-400">+{order.items.length - 1} more</div>
                        )}
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className={`px-4 py-3 text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                    {order.due_date ? new Date(order.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    {isOverdue && <span className="ml-1 text-red-400 text-[10px]">OVERDUE</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹{Number(order.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.status || 'Pending'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end space-x-1">
                      <button className="p-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200" title="Download PDF"
                        onClick={() => handleDownloadOrderPdf(order)}>
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200" title="Message"
                        onClick={() => window.open(`https://wa.me/?text=Order ${order.order_number} - ₹${Number(order.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, '_blank')}>
                        <MessageCircle className="w-4 h-4" />
                      </button>
                      <Link href={`/orders/${order.id}`}>
                        <button className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200" title="Edit">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination info */}
        {!isLoading && orders.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
            <span>Showing {orders.length} of {total} orders</span>
            {total > orders.length && (
              <span className="text-gray-500">Use filters to narrow results (page size: 10)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
