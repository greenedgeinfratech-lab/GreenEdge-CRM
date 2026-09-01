'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services/crmService';
import type { Customer, CustomerCreatePayload } from '@/interfaces/crm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (customer: Customer) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Ladakh', 'Jammu and Kashmir',
];

const INDIAN_CITIES = [
  'Ahmedabad', 'Bengaluru', 'Bhopal', 'Chandigarh', 'Chennai',
  'Coimbatore', 'Delhi', 'Gurgaon', 'Hyderabad', 'Indore',
  'Jaipur', 'Kochi', 'Kolkata', 'Lucknow', 'Mumbai',
  'Noida', 'Pune', 'Vadodara', 'Visakhapatnam',
];

export default function CreateCustomerModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<CustomerCreatePayload>>({
    customer_type: 'business',
    country: 'India',
    status: 'active',
  });

  const [salutation, setSalutation] = useState('Mr');
  const [lastName, setLastName] = useState('');
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [errors, setErrors] = useState<Record<string, any>>({});

  const parseApiError = (errorData: any) => {
    if (!errorData) return { general: 'Failed to create customer' };
    if (typeof errorData === 'object' && errorData !== null) {
      if ('errors' in errorData && errorData.errors) return errorData.errors;
      if ('message' in errorData && typeof errorData.message === 'string') return { general: errorData.message };
      return errorData;
    }
    return { general: String(errorData) };
  };

  const mutation = useMutation({
    mutationFn: (data: CustomerCreatePayload) => customersApi.create(data),
    onSuccess: (response) => {
      const customer = response.data.data;
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
      setFormData({ customer_type: 'business', country: 'India', status: 'active' });
      setSalutation('Mr');
      setLastName('');
      setErrors({});
      onOpenChange(false);
      onSuccess?.(customer);
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      setErrors(parseApiError(errorData));
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.currentTarget;
    let finalValue: any = value;
    if (type === 'checkbox') finalValue = (e.currentTarget as HTMLInputElement).checked;
    else if (type === 'number') finalValue = value === '' ? undefined : Number(value);
    else if (name === 'mobile') {
      const digits = value.replace(/\D/g, '');
      finalValue = digits.length > 10 && digits.startsWith('91') ? digits.slice(digits.length - 10) : digits;
    } else if (name === 'pincode') {
      finalValue = value.replace(/\D/g, '');
    }
    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submissionData: CustomerCreatePayload = {
      ...formData,
      name: `${salutation} ${formData.name || ''} ${lastName}`.trim(),
      mobile: typeof formData.mobile === 'string'
        ? formData.mobile.replace(/\D/g, '').slice(-10)
        : formData.mobile,
      pincode: typeof formData.pincode === 'string'
        ? formData.pincode.replace(/\D/g, '')
        : formData.pincode,
    };

    mutation.mutate(submissionData);
  };

  const handleClose = () => {
    setFormData({ customer_type: 'business', country: 'India', status: 'active' });
    setSalutation('Mr');
    setLastName('');
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100vw-2rem)] max-w-[1200px] sm:max-w-[1200px] max-h-[85vh] overflow-y-auto p-6"
        showCloseButton={true}
      >
        <DialogHeader className="mb-4">
          <DialogTitle>Create Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Name */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 items-end">
            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Contact Name <span className="text-red-500">*</span>
              </label>
              <select
                value={salutation}
                onChange={(e) => setSalutation(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option>Mr</option>
                <option>Ms</option>
                <option>Mrs</option>
                <option>Dr</option>
              </select>
            </div>
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="First Name"
                value={formData.name || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="lg:col-span-1">
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2 flex items-center gap-2">
              <input
                type="text"
                name="gst_number"
                placeholder="GSTIN"
                value={formData.gst_number || ''}
                onChange={handleChange}
                className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                className="bg-green-600 text-white px-3 py-2 rounded text-sm font-medium hover:bg-green-700 transition"
              >
                Fetch
              </button>
            </div>
          </div>

          {/* Business Name and Code */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                name="company_name"
                placeholder="Business Name"
                value={formData.company_name || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="lg:col-span-1 flex items-center gap-2">
              <div className="w-full">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Business Code
                </label>
                <input
                  type="text"
                  placeholder="Business Code"
                  className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="lg:col-span-1 flex items-center">
              <label className="flex items-center text-xs text-gray-700 mt-4">
                <input type="checkbox" className="mr-2 rounded border-gray-300" />
                Create Ledger
              </label>
            </div>
          </div>

          {/* Mobile and Email */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mobile
              </label>
              <div className="flex items-center gap-2">
                <span className="px-2 py-2 border border-gray-300 rounded bg-gray-100 text-sm">
                  +91
                </span>
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile number"
                  value={formData.mobile || ''}
                  onChange={handleChange}
                  className="flex-1 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              {errors.mobile && <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>}
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Email address"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>

          {/* Primary Address */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Primary Address
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Line 1"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Line 2"
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* City, State, Country, Pincode */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                City
              </label>
              <select
                name="city"
                value={formData.city || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select City</option>
                {INDIAN_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                name="state"
                value={formData.state || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select State</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country || 'India'}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="India">India</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                maxLength={6}
                value={formData.pincode || ''}
                onChange={handleChange}
                className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Optional Sections */}
          <div className="space-y-2">
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded border-gray-300"
                checked={showSalesDetails}
                onChange={(e) => setShowSalesDetails(e.target.checked)}
              />
              Add Sales Details
            </label>
            <label className="flex items-center text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                className="mr-2 rounded border-gray-300"
                checked={showMoreDetails}
                onChange={(e) => setShowMoreDetails(e.target.checked)}
              />
              Add More Details
            </label>
          </div>

          {/* Sales Details Section */}
          {showSalesDetails && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h4 className="font-semibold text-sm">Sales Details</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-center">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Current Receivable</label>
                  <div className="flex">
                    <span className="px-3 py-2 border border-gray-300 rounded-l bg-gray-100">₹</span>
                    <input
                      type="number"
                      name="outstanding"
                      value={formData.outstanding ?? ''}
                      onChange={handleChange}
                      className="flex-1 px-2 py-2 border-t border-b border-r border-gray-300 rounded-r text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 lg:col-span-2">
                  <label className="block text-xs text-gray-600 mb-1">Recovery Notes</label>
                  <input
                    type="text"
                    name="notes"
                    value={formData.notes || ''}
                    onChange={handleChange}
                    placeholder="Recovery notes"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">Business Prospect (Annual)</label>
                  <div className="flex">
                    <span className="px-3 py-2 border border-gray-300 rounded-l bg-gray-100">₹</span>
                    <input
                      type="number"
                      name="credit_limit"
                      value={formData.credit_limit ?? ''}
                      onChange={handleChange}
                      placeholder="Revenue"
                      className="flex-1 px-2 py-2 border-t border-b border-r border-gray-300 rounded-r text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
                  <div className="w-56">
                    <label className="block text-xs text-gray-600 mb-1">Order Expected</label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        name="total_orders"
                        value={formData.total_orders ?? ''}
                        onChange={handleChange}
                        placeholder="Count"
                        className="w-28 px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                      <span className="ml-2 text-xs text-gray-600">/ year</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* More Details Section */}
          {showMoreDetails && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h4 className="font-semibold text-sm">More Details</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Website</label>
                  <input
                    type="text"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleChange}
                    placeholder="Website"
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">MSME No.</label>
                  <input
                    type="text"
                    name="msme_no"
                    value={(formData as any).msme_no || ''}
                    onChange={handleChange}
                    placeholder="MSME No."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">PAN No.</label>
                  <input
                    type="text"
                    name="pan_number"
                    value={formData.pan_number || ''}
                    onChange={handleChange}
                    placeholder="PAN No."
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Industry & Segment</label>
                  <select
                    name="industry"
                    value={formData.industry || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Industry & Segment</option>
                    <option value="manufacturing">Manufacturing</option>
                    <option value="services">Services</option>
                    <option value="retail">Retail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Source</label>
                  <select
                    name="source"
                    value={formData.source || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Source</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="walkin">Walk-in</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Category</label>
                  <select
                    name="category"
                    value={(formData as any).category || ''}
                    onChange={handleChange}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="vip">VIP</option>
                    <option value="regular">Regular</option>
                    <option value="prospect">Prospect</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {Object.keys(errors).length > 0 && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 space-y-1">
              {Object.entries(errors).map(([key, msg]) => (
                <div key={key}>
                  {typeof msg === 'string'
                    ? msg
                    : Array.isArray(msg)
                    ? msg.join(', ')
                    : typeof msg === 'object' && msg !== null
                    ? JSON.stringify(msg)
                    : String(msg)}
                </div>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                '✓ Save'
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
