'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ChevronLeft, ChevronRight, Pencil, Plus, Package, Trash2 } from 'lucide-react';
import { productsApi } from '@/services/crmService';
import type { ProductCatalog } from '@/interfaces/crm';
import EnterItemModal from '@/app/(erp)/invoices/components/EnterItemModal';
import AddNonStockItemModal from '@/app/(erp)/invoices/components/AddNonStockItemModal';

type ItemType = '' | 'Stock' | 'Service';
type ProductListPayload = { count?: number; results?: ProductCatalog[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseProductList(response: unknown): { products: ProductCatalog[]; count: number } {
  // Django responses are rendered as { success, data: { count, results }, errors }.
  const payload = isRecord(response) && 'data' in response ? response.data : response;

  if (Array.isArray(payload)) return { products: payload as ProductCatalog[], count: payload.length };
  if (!isRecord(payload)) return { products: [], count: 0 };

  const page = payload as ProductListPayload;
  const products = Array.isArray(page.results) ? page.results : [];
  return { products, count: typeof page.count === 'number' ? page.count : products.length };
}

function amount(value: number | string | undefined): number {
  return Number(value ?? 0);
}

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState<ItemType>('');
  const [page, setPage] = useState(1);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductCatalog | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventory-products', search, itemType, page],
    queryFn: async () => {
      const response = await productsApi.list({ search: search || undefined, item_type: itemType || undefined, page });
      return parseProductList(response.data);
    },
  });

  const products = data?.products ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 10));
  const stockValue = products.reduce((sum, product) => sum + amount(product.rate) * amount(product.stock_qty), 0);
  const lowStockCount = products.filter(
    (product) => product.item_type === 'Stock' && amount(product.stock_qty) <= Math.max(amount(product.min_stock_qty), 10),
  ).length;

  const refreshInventory = () => queryClient.invalidateQueries({ queryKey: ['inventory-products'] });

  const openCreate = (type: 'Stock' | 'Service') => {
    setEditingItem(null);
    setShowStockModal(type === 'Stock');
    setShowServiceModal(type === 'Service');
  };

  const openEdit = (item: ProductCatalog) => {
    setEditingItem(item);
    setShowStockModal(item.item_type === 'Stock');
    setShowServiceModal(item.item_type === 'Service');
  };

  const closeModals = () => {
    setShowStockModal(false);
    setShowServiceModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (item: ProductCatalog) => {
    if (!window.confirm(`Delete “${item.name}”? This cannot be undone.`)) return;

    setDeleteError('');
    try {
      await productsApi.delete(item.id);
      if (products.length === 1 && page > 1) setPage((current) => current - 1);
      await refreshInventory();
    } catch {
      setDeleteError('The item could not be deleted. It may be used by an existing transaction.');
    }
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 p-4">
      <div className="flex flex-col justify-between gap-4 border border-gray-200 bg-white p-4 shadow-xs xl:flex-row xl:items-center">
        <div className="flex items-baseline gap-3">
          <h1 className="text-xl font-semibold text-gray-800">Inventory</h1>
          <span className="text-sm text-gray-500">({totalCount} items)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search inventory</span>
            <input
              type="search"
              placeholder="Search items, code, HSN..."
              value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              className="w-56 rounded border border-gray-300 py-1.5 pr-3 pl-3 text-sm outline-none focus:border-green-600"
            />
          </label>
          <button onClick={() => openCreate('Service')} className="rounded border border-[#c85a17] px-3 py-1.5 text-sm font-medium text-[#c85a17] hover:bg-orange-50">
            Add Service
          </button>
          <button onClick={() => openCreate('Stock')} className="flex items-center rounded bg-[#c85a17] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b04a10]">
            <Plus className="mr-1 h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total Items" value={totalCount.toLocaleString('en-IN')} />
        <SummaryCard label="Stock Value on this page" value={formatCurrency(stockValue)} valueClassName="text-green-600" />
        <SummaryCard label="Low Stock on this page" value={lowStockCount.toLocaleString('en-IN')} valueClassName="text-orange-600" />
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filter item type">
        {([
          ['', 'All'],
          ['Stock', 'Stock'],
          ['Service', 'Services'],
        ] as const).map(([value, label]) => (
          <button
            key={label}
            onClick={() => { setItemType(value); setPage(1); }}
            className={`rounded px-4 py-1.5 text-sm font-medium ${itemType === value ? 'bg-[#162032] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {deleteError && <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{deleteError}</div>}

      <div className="overflow-x-auto rounded border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 font-semibold text-gray-800">
            <tr>
              <th className="px-4 py-3">Item</th><th className="px-4 py-3">Code</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">HSN/SAC</th>
              <th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Stock</th><th className="px-4 py-3 text-right">Value</th><th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <EmptyRow message="Loading inventory…" /> : isError ? <EmptyRow message="Unable to load inventory. Please try again." action={<button onClick={() => refetch()} className="mt-2 text-sm font-medium text-green-700 hover:underline">Try again</button>} /> : products.length === 0 ? (
              <EmptyRow message={search || itemType ? 'No items match these filters.' : 'No items found. Add your first inventory item to get started.'} icon action={!search && !itemType ? <button onClick={() => openCreate('Stock')} className="mt-3 inline-flex items-center rounded bg-[#c85a17] px-3 py-1.5 text-sm text-white"><Plus className="mr-1 h-4 w-4" /> Add Item</button> : undefined} />
            ) : products.map((product) => {
              const stock = amount(product.stock_qty);
              const rate = amount(product.rate);
              const lowStock = product.item_type === 'Stock' && stock <= Math.max(amount(product.min_stock_qty), 10);
              return <tr key={product.id} className="text-gray-700 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}<span className="mt-0.5 block text-xs text-gray-500">{product.unit || 'no.s'}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{product.code || '—'}</td>
                <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs ${product.item_type === 'Stock' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{product.item_type}</span></td>
                <td className="px-4 py-3 text-xs text-gray-500">{product.hsn_sac || '—'}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(rate)}</td>
                <td className={`px-4 py-3 text-right font-medium ${lowStock ? 'text-orange-600' : ''}`}>{stock.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-right font-medium">{formatCurrency(rate * stock)}</td>
                <td className="px-4 py-3"><div className="flex justify-center gap-1"><button onClick={() => openEdit(product)} title={`Edit ${product.name}`} className="rounded p-1.5 text-blue-700 hover:bg-blue-50"><Pencil className="h-4 w-4" /></button><button onClick={() => handleDelete(product)} title={`Delete ${product.name}`} className="rounded p-1.5 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button></div></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && <div className="flex items-center justify-center gap-3"><button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button><span className="text-sm text-gray-600">Page {page} of {totalPages}</span><button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button></div>}

      {showStockModal && <EnterItemModal mode={editingItem ? 'edit' : 'create'} initialItem={editingItem} onClose={closeModals} onSaveSuccess={() => { closeModals(); refreshInventory(); }} />}
      {showServiceModal && <AddNonStockItemModal mode={editingItem ? 'edit' : 'create'} initialItem={editingItem} onClose={closeModals} onSaveSuccess={() => { closeModals(); refreshInventory(); }} />}
    </div>
  );
}

function SummaryCard({ label, value, valueClassName = 'text-gray-800' }: { label: string; value: string; valueClassName?: string }) {
  return <div className="rounded-lg border bg-white p-4"><div className="text-sm text-gray-500">{label}</div><div className={`mt-1 text-2xl font-bold ${valueClassName}`}>{value}</div></div>;
}

function EmptyRow({ message, action, icon = false }: { message: string; action?: React.ReactNode; icon?: boolean }) {
  return <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">{icon && <Package className="mx-auto mb-2 h-12 w-12 text-gray-300" />}{message}{action && <div>{action}</div>}</td></tr>;
}
