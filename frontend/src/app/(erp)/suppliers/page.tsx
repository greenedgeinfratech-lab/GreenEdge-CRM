'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  MessageCircle,
  Mail,
  Pencil,
  Download,
  ShoppingCart,
  FileText,
  HelpCircle,
  Upload,
  X,
  Loader2,
} from 'lucide-react';
import { customersApi } from '@/services/crmService';
import { usersApi } from '@/services/userService';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import CreateCustomerModal from '@/components/CreateCustomerModal';
import type { Customer } from '@/interfaces/crm';

const TRAINING_LINKS = [
  'Suppliers Related',
  'What is the usefulness of Connections?',
  'How to add a supplier branch?',
];

const INTERACTION_TYPES = [
  { value: 'reminder', label: 'Reminder' },
  { value: 'appointment', label: 'Appointment' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
];

export default function SuppliersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [executive, setExecutive] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [interactionModal, setInteractionModal] = useState<{
    open: boolean;
    supplierId: string;
    supplierName: string;
    type: 'lastTalk' | 'nextAction';
  }>({ open: false, supplierId: '', supplierName: '', type: 'lastTalk' });
  const [interactionForm, setInteractionForm] = useState({
    interaction_type: 'reminder',
    notes: '',
    scheduled_for: '',
  });

  // Import feedback
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  // Fetch suppliers (customers with business type)
  const filters: Record<string, any> = {
    search,
    customer_type: 'business',
    page,
  };
  if (executive) filters.assigned_to = executive;
  if (city) filters.city = city;
  if (state) filters.state = state;

  const { data, isLoading } = useQuery({
    queryKey: CRM_KEYS.customers(filters),
    queryFn: () => customersApi.list(filters),
  });

  const suppliers: Customer[] = (data?.data as any)?.results || (data as any)?.results || [];
  const totalCount: number = (data?.data as any)?.count || (data as any)?.count || 0;
  const totalPages = Math.ceil(totalCount / 10);

  // Fetch employees for executive filter
  const { data: employeesRes } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.listEmployees(),
  });
  const employees: Array<{ id: string; first_name: string; last_name: string }> = (() => {
    const body = employeesRes?.data;
    if (!body) return [];
    const list = Array.isArray(body.results) ? body.results : Array.isArray(body) ? body : [];
    return list.filter((e: any) => e && e.id);
  })();

  // Create interaction mutation
  const createInteractionMutation = useMutation({
    mutationFn: ({
      supplierId,
      data,
    }: {
      supplierId: string;
      data: { interaction_type: string; notes?: string; scheduled_for?: string };
    }) => customersApi.addInteraction(supplierId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
      setInteractionModal({ open: false, supplierId: '', supplierName: '', type: 'lastTalk' });
      setInteractionForm({ interaction_type: 'reminder', notes: '', scheduled_for: '' });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => customersApi.toggleStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────

  const refreshList = () => {
    // Reset to page 1 and force a complete refetch
    setPage(1);
    // Invalidate all customer queries
    void queryClient.invalidateQueries({ queryKey: ['customers'] });
  };

  const handleExport = () => {
    const headers = ['Name', 'Company', 'Mobile', 'Email', 'City', 'State', 'Status', 'Outstanding'];
    const rows = suppliers.map((s) => [
      s.name,
      s.company_name || '',
      s.mobile || '',
      s.email || '',
      s.city || '',
      s.state || '',
      s.status || 'active',
      String(s.outstanding || 0),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `suppliers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('importing');
    setImportMessage('');
    try {
      const text = await file.text();
      const lines = text.split('\n').filter((l) => l.trim());
      if (lines.length < 2) {
        setImportStatus('error');
        setImportMessage('CSV file is empty or has no data rows.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      let successCount = 0;
      let failCount = 0;
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => (row[h] = values[idx] || ''));
        try {
          await customersApi.create({
            name: row.name || row.contact_name || '',
            company_name: row.company || row.company_name || row.business_name || '',
            mobile: (row.mobile || row.phone || '').replace(/\s/g, ''),
            email: row.email || '',
            city: row.city || '',
            state: row.state || '',
            customer_type: 'business',
            status: 'active',
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
      refreshList();
      setImportStatus('success');
      setImportMessage(`Imported ${successCount} supplier(s).${failCount > 0 ? ` ${failCount} failed.` : ''}`);
    } catch (err) {
      setImportStatus('error');
      setImportMessage('Failed to parse CSV file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWhatsApp = (mobile: string) => {
    window.open(`https://wa.me/91${mobile}`, '_blank');
  };

  const handleEmail = (email: string) => {
    window.open(`mailto:${email}`, '_blank');
  };

  const handleOpenInteraction = (supplier: Customer, type: 'lastTalk' | 'nextAction') => {
    setInteractionModal({
      open: true,
      supplierId: supplier.id,
      supplierName: supplier.name,
      type,
    });
    setInteractionForm({ interaction_type: 'reminder', notes: '', scheduled_for: '' });
  };

  const handleSubmitInteraction = () => {
    if (!interactionModal.supplierId) return;
    createInteractionMutation.mutate({
      supplierId: interactionModal.supplierId,
      data: {
        interaction_type: interactionForm.interaction_type,
        notes: interactionForm.notes || (interactionModal.type === 'lastTalk' ? 'Last talk logged' : 'Next action scheduled'),
        ...(interactionModal.type === 'nextAction' && interactionForm.scheduled_for
          ? { scheduled_for: interactionForm.scheduled_for }
          : {}),
      },
    });
  };

  const uniqueCities = [...new Set(suppliers.map((s) => s.city).filter(Boolean))] as string[];
  const uniqueStates = [...new Set(suppliers.map((s) => s.state).filter(Boolean))] as string[];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 max-w-[1600px] mx-auto w-full p-4">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9 pr-3 py-2 border border-gray-300 rounded text-sm w-56 focus:outline-none focus:border-blue-500 bg-white"
              />
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10]"
            >
              <Plus className="w-4 h-4 mr-1" /> Enter Supplier
            </button>

            <button
              onClick={() => router.push('/crm')}
              className="flex items-center bg-[#1a2332] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#243044]"
            >
              Appointments
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importStatus === 'importing'}
              className="flex items-center bg-[#1a2332] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#243044] disabled:opacity-50"
            >
              {importStatus === 'importing' ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Importing...</>
              ) : (
                <><Upload className="w-4 h-4 mr-1" /> Import Suppliers</>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImport}
            />

            <button
              onClick={handleExport}
              className="p-2 border border-gray-300 rounded bg-white hover:bg-gray-50"
              title="Export Suppliers"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Import feedback */}
        {importStatus !== 'idle' && importStatus !== 'importing' && (
          <div className={`mb-4 p-3 rounded text-sm ${importStatus === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {importMessage}
            <button onClick={() => setImportStatus('idle')} className="ml-2 underline">Dismiss</button>
          </div>
        )}

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select
            value={executive}
            onChange={(e) => { setExecutive(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Executives</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
            ))}
          </select>

          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Cities</option>
            {uniqueCities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={state}
            onChange={(e) => { setState(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="flex-1" />

          <button
            onClick={() => router.push('/invoices')}
            className="flex items-center bg-[#b8651a] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#a05515]"
          >
            <ShoppingCart className="w-4 h-4 mr-1" /> Supplier Invoices
          </button>

          <button
            onClick={() => router.push('/purch-orders')}
            className="flex items-center bg-[#b8651a] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#a05515]"
          >
            <FileText className="w-4 h-4 mr-1" /> Purchase Orders
          </button>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mb-4">
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Relation</th>
                <th className="px-4 py-3">Last Talk</th>
                <th className="px-4 py-3">Next Action</th>
                <th className="px-4 py-3 text-right w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                    Loading...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No suppliers found. Add your first supplier to get started.
                  </td>
                </tr>
              ) : (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 text-gray-700">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {s.name}
                        {s.company_name && (
                          <span className="text-gray-500 font-normal"> / {s.company_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block w-3 h-3 rounded-sm cursor-pointer ${
                          s.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                        title={s.status === 'active' ? 'Active' : 'Inactive'}
                        onClick={() => toggleStatusMutation.mutate(s.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <button
                        onClick={() => handleOpenInteraction(s, 'lastTalk')}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        + Enter
                      </button>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      <button
                        onClick={() => handleOpenInteraction(s, 'nextAction')}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        + Set
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {s.mobile && (
                          <button
                            onClick={() => handleWhatsApp(s.mobile!)}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        {s.email && (
                          <button
                            onClick={() => handleEmail(s.email!)}
                            className="p-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                            title="Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/customers/${s.id}/edit`)}
                          className="p-1.5 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-end items-center gap-1 mb-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &laquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 text-sm border rounded ${
                  page === p
                    ? 'bg-[#1a2332] text-white border-[#1a2332]'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &raquo;
            </button>
          </div>
        )}

        {/* Training Materials */}
        <div className="border-t border-gray-200 pt-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">Training Materials</h3>
          <div className="flex flex-wrap gap-2">
            {TRAINING_LINKS.map((link) => (
              <button
                key={link}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 bg-white hover:bg-gray-50"
              >
                <HelpCircle className="w-4 h-4 text-gray-400" />
                {link}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Supplier Modal */}
      <CreateCustomerModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refreshList()}
      />

      {/* Interaction Modal (Last Talk / Next Action) */}
      {interactionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                {interactionModal.type === 'lastTalk' ? 'Log Last Talk' : 'Set Next Action'}
              </h3>
              <button
                onClick={() => setInteractionModal({ ...interactionModal, open: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-500">
                Supplier: <span className="font-medium text-gray-700">{interactionModal.supplierName}</span>
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={interactionForm.interaction_type}
                  onChange={(e) => setInteractionForm({ ...interactionForm, interaction_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                >
                  {INTERACTION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={interactionForm.notes}
                  onChange={(e) => setInteractionForm({ ...interactionForm, notes: e.target.value })}
                  placeholder={interactionModal.type === 'lastTalk' ? 'What was discussed...' : 'What needs to be done...'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {interactionModal.type === 'nextAction' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={interactionForm.scheduled_for}
                    onChange={(e) => setInteractionForm({ ...interactionForm, scheduled_for: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-200">
              <button
                onClick={() => setInteractionModal({ ...interactionModal, open: false })}
                className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitInteraction}
                disabled={createInteractionMutation.isPending}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {createInteractionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
