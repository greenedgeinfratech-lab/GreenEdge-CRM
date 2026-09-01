'use client';

import React, { useState } from 'react';
import { X, Check, Loader2, AlertCircle } from 'lucide-react';
import { productsApi } from '@/services/crmService';
import type { ProductCatalog } from '@/interfaces/crm';

interface AddNonStockItemModalProps {
  onClose: () => void;
  onSaveSuccess: (item: ProductCatalog) => void;
  initialItem?: ProductCatalog | null;
  mode?: 'create' | 'edit';
}

export default function AddNonStockItemModal({
  onClose,
  onSaveSuccess,
  initialItem = null,
  mode = 'create',
}: AddNonStockItemModalProps) {
  const [type, setType] = useState<'Goods' | 'Services'>(initialItem?.item_type === 'Service' ? 'Services' : 'Goods');
  const [itemName, setItemName] = useState(initialItem?.name ?? '');
  const [code, setCode] = useState(initialItem?.code ?? '');
  const [description, setDescription] = useState(initialItem?.description ?? '');

  const [standardRate, setStandardRate] = useState<number | ''>(initialItem?.rate ?? 0);
  const [unit, setUnit] = useState(initialItem?.unit ?? 'no.s');
  const [hsn, setHsn] = useState(initialItem?.hsn_sac ?? '');
  const [gstPercent, setGstPercent] = useState<number | ''>(
    initialItem
      ? Number(initialItem.igst_percent || ((Number(initialItem.cgst_percent || 0) + Number(initialItem.sgst_percent || 0)) || 0))
      : ''
  );

  const [mrp, setMrp] = useState<number | ''>(initialItem?.mrp ?? 0);
  const [leadTime, setLeadTime] = useState<number | ''>(initialItem?.lead_time ?? 0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!itemName.trim()) {
      setError('Item Name is required.');
      return;
    }

    setSaving(true);
    setError('');

    const gst = Number(gstPercent) || 0;
    const cgst = gst / 2;
    const sgst = gst / 2;

    const payload: Partial<ProductCatalog> = {
      name: itemName.trim(),
      code: code.trim() || undefined,
      item_type: type === 'Services' ? 'Service' : 'Stock',
      description: description.trim() || undefined,
      rate: Number(standardRate) || 0,
      unit: unit || 'no.s',
      hsn_sac: hsn.trim() || undefined,
      cgst_percent: cgst,
      sgst_percent: sgst,
      igst_percent: gst,
      mrp: Number(mrp) || 0,
      lead_time: Number(leadTime) || 0,
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
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden border border-gray-200">
        
        {/* Header (img2 style) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-medium text-gray-800">{mode === 'edit' ? 'Edit Item' : 'Add Item'}</h2>
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
        <div className="p-6 flex flex-col gap-4 text-xs text-gray-700 bg-[#fbfcfc]">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded flex items-center gap-2 text-xs">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {/* Type radio buttons */}
          <div>
            <label className="block mb-1.5 font-medium text-gray-700">Type</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="itemType"
                  checked={type === 'Goods'}
                  onChange={() => setType('Goods')}
                  className="w-4 h-4 text-[#007026] focus:ring-[#007026]"
                />
                Goods
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="itemType"
                  checked={type === 'Services'}
                  onChange={() => setType('Services')}
                  className="w-4 h-4 text-[#007026] focus:ring-[#007026]"
                />
                Services
              </label>
            </div>
          </div>

          {/* Item Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1 font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded p-2.5 bg-white resize-none focus:outline-none focus:border-green-600"
            />
          </div>

          {/* Standard Rate, Unit, HSN, GST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Standard Rate <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-2 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={standardRate}
                  onChange={(e) => setStandardRate(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-right font-medium text-sm rounded-r"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Unit</label>
              <div className="flex gap-1.5">
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2.5 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
                >
                  <option>no.s</option>
                  <option>Set</option>
                  <option>Mtr</option>
                  <option>Pkt</option>
                  <option>Kg</option>
                  <option>Job</option>
                  <option>Hrs</option>
                </select>
                <button type="button" className="px-2.5 bg-[#b2dfbc] text-[#006020] rounded font-bold text-sm hover:bg-[#a0d4ab]">
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">HSN</label>
              <input
                type="text"
                placeholder="e.g. 998313"
                value={hsn}
                onChange={(e) => setHsn(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">GST</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={gstPercent}
                  onChange={(e) => setGstPercent(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-sm"
                />
                <span className="text-gray-500 font-medium">%</span>
              </div>
            </div>
          </div>

          {/* MRP & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="block mb-1 font-medium text-gray-700">MRP</label>
              <div className="flex items-center">
                <span className="border border-r-0 border-gray-300 bg-gray-50 px-2.5 py-2 text-gray-500 rounded-l">₹</span>
                <input
                  type="number"
                  value={mrp}
                  onChange={(e) => setMrp(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full border border-gray-300 px-3 py-2 bg-white focus:outline-none focus:border-green-600 text-right font-medium text-sm rounded-r"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1 font-medium text-gray-700">Lead Time</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value ? parseInt(e.target.value) : '')}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-center font-medium focus:outline-none focus:border-green-600 text-sm"
                />
                <span className="text-gray-500 text-xs font-medium">days</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="flex gap-2">
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
              className="px-4 py-2 bg-[#e2e8f0] border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-300 transition-colors"
            >
              ✕ Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
