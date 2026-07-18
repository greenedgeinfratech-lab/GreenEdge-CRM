'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';

export default function CompanySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [formData, setFormData] = useState({
    name: '',
    legal_name: '',
    tax_id: '', // GSTIN
    pan_number: '',
    cin_number: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    currency: 'USD',
  });

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user?.company?.id) return;
      try {
        const res = await api.get(`/companies/${user.company.id}/`);
        // Filter out nulls to prevent controlled/uncontrolled warnings
        const safeData = Object.fromEntries(
          Object.entries(res.data).map(([k, v]) => [k, v === null ? '' : v])
        );
        setFormData((prev) => ({ ...prev, ...safeData }));
      } catch (err) {
        console.error('Error fetching company details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      if (user?.company?.id) {
        await api.patch(`/companies/${user.company.id}/`, formData);
        setMessage({ text: 'Company details updated successfully!', type: 'success' });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : 'Failed to update company details.';
      setMessage({ text: errorMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Company Settings</h1>
        <p className="text-muted-foreground">Manage your company's profile, legal information, and localization settings.</p>
      </div>

      {message.text && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name</label>
              <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Legal Name</label>
              <Input name="legal_name" value={formData.legal_name} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Website</label>
              <Input type="url" name="website" value={formData.website} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">Legal & Registration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1">GSTIN</label>
              <Input name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="e.g. 22AAAAA0000A1Z5" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PAN Number</label>
              <Input name="pan_number" value={formData.pan_number} onChange={handleChange} placeholder="e.g. ABCDE1234F" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">CIN Number</label>
              <Input name="cin_number" value={formData.cin_number} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-medium mb-4 border-b pb-2">Address & Localization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Address</label>
              <textarea 
                name="address" 
                value={formData.address} 
                onChange={handleChange}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">State</label>
              <Input name="state" value={formData.state} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">PIN Code</label>
              <Input name="pincode" value={formData.pincode} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Currency</label>
              <Input name="currency" value={formData.currency} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
