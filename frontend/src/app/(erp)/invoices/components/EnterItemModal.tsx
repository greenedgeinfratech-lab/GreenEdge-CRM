'use client';

import React, { useState } from 'react';
import { X, Check, Info, Loader2, AlertCircle } from 'lucide-react';
import { productsApi } from '@/services/crmService';
import type { ProductCatalog } from '@/interfaces/crm';

interface EnterItemModalProps {
  onClose: () => void;
  onSaveSuccess: (item: ProductCatalog) => void;
  initialItem?: ProductCatalog | null;
  mode?: 'create' | 'edit';
}

export default function EnterItemModal({
  onClose,
  onSaveSuccess,
  initialItem = null,
  mode = 'create',
}: EnterItemModalProps) {
  const [name, setName] = useState(initialItem?.name ?? '');
  const [code, setCode] = useState(initialItem?.code ?? '');
  const [category, setCategory] = useState(initialItem?.category ?? '');
  const [subCategory, setSubCategory] = useState(initialItem?.sub_category ?? '');
  const [classification, setClassification] = useState(initialItem?.classification ?? 'Product');
  const [importance, setImportance] = useState(initialItem?.importance ?? 'Normal');

  const [opngQty, setOpngQty] = useState<number | ''>(initialItem?.opng_qty ?? initialItem?.stock_qty ?? 0);
  const [unit, setUnit] = useState(initialItem?.unit ?? 'no.s');
  const [atStore, setAtStore] = useState(initialItem?.at_store ?? '');

  const [source, setSource] = useState(initialItem?.source ?? 'Internal Manufacturing');
  const [minStockQty, setMinStockQty] = useState<number | ''>(initialItem?.min_stock_qty ?? '');
  const [leadTime, setLeadTime] = useState<number | ''>(initialItem?.lead_time ?? '');

  const [stdCost, setStdCost] = useState<number | ''>(initialItem?.std_cost ?? '');
  const [purchCost, setPurchCost] = useState<number | ''>(initialItem?.purch_cost ?? '');
  const [stdSalePrice, setStdSalePrice] = useState<number | ''>(initialItem?.rate ?? '');

  const [hsnSac, setHsnSac] = useState(initialItem?.hsn_sac ?? '');
  const computedGst = initialItem ? Number(initialItem.igst_percent || ((Number(initialItem.cgst_percent || 0) + Number(initialItem.sgst_percent || 0)) || 18)) : 18;
  const [gstPercent, setGstPercent] = useState<number | ''>(computedGst);
  const [mrp, setMrp] = useState<number | ''>(initialItem?.mrp ?? '');

  const [description, setDescription] = useState(initialItem?.description ?? '');
  const [internalNotes, setInternalNotes] = useState(initialItem?.internal_notes ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(initialItem?.tags ?? []);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError('');

    const gst = Number(gstPercent) || 0;
    const cgst = gst / 2;
    const sgst = gst / 2;

    const payload: Partial<ProductCatalog> = {
      name: name.trim(),
      code: code.trim() || undefined,
      item_type: 'Stock',
      category: category.trim() || undefined,
      sub_category: subCategory.trim() || undefined,
      classification,
      importance,
      opng_qty: Number(opngQty) || 0,
      stock_qty: Number(opngQty) || 0,
      unit: unit || 'no.s',
      at_store: atStore || undefined,
      source,
      min_stock_qty: Number(minStockQty) || 0,
      lead_time: Number(leadTime) || 0,
      std_cost: Number(stdCost) || 0,
      purch_cost: Number(purchCost) || 0,
      rate: Number(stdSalePrice) || 0,
      hsn_sac: hsnSac.trim() || undefined,
      cgst_percent: cgst,
      sgst_percent: sgst,
      igst_percent: gst,
      mrp: Number(mrp) || 0,
      description: description.trim() || undefined,
      internal_notes: internalNotes.trim() || undefined,
      tags,
    };

    try {
      const res = mode === 'edit' && initialItem?.id
        ? await productsApi.update(initialItem.id, payload)
        : await productsApi.create(payload);
      const responseData = res.data as { data?: ProductCatalog } | ProductCatalog;
      const savedItem = responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data
        ? responseData.data
        : (responseData as ProductCatalog);
      onSaveSuccess(savedItem);
      onClose();
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { detail?: string } } ; message?: string };
      setError(errorResponse?.response?.data?.detail || errorResponse?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} item.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl overflow-hidden my-6 border border-gray-200">
        
        {/* Header (img1 style) */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-normal text-gray-800">{mode === 'edit' ? 'Edit Stock Item' : 'Enter Item'}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#007026] text-white text-xs font-semibold px-4 py-1.5 rounded hover:bg-[#005c1f] flex items-center gap-1.5 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {mode === 'edit' ? 'Update' : 'Save'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col gap-5 text-xs text-gray-700 bg-[#f9fafb]">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded flex items-center gap-2 text-xs">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Code <span className="text-red-500">*</span> <span className="text-gray-400 font-normal">(Prev. Code : Solar Panels)</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
              />
            </div>
          </div>

          {/* Category, Sub-Category, Classification, Importance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Category</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <button type="button" className="px-2.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]">
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Sub-Category</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <button type="button" className="px-2.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]">
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Classification</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              >
                <option>Product</option>
                <option>Service</option>
                <option>Raw Material</option>
                <option>Asset</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Importance</label>
              <select
                value={importance}
                onChange={(e) => setImportance(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              >
                <option>Normal</option>
                <option>High</option>
                <option>Low</option>
              </select>
            </div>
          </div>

          {/* Opng. Qty, Unit, At Store */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
                Opng. Qty <Info size={13} className="text-gray-400" />
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  value={opngQty}
                  onChange={(e) => setOpngQty(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-20 border border-gray-300 rounded px-2.5 py-1.5 bg-white text-center focus:outline-none focus:border-green-600"
                />
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                >
                  <option>no.s</option>
                  <option>Set</option>
                  <option>Mtr</option>
                  <option>Pkt</option>
                  <option>Kg</option>
                  <option>Box</option>
                </select>
                <button type="button" className="px-2.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]">
                  +
                </button>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 font-medium text-gray-700">At Store</label>
              <div className="flex gap-1.5">
                <select
                  value={atStore}
                  onChange={(e) => setAtStore(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                >
                  <option value="">Select Store / Warehouse</option>
                  <option value="Main Store">Main Store</option>
                  <option value="Factory Warehouse">Factory Warehouse</option>
                </select>
                <button type="button" className="px-2.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]">
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Source, Min Stock Qty, Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              >
                <option>Internal Manufacturing</option>
                <option>Outsourced / Purchase</option>
                <option>Trading</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Min. Stock Qty</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={minStockQty}
                  onChange={(e) => setMinStockQty(e.target.value ? parseFloat(e.target.value) : '')}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="text-gray-500 text-xs">no.s</span>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Lead Time</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value ? parseInt(e.target.value) : '')}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="text-gray-500 text-xs">days</span>
              </div>
            </div>
          </div>

          {/* Costs: Std Cost, Purch Cost, Std Sale Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
                Std. Cost <Info size={13} className="text-gray-400" />
              </label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-1.5 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={stdCost}
                  onChange={(e) => setStdCost(e.target.value ? parseFloat(e.target.value) : '')}
                  className="flex-1 border border-gray-300 px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="border border-l-0 border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-500 rounded-r text-[11px]">/ no.s</span>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
                Purch. Cost <Info size={13} className="text-gray-400" />
              </label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-1.5 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={purchCost}
                  onChange={(e) => setPurchCost(e.target.value ? parseFloat(e.target.value) : '')}
                  className="flex-1 border border-gray-300 px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="border border-l-0 border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-500 rounded-r text-[11px]">/ no.s</span>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
                Std. Sale Price <Info size={13} className="text-gray-400" />
              </label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-1.5 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={stdSalePrice}
                  onChange={(e) => setStdSalePrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className="flex-1 border border-gray-300 px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="border border-l-0 border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-500 rounded-r text-[11px]">/ no.s</span>
              </div>
            </div>
          </div>

          {/* HSN/SAC, GST %, MRP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">HSN/SAC</label>
              <input
                type="text"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">GST %</label>
              <input
                type="number"
                value={gstPercent}
                onChange={(e) => setGstPercent(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">MRP</label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-1.5 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value ? parseFloat(e.target.value) : '')}
                  className="flex-1 border border-gray-300 px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
                />
                <span className="border border-l-0 border-gray-300 bg-gray-50 px-2 py-1.5 text-gray-500 rounded-r text-[11px]">/ no.s</span>
              </div>
            </div>
          </div>

          {/* Description & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700 flex items-center gap-1">
                Description <Info size={13} className="text-gray-400" />
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded p-2.5 bg-white resize-none focus:outline-none focus:border-green-600"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Internal Notes</label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded p-2.5 bg-white resize-none focus:outline-none focus:border-green-600"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Tags</label>
            <div className="flex items-center gap-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. Solar, Hardware"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-green-600"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]"
              >
                +
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                    {t}
                    <button type="button" onClick={() => handleRemoveTag(t)} className="text-green-600 hover:text-green-900">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#007026] text-white text-xs font-semibold px-5 py-2 rounded hover:bg-[#005c1f] flex items-center gap-1.5 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            Save
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
