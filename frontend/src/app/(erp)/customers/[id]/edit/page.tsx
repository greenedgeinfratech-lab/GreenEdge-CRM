'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/services/crmService';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { CustomerContact } from '@/interfaces/crm';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();

  const { data: customerData, isLoading } = useQuery({
    queryKey: CRM_KEYS.customer(id),
    queryFn: () => customersApi.get(id),
    enabled: !!id,
  });

  const customer = customerData?.data?.data;

  const [form, setForm] = useState({
    name: '',
    company_name: '',
    customer_type: 'business',
    status: 'active',
    mobile: '',
    alternate_mobile: '',
    email: '',
    secondary_email: '',
    phone: '',
    website: '',
    gst_number: '',
    pan_number: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    billing_address: '',
    shipping_address: '',
    industry: '',
    source: '',
    credit_limit: '',
    notes: '',
  });

  const [contacts, setContacts] = useState<CustomerContact[]>([]);

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        company_name: customer.company_name || '',
        customer_type: customer.customer_type || 'business',
        status: customer.status || 'active',
        mobile: customer.mobile || '',
        alternate_mobile: customer.alternate_mobile || '',
        email: customer.email || '',
        secondary_email: customer.secondary_email || '',
        phone: customer.phone || '',
        website: customer.website || '',
        gst_number: customer.gst_number || '',
        pan_number: customer.pan_number || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || 'India',
        pincode: customer.pincode || '',
        billing_address: customer.billing_address || '',
        shipping_address: customer.shipping_address || '',
        industry: customer.industry || '',
        source: customer.source || '',
        credit_limit: customer.credit_limit?.toString() || '',
        notes: customer.notes || '',
      });
      setContacts(customer.contacts || []);
    }
  }, [customer]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      customersApi.update(id, data as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customer(id) });
      router.push('/customers');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ ...form, credit_limit: form.credit_limit ? Number(form.credit_limit) : undefined, contacts });
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addContact = () => {
    setContacts(prev => [
      ...prev,
      { name: '', designation: '', mobile: '', email: '', is_primary: false },
    ]);
  };

  const updateContact = (index: number, field: keyof CustomerContact, value: string | boolean) => {
    setContacts(prev => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center text-gray-500 py-8">Loading customer...</div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center text-red-500 py-8">Customer not found.</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/customers" className="p-2 hover:bg-gray-100 rounded">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Customer</h1>
          {customer.customer_number && (
            <p className="text-sm text-gray-500">{customer.customer_number}</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={form.company_name}
                onChange={(e) => updateField('company_name', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <select
                value={form.customer_type}
                onChange={(e) => updateField('customer_type', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="business">Business</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g., Manufacturing, IT, Retail"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={form.source}
                onChange={(e) => updateField('source', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="e.g., Website, Referral, Cold Call"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => updateField('mobile', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Mobile</label>
              <input
                type="text"
                value={form.alternate_mobile}
                onChange={(e) => updateField('alternate_mobile', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Email</label>
              <input
                type="email"
                value={form.secondary_email}
                onChange={(e) => updateField('secondary_email', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                placeholder="https://"
              />
            </div>
          </div>
        </div>

        {/* Tax / Legal */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Tax & Legal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Number</label>
              <input
                type="text"
                value={form.gst_number}
                onChange={(e) => updateField('gst_number', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
              <input
                type="text"
                value={form.pan_number}
                onChange={(e) => updateField('pan_number', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Limit (₹)</label>
              <input
                type="number"
                value={form.credit_limit}
                onChange={(e) => updateField('credit_limit', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
              <textarea
                value={form.billing_address}
                onChange={(e) => updateField('billing_address', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              <textarea
                value={form.shipping_address}
                onChange={(e) => updateField('shipping_address', e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Additional Contacts</h2>
            <button
              type="button"
              onClick={addContact}
              className="flex items-center gap-1 text-sm text-[#c85a17] hover:text-[#b04a10]"
            >
              <Plus className="w-4 h-4" /> Add Contact
            </button>
          </div>
          {contacts.length === 0 ? (
            <p className="text-sm text-gray-500">No additional contacts.</p>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-4 relative">
                  <button
                    type="button"
                    onClick={() => removeContact(idx)}
                    className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                      <input
                        type="text"
                        required
                        value={contact.name}
                        onChange={(e) => updateContact(idx, 'name', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Designation</label>
                      <input
                        type="text"
                        value={contact.designation || ''}
                        onChange={(e) => updateContact(idx, 'designation', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Mobile</label>
                      <input
                        type="text"
                        value={contact.mobile || ''}
                        onChange={(e) => updateContact(idx, 'mobile', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input
                        type="email"
                        value={contact.email || ''}
                        onChange={(e) => updateContact(idx, 'email', e.target.value)}
                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={contact.is_primary || false}
                          onChange={(e) => updateContact(idx, 'is_primary', e.target.checked)}
                          className="rounded"
                        />
                        Primary contact
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          <textarea
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Any additional notes..."
          />
        </div>

        {/* Read-only info */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Outstanding:</span>{' '}
              ₹{(customer.outstanding || 0).toLocaleString('en-IN')}
            </div>
            <div>
              <span className="font-medium">Total Orders:</span>{' '}
              ₹{(customer.total_orders || 0).toLocaleString('en-IN')}
            </div>
            <div>
              <span className="font-medium">Total Invoices:</span>{' '}
              ₹{(customer.total_invoices || 0).toLocaleString('en-IN')}
            </div>
            <div>
              <span className="font-medium">Assigned To:</span>{' '}
              {customer.assigned_to_name || 'Unassigned'}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/customers"
            className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-[#c85a17] text-white rounded text-sm font-medium hover:bg-[#b04a10] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving...' : 'Update Customer'}
          </button>
        </div>
      </form>
    </div>
  );
}
