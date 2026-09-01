'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Search, Plus, Calendar, MessageCircle, Mail, Pencil,
  HelpCircle, X, Check, Building2, User, Phone, MapPin,
  ChevronLeft, ChevronRight, Send, Clock, Trash2, RefreshCw
} from 'lucide-react';
import { customersApi, leadsApi } from '@/services/crmService';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';

interface Connection {
  id: string;
  name: string;
  relation: 'customer' | 'supplier' | 'neighbour' | 'friend';
  last_talk?: string;
  next_action?: string;
  mobile?: string;
  email?: string;
  executive?: string;
  city?: string;
  state?: string;
  company_name?: string;
}



export default function ConnectionsPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const queryClient = useQueryClient();

  // Filters & State
  const [search, setSearch] = useState('');
  const [activeRelation, setActiveRelation] = useState<'all' | 'customer' | 'supplier' | 'neighbour' | 'friend'>('customer');
  const [selectedExecutive, setSelectedExecutive] = useState('All Executives');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedState, setSelectedState] = useState('All States');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Local connection state additions (persisted to localStorage)
  const [localConnections, setLocalConnections] = useState<Connection[]>([]);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  // Load from localStorage after mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('connections_local');
      if (saved) setLocalConnections(JSON.parse(saved));
    } catch {}
    setLoadedFromStorage(true);
  }, []);

  // Persist localConnections to localStorage whenever it changes
  useEffect(() => {
    if (!loadedFromStorage) return;
    try {
      localStorage.setItem('connections_local', JSON.stringify(localConnections));
    } catch {}
  }, [localConnections, loadedFromStorage]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [activeTrainingModal, setActiveTrainingModal] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Connection>>({
    name: '',
    relation: 'customer',
    mobile: '',
    email: '',
    executive: '',
    city: '',
    state: '',
  });

  // Fetch connections from API
  const { data: apiRes, isLoading } = useQuery({
    queryKey: ['connections', search],
    queryFn: () => customersApi.list({ search }),
    staleTime: 30000,
  });

  // Combine backend list with demo/local connections smoothly
  const allConnections = useMemo(() => {
    const rawApiList: any[] = (apiRes?.data as any)?.results || (apiRes as any)?.results || [];
    const mappedApi: Connection[] = rawApiList.map((item: any) => ({
      id: item.id || String(Math.random()),
      name: item.name || item.customer_name || 'Unnamed',
      relation: (item.relation || item.tags?.[0] || 'customer').toLowerCase() as any,
      last_talk: item.last_talk || '-',
      next_action: item.next_action || '-',
      mobile: item.mobile || '',
      email: item.email || '',
      executive: item.assigned_to_name || item.executive || '',
      city: item.city || '',
      state: item.state || '',
      company_name: item.company_name,
    }));

    // Merge API data + local additions
    const combined = [...localConnections, ...mappedApi];
    // Deduplicate by ID / Name
    const seen = new Set();
    return combined.filter((c) => {
      const key = `${c.id}-${c.name.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [apiRes, localConnections]);

  // Derived filter options
  const executives = useMemo(() => {
    const list = Array.from(new Set(allConnections.map((c) => c.executive).filter(Boolean)));
    return ['All Executives', ...list];
  }, [allConnections]);

  const cities = useMemo(() => {
    const list = Array.from(new Set(allConnections.map((c) => c.city).filter(Boolean)));
    return ['All Cities', ...list];
  }, [allConnections]);

  const states = useMemo(() => {
    const list = Array.from(new Set(allConnections.map((c) => c.state).filter(Boolean)));
    return ['All States', ...list];
  }, [allConnections]);

  // Filtered connections list
  const filteredConnections = useMemo(() => {
    return allConnections.filter((c) => {
      // Search term
      if (
        search.trim() &&
        !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.mobile?.includes(search) &&
        !c.email?.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      // Relation filter
      if (activeRelation !== 'all' && c.relation !== activeRelation) {
        return false;
      }
      // Executive filter
      if (selectedExecutive !== 'All Executives' && c.executive !== selectedExecutive) {
        return false;
      }
      // City filter
      if (selectedCity !== 'All Cities' && c.city !== selectedCity) {
        return false;
      }
      // State filter
      if (selectedState !== 'All States' && c.state !== selectedState) {
        return false;
      }
      return true;
    });
  }, [allConnections, search, activeRelation, selectedExecutive, selectedCity, selectedState]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredConnections.length / itemsPerPage));
  const paginatedConnections = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredConnections.slice(start, start + itemsPerPage);
  }, [filteredConnections, currentPage]);

  // Save / Submit Connection Handler
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast('Please enter a connection name', 'error');
      return;
    }

    try {
      if (editingConnection) {
        // Edit flow
        const updated = {
          ...editingConnection,
          ...formData,
        } as Connection;

        setLocalConnections((prev) =>
          prev.map((c) => (c.id === editingConnection.id ? updated : c))
        );
        showToast(`Connection "${formData.name}" updated successfully`, 'success');
      } else {
        // Create flow
        const newConn: Connection = {
          id: `new-${Date.now()}`,
          name: formData.name.trim(),
          relation: (formData.relation || 'customer') as any,
          last_talk: '-',
          next_action: '-',
          mobile: formData.mobile || '',
          email: formData.email || '',
          executive: formData.executive || '',
          city: formData.city || '',
          state: formData.state || '',
        };

        // Try API create or fallback to local state
        try {
          await customersApi.create({
            name: newConn.name,
            mobile: newConn.mobile,
            email: newConn.email,
            city: newConn.city,
            state: newConn.state,
            customer_type: 'individual',
            status: 'active',
          });
        } catch {
          // Graceful simple fallback
        }

        setLocalConnections((prev) => [newConn, ...prev]);
        showToast(`Connection "${newConn.name}" added successfully`, 'success');
      }

      setShowAddModal(false);
      setEditingConnection(null);
      setFormData({
        name: '',
        relation: 'customer',
        mobile: '',
        email: '',
        executive: '',
        city: '',
        state: '',
      });
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err: any) {
      showToast(err.message || 'Failed to save connection', 'error');
    }
  };

  // Sync connections from CRM (Leads + Customers)
  const handleSyncFromCRM = async () => {
    setIsSyncing(true);
    try {
      const [leadsRes, customersRes] = await Promise.all([
        leadsApi.list({ page_size: 500 }),
        customersApi.list({ page_size: 500 }),
      ]);

      const leads: any[] = (leadsRes as any)?.data?.data?.results || [];
      const customers: any[] = (customersRes as any)?.data?.data?.results || [];

      const synced: Connection[] = [];

      leads.forEach((lead: any) => {
        synced.push({
          id: `lead-${lead.id}`,
          name: lead.full_name || lead.company_name || 'Unnamed Lead',
          relation: 'customer',
          last_talk: lead.last_contact_date || '-',
          next_action: lead.next_followup_date || '-',
          mobile: lead.mobile || '',
          email: lead.email || '',
          executive: lead.assigned_to_name || '',
          city: lead.city || '',
          state: lead.state || '',
          company_name: lead.company_name,
        });
      });

      customers.forEach((cust: any) => {
        synced.push({
          id: `cust-${cust.id}`,
          name: cust.company_name || cust.name || 'Unnamed Customer',
          relation: (cust.tags?.[0] || 'customer').toLowerCase() as any,
          last_talk: '-',
          next_action: '-',
          mobile: cust.mobile || '',
          email: cust.email || '',
          executive: cust.assigned_to_name || '',
          city: cust.city || '',
          state: cust.state || '',
          company_name: cust.company_name,
        });
      });

      setLocalConnections(synced);
      localStorage.setItem('connections_local', JSON.stringify(synced));
      setLoadedFromStorage(true);
      showToast(`Synced ${synced.length} connections from CRM (Leads: ${leads.length}, Customers: ${customers.length})`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err: any) {
      showToast('Failed to sync from CRM: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete a connection
  const handleDeleteConnection = async (conn: Connection) => {
    const confirmed = await confirm({
      title: 'Delete Connection',
      message: `Remove "${conn.name}" from connections?`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });
    if (!confirmed) return;

    setDeletingId(conn.id);
    try {
      // If it's a real CRM customer, try API delete
      if (conn.id.startsWith('cust-')) {
        const realId = conn.id.replace('cust-', '');
        await customersApi.delete(realId);
      }
      // Remove from local state
      setLocalConnections((prev) => prev.filter((c) => c.id !== conn.id));
      showToast(`"${conn.name}" deleted`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err: any) {
      showToast('Failed to delete: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Update relation tag inline
  const handleUpdateRelation = async (conn: Connection, newRelation: Connection['relation']) => {
    try {
      if (conn.id.startsWith('cust-')) {
        const realId = conn.id.replace('cust-', '');
        await customersApi.update(realId, { tags: [newRelation] });
      }
      setLocalConnections((prev) =>
        prev.map((c) => (c.id === conn.id ? { ...c, relation: newRelation } : c))
      );
      showToast(`"${conn.name}" tagged as ${newRelation}`, 'success');
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
    } catch (err: any) {
      showToast('Failed to update tag: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  // Helper for relation badge square colors
  const getRelationBadge = (relation: string) => {
    switch (relation) {
      case 'customer':
        return <span className="w-2.5 h-2.5 bg-[#d97706] rounded-xs inline-block" title="Customer" />;
      case 'supplier':
        return <span className="w-2.5 h-2.5 bg-[#16a34a] rounded-xs inline-block" title="Supplier" />;
      case 'neighbour':
        return <span className="w-2.5 h-2.5 bg-[#2563eb] rounded-xs inline-block" title="Neighbour" />;
      case 'friend':
      default:
        return <span className="w-2.5 h-2.5 bg-[#334155] rounded-xs inline-block" title="Friend" />;
    }
  };

  return (
    <div className="flex flex-col gap-3 max-w-[1600px] mx-auto p-2 text-slate-800 font-sans">
      {/* ── Top Bar Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 pb-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Connections</h1>

        <div className="flex items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs w-48 focus:outline-none focus:border-amber-600 bg-white"
            />
          </div>

          {/* + Enter Connection Button */}
          <button
            onClick={() => {
              setEditingConnection(null);
              setFormData({
                name: '',
                relation: 'customer',
                mobile: '',
                email: '',
                executive: '',
                city: '',
                state: '',
              });
              setShowAddModal(true);
            }}
            className="flex items-center gap-1 bg-[#b85800] hover:bg-[#a14c00] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> + Enter Connection
          </button>

          {/* Sync from CRM Button */}
          <button
            onClick={handleSyncFromCRM}
            disabled={isSyncing}
            className="flex items-center gap-1 bg-[#1a5276] hover:bg-[#154360] text-white px-3 py-1.5 rounded text-xs font-semibold shadow-xs transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing…' : 'Sync from CRM'}
          </button>

          {/* Appointments Button */}
          <button
            onClick={() => setShowAppointmentsModal(true)}
            className="flex items-center gap-1.5 bg-[#112a46] hover:bg-[#1a385c] text-white px-3.5 py-1.5 rounded text-xs font-medium shadow-xs transition-colors"
          >
            Appointments
          </button>

          {/* Calendar Icon View Button */}
          <button
            onClick={() => setShowAppointmentsModal(true)}
            className="p-1.5 bg-[#112a46] hover:bg-[#1a385c] text-white rounded shadow-xs transition-colors"
            title="Appointments Calendar"
          >
            <Calendar className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Relation Filter Pills ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 py-1">
        {/* All */}
        <button
          onClick={() => {
            setActiveRelation('all');
            setCurrentPage(1);
          }}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeRelation === 'all'
              ? 'bg-[#5c4738] text-white border border-[#5c4738]'
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          All
        </button>

        {/* Customers */}
        <button
          onClick={() => {
            setActiveRelation('customer');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeRelation === 'customer'
              ? 'bg-amber-50 text-amber-900 border-2 border-amber-600'
              : 'bg-white text-amber-700 border border-amber-500 hover:bg-amber-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-[#d97706] rounded-xs inline-block" />
          Customers
        </button>

        {/* Suppliers */}
        <button
          onClick={() => {
            setActiveRelation('supplier');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeRelation === 'supplier'
              ? 'bg-green-50 text-green-900 border-2 border-green-600'
              : 'bg-white text-green-700 border border-green-600 hover:bg-green-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-[#16a34a] rounded-xs inline-block" />
          Suppliers
        </button>

        {/* Neighbours */}
        <button
          onClick={() => {
            setActiveRelation('neighbour');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeRelation === 'neighbour'
              ? 'bg-blue-50 text-blue-900 border-2 border-blue-600'
              : 'bg-white text-blue-700 border border-blue-600 hover:bg-blue-50/50'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-[#2563eb] rounded-xs inline-block" />
          Neighbours
        </button>

        {/* Friends */}
        <button
          onClick={() => {
            setActiveRelation('friend');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
            activeRelation === 'friend'
              ? 'bg-slate-100 text-slate-900 border-2 border-slate-700'
              : 'bg-white text-slate-800 border border-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="w-2.5 h-2.5 bg-[#334155] rounded-xs inline-block" />
          Friends
        </button>
      </div>

      {/* ── Dropdown Filters Row ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 py-1">
        {/* All Executives */}
        <select
          value={selectedExecutive}
          onChange={(e) => {
            setSelectedExecutive(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-amber-600 min-w-[150px]"
        >
          {executives.map((ex) => (
            <option key={ex} value={ex}>
              {ex}
            </option>
          ))}
        </select>

        {/* All Cities */}
        <select
          value={selectedCity}
          onChange={(e) => {
            setSelectedCity(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-amber-600 min-w-[140px]"
        >
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        {/* All States */}
        <select
          value={selectedState}
          onChange={(e) => {
            setSelectedState(e.target.value);
            setCurrentPage(1);
          }}
          className="px-2.5 py-1 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-amber-600 min-w-[140px]"
        >
          {states.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* ── Main Connections Table ───────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded shadow-2xs overflow-hidden mt-1">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
              <tr className="border-b border-slate-200 text-slate-800 font-semibold bg-white">
              <th className="py-2.5 px-4">Customer</th>
              <th className="py-2.5 px-4">Relation</th>
              <th className="py-2.5 px-4">Last Talk</th>
              <th className="py-2.5 px-4">Next Action</th>
              <th className="py-2.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Loading connections...
                </td>
              </tr>
            ) : paginatedConnections.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No matching connections found.
                </td>
              </tr>
            ) : (
              paginatedConnections.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Customer Name */}
                  <td className="py-2.5 px-4 text-slate-800 font-medium">
                    {c.name}
                  </td>

                  {/* Relation Badge - inline tag selector */}
                  <td className="py-2.5 px-4">
                    <select
                      value={c.relation}
                      onChange={(e) => handleUpdateRelation(c, e.target.value as Connection['relation'])}
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 bg-white focus:outline-none focus:border-amber-500 cursor-pointer"
                      style={{
                        color: c.relation === 'customer' ? '#92400e' : c.relation === 'supplier' ? '#166534' : c.relation === 'neighbour' ? '#1e40af' : '#334155',
                        backgroundColor: c.relation === 'customer' ? '#fffbeb' : c.relation === 'supplier' ? '#f0fdf4' : c.relation === 'neighbour' ? '#eff6ff' : '#f8fafc',
                        borderColor: c.relation === 'customer' ? '#f59e0b' : c.relation === 'supplier' ? '#22c55e' : c.relation === 'neighbour' ? '#3b82f6' : '#64748b',
                      }}
                    >
                      <option value="customer">Customer</option>
                      <option value="supplier">Supplier</option>
                      <option value="neighbour">Neighbour</option>
                      <option value="friend">Friend</option>
                    </select>
                  </td>

                  {/* Last Talk */}
                  <td className="py-2.5 px-4 text-slate-600">
                    {c.last_talk || '-'}
                  </td>

                  {/* Next Action */}
                  <td className="py-2.5 px-4 text-slate-600">
                    {c.next_action || '-'}
                  </td>

                  {/* Actions Column */}
                  <td className="py-2.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* WhatsApp Icon */}
                      <a
                        href={`https://wa.me/${c.mobile ? c.mobile.replace(/\D/g, '') : '919876543210'}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-6 h-6 rounded bg-[#86d98c] hover:bg-[#6ecb75] text-[#0f5114] flex items-center justify-center transition-colors shadow-2xs"
                        title="WhatsApp Chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current" />
                      </a>

                      {/* Email Icon */}
                      {c.email ? (
                        <a
                          href={`mailto:${c.email}`}
                          className="w-6 h-6 rounded bg-[#f59e0b] hover:bg-[#d97706] text-white flex items-center justify-center transition-colors shadow-2xs"
                          title="Send Email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      ) : null}

                      {/* Edit Icon */}
                      <button
                        onClick={() => {
                          setEditingConnection(c);
                          setFormData({ ...c });
                          setShowAddModal(true);
                        }}
                        className="w-6 h-6 rounded bg-[#c45c08] hover:bg-[#a14c00] text-white flex items-center justify-center transition-colors shadow-2xs"
                        title="Edit Connection"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDeleteConnection(c)}
                        disabled={deletingId === c.id}
                        className="w-6 h-6 rounded bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center transition-colors shadow-2xs disabled:opacity-50"
                        title="Delete Connection"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination Controls ─────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-1 py-2 text-xs">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40"
        >
          «
        </button>

        {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map((pg) => (
          <button
            key={pg}
            onClick={() => setCurrentPage(pg)}
            className={`w-7 h-7 flex items-center justify-center border rounded font-medium ${
              currentPage === pg
                ? 'bg-[#162032] border-[#162032] text-white font-bold'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {pg}
          </button>
        ))}

        {totalPages > 7 && <span className="px-1 text-slate-400">...</span>}

        {totalPages > 7 && (
          <button
            onClick={() => setCurrentPage(14)}
            className={`w-7 h-7 flex items-center justify-center border rounded font-medium ${
              currentPage === 14
                ? 'bg-[#162032] border-[#162032] text-white font-bold'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            14
          </button>
        )}

        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="w-7 h-7 flex items-center justify-center border border-slate-300 rounded text-slate-600 bg-white hover:bg-slate-50 disabled:opacity-40"
        >
          »
        </button>
      </div>

      {/* ── Training Materials Section ───────────────────────────────────── */}
      <div className="mt-4 pt-2 border-t border-slate-200">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">Training Materials</h3>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTrainingModal('customers')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Customers Related
          </button>

          <button
            onClick={() => setActiveTrainingModal('usefulness')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            What is the usefulness of Connections?
          </button>

          <button
            onClick={() => setActiveTrainingModal('branch')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 hover:bg-slate-50 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            How to add a branch?
          </button>
        </div>
      </div>

      {/* ── Modal: Enter / Edit Connection ───────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800">
                {editingConnection ? 'Edit Connection' : '+ Enter Connection'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Connection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Relation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relation / Type *
                </label>
                <select
                  value={formData.relation || 'customer'}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value as any })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600 bg-white"
                >
                  <option value="customer">Customer (Orange)</option>
                  <option value="supplier">Supplier (Green)</option>
                  <option value="neighbour">Neighbour (Blue)</option>
                  <option value="friend">Friend (Dark Slate)</option>
                </select>
              </div>

              {/* Mobile & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile
                  </label>
                  <input
                    type="text"
                    placeholder="9876543210"
                    value={formData.mobile || ''}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="name@company.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delhi"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Assigned Executive */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Executive
                </label>
                <input
                  type="text"
                  value={formData.executive || ''}
                  onChange={(e) => setFormData({ ...formData, executive: e.target.value })}
                  placeholder="Enter executive name"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#b85800] hover:bg-[#a14c00] text-white rounded text-xs font-semibold shadow-xs"
                >
                  {editingConnection ? 'Update Connection' : 'Save Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Appointments ──────────────────────────────────────────── */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-[#112a46] text-white">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Calendar className="w-4 h-4" /> Upcoming Appointments & Followups
              </div>
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="text-slate-300 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
              <p className="text-xs text-slate-400 text-center py-4">No upcoming appointments. Appointments are managed through the CRM module.</p>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setShowAppointmentsModal(false)}
                className="px-4 py-1.5 bg-[#112a46] text-white text-xs font-medium rounded hover:bg-[#1a385c]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Training Guide ────────────────────────────────────────── */}
      {activeTrainingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                {activeTrainingModal === 'customers'
                  ? 'Customers Related Guide'
                  : activeTrainingModal === 'usefulness'
                  ? 'Usefulness of Connections'
                  : 'How to Add a Branch'}
              </h3>
              <button
                onClick={() => setActiveTrainingModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 text-xs text-slate-700 space-y-2 leading-relaxed">
              {activeTrainingModal === 'customers' && (
                <>
                  <p><strong>Customer Connections:</strong> Manage all customer touchpoints, past talks, and next actions in one organized directory.</p>
                  <p>Filter connections by relation badges (Orange for Customers, Green for Suppliers, Blue for Neighbours, and Slate for Friends).</p>
                </>
              )}
              {activeTrainingModal === 'usefulness' && (
                <>
                  <p><strong>Why use Connections?</strong> It gives your entire executive team an instant single-pane view of every relationship in your network.</p>
                  <p>One-click WhatsApp chats, Email outreach, and last talk timestamps keep communication flowing smooth and fast.</p>
                </>
              )}
              {activeTrainingModal === 'branch' && (
                <>
                  <p><strong>Adding a Branch:</strong> Go to Settings → Branches → Add Branch. Each branch can be assigned distinct connection lists and executive teams.</p>
                </>
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setActiveTrainingModal(null)}
                className="px-4 py-1.5 bg-slate-700 text-white text-xs font-medium rounded hover:bg-slate-800"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
