import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { LeadFilters } from '@/interfaces/crm';

interface PeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LeadFilters;
  onApply: (updates: Partial<LeadFilters>) => void;
}

export default function PeriodModal({ isOpen, onClose, filters, onApply }: PeriodModalProps) {
  const [mode, setMode] = useState<'year' | 'month' | 'date' | 'all'>('all');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('2026-07');
  const [date, setDate] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    let created_after = undefined;
    let created_before = undefined;

    if (mode === 'year') {
      created_after = `${year}-04-01T00:00:00`;
      created_before = `${parseInt(year) + 1}-03-31T23:59:59`;
    } else if (mode === 'month') {
      const [y, m] = month.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      created_after = `${month}-01T00:00:00`;
      created_before = `${month}-${lastDay}T23:59:59`;
    } else if (mode === 'date') {
      if (date) {
        created_after = `${date}T00:00:00`;
        created_before = `${date}T23:59:59`;
      }
    }

    onApply({ created_after, created_before, page: 1 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-[#f4f5f7] rounded-lg shadow-xl w-[320px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-[#f4f5f7]">
          <h2 className="text-xl font-normal text-gray-800">Period</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4 bg-[#f4f5f7]">
          <label className="flex items-center gap-3">
            <input 
              type="radio" 
              name="periodMode"
              checked={mode === 'year'} 
              onChange={() => setMode('year')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="w-16 text-sm text-gray-700">Year</span>
            <select 
              value={year}
              onChange={e => setYear(e.target.value)}
              disabled={mode !== 'year'}
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white disabled:opacity-50"
            >
              <option value="2025">FY 2025-26</option>
              <option value="2026">FY 2026-27</option>
              <option value="2027">FY 2027-28</option>
            </select>
          </label>
          
          <label className="flex items-center gap-3">
            <input 
              type="radio" 
              name="periodMode"
              checked={mode === 'month'} 
              onChange={() => setMode('month')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="w-16 text-sm text-gray-700">Month</span>
            <input 
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              disabled={mode !== 'month'}
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white disabled:opacity-50"
            />
          </label>
          
          <label className="flex items-center gap-3">
            <input 
              type="radio" 
              name="periodMode"
              checked={mode === 'date'} 
              onChange={() => setMode('date')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="w-16 text-sm text-gray-700">Date</span>
            <input 
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              disabled={mode !== 'date'}
              className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm bg-white disabled:opacity-50"
            />
          </label>
          
          <label className="flex items-center gap-3 pt-2">
            <input 
              type="radio" 
              name="periodMode"
              checked={mode === 'all'} 
              onChange={() => setMode('all')}
              className="w-4 h-4 text-[#0d6efd] focus:ring-[#0d6efd]"
            />
            <span className="text-sm text-gray-700">All Leads</span>
          </label>
        </div>
        
        <div className="px-4 py-3 flex gap-2 bg-[#f4f5f7]">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#006400] text-white rounded text-sm font-medium hover:bg-green-800"
          >
            <Check className="w-4 h-4" /> Apply
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#dce1e7] text-[#1a365d] border border-gray-300 rounded text-sm hover:bg-gray-300"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
