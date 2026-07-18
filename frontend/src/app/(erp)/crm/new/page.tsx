'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Save, Loader2, AlertCircle, Building2, User,
  Phone, Mail, MapPin, Tag, Briefcase, FileText, Calendar, AlertTriangle
} from 'lucide-react';
import { leadsApi, crmConfigApi } from '@/services/crmService';
import type { LeadCreatePayload, LeadStage, LeadSource, DuplicateCheckResult } from '@/interfaces/crm';
import { usersApi } from '@/services/userService';

export default function NewLeadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);

  const [formData, setFormData] = useState<LeadCreatePayload>({
    first_name: '',
    last_name: '',
    company_name: '',
    mobile: '',
    alternate_mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    stage: '',
    source: '',
    priority: 'medium',
    estimated_value: 0,
    product_interested: '',
    requirements: '',
    assigned_to: '',
    next_followup_date: '',
    tags: [],
    override_duplicate: false,
  });

  // ── Reference Data Queries ────────────────────────────────────────────────

  const { data: stagesResponse } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: crmConfigApi.getStages,
  });

  const { data: sourcesResponse } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: crmConfigApi.getSources,
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.listEmployees({ page_size: 100 }),
  });

  const stages: LeadStage[] = (stagesResponse?.data as any)?.data?.results || (stagesResponse?.data as any)?.data || [];
  const sources = (sourcesResponse?.data as any)?.data?.results || (sourcesResponse?.data as any)?.data || [];
  const employees = (employeesResponse?.data as any)?.data?.results || (employeesResponse?.data as any)?.data || [];

  // Default stage logic
  React.useEffect(() => {
    if (stages.length > 0 && !formData.stage) {
      const defaultStage = stages.find(s => s.is_default) || stages[0];
      if (defaultStage) {
        setFormData(prev => ({ ...prev, stage: defaultStage.id }));
      }
    }
  }, [stages, formData.stage]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (data: LeadCreatePayload) => leadsApi.create(data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.push(`/crm/${res.data.data.id}`);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.errors?.detail ||
                  err.response?.data?.detail ||
                  'Failed to create lead. Please check your inputs.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const duplicateCheckMutation = useMutation({
    mutationFn: (data: any) => leadsApi.checkDuplicate(data),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (type === 'number') finalValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    setError(null);
  };

  const handleDuplicateCheck = async () => {
    if (!formData.mobile && !formData.email && !formData.company_name) return true;
    
    try {
      const res = await duplicateCheckMutation.mutateAsync({
        mobile: formData.mobile,
        email: formData.email,
        company_name: formData.company_name,
      });
      const data = (res as any).data;
      if (data.has_duplicate) {
        setDuplicateWarning(data);
        return false; // Found duplicate
      }
      setDuplicateWarning(null);
      return true; // Safe
    } catch (err) {
      return true; // If check fails, proceed anyway and let backend catch it
    }
  };

  const handleSubmit = async (e: React.FormEvent, force = false) => {
    e.preventDefault();
    if (!force) {
      const isSafe = await handleDuplicateCheck();
      if (!isSafe) return;
    }

    createMutation.mutate({
      ...formData,
      override_duplicate: force,
    });
  };

  // ── Form Sections ─────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/crm" className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Lead</h1>
            <p className="text-sm text-gray-500">Create a new prospect in the CRM</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {duplicateWarning && !error && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">Potential Duplicate Detected</h3>
              <p className="text-sm text-yellow-700 mt-1">{duplicateWarning.message}</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <Link
              href={`/crm/${duplicateWarning.lead_id}`}
              className="text-sm font-medium text-blue-600 hover:underline px-3 py-1.5"
            >
              View Existing Lead
            </Link>
            <button
              onClick={(e) => handleSubmit(e, true)}
              className="px-4 py-1.5 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700"
            >
              Create Anyway
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)} className="flex flex-col gap-6">
        
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500" />
            Primary Contact
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">First Name *</label>
              <input required name="first_name" value={formData.first_name} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter first name" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Last Name</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Enter last name" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Building2 className="w-4 h-4 text-gray-400" /> Company Name</label>
              <input name="company_name" value={formData.company_name} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="E.g. Acme Corp" />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-semibold text-gray-800 flex items-center gap-2">
            <Phone className="w-5 h-5 text-gray-500" />
            Contact & Address
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Mobile *</label>
              <input required name="mobile" value={formData.mobile} onChange={handleChange} pattern="^[6-9]\d{9}$" title="Enter a valid 10-digit Indian mobile number" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="10-digit number" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="email@example.com" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700">Address</label>
              <input name="address" value={formData.address} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Street address" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">City</label>
              <input name="city" value={formData.city} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">State</label>
              <input name="state" value={formData.state} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Lead Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-semibold text-gray-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-gray-500" />
            Lead Details
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Stage *</label>
              <select required name="stage" value={formData.stage} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="">Select stage...</option>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Source</label>
              <select name="source" value={formData.source} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="">Select source...</option>
                {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Estimated Value (₹)</label>
              <input type="number" name="estimated_value" value={formData.estimated_value} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" min="0" />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><FileText className="w-4 h-4 text-gray-400" /> Requirements</label>
              <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows={3} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What is the prospect looking for?" />
            </div>
          </div>
        </div>

        {/* Assignment & Next Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            Assignment & Next Steps
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Assign To</label>
              <select name="assigned_to" value={formData.assigned_to} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="">Unassigned</option>
                {employees.map((e: any) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">First Follow-up Date</label>
              <input type="date" name="next_followup_date" value={formData.next_followup_date} onChange={handleChange} className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || duplicateCheckMutation.isPending}
            className="px-5 py-2.5 bg-[#162032] text-white rounded-lg text-sm font-medium hover:bg-[#1a2b4c] transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {(createMutation.isPending || duplicateCheckMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Lead
          </button>
        </div>

      </form>
    </div>
  );
}
