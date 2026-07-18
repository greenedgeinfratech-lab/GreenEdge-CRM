'use client';

import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '@/services/crmService';
import { useToast } from '@/providers/ToastProvider';

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customerName: string, billingAddress: string, contactName: string, id: string) => void;
}

export default function CreateCustomerModal({
  isOpen,
  onClose,
  onSuccess
}: CreateCustomerModalProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [salutation, setSalutation] = useState('Mr.');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gstin, setGstin] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessCode, setBusinessCode] = useState('');
  const [createLedger, setCreateLedger] = useState(false);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  
  const [addSalesDetails, setAddSalesDetails] = useState(false);
  const [addMoreDetails, setAddMoreDetails] = useState(false);

  // Mutation to create lead
  const createLeadMutation = useMutation({
    mutationFn: (payload: any) => leadsApi.create(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['leads-all'] });
      showToast('Customer created successfully!', 'success');
      
      const company = businessName || `${firstName} ${lastName}`.trim();
      const billingAddr = [addressLine1, addressLine2, city, state, country].filter(Boolean).join(', ');
      const newLeadId = res.data?.data?.id || '';
      
      onSuccess(company, billingAddr, `${firstName} ${lastName}`.trim(), newLeadId);
      onClose();

      
      // Reset form
      setFirstName('');
      setLastName('');
      setGstin('');
      setBusinessName('');
      setBusinessCode('');
      setMobile('');
      setEmail('');
      setAddressLine1('');
      setAddressLine2('');
      setCity('');
      setState('');
      setPincode('');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Failed to create customer.', 'error');
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName) {
      showToast('Contact name is required', 'error');
      return;
    }
    
    // Construct address
    const fullAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');

    // Standard LeadCreatePayload mappings
    const payload = {
      first_name: firstName,
      last_name: lastName,
      company_name: businessName || `${firstName} ${lastName}`.trim(),
      mobile: mobile,
      email: email,
      gst_number: gstin,
      address: fullAddress,
      city: city,
      state: state,
      country: country,
      pincode: pincode,
      estimated_value: 0,
      priority: 'medium',
      // stage and source will default on backend
    };

    createLeadMutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-[#f8f9fa] rounded shadow-xl flex flex-col mx-4 h-max text-[13px] text-gray-700 font-sans border border-gray-300">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Create Customer</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleSubmit} 
              disabled={createLeadMutation.isPending}
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
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          
          {/* Row 1: Contact Name & GSTIN */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Contact Name <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <select 
                  value={salutation} 
                  onChange={e => setSalutation(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 bg-white w-20"
                >
                  <option>Mr.</option>
                  <option>Ms.</option>
                  <option>Mrs.</option>
                </select>
                <input 
                  value={firstName} 
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First Name" 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                  required 
                />
                <input 
                  value={lastName} 
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last Name" 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">GSTIN</label>
              <div className="flex gap-2">
                <input 
                  value={gstin} 
                  onChange={e => setGstin(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <button type="button" className="bg-green-800 text-white px-4 py-1.5 rounded-sm font-semibold hover:bg-green-950">Fetch</button>
              </div>
            </div>
          </div>

          {/* Row 2: Business Name & Business Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Business Name</label>
              <input 
                value={businessName} 
                onChange={e => setBusinessName(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Business Code</label>
              <div className="flex items-center gap-4">
                <input 
                  value={businessCode} 
                  onChange={e => setBusinessCode(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={createLedger} onChange={e => setCreateLedger(e.target.checked)} className="rounded-sm" />
                  Create Ledger
                </label>
              </div>
            </div>
          </div>

          {/* Row 3: Mobile & Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Mobile</label>
              <div className="flex w-full">
                <span className="border border-gray-300 border-r-0 rounded-l-sm px-3 py-1.5 bg-gray-50 text-gray-600">+91</span>
                <input 
                  value={mobile} 
                  onChange={e => setMobile(e.target.value)}
                  className="border border-gray-300 rounded-r-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>
          </div>

          {/* Row 4: Primary Address Line 1 & Line 2 */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-gray-600">Primary Address</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                value={addressLine1} 
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="Line 1" 
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
              <input 
                value={addressLine2} 
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Line 2" 
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>
          </div>

          {/* Row 5: City, State, Country, Pincode */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">City</label>
              <select 
                value={city} 
                onChange={e => setCity(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
              >
                <option value="">Select City</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Aligarh">Aligarh</option>
                <option value="Noida">Noida</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">State</label>
              <select 
                value={state} 
                onChange={e => setState(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
              >
                <option value="">Select State</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Delhi">Delhi</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Haryana">Haryana</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Country <span className="text-red-500">*</span></label>
              <select 
                value={country} 
                onChange={e => setCountry(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
                required
              >
                <option value="India">India</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-gray-600">Pincode</label>
              <input 
                value={pincode} 
                onChange={e => setPincode(e.target.value)}
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2 mt-2">
            <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={addSalesDetails} onChange={e => setAddSalesDetails(e.target.checked)} className="rounded-sm" />
              Add Sales Details
            </label>
            <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
              <input type="checkbox" checked={addMoreDetails} onChange={e => setAddMoreDetails(e.target.checked)} className="rounded-sm" />
              Add More Details
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-2 mt-4 border-t border-gray-200 pt-4">
            <button 
              type="submit" 
              disabled={createLeadMutation.isPending}
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

        </form>
      </div>
    </div>
  );
}
