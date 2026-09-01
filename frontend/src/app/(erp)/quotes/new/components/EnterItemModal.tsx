'use client';

import React, { useState } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

interface EnterItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType?: 'stock' | 'service';
  onSaveItem: (itemDetails: {
    name: string;
    rate: number;
    unit: string;
    hsnSac: string;
    description: string;
  }) => void;
}

export default function EnterItemModal({
  isOpen,
  onClose,
  itemType = 'stock',
  onSaveItem
}: EnterItemModalProps) {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [classification, setClassification] = useState(itemType === 'service' ? 'Service' : 'Product');
  const [importance, setImportance] = useState('Normal');
  const [openingQty, setOpeningQty] = useState(0);
  const [unit, setUnit] = useState('no.s');
  const [store, setStore] = useState('');
  const [source, setSource] = useState('Internal Manufacturing');
  const [minStockQty, setMinStockQty] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [stdCost, setStdCost] = useState('');
  const [purchCost, setPurchCost] = useState('');
  const [stdSalePrice, setStdSalePrice] = useState('');
  const [hsnSac, setHsnSac] = useState('');
  const [gstPercent, setGstPercent] = useState('');
  const [mrp, setMrp] = useState('');
  const [description, setDescription] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      showToast('Item Name is required', 'error');
      return;
    }
    
    showToast('Item created successfully!', 'success');
    
    onSaveItem({
      name,
      rate: parseFloat(stdSalePrice) || 0,
      unit,
      hsnSac,
      description
    });
    
    onClose();

    // Reset Form
    setName('');
    setCode('');
    setCategory('');
    setSubCategory('');
    setOpeningQty(0);
    setUnit('no.s');
    setStore('');
    setMinStockQty('');
    setLeadTime('');
    setStdCost('');
    setPurchCost('');
    setStdSalePrice('');
    setHsnSac('');
    setGstPercent('');
    setMrp('');
    setDescription('');
    setInternalNotes('');
    setTags('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#f8f9fa] rounded shadow-xl flex flex-col mx-4 h-max text-[13px] text-gray-700 font-sans border border-gray-300">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">{itemType === 'service' ? 'Add Service / Non-Stock Item' : 'Add Stock Item'}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSubmit}
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-1.5 rounded-sm font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 flex flex-col gap-4">
          
          {/* Row 1: Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Name <span className="text-red-500">*</span></label>
              <input 
                value={name} 
                onChange={e => setName(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
                required 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Code <span className="text-red-500">*</span> <span className="text-[11px] text-gray-400 font-normal">(Prev. Code : Solar Panels)</span></label>
              <input 
                value={code} 
                onChange={e => setCode(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
                required 
              />
            </div>
          </div>

          {/* Row 2: Category, Sub-Category, Classification, Importance */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Category</label>
              <div className="flex gap-1">
                <input 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <button type="button" className="bg-[#ebedf0] hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded-sm"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Sub-Category</label>
              <div className="flex gap-1">
                <input 
                  value={subCategory} 
                  onChange={e => setSubCategory(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <button type="button" className="bg-[#ebedf0] hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded-sm"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Classification</label>
              <select 
                value={classification} 
                onChange={e => setClassification(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
              >
                <option value="Product">Product</option>
                <option value="Service">Service</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Importance</label>
              <select 
                value={importance} 
                onChange={e => setImportance(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Row 3: Opng. Qty, Unit, At Store */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Opng. Qty</label>
              <div className="flex gap-1">
                <input 
                  type="number" 
                  value={openingQty} 
                  onChange={e => setOpeningQty(parseInt(e.target.value) || 0)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 text-right"
                />
                <select 
                  value={unit} 
                  onChange={e => setUnit(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 bg-white w-20"
                >
                  <option value="no.s">no.s</option>
                  <option value="pcs">pcs</option>
                  <option value="kgs">kgs</option>
                </select>
                <button type="button" className="bg-[#ebedf0] hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded-sm"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">At Store</label>
              <div className="flex gap-1">
                <select 
                  value={store} 
                  onChange={e => setStore(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                >
                  <option value="">Select</option>
                  <option value="Main Store">Main Store</option>
                  <option value="Sub Store">Sub Store</option>
                </select>
                <button type="button" className="bg-[#ebedf0] hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded-sm"><Plus className="w-3.5 h-3.5" /></button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Source</label>
              <select 
                value={source} 
                onChange={e => setSource(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
              >
                <option value="Internal Manufacturing">Internal Manufacturing</option>
                <option value="Purchased">Purchased</option>
              </select>
            </div>
          </div>

          {/* Row 4: Min. Stock Qty, Lead Time */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Min. Stock Qty</label>
              <div className="flex items-center">
                <input 
                  value={minStockQty} 
                  onChange={e => setMinStockQty(e.target.value)}
                  className="border border-gray-300 rounded-l-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">no.s</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Lead Time</label>
              <div className="flex items-center">
                <input 
                  value={leadTime} 
                  onChange={e => setLeadTime(e.target.value)}
                  className="border border-gray-300 rounded-l-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">days</span>
              </div>
            </div>
          </div>

          {/* Row 5: Std Cost, Purchase Cost, Sale Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Std. Cost</label>
              <div className="flex items-center">
                <span className="border border-gray-300 border-r-0 rounded-l-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">₹</span>
                <input 
                  value={stdCost} 
                  onChange={e => setStdCost(e.target.value)}
                  className="border border-gray-300 px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">/ no.s</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Purch. Cost</label>
              <div className="flex items-center">
                <span className="border border-gray-300 border-r-0 rounded-l-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">₹</span>
                <input 
                  value={purchCost} 
                  onChange={e => setPurchCost(e.target.value)}
                  className="border border-gray-300 px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">/ no.s</span>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Std. Sale Price</label>
              <div className="flex items-center">
                <span className="border border-gray-300 border-r-0 rounded-l-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">₹</span>
                <input 
                  value={stdSalePrice} 
                  onChange={e => setStdSalePrice(e.target.value)}
                  className="border border-gray-300 px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">/ no.s</span>
              </div>
            </div>
          </div>

          {/* Row 6: HSN/SAC, GST %, MRP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">HSN/SAC</label>
              <input 
                value={hsnSac} 
                onChange={e => setHsnSac(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">GST %</label>
              <input 
                value={gstPercent} 
                onChange={e => setGstPercent(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">MRP</label>
              <div className="flex items-center">
                <span className="border border-gray-300 border-r-0 rounded-l-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">₹</span>
                <input 
                  value={mrp} 
                  onChange={e => setMrp(e.target.value)}
                  className="border border-gray-300 px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <span className="border border-gray-300 border-l-0 rounded-r-sm px-2.5 py-1.5 bg-gray-50 text-gray-500">/ no.s</span>
              </div>
            </div>
          </div>

          {/* Row 7: Description & Internal Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Description</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Internal Notes</label>
              <textarea 
                value={internalNotes} 
                onChange={e => setInternalNotes(e.target.value)}
                rows={3}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none"
              />
            </div>
          </div>

          {/* Row 8: Tags */}
          <div className="flex flex-col gap-1.5 max-w-sm">
            <label className="font-semibold text-gray-600">Tags</label>
            <div className="flex gap-1">
              <input 
                value={tags} 
                onChange={e => setTags(e.target.value)}
                className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1"
              />
              <button type="button" className="bg-[#ebedf0] hover:bg-gray-300 text-gray-700 px-2 py-1.5 rounded-sm"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 mt-4 border-t border-gray-200 pt-4">
            <button 
              type="button" 
              onClick={handleSubmit}
              className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-sm font-semibold flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2.5 rounded-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
