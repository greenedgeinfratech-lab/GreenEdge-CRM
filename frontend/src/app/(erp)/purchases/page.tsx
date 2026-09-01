'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Edit3, Printer, Download, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { purchOrdersApi } from '@/services/crmService';

const STATUS_OPTIONS = ['All Status', 'Pending', 'Processing', 'Received', 'Cancelled'];

export default function PurchasesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => purchOrdersApi.list({}),
  });

  const orders = (data?.data as any)?.results || (data as any)?.results || [];

  const filteredOrders = useMemo(() => {
    return orders.filter((o: any) => {
      if (search) {
        const q = search.toLowerCase();
        if (!(o.supplier_name || '').toLowerCase().includes(q) && !(o.po_number || o.po_no || '').toLowerCase().includes(q)) return false;
      }
      if (statusFilter !== 'All Status') {
        if ((o.status || 'Pending').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  const totalTaxable = filteredOrders.reduce((sum: number, o: any) => sum + (o.total_taxable || 0), 0);
  const totalAmount = filteredOrders.reduce((sum: number, o: any) => sum + (o.grand_total || 0), 0);

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['PO No', 'Supplier', 'Date', 'Status', 'Taxable', 'Total'];
    const rows = filteredOrders.map((o: any) => [
      o.po_number || o.po_no || '',
      o.supplier_name || '',
      o.po_date || '',
      o.status || 'Pending',
      (o.total_taxable || 0).toFixed(2),
      (o.grand_total || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(r => r.map((c: string | number) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchases_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredOrders.map((o: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.po_number || o.po_no || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.supplier_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.po_date || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${o.status || 'Pending'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(o.total_taxable || 0).toLocaleString('en-IN')}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹${Number(o.grand_total || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Purchases Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}</style></head><body>
        <h1>Purchases Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | ${filteredOrders.length} orders</div>
        <table><thead><tr><th>PO No</th><th>Supplier</th><th>Date</th><th>Status</th><th style="text-align:right">Taxable</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await purchOrdersApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    } catch {
      alert('Failed to delete purchase order.');
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Purchase Orders</span>
          <span className="text-sm text-gray-500">({filteredOrders.length} total)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier or PO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-52 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between cursor-pointer hover:bg-gray-50"
            >
              <span>{statusFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showStatusDropdown && (
              <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
                {STATUS_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={handlePrint} className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print
          </button>

          <button onClick={handleExport} className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm hover:bg-[#1a2b4c]" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>

          <Link
            href="/purch-orders/create"
            className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]"
          >
            <Plus className="w-4 h-4 mr-1" /> Create PO
          </Link>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-2 text-xs">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Count {filteredOrders.length}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Pre-Tax ₹{totalTaxable.toLocaleString('en-IN')}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Total ₹{totalAmount.toLocaleString('en-IN')}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
            <tr>
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Taxable</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  <Loader2 size={20} className="animate-spin text-green-600 inline-block mr-2" />
                  Loading...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  No purchase orders found{search ? ` matching "${search}"` : ''}.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3 font-medium">{o.po_number || o.po_no || 'Draft'}</td>
                  <td className="px-4 py-3">{o.supplier_name || '-'}</td>
                  <td className="px-4 py-3">{o.po_date || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      (o.status || 'Pending').toLowerCase() === 'received' ? 'bg-green-100 text-green-800 border border-green-200' :
                      (o.status || 'Pending').toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                      (o.status || 'Pending').toLowerCase() === 'processing' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {o.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">₹{(o.total_taxable || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold">₹{(o.grand_total || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link href={`/purch-orders/${o.id}`} className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => handleDelete(o.id)} className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}