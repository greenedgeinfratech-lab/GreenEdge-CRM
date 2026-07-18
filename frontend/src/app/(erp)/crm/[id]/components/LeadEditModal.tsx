'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Plus } from 'lucide-react';
import { Lead, LeadSource, LeadStage } from '@/interfaces/crm';
import { User } from '@/interfaces/user';

interface LeadEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  employees: any[];
  stages: LeadStage[];
  sources: LeadSource[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export default function LeadEditModal({
  isOpen,
  onClose,
  lead,
  employees,
  stages,
  sources,
  onSubmit,
  isLoading
}: LeadEditModalProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (lead) {
      setFormData({
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        company_name: lead.company_name || '',
        mobile: lead.mobile || '',
        email: lead.email || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || 'India',
        pincode: lead.pincode || '',
        website: lead.website || '',
        gst_number: lead.gst_number || '',
        pan_number: lead.pan_number || '',
        source_id: lead.source?.id || '',
        requirements: lead.requirements || '',
        estimated_value: lead.estimated_value || 0,
        product_interested: lead.product_interested || '',
        assigned_to: lead.assigned_to || '',
        stage_id: lead.stage?.id || '',
        lost_notes: lead.lost_notes || '',
      });
    }
  }, [lead]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-6xl my-8 bg-[#f5f5f5] rounded shadow-xl flex flex-col mx-4 h-max min-h-min">
        {/* Header */}
        <div className="flex justify-between items-center bg-white px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Edit Lead: {lead?.lead_number || ''}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 text-[13px] text-gray-700">
          
          {/* Core Data Card */}
          <div className="bg-white border border-gray-200 p-6 rounded-sm">
            <h3 className="text-[#145a32] font-bold text-[15px] mb-4">Core Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center">
                  <label className="w-32 shrink-0">Name <span className="text-red-500">*</span> :</label>
                  <div className="flex gap-2 flex-1">
                    <select className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 bg-white w-20">
                      <option>Mr.</option>
                      <option>Ms.</option>
                      <option>Mrs.</option>
                    </select>
                    <input name="first_name" value={formData.first_name || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" required />
                    <input name="last_name" value={formData.last_name || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Designation :</label>
                  <input className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Mobile :</label>
                  <div className="flex flex-1">
                    <span className="border border-gray-300 border-r-0 rounded-l-sm px-2 py-1.5 bg-gray-50 text-gray-600">+91</span>
                    <input name="mobile" value={formData.mobile || ''} onChange={handleChange} className="border border-gray-300 rounded-r-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Email :</label>
                  <input name="email" value={formData.email || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Website :</label>
                  <input name="website" value={formData.website || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start">
                  <label className="w-32 shrink-0 pt-1.5">Address :</label>
                  <div className="flex flex-col gap-2 flex-1">
                    <input name="address" value={formData.address || ''} onChange={handleChange} placeholder="Line 1" className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-full" />
                    <input placeholder="Line 2" className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-full" />
                  </div>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Country :</label>
                  <select name="country" value={formData.country || 'India'} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 bg-white">
                    <option value="India">India</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 shrink-0">City :</label>
                  <input name="city" value={formData.city || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                  <button type="button" className="bg-gray-200 p-1.5 rounded-sm hover:bg-gray-300"><Plus className="w-4 h-4 text-gray-600" /></button>
                  <label className="ml-2">State :</label>
                  <select name="state" value={formData.state || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-32 bg-white">
                    <option value="">Select</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 shrink-0">GSTIN :</label>
                  <input name="gst_number" value={formData.gst_number || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                  <label className="ml-2">Pincode :</label>
                  <input name="pincode" value={formData.pincode || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-32" />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 shrink-0">Code :</label>
                  <input className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 max-w-[200px]" />
                </div>
              </div>
            </div>
          </div>

          {/* Business Opportunity Card */}
          <div className="bg-white border border-gray-200 p-6 rounded-sm">
            <h3 className="text-[#145a32] font-bold text-[15px] mb-4">Business Opportunity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {/* Left Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <label className="w-32 shrink-0">Source :</label>
                  <select name="source_id" value={formData.source_id || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 bg-white">
                    <option value="">Select</option>
                    {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button type="button" className="bg-gray-200 p-1.5 rounded-sm hover:bg-gray-300"><Plus className="w-4 h-4 text-gray-600" /></button>
                  <label className="ml-2">Since :</label>
                  <input type="text" placeholder="12-Jul-26" className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-28" />
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Category :</label>
                  <select className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 bg-white">
                    <option>Select</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-32 shrink-0">Product :</label>
                  <input name="product_interested" value={formData.product_interested || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1" />
                  <button type="button" className="bg-gray-200 p-1.5 rounded-sm hover:bg-gray-300"><Plus className="w-4 h-4 text-gray-600" /></button>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Potential (₹) :</label>
                  <input type="number" name="estimated_value" value={formData.estimated_value || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-32" />
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Assigned to :</label>
                  <select name="assigned_to" value={formData.assigned_to || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 bg-white">
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Stage :</label>
                  <select name="stage_id" value={formData.stage_id || ''} onChange={handleChange} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 flex-1 bg-white">
                    <option value="">Select</option>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="w-32 shrink-0">Tags :</label>
                  <input className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-32" />
                </div>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-4">
                <div className="flex items-start">
                  <label className="w-32 shrink-0 pt-1.5">Requirement :</label>
                  <textarea name="requirements" value={formData.requirements || ''} onChange={handleChange} rows={2} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-full resize-none" />
                </div>
                
                <div className="flex items-start mt-2">
                  <label className="w-32 shrink-0 pt-1.5">Notes :</label>
                  <textarea name="lost_notes" value={formData.lost_notes || ''} onChange={handleChange} rows={3} className="border border-gray-300 rounded-sm px-2 py-1.5 outline-none focus:border-green-600 w-full resize-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex mt-2">
            <button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#145a32] hover:bg-[#0f4225] text-white px-5 py-2.5 rounded-sm font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save & Close
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
