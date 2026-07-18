'use client';

import React, { useState } from 'react';
import { X, Search } from 'lucide-react';

import EnterItemModal from './EnterItemModal';

interface SelectItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItems: (items: { description: string; rate?: number; hsnSac?: string }[]) => void;
}

const ITEMS_LIST = [
  "1 WAAREE 540WP MONO HF-CUT SOLAR MODULE",
  "12 F HOT DIP STUD",
  "12 HOT DIP PARLIN",
  "16MM ALUMINIUM CABLE 100METER EARTH GUARD",
  "16mm aluminum cable 100meter",
  "2 KW Ongrid Solar System",
  "300 4.8MM CABLE TIE NAVKAR",
  "3KW GRID CONNECTED 560-580 WP X6 NO 1P TATA POWER SOLAR SYSTEM SPGS SOLAR MODULE DCR BIFACIAL PANEL",
  "3KW GRID CONNECTED 575WP X6 NOS. 1P",
  "3KWp TATA SOLAR ONGRID SYSTEM KIT",
  "5 KVA Hybrid Single Phase Inverter",
  "5.12 Kwh LPF battery",
  "540 WATT Mono Half Cut Bifacial Solar Module"
];

export default function SelectItemModal({
  isOpen,
  onClose,
  onSelectItems
}: SelectItemModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [isEnterItemOpen, setIsEnterItemOpen] = useState(false);

  if (!isOpen) return null;

  const filteredItems = ITEMS_LIST.filter(item => 
    item.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = (item: string) => {
    setSelected(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  const handleAddSelected = () => {
    const checked = Object.keys(selected).filter(k => selected[k]);
    if (checked.length > 0) {
      onSelectItems(checked.map(c => ({ description: c })));
      setSelected({});
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg bg-white rounded shadow-xl flex flex-col h-[90vh] text-[13px] text-gray-700 font-sans border border-gray-300">
        
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-bold text-gray-800">Select Item</h2>
          <div className="flex items-center gap-2">
            <button className="bg-orange-100 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-sm font-semibold hover:bg-orange-200">
              Change Layout
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-gray-100 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-gray-400 absolute left-3" />
            <input 
              type="text" 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              placeholder="Search" 
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-sm outline-none focus:border-green-600 bg-white"
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-gray-100">
          {filteredItems.map((item, idx) => (
            <label 
              key={idx} 
              className="flex items-start gap-3 py-3 cursor-pointer hover:bg-orange-50/50 transition-colors"
            >
              <input 
                type="checkbox" 
                checked={!!selected[item]} 
                onChange={() => handleToggle(item)} 
                className="mt-0.5 rounded-sm"
              />
              <div className="flex flex-col">
                <span className="font-bold text-gray-800">{item}</span>
                <span className="text-[11px] text-gray-500">{item}</span>
              </div>
            </label>
          ))}
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-400 font-medium">No items found</div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex gap-2 p-4 border-t border-gray-200 shrink-0 bg-gray-50 flex-wrap">
          {Object.keys(selected).filter(k => selected[k]).length > 0 ? (
            <button 
              onClick={handleAddSelected}
              className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-sm font-semibold text-center text-[12px]"
            >
              ✓ Add Selected Items ({Object.keys(selected).filter(k => selected[k]).length})
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsEnterItemOpen(true)}
                className="flex-1 bg-[#c85a17] hover:bg-[#b04a10] text-white py-2 rounded-sm font-semibold text-center text-[12px]"
              >
                + Add Stock Item
              </button>
              <button 
                onClick={() => setIsEnterItemOpen(true)}
                className="flex-1 bg-[#c85a17] hover:bg-[#b04a10] text-white py-2 rounded-sm font-semibold text-center text-[12px]"
              >
                + Add Service / Non-Stock Item
              </button>
            </>
          )}
          <button 
            onClick={onClose} 
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-sm font-semibold flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>

      </div>

      <EnterItemModal 
        isOpen={isEnterItemOpen}
        onClose={() => setIsEnterItemOpen(false)}
        onSaveItem={(itemDetails) => {
          onSelectItems([{
            description: itemDetails.name,
            rate: itemDetails.rate,
            hsnSac: itemDetails.hsnSac
          }]);
          onClose();
        }}
      />
    </div>
  );
}
