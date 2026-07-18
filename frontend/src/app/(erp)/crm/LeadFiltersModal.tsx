import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { LeadFilters, LeadSource } from '@/interfaces/crm';
import { User } from '@/interfaces/user';
import { userService } from '@/services/userService';

interface LeadFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: LeadFilters;
  onApply: (updates: Partial<LeadFilters>) => void;
  sources: LeadSource[];
  onOpenPeriodModal: () => void;
}

export default function LeadFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  sources,
  onOpenPeriodModal
}: LeadFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);
  const [employees, setEmployees] = useState<User[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState('all');

  useEffect(() => {
    setLocalFilters(filters);
    
    // Reverse-map the next_followup filters into the radio button state
    if (filters.next_followup_isnull) {
      setAppointmentFilter('not_set');
    } else if (filters.next_followup_before) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (filters.next_followup_before < todayStr) {
        setAppointmentFilter('overdue');
      } else {
        setAppointmentFilter('all');
      }
    } else if (filters.next_followup) {
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      if (filters.next_followup === todayStr) {
        setAppointmentFilter('today');
      } else if (filters.next_followup === tomorrowStr) {
        setAppointmentFilter('tomorrow');
      }
    } else if (filters.next_followup_after) {
      setAppointmentFilter('future');
    } else {
      setAppointmentFilter('all');
    }
  }, [filters, isOpen]);

  useEffect(() => {
    if (isOpen && employees.length === 0) {
      userService.getUsers().then(setEmployees);
    }
  }, [isOpen, employees.length]);

  if (!isOpen) return null;

  const handleApply = () => {
    const updates: Partial<LeadFilters> = { ...localFilters, page: 1 };
    
    // Clear old appointment filters
    updates.next_followup_isnull = undefined;
    updates.next_followup = undefined;
    updates.next_followup_before = undefined;
    updates.next_followup_after = undefined;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    if (appointmentFilter === 'not_set') {
      updates.next_followup_isnull = true;
    } else if (appointmentFilter === 'overdue') {
      // For overdue, technically it should be before today
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      updates.next_followup_before = yesterday.toISOString().split('T')[0];
    } else if (appointmentFilter === 'today') {
      updates.next_followup = todayStr;
    } else if (appointmentFilter === 'tomorrow') {
      updates.next_followup = tomorrowStr;
    } else if (appointmentFilter === 'future') {
      updates.next_followup_after = tomorrowStr; // strictly after today? Maybe tomorrowStr is better.
    }
    
    onApply(updates);
    onClose();
  };

  const activeFiltersCount = Object.keys(localFilters).filter(k => 
    !['page', 'page_size', 'ordering', 'status'].includes(k) && (localFilters as any)[k] !== undefined && (localFilters as any)[k] !== ''
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-[#f4f5f7] rounded-lg shadow-xl w-[700px] overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-2xl font-normal text-gray-800">Lead List Filters</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1a365d] text-white rounded text-sm font-medium hover:bg-[#152a4a]"
            >
              <Check className="w-4 h-4" /> Apply Filters
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="px-6 pb-2">
          {activeFiltersCount === 0 ? (
            <div className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded font-semibold text-sm">
              No filters applied.
            </div>
          ) : (
            <div className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded font-semibold text-sm">
              {activeFiltersCount} filter(s) applied.
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-x-12 gap-y-6">
            
            {/* Sort order */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Sort order</span>
                <select 
                  value={localFilters.ordering || '-created_at'}
                  onChange={e => setLocalFilters({ ...localFilters, ordering: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white"
                >
                  <option value="-created_at">Newest First</option>
                  <option value="created_at">Oldest First</option>
                  <option value="-lead_score">Highest Score</option>
                  <option value="-estimated_value">Highest Value</option>
                  <option value="first_name">Name (A-Z)</option>
                </select>
              </label>
            </div>
            
            <div className="col-span-1"></div>
            
            {/* Status */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Status</span>
                <select 
                  value={localFilters.status || 'open,in_progress,on_hold'}
                  onChange={e => setLocalFilters({ ...localFilters, status: e.target.value })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white"
                >
                  <option value="open,in_progress,on_hold">All Active Leads & Prospects</option>
                  <option value="converted">Converted Customers</option>
                  <option value="lost">Lost Leads</option>
                  <option value="">Any</option>
                </select>
              </label>
            </div>
            
            <div className="col-span-1"></div>
            
            {/* Period */}
            <div className="col-span-1">
              <div className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Period</span>
                <button 
                  type="button"
                  onClick={onOpenPeriodModal}
                  className="w-40 border border-gray-300 rounded px-3 py-1.5 bg-white text-left flex justify-between items-center text-sm"
                >
                  {localFilters.created_after ? 'Custom Period' : 'All leads'}
                  <span className="text-gray-400">▼</span>
                </button>
              </div>
            </div>
            
            <div className="col-span-1"></div>
            
            {/* Appointment */}
            <div className="col-span-2 flex flex-col mt-2">
              <span className="w-32 font-bold text-gray-800 mb-2">Appointment</span>
              <div className="flex flex-wrap gap-3 ml-32 -mt-7">
                {[
                  { id: 'all', label: 'All Appointments' },
                  { id: 'not_set', label: 'Not Set' },
                  { id: 'overdue', label: 'Overdue' },
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'future', label: 'Future' },
                ].map(opt => (
                  <label key={opt.id} className="flex items-center bg-[#dce1e7] rounded px-3 py-1.5 cursor-pointer">
                    <input 
                      type="radio" 
                      name="appointment" 
                      checked={appointmentFilter === opt.id}
                      onChange={() => setAppointmentFilter(opt.id)}
                      className="w-4 h-4 text-[#1a365d] bg-white border-gray-400 focus:ring-0 mr-2"
                    />
                    <span className="text-sm text-[#1a365d]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Source */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Source</span>
                <select 
                  value={localFilters.source || ''}
                  onChange={e => setLocalFilters({ ...localFilters, source: e.target.value || undefined })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white text-sm"
                >
                  <option value="">All</option>
                  {sources.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </label>
            </div>
            
            {/* Product */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Product</span>
                <input 
                  type="text"
                  value={localFilters.product_interested || ''}
                  onChange={e => setLocalFilters({ ...localFilters, product_interested: e.target.value || undefined })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white"
                />
              </label>
            </div>
            
            {/* Assigned to */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Assigned to</span>
                <select 
                  value={localFilters.assigned_to || ''}
                  onChange={e => setLocalFilters({ ...localFilters, assigned_to: e.target.value || undefined })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white text-sm"
                >
                  <option value="">All</option>
                  <option value="unassigned">Unassigned</option>
                  {employees.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
              </label>
            </div>
            
            {/* Last Talk */}
            <div className="col-span-1">
              <div className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Last Talk</span>
                <div className="flex-1 flex items-center gap-2">
                  <input 
                    type="number"
                    min="1"
                    className="w-24 border border-gray-300 rounded px-3 py-1.5 bg-white text-sm"
                    onChange={e => {
                      const days = parseInt(e.target.value);
                      if (!isNaN(days) && days > 0) {
                        const d = new Date();
                        d.setDate(d.getDate() - days);
                        setLocalFilters({ ...localFilters, last_contact_before: d.toISOString().split('T')[0] });
                      } else {
                        setLocalFilters({ ...localFilters, last_contact_before: undefined });
                      }
                    }}
                  />
                  <span className="text-sm text-gray-700">days or earlier</span>
                </div>
              </div>
            </div>
            
            {/* Country */}
            <div className="col-span-1">
              <label className="flex items-center">
                <span className="w-32 font-bold text-gray-800">Country</span>
                <select 
                  value={localFilters.country || ''}
                  onChange={e => setLocalFilters({ ...localFilters, country: e.target.value || undefined })}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 bg-white text-sm"
                >
                  <option value="">All</option>
                  <option value="India">India</option>
                  <option value="USA">USA</option>
                  <option value="UK">UK</option>
                  <option value="Australia">Australia</option>
                  <option value="Canada">Canada</option>
                </select>
              </label>
            </div>
            
          </div>
        </div>
        
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#1a365d] text-white rounded font-medium hover:bg-[#152a4a]"
          >
            <Check className="w-4 h-4" /> Apply Filters
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-6 py-2 bg-[#dce1e7] text-[#1a365d] border border-gray-300 rounded hover:bg-gray-300"
          >
            <X className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
}
