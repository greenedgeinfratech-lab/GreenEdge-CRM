'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, UserCheck, Clock, Plus, Search, RefreshCw,
  Eye, Edit3, Trash2, Building2, Mail, Phone, MapPin,
  SlidersHorizontal, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';

interface Executive {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile?: string;
  employment_status: string;
  work_location?: string;
  joining_date?: string;
  department_name?: string;
  designation_name?: string;
  notes?: string;
  created_at: string;
}

const INITIAL_FORM_STATE = {
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  mobile: '',
  employment_status: 'Active',
  work_location: 'Office',
  notes: '',
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback;
  const payload = (error as { response?: { data?: unknown } }).response?.data;
  if (typeof payload !== 'object' || payload === null) return fallback;

  const errors = (payload as { errors?: unknown }).errors;
  if (typeof errors === 'object' && errors !== null) {
    const [fieldName, firstError] = Object.entries(errors as Record<string, unknown>)[0] ?? [];
    const label = fieldName ? fieldName.replace(/_/g, ' ') : 'Field';
    if (Array.isArray(firstError) && typeof firstError[0] === 'string') return `${label}: ${firstError[0]}`;
    if (typeof firstError === 'string') return `${label}: ${firstError}`;
  }

  const detail = (payload as { detail?: unknown }).detail;
  return typeof detail === 'string' ? detail : fallback;
}

export default function ExecutivesOperationsPage() {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [saving, setSaving] = useState(false);

  const { showToast } = useToast();
  const { confirm } = useConfirm();

  const fetchExecutives = useCallback(async (query = '', isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      const endpoint = query ? `/employees/?search=${encodeURIComponent(query)}` : '/employees/?page_size=200';
      const response = await api.get(endpoint);
      const resData = response.data;
      const rawList = resData?.data?.results || resData?.data || resData?.results || resData;
      
      setExecutives(Array.isArray(rawList) ? rawList : []);
    } catch (error) {
      console.error('Failed to load executives', error);
      showToast('Failed to load executives list', 'error');
      setExecutives([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchExecutives(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchExecutives]);

  // Filtered Data
  const filteredExecutives = useMemo(() => {
    return executives.filter((exec) => {
      const matchesSearch =
        search.trim() === '' ||
        exec.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        exec.last_name?.toLowerCase().includes(search.toLowerCase()) ||
        exec.email?.toLowerCase().includes(search.toLowerCase()) ||
        exec.employee_code?.toLowerCase().includes(search.toLowerCase()) ||
        (exec.mobile && exec.mobile.includes(search));

      const matchesStatus =
        statusFilter === 'all' || exec.employment_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [executives, search, statusFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = executives.length;
    const active = executives.filter((e) => e.employment_status === 'Active').length;
    const onLeave = executives.filter((e) => e.employment_status === 'On Leave' || e.employment_status === 'Probation').length;
    const departments = new Set(executives.map((e) => e.department_name).filter(Boolean)).size;

    return { total, active, onLeave, departments };
  }, [executives]);

  // Actions
  const handleOpenAddModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (executive: Executive) => {
    setSelectedExecutive(executive);
    setFormData({
      employee_code: executive.employee_code || '',
      first_name: executive.first_name || '',
      last_name: executive.last_name || '',
      email: executive.email || '',
      mobile: executive.mobile || '',
      employment_status: executive.employment_status || 'Active',
      work_location: executive.work_location || 'Office',
      notes: executive.notes || '',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenViewModal = (executive: Executive) => {
    setSelectedExecutive(executive);
    setIsViewModalOpen(true);
  };

  const handleCreateExecutive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.email.trim()) {
      showToast('First Name and Email are required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const employeePayload = {
        first_name: formData.first_name, last_name: formData.last_name, email: formData.email,
        mobile: formData.mobile, employment_status: formData.employment_status,
        work_location: formData.work_location, notes: formData.notes,
      };
      await api.post('/employees/', employeePayload);
      showToast('Executive added successfully!');
      setIsAddModalOpen(false);
      fetchExecutives(search, true);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Could not add executive.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateExecutive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExecutive) return;

    setSaving(true);
    try {
      const employeePayload = {
        first_name: formData.first_name, last_name: formData.last_name, email: formData.email,
        mobile: formData.mobile, employment_status: formData.employment_status,
        work_location: formData.work_location, notes: formData.notes,
      };
      await api.patch(`/employees/${selectedExecutive.id}/`, employeePayload);
      showToast('Executive profile updated!');
      setIsEditModalOpen(false);
      setSelectedExecutive(null);
      fetchExecutives(search, true);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, 'Could not update executive profile.'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExecutive = async (executive: Executive) => {
    const confirmed = await confirm({
      title: 'Delete Executive Profile?',
      message: `Are you sure you want to delete ${executive.first_name} ${executive.last_name} (${executive.employee_code})? This action cannot be undone.`,
      confirmText: 'Delete Executive',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    try {
      await api.delete(`/employees/${executive.id}/`);
      showToast('Executive record deleted successfully.');
      fetchExecutives(search, true);
    } catch (err) {
      console.error('Delete executive error:', err);
      showToast('Could not delete executive record.', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'On Leave':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Probation':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Terminated':
      case 'Resigned':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName?.[0] || '';
    const l = lastName?.[0] || '';
    return (f + l).toUpperCase() || 'EX';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-emerald-600" />
            Executive Operations & Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage executive profiles, track active statuses, and assign operational roles across teams.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchExecutives(search, true)}
            disabled={refreshing || loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleOpenAddModal}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Executive
          </Button>

          <Link
            href="/settings/employees"
            className="inline-flex h-9 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Settings
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Executives</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{metrics.total}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Registered in system</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Staff</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{metrics.active}</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {metrics.total ? `${Math.round((metrics.active / metrics.total) * 100)}% of total team` : '0%'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">On Leave / Probation</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{metrics.onLeave}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Requiring coverage</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Departments</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{metrics.departments}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Functional areas</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, name, email, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400 hidden sm:block" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none"
          >
            <option value="all">All Employment Statuses</option>
            <option value="Active">Active</option>
            <option value="On Leave">On Leave</option>
            <option value="Probation">Probation</option>
            <option value="Resigned">Resigned</option>
            <option value="Terminated">Terminated</option>
          </select>

          {(search || statusFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setStatusFilter('all'); }}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Executives Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 font-semibold text-slate-700">
              <tr>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Executive</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    Loading executive records...
                  </td>
                </tr>
              ) : filteredExecutives.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-semibold text-slate-700">No executives found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search || statusFilter !== 'all'
                        ? 'Try adjusting your search or filters.'
                        : 'Click "Add Executive" to create your first executive profile.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredExecutives.map((executive) => {
                  const fullName = `${executive.first_name || ''} ${executive.last_name || ''}`.trim() || 'Unnamed Executive';
                  return (
                    <tr key={executive.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-emerald-700">
                        {executive.employee_code || '-'}
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {getInitials(executive.first_name, executive.last_name)}
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenViewModal(executive)}
                              className="font-medium text-slate-900 hover:text-emerald-600 transition text-left"
                            >
                              {fullName}
                            </button>
                            <p className="text-xs text-slate-400">{executive.designation_name || 'Executive Member'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          <a href={`mailto:${executive.email}`} className="hover:underline text-slate-700">
                            {executive.email}
                          </a>
                        </div>
                        {executive.mobile && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <a href={`tel:${executive.mobile}`} className="hover:underline text-slate-500">
                              {executive.mobile}
                            </a>
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-600">
                        {executive.department_name ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 font-medium">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            {executive.department_name}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(executive.employment_status)}`}>
                          {executive.employment_status}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {executive.joining_date
                          ? new Date(executive.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : new Date(executive.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenViewModal(executive)}
                            title="View Profile"
                            className="p-1.5 rounded text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(executive)}
                            title="Edit Executive"
                            className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExecutive(executive)}
                            title="Delete Executive"
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD EXECUTIVE MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Add New Executive
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExecutive} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Jitendra"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Bharadwaj"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="executive@greenedge.in"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code</label>
                  <div className="w-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                    Automatically generated when the executive is created
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Location</label>
                <select
                  value={formData.work_location}
                  onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Office">Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes & Operational Remarks</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes about executive role..."
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {saving ? 'Creating...' : 'Create Executive'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT EXECUTIVE MODAL --- */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-blue-600" />
                Edit Executive Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExecutive} className="p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={formData.employee_code}
                    readOnly
                    className="w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Status</label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probation">Probation</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Terminated">Terminated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Work Location</label>
                <select
                  value={formData.work_location}
                  onChange={(e) => setFormData({ ...formData, work_location: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Office">Office</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW EXECUTIVE PROFILE MODAL --- */}
      {isViewModalOpen && selectedExecutive && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white relative">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="h-20 w-20 rounded-full bg-emerald-600 text-white font-bold text-2xl flex items-center justify-center mx-auto shadow-md mb-3">
                {getInitials(selectedExecutive.first_name, selectedExecutive.last_name)}
              </div>

              <h3 className="font-bold text-slate-900 text-xl">
                {selectedExecutive.first_name} {selectedExecutive.last_name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {selectedExecutive.designation_name || 'Executive Staff'}
              </p>

              <div className="mt-3 inline-flex items-center gap-2">
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-semibold">
                  {selectedExecutive.employee_code}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedExecutive.employment_status)}`}>
                  {selectedExecutive.employment_status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-4 text-sm">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <Mail className="h-4 w-4 text-emerald-600" /> Email
                  </span>
                  <a href={`mailto:${selectedExecutive.email}`} className="font-medium text-slate-800 hover:underline">
                    {selectedExecutive.email}
                  </a>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <Phone className="h-4 w-4 text-emerald-600" /> Mobile
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedExecutive.mobile || 'Not set'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <Building2 className="h-4 w-4 text-emerald-600" /> Department
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedExecutive.department_name || 'General Operations'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="h-4 w-4 text-emerald-600" /> Work Location
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedExecutive.work_location || 'Office'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="h-4 w-4 text-emerald-600" /> Joined On
                  </span>
                  <span className="font-medium text-slate-800">
                    {selectedExecutive.joining_date
                      ? new Date(selectedExecutive.joining_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : new Date(selectedExecutive.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {selectedExecutive.notes && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
                    {selectedExecutive.notes}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    handleOpenEditModal(selectedExecutive);
                  }}
                  className="gap-1.5"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
