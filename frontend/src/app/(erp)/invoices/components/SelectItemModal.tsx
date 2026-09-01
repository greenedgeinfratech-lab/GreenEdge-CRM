'use client';

import React, { useState } from 'react';
import { X, Search, Plus, Check, Loader2, AlertCircle, Package, Pencil } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/services/crmService';
import type { ProductCatalog } from '@/interfaces/crm';
import EnterItemModal from './EnterItemModal';
import AddNonStockItemModal from './AddNonStockItemModal';

interface SelectItemModalProps {
  onClose: () => void;
  onSelectItems: (items: ProductCatalog[]) => void;
}

export default function SelectItemModal({ onClose, onSelectItems }: SelectItemModalProps) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Stock' | 'Service'>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<ProductCatalog | null>(null);
  
  // Modals for img1 (EnterItemModal) and img2 (AddNonStockItemModal)
  const [showEnterItemModal, setShowEnterItemModal] = useState(false);
  const [showAddNonStockModal, setShowAddNonStockModal] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products-catalog-search', query, filterType],
    queryFn: async () => {
      const res = await productsApi.list({
        search: query || undefined,
        item_type: filterType === 'All' ? undefined : filterType,
      });
      const rawData: unknown = res.data;
      const payload = typeof rawData === 'object' && rawData !== null && 'data' in rawData
        ? (rawData as { data?: unknown }).data
        : rawData;

      // Backend responses are wrapped as { success, message, data, errors }.
      // The actual catalog list lives under payload.results when paginated.
      if (Array.isArray(payload)) return payload;
      if (typeof payload === 'object' && payload !== null) {
        const maybeResults = (payload as { results?: unknown }).results;
        if (Array.isArray(maybeResults)) return maybeResults;
        const maybeData = (payload as { data?: unknown }).data;
        if (Array.isArray(maybeData)) return maybeData;
      }
      return [];
    },
  });

  const products: ProductCatalog[] = data || [];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddSelected = () => {
    const selected = products.filter((p) => selectedIds.includes(p.id));
    if (selected.length > 0) {
      onSelectItems(selected);
      onClose();
    }
  };

  const handleSingleClick = (product: ProductCatalog) => {
    onSelectItems([product]);
    onClose();
  };

  const handleCreatedItemSuccess = (createdItem: ProductCatalog) => {
    queryClient.invalidateQueries({ queryKey: ['products-catalog-search'] });
    onSelectItems([createdItem]);
    onClose();
  };

  const handleUpdatedItemSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['products-catalog-search'] });
    setEditingItem(null);
  };

  const openCreateStockItem = () => {
    setEditingItem(null);
    setShowEnterItemModal(true);
  };

  const openCreateServiceItem = () => {
    setEditingItem(null);
    setShowAddNonStockModal(true);
  };

  const openEditItem = (item: ProductCatalog) => {
    setEditingItem(item);
    if (item.item_type === 'Service') {
      setShowAddNonStockModal(true);
    } else {
      setShowEnterItemModal(true);
    }
  };

  const closeStockModal = () => {
    setShowEnterItemModal(false);
    setEditingItem(null);
  };

  const closeServiceModal = () => {
    setShowAddNonStockModal(false);
    setEditingItem(null);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-800">Select Item</h2>
            <div className="flex items-center gap-3">
              <span className="bg-[#fce8d5] text-[#c85a17] text-xs font-semibold px-2.5 py-1 rounded-md cursor-pointer border border-[#f5d0b0] flex items-center gap-1 hover:bg-[#fad8bc]">
                <span className="grid grid-cols-2 gap-0.5 w-3 h-3">
                  <span className="bg-[#c85a17] rounded-xs"></span>
                  <span className="bg-[#c85a17] rounded-xs"></span>
                  <span className="bg-[#c85a17] rounded-xs"></span>
                  <span className="bg-[#c85a17] rounded-xs"></span>
                </span>
                Change Layout
              </span>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Filter / Search Bar */}
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search by name, code or HSN/SAC..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-[#c85a17]"
              />
            </div>

            <div className="flex bg-white rounded border border-gray-200 p-0.5 text-xs font-medium text-gray-600">
              {(['All', 'Stock', 'Service'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1 rounded transition-colors ${
                    filterType === type ? 'bg-[#c85a17] text-white shadow-xs' : 'hover:bg-gray-100'
                  }`}
                >
                  {type === 'All' ? 'All' : type === 'Stock' ? 'Stock Items' : 'Services'}
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="overflow-y-auto flex-1 min-h-[300px] max-h-[420px] divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <Loader2 size={24} className="animate-spin text-[#c85a17]" />
                <span>Loading catalog items…</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-12 text-red-500 text-sm gap-2">
                <AlertCircle size={22} />
                <span>Failed to load items.</span>
                <button onClick={() => refetch()} className="text-xs underline text-gray-600 mt-1">
                  Retry
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-sm gap-2">
                <Package size={32} className="text-gray-300" />
                <p>{query ? 'No matching items found.' : 'No items found in catalog.'}</p>
              </div>
            ) : (
              products.map((item) => {
                const isChecked = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3.5 px-6 py-3 cursor-pointer transition-colors ${
                      isChecked ? 'bg-[#fff7f2]' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleSelect(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 text-[#c85a17] border-gray-300 rounded focus:ring-[#c85a17]"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-800 uppercase tracking-tight">
                          {item.name}
                        </p>
                        <span className="text-xs font-semibold text-gray-700 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
                          ₹ {Number(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <p className="text-xs text-gray-500 mt-0.5 uppercase">
                        {item.description || item.name}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-1">
                        {item.hsn_sac && (
                          <span>HSN/SAC: <strong className="text-gray-600 font-medium">{item.hsn_sac}</strong></span>
                        )}
                        <span>Unit: <strong className="text-gray-600 font-medium">{item.unit}</strong></span>
                        <span>GST: <strong className="text-gray-600 font-medium">{(Number(item.cgst_percent || 0) + Number(item.sgst_percent || 0))}%</strong></span>
                        <span className="ml-auto flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditItem(item);
                            }}
                            className="inline-flex items-center gap-1 text-blue-700 hover:text-blue-900 font-semibold"
                            title="Edit item"
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleClick(item);
                            }}
                            className="text-[#c85a17] hover:underline font-semibold"
                          >
                            Select →
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Buttons */}
          <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={openCreateStockItem}
                className="bg-[#c85a17] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#b04a10] flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Add Stock Item
              </button>
              <button
                onClick={openCreateServiceItem}
                className="bg-[#c85a17] text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-[#b04a10] flex items-center gap-1 transition-colors"
              >
                <Plus size={14} /> Add Service / Non Stock Item
              </button>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleAddSelected}
                  className="bg-green-700 text-white text-xs font-medium px-3 py-1.5 rounded hover:bg-green-800 flex items-center gap-1 transition-colors"
                >
                  <Check size={14} /> Add Selected ({selectedIds.length})
                </button>
              )}
              <button
                onClick={onClose}
                className="bg-gray-200 border border-gray-300 text-gray-700 text-xs font-medium px-3.5 py-1.5 rounded hover:bg-gray-300 transition-colors"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Biziverse ERP Enter Item Form Modal (img1) */}
      {showEnterItemModal && (
        <EnterItemModal
          key={editingItem?.id ? `stock-edit-${editingItem.id}` : 'stock-create'}
          onClose={closeStockModal}
          onSaveSuccess={editingItem ? handleUpdatedItemSuccess : handleCreatedItemSuccess}
          initialItem={editingItem}
          mode={editingItem ? 'edit' : 'create'}
        />
      )}

      {/* Biziverse ERP Add Item (Non-stock / Services) Form Modal (img2) */}
      {showAddNonStockModal && (
        <AddNonStockItemModal
          key={editingItem?.id ? `service-edit-${editingItem.id}` : 'service-create'}
          onClose={closeServiceModal}
          onSaveSuccess={editingItem ? handleUpdatedItemSuccess : handleCreatedItemSuccess}
          initialItem={editingItem}
          mode={editingItem ? 'edit' : 'create'}
        />
      )}
    </>
  );
}
