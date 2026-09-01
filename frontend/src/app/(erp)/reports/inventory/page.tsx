'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, AlertTriangle, TrendingUp, Loader2, ChevronDown, Printer } from 'lucide-react';
import { productsApi } from '@/services/crmService';

const SORT_OPTIONS = ['Name', 'Stock Qty', 'Rate', 'Valuation'];

export default function InventoryReportPage() {
  const [sortBy, setSortBy] = useState('Name');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['report-products'],
    queryFn: () => productsApi.list({ item_type: 'Stock' }),
  });

  const allProducts: any[] = (data?.data as any)?.data?.results || (data?.data as any)?.results || (data as any)?.results || [];

  const products = useMemo(() => {
    let list = [...allProducts];
    if (lowStockOnly) {
      list = list.filter(p => (p.stock_qty || 0) <= 10);
    }
    if (sortBy === 'Stock Qty') list.sort((a, b) => (b.stock_qty || 0) - (a.stock_qty || 0));
    else if (sortBy === 'Rate') list.sort((a, b) => (b.rate || 0) - (a.rate || 0));
    else if (sortBy === 'Valuation') list.sort((a, b) => ((b.stock_qty || 0) * (b.rate || 0)) - ((a.stock_qty || 0) * (a.rate || 0)));
    else list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return list;
  }, [allProducts, sortBy, lowStockOnly]);

  const totalItems = allProducts.length;
  const lowStockItems = allProducts.filter(p => (p.stock_qty || 0) <= 10);
  const totalStockQty = allProducts.reduce((acc, p) => acc + (p.stock_qty || 0), 0);
  const totalStockValue = allProducts.reduce((acc, p) => acc + ((p.stock_qty || 0) * (p.rate || 0)), 0);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = products.map(p => {
      const valuation = (p.stock_qty || 0) * (p.rate || 0);
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${p.name}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${p.code || p.hsn_sac || '-'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:${(p.stock_qty || 0) <= 10 ? '700;color:#ea580c' : '600'}">${p.stock_qty || 0} ${p.unit || 'nos'}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(p.rate || 0).toLocaleString('en-IN')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹${valuation.toLocaleString('en-IN')}</td>
        </tr>
      `;
    }).join('');
    printWindow.document.write(`
      <html><head><title>Inventory Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:12px}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}.kpi{display:inline-block;margin-right:24px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:6px}.kpi-label{font-size:11px;color:#6b7280}.kpi-value{font-size:18px;font-weight:700}</style></head><body>
        <h1>Inventory & Stock Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | ${products.length} items${lowStockOnly ? ' (Low Stock Only)' : ''} | Sorted by ${sortBy}</div>
        <div style="margin-bottom:16px">
          <div class="kpi"><div class="kpi-label">Total Items</div><div class="kpi-value">${totalItems}</div></div>
          <div class="kpi"><div class="kpi-label">Total Units</div><div class="kpi-value" style="color:#2563eb">${totalStockQty.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Stock Value</div><div class="kpi-value" style="color:#16a34a">₹${totalStockValue.toLocaleString('en-IN')}</div></div>
          <div class="kpi"><div class="kpi-label">Low Stock</div><div class="kpi-value" style="color:#ea580c">${lowStockItems.length}</div></div>
        </div>
        <table><thead><tr><th>Item Name</th><th>Code / HSN</th><th style="text-align:right">Stock Qty</th><th style="text-align:right">Unit Rate</th><th style="text-align:right">Valuation</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading inventory data…</span>
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
          <h1 className="text-xl text-gray-800 font-medium">Inventory & Stock Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
            <input type="checkbox" checked={lowStockOnly} onChange={e => setLowStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
            Low Stock Only
          </label>
          <div className="relative">
            <button onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between cursor-pointer hover:bg-gray-50">
              <span>Sort: {sortBy}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showSortDropdown && (
              <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
                {SORT_OPTIONS.map(opt => (
                  <button key={opt} onClick={() => { setSortBy(opt); setShowSortDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortBy === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
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
          { label: 'Total Stock Items', value: totalItems, icon: Package, color: 'text-gray-800' },
          { label: 'Total Units in Stock', value: totalStockQty.toLocaleString('en-IN'), icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Estimated Stock Value', value: `₹${totalStockValue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Low Stock Items', value: lowStockItems.length, icon: AlertTriangle, color: 'text-orange-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <kpi.icon className="w-4 h-4" /> {kpi.label}
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Warning Section */}
      {!lowStockOnly && lowStockItems.length > 0 && (
        <div className="bg-white border border-orange-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-orange-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-800 font-semibold">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <span>Low Stock Alerts (Threshold: ≤ 10 units)</span>
            </div>
            <span className="text-xs text-orange-700 font-medium">{lowStockItems.length} items need replenishment</span>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Rate (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lowStockItems.map(p => (
                <tr key={p.id} className="hover:bg-orange-50/50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{p.code || '—'}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-orange-600">{p.stock_qty || 0} {p.unit || 'nos'}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{Number(p.rate || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Complete Stock Listing */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {lowStockOnly ? 'Low Stock Items' : 'All Inventory Items'}
            <span className="ml-2 text-sm font-normal text-gray-500">({products.length} items)</span>
          </h3>
        </div>
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Code / HSN</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock Qty</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit Rate</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total Valuation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                {lowStockOnly ? 'No low stock items found' : 'No stock items found in database'}
              </td></tr>
            ) : products.map(p => {
              const valuation = (p.stock_qty || 0) * (p.rate || 0);
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium text-gray-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">{p.code || p.hsn_sac || '—'}</td>
                  <td className={`px-4 py-2.5 text-sm text-right font-medium ${(p.stock_qty || 0) <= 10 ? 'text-orange-600 font-bold' : ''}`}>
                    {p.stock_qty || 0} {p.unit || 'nos'}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{Number(p.rate || 0).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-gray-800">₹{valuation.toLocaleString('en-IN')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}