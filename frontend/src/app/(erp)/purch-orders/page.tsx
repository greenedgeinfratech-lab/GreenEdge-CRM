'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Printer, LineChart, Check, FileVideo, Plus, Loader2, Trash2, Download } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { purchOrdersApi } from '@/services/crmService';
import type { PurchaseOrder } from '@/interfaces/crm';

const DATE_OPTIONS = ['All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year'];
const STATUS_OPTIONS = ['All Status', 'Pending', 'Processing', 'Received', 'Cancelled'];

export default function PurchOrdersPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [executiveFilter, setExecutiveFilter] = useState('All Executives');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showExecDropdown, setShowExecDropdown] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['purch-orders-list'],
    queryFn: async () => {
      const res = await purchOrdersApi.list();
      const responseData: unknown = res.data;
      const payload =
        typeof responseData === 'object' && responseData !== null && 'data' in responseData
          ? (responseData as { data?: unknown }).data
          : responseData;
      if (Array.isArray(payload)) return payload;
      if (
        typeof payload === 'object' &&
        payload !== null &&
        'results' in payload &&
        Array.isArray((payload as { results?: unknown }).results)
      ) {
        return (payload as { results: PurchaseOrder[] }).results;
      }
      return [];
    },
  });

  const orders: PurchaseOrder[] = data || [];

  // Apply filters
  const filteredOrders = useMemo(() => {
    return orders.filter((po) => {
      // Search
      if (searchInput) {
        const q = searchInput.toLowerCase();
        const name = (po.supplier_name || '').toLowerCase();
        const poNo = (po.po_no || '').toLowerCase();
        if (!name.includes(q) && !poNo.includes(q)) return false;
      }
      // Status filter
      if (statusFilter !== 'All Status') {
        if ((po.status || 'Pending').toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      // Date filter
      if (dateFilter !== 'All Time' && po.po_date) {
        const orderDate = new Date(po.po_date);
        const now = new Date();
        if (dateFilter === 'This Month') {
          if (orderDate.getMonth() !== now.getMonth() || orderDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'Last Month') {
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          if (orderDate.getMonth() !== lastMonth.getMonth() || orderDate.getFullYear() !== lastMonth.getFullYear()) return false;
        } else if (dateFilter === 'This Quarter') {
          const quarter = Math.floor(now.getMonth() / 3);
          const orderQuarter = Math.floor(orderDate.getMonth() / 3);
          if (orderQuarter !== quarter || orderDate.getFullYear() !== now.getFullYear()) return false;
        } else if (dateFilter === 'This Year') {
          if (orderDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      return true;
    });
  }, [orders, searchInput, statusFilter, dateFilter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this Purchase Order?')) return;
    try {
      await purchOrdersApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['purch-orders-list'] });
    } catch {
      alert('Failed to delete purchase order.');
    }
  };

  const handleExport = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['PO No', 'Supplier', 'Status', 'Order Date', 'Due Date', 'Taxable', 'Amount', 'Created By'];
    const rows = filteredOrders.map(po => [
      po.po_no || '',
      po.supplier_name || '',
      po.status || 'Pending',
      po.po_date || '',
      po.due_date || '',
      Number(po.total_taxable || 0).toFixed(2),
      Number(po.grand_total || 0).toFixed(2),
      po.created_by_name || '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `purchase_orders_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredOrders.map(po => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${po.po_no || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${po.supplier_name || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${po.status || 'Pending'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${po.po_date || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹ ${Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Purchase Orders Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}</style></head><body>
        <h1>Purchase Orders Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | ${filteredOrders.length} orders</div>
        <table><thead><tr><th>PO No</th><th>Supplier</th><th>Status</th><th>Date</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const totalPreTax = filteredOrders.reduce((sum, o) => sum + Number(o.total_taxable || 0), 0);
  const totalAmount = filteredOrders.reduce((sum, o) => sum + Number(o.grand_total || 0), 0);

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4">
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded shadow-xs">
        <div className="flex items-center space-x-4 text-xl text-gray-800 font-semibold">
          <span>Purchase Orders</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search supplier or PO no..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-52 focus:outline-none focus:border-green-600"
            />
          </div>

          <button onClick={handlePrint} className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <Printer className="w-4 h-4 mr-1" /> Print
          </button>

          <button onClick={handleExport} className="flex items-center bg-[#c85a17] text-white p-2 rounded text-sm font-medium hover:bg-[#b04a10]" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>

          <Link
            href="/purch-orders/create"
            className="flex items-center bg-[#c85a17] text-white px-3.5 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10] shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1" /> + Create Purchase Order
          </Link>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowDateDropdown(!showDateDropdown); setShowStatusDropdown(false); setShowExecDropdown(false); }}
            className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between cursor-pointer hover:bg-gray-50"
          >
            <span>{dateFilter}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showDateDropdown && (
            <div className="absolute z-10 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg">
              {DATE_OPTIONS.map(opt => (
                <button key={opt} onClick={() => { setDateFilter(opt); setShowDateDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${dateFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDateDropdown(false); setShowExecDropdown(false); }}
            className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between cursor-pointer hover:bg-gray-50"
          >
            <span>{statusFilter}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showStatusDropdown && (
            <div className="absolute z-10 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg">
              {STATUS_OPTIONS.map(opt => (
                <button key={opt} onClick={() => { setStatusFilter(opt); setShowStatusDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Executive Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowExecDropdown(!showExecDropdown); setShowDateDropdown(false); setShowStatusDropdown(false); }}
            className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between cursor-pointer hover:bg-gray-50"
          >
            <span>{executiveFilter}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showExecDropdown && (
            <div className="absolute z-10 mt-1 w-44 bg-white border border-gray-200 rounded shadow-lg">
              {['All Executives', 'Admin', 'Manager'].map(opt => (
                <button key={opt} onClick={() => { setExecutiveFilter(opt); setShowExecDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${executiveFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2 text-xs">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Count {filteredOrders.length}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Pre-Tax ₹ {totalPreTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded font-semibold">
          Total ₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-xs overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <Loader2 size={20} className="animate-spin text-green-600" />
            <span>Fetching purchase orders...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No purchase orders found{searchInput ? ` matching "${searchInput}"` : ''}. Click <strong className="text-[#c85a17]">&quot;+ Create Purchase Order&quot;</strong> to add one.
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
              <tr>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Order No.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Order Date</th>
                <th className="px-4 py-3">Due on</th>
                <th className="px-4 py-3 text-right">Taxable (₹)</th>
                <th className="px-4 py-3 text-right">Amount (₹)</th>
                <th className="px-4 py-3">Created by</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50/80 text-gray-800">
                  <td className="px-4 py-3 font-medium">{po.supplier_name}</td>
                  <td className="px-4 py-3 font-semibold text-green-800">{po.po_no}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      (po.status || 'Pending') === 'Received' ? 'bg-green-100 text-green-800 border border-green-200' :
                      (po.status || 'Pending') === 'Cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                      'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {po.status || 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{po.po_date || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{po.due_date || '-'}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    ₹ {Number(po.total_taxable || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">
                    ₹ {Number(po.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{po.created_by_name || 'Admin'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDelete(po.id)}
                        className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        title="Delete PO"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Details */}
      <div className="mt-2">
        <h3 className="text-gray-800 font-medium mb-3 text-sm">Training Materials</h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to see GST % in Purchase Order?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to Update Stock after/ while Entering Supplier Invoice?
          </button>
        </div>
      </div>
    </div>
  );
}
