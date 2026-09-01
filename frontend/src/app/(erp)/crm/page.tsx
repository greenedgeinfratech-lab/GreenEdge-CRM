'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/providers/ToastProvider';
import Link from 'next/link';
import {
  Search, Filter, Star, StarOff, Edit3, MessageCircle, Grid,
  ChevronDown, LineChart, Plus, Upload, Download, MoreHorizontal,
  ArrowUpDown, RefreshCw, Loader2, AlertCircle, Phone, Mail,
  CheckSquare, Square, ChevronLeft, ChevronRight, Check, Ban
} from 'lucide-react';
import LeadFiltersModal from './LeadFiltersModal';
import PeriodModal from './PeriodModal';
import RawLeadsDashboard from './RawLeadsDashboard';

import { leadsApi, crmConfigApi } from '@/services/crmService';
import type { Lead, LeadFilters, LeadStage } from '@/interfaces/crm';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(val: number | string | undefined | null): string {
  const num = Number(val);
  if (isNaN(num) || val == null) return '-';
  if (num >= 10_00_000) return `₹${(num / 10_00_000).toFixed(1)}L`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

function scoreColor(score: number): string {
  if (score >= 75) return 'text-green-600 bg-green-50';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50';
  if (score >= 25) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
}

function priorityBadge(p: string) {
  const map: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high:   'bg-orange-100 text-orange-700',
    medium: 'bg-blue-100 text-blue-700',
    low:    'bg-gray-100 text-gray-600',
  };
  return map[p] || 'bg-gray-100 text-gray-600';
}

function timeAgo(dt: string): string {
  const d = new Date(dt);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

import { Suspense } from 'react';

// ── URL-driven filter state ───────────────────────────────────────────────

function CRMContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<LeadFilters>({
    page: 1,
    page_size: 25,
    ordering: '-created_at',
    stage: searchParams.get('stage') || undefined,
    search: '',
    status: 'open,in_progress,on_hold',
  });
  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'kanban' | 'dashboard'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const { user } = useAuth() || {};
  const { showToast } = useToast();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: leadsResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => leadsApi.list(filters),
    staleTime: 30_000,
    retry: 2,
  });

  const { data: stagesResponse } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: () => crmConfigApi.getStages(),
    staleTime: 5 * 60_000,
  });

  const { data: sourcesResponse } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: () => crmConfigApi.getSources(),
    staleTime: 5 * 60_000,
  });

  const leads = (leadsResponse?.data as any)?.data?.results || [];
  const totalCount = (leadsResponse?.data as any)?.data?.count || 0;
  const stages: LeadStage[] = (stagesResponse?.data as any)?.data?.results || (stagesResponse?.data as any)?.data || [];
  const sources = (sourcesResponse?.data as any)?.data?.results || (sourcesResponse?.data as any)?.data || [];
  const totalPages = Math.ceil(totalCount / (filters.page_size || 25));

  // ── Mutations ─────────────────────────────────────────────────────────────
  const starMutation = useMutation({
    mutationFn: (id: string) => leadsApi.toggleStar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const clearFollowupMutation = useMutation({
    mutationFn: (id: string) => leadsApi.update(id, { next_followup_date: null as any }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
    onError: (err: any) => {
      console.error('Clear followup error:', err?.response?.data || err);
      alert(err?.response?.data?.detail || 'Failed to update appointment. Check console.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: Parameters<typeof leadsApi.bulk>[0]) => leadsApi.bulk(payload),
    onSuccess: () => {
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback((value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setFilters(f => ({ ...f, search: value, page: 1 }));
    }, 400);
  }, []);

  const handleStageFilter = (stageId?: string) => {
    setFilters(f => ({
      ...f,
      stage: stageId,
      page: 1,
      status: stageId ? undefined : 'open,in_progress,on_hold',
    }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(leads.map((l: Lead) => l.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const totalPotential = leads.reduce((sum: number, l: Lead) => sum + Number(l.estimated_value || 0), 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-3 max-w-[1600px] mx-auto p-2">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 bg-transparent py-2">
        <div className="flex items-center space-x-4 text-2xl text-gray-800 font-normal">
          <span>Leads &amp; Prospects</span>
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-gray-400" />}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Active leads dropdown */}
          <div className="relative flex items-center border border-gray-300 rounded overflow-visible z-20">
            <button 
              onClick={() => setShowViewDropdown(!showViewDropdown)}
              className="bg-gray-100 text-[#1a365d] px-3 py-1.5 text-sm font-semibold hover:bg-gray-200"
            >
              {filters.status === 'converted' ? 'Converted Leads' :
               filters.status === 'lost' ? 'Lost Leads' :
               filters.assigned_to ? 'My Leads' :
               'All Leads'}
            </button>
            <button className="bg-[#1a365d] text-white p-1.5 hover:bg-[#152a4a]">
              <Edit3 className="w-4 h-4" />
            </button>
            
            {showViewDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg py-1 z-50">
                <button
                  onClick={() => { setFilters(f => ({ ...f, status: 'open,in_progress,on_hold', assigned_to: undefined, stage: undefined, page: 1 })); setShowViewDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  All Active Leads
                </button>
                <button
                  onClick={() => { setFilters(f => ({ ...f, status: 'open,in_progress,on_hold', assigned_to: user?.id, stage: undefined, page: 1 })); setShowViewDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  My Leads
                </button>
                <button
                  onClick={() => { setFilters(f => ({ ...f, status: 'converted', assigned_to: undefined, stage: undefined, page: 1 })); setShowViewDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Converted Leads
                </button>
                <button
                  onClick={() => { setFilters(f => ({ ...f, status: 'lost', assigned_to: undefined, stage: undefined, page: 1 })); setShowViewDropdown(false); }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Lost Leads
                </button>
              </div>
            )}
          </div>

          {/* Filters button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-[#1a365d] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#152a4a]"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filters {Object.keys(filters).filter(k => !['page', 'page_size', 'ordering', 'status'].includes(k) && (filters as any)[k]).length > 0 ? `(${Object.keys(filters).filter(k => !['page', 'page_size', 'ordering', 'status'].includes(k) && (filters as any)[k]).length})` : '(0)'}
          </button>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              value={searchInput}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:border-blue-500 bg-white"
            />
          </div>

          {/* Add Lead */}
          <Link
            href="/crm/new"
            className="flex items-center bg-[#c2590e] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#a64a0a]"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Lead
          </Link>

          {/* Import */}
          <label className="flex items-center bg-[#c2590e] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#a64a0a] cursor-pointer">
            <span className="mr-1">✓</span> Import
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    const res = await leadsApi.import(file);
                    const importedCount = (res.data as any)?.imported ?? 0;
                    showToast(`Successfully imported ${importedCount} lead(s)`, 'success');
                    queryClient.invalidateQueries({ queryKey: ['leads'] });
                  } catch (err: any) {
                    const errorDetail = err.response?.data?.detail || err.message || 'Failed to import CSV file';
                    showToast(`Import failed: ${errorDetail}`, 'error');
                  } finally {
                    e.target.value = '';
                  }
                }
              }}
            />
          </label>

          {/* View toggle & Actions */}
          <div className="flex space-x-1">
            <button
              onClick={() => leadsApi.export(filters)}
              className="p-1.5 rounded text-sm bg-[#1a365d] text-white hover:bg-[#152a4a]"
              title="Export to Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('dashboard')}
              className={`p-1.5 rounded text-sm ${view === 'dashboard' ? 'bg-[#c2590e]' : 'bg-[#1a365d]'} text-white hover:opacity-80`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <Link
              href="/dashboard"
              className="p-1.5 rounded text-sm bg-[#1a365d] text-white hover:bg-[#152a4a] flex items-center justify-center"
              title="Analytics"
            >
              <LineChart className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Stage Tabs ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStageFilter(undefined)}
          className={`px-3 py-1.5 rounded text-sm font-medium border ${!filters.stage ? 'bg-[#1a365d] text-white border-[#1a365d]' : 'bg-white border-gray-300 text-[#1a365d] hover:bg-gray-50'}`}
        >
          All Active Leads &amp; Prospects
        </button>
        {stages.map(stage => (
          <button
            key={stage.id}
            onClick={() => handleStageFilter(stage.id)}
            className={`px-3 py-1.5 rounded text-sm border ${filters.stage === stage.id ? 'bg-[#1a365d] text-white border-[#1a365d]' : 'bg-white border-gray-300 text-[#1a365d] hover:bg-gray-50'}`}
          >
            {stage.name}
            {stage.lead_count > 0 && (
              <span className="ml-1 text-xs">({stage.lead_count})</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sort Bar ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex gap-2">
          <button
            onClick={() => setFilters(f => ({ ...f, has_appointments: !f.has_appointments, page: 1 }))}
            className={`px-3 py-1.5 rounded text-sm font-medium border ${filters.has_appointments ? 'bg-gray-200 border-gray-400 text-[#1a365d]' : 'bg-[#1a365d] text-white border-[#1a365d]'}`}
          >
            Appointments
          </button>
          {[
            { label: 'Newest First', value: '-created_at' },
            { label: 'Oldest First', value: 'created_at' },
            { label: 'Kanban (Prospects)', value: 'kanban_prospects' },
            { label: 'Star Leads', value: 'star_leads' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                if (opt.value === 'kanban_prospects') {
                  setView('kanban');
                  return;
                }
                if (opt.value === 'star_leads') {
                  setFilters(f => ({ ...f, is_starred: !f.is_starred, page: 1 }));
                  return;
                }
                setFilters(f => ({ ...f, ordering: opt.value, page: 1 }));
              }}
              className={`px-3 py-1.5 rounded text-sm border ${(filters.ordering === opt.value || (opt.value === 'star_leads' && filters.is_starred)) ? 'bg-gray-200 border-gray-400 text-[#1a365d]' : 'bg-white border-gray-300 text-[#1a365d] hover:bg-gray-50'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 text-sm">
          <div className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded font-medium shadow-sm">
            Count : <span className="font-bold">{totalCount}</span>
          </div>
          <div className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded font-medium shadow-sm">
            Potential : <span className="font-bold">{formatCurrency(totalPotential)}</span>
          </div>
        </div>
      </div>

      {/* ── Bulk action bar (shown when rows selected) ─────────────────── */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded px-4 py-2 text-sm">
          <span className="font-medium text-blue-800">{selectedIds.size} selected</span>
          <button
            onClick={() => bulkMutation.mutate({ lead_ids: [...selectedIds], action: 'star' })}
            className="flex items-center text-yellow-600 hover:text-yellow-800"
          >
            <Star className="w-4 h-4 mr-1" /> Star
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} leads?`)) {
                bulkMutation.mutate({ lead_ids: [...selectedIds], action: 'delete' });
              }
            }}
            className="flex items-center text-red-600 hover:text-red-800"
          >
            Delete
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-500 hover:text-gray-800 ml-auto">
            Clear
          </button>
        </div>
      )}

      {/* ── Table / Dashboard ─────────────────────────────────────────────────────── */}
      {view === 'dashboard' ? (
        <RawLeadsDashboard />
      ) : view === 'list' ? (
        <div className="bg-white border border-gray-200 rounded-sm shadow-sm overflow-x-auto min-h-[500px]">
          {isError ? (
            <div className="flex items-center justify-center gap-2 py-16 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <span>Failed to load leads. <button onClick={() => refetch()} className="underline">Retry</button></span>
            </div>
          ) : (
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold">
                <tr>
                  <th className="px-3 py-3 w-8">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={leads.length > 0 && selectedIds.size === leads.length}
                      onChange={e => handleSelectAll(e.target.checked)}
                    />
                  </th>
                  <th className="px-2 py-3 w-8" />
                  <th className="px-4 py-3 min-w-[160px]">Customer</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Stage</th>
                  <th className="px-4 py-3 text-right">Potential</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Since</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Next F/U</th>
                  <th className="px-4 py-3 min-w-[180px]">Notes</th>
                  <th className="px-4 py-3 w-16" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  // Skeleton rows
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 15 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-16 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-gray-300" />
                        <span>No leads found. <Link href="/crm/new" className="text-blue-600 hover:underline">Add the first one</Link></span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead: Lead) => (
                    <tr key={lead.id} className={`hover:bg-gray-50 group ${selectedIds.has(lead.id) ? 'bg-blue-50' : ''}`}>
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={selectedIds.has(lead.id)}
                          onChange={e => handleSelectOne(lead.id, e.target.checked)}
                        />
                      </td>
                      <td className="px-2 py-3">
                        <button onClick={() => starMutation.mutate(lead.id)}>
                          {lead.is_starred
                            ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            : <Star className="w-4 h-4 text-gray-300 hover:text-yellow-400" />
                          }
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/crm/${lead.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                          {lead.full_name}
                        </Link>
                        {lead.company_name && (
                          <div className="text-xs text-gray-400">{lead.company_name}</div>
                        )}
                        {lead.priority !== 'medium' && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${priorityBadge(lead.priority)}`}>
                            {lead.priority}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a href={`tel:${lead.mobile}`} className="text-gray-700 hover:text-blue-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {lead.mobile}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">
                        {lead.email ? (
                          <a href={`mailto:${lead.email}`} className="hover:text-blue-600 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> <span className="truncate">{lead.email}</span>
                          </a>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{lead.city || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{lead.source_name || '—'}</td>
                      <td className="px-4 py-3">
                        {lead.stage_name ? (
                          <span
                            className="text-xs px-2 py-1 rounded-full text-white font-medium"
                            style={{ backgroundColor: lead.stage_color || '#6b7280' }}
                          >
                            {lead.stage_name}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-800">
                        {lead.estimated_value > 0 ? formatCurrency(lead.estimated_value) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(lead.lead_score)}`}>
                          {lead.lead_score}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(lead.created_at)}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{lead.assigned_to_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {lead.next_followup_date || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[180px] truncate">
                        {lead.requirements || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearFollowupMutation.mutate(lead.id);
                            }}
                            className="p-1.5 bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] rounded hover:bg-[#c8e6c9] transition-colors"
                            title="Mark Appointment Done"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              clearFollowupMutation.mutate(lead.id);
                            }}
                            className="p-1.5 bg-[#ffebee] text-[#c62828] border border-[#ffcdd2] rounded hover:bg-[#ffcdd2] transition-colors"
                            title="Cancel Appointment"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <a
                            href={`https://wa.me/91${lead.mobile}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9] rounded hover:bg-[#c8e6c9] transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* ── Kanban View ────────────────────────────────────────────────── */
        <KanbanView stages={stages} filters={filters} />
      )}

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Per page */}
          <div className="flex space-x-1">
            {[10, 25, 50, 100].map(n => (
              <button
                key={n}
                onClick={() => setFilters(f => ({ ...f, page_size: n, page: 1 }))}
                className={`px-3 py-1.5 rounded text-sm border ${filters.page_size === n ? 'bg-[#162032] text-white border-[#162032]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Page nav */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">
              Page {filters.page} of {totalPages} ({totalCount} total)
            </span>
            <button
              disabled={(filters.page || 1) <= 1}
              onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) - 1 }))}
              className="p-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setFilters(f => ({ ...f, page }))}
                  className={`w-8 h-8 rounded text-sm border ${filters.page === page ? 'bg-[#162032] text-white border-[#162032]' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                  {page}
                </button>
              );
            })}
            <button
              disabled={(filters.page || 1) >= totalPages}
              onClick={() => setFilters(f => ({ ...f, page: (f.page || 1) + 1 }))}
              className="p-1.5 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      {/* Modals */}
      <LeadFiltersModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
        sources={sources}
        onOpenPeriodModal={() => {
          setShowFilters(false);
          setShowPeriodModal(true);
        }}
      />
      
      <PeriodModal 
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        filters={filters}
        onApply={(updates) => {
          setFilters(prev => ({ ...prev, ...updates }));
          setShowFilters(true); // Re-open filters modal after period is applied
        }}
      />
    </div>
  );
}

// ── Kanban View Sub-component ─────────────────────────────────────────────────

function KanbanView({ stages, filters }: { stages: LeadStage[]; filters: LeadFilters }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.filter(s => !s.is_lost).map(stage => (
        <div key={stage.id} className="min-w-[260px] flex flex-col gap-2">
          {/* Stage header */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-lg text-white font-medium text-sm"
            style={{ backgroundColor: stage.color }}
          >
            <span>{stage.name}</span>
            <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-xs">
              {stage.lead_count}
            </span>
          </div>

          {/* Cards */}
          <KanbanColumn stageId={stage.id} stageColor={stage.color} baseFilters={filters} />
        </div>
      ))}
    </div>
  );
}

function KanbanColumn({ stageId, stageColor, baseFilters }: {
  stageId: string; stageColor: string; baseFilters: LeadFilters;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['leads', { ...baseFilters, stage: stageId, page_size: 20 }],
    queryFn: () => leadsApi.list({ ...baseFilters, stage: stageId, page_size: 20 }),
    staleTime: 30_000,
  });
  const leads: Lead[] = (data?.data as any)?.data?.results || [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {leads.map((lead: Lead) => (
        <Link
          key={lead.id}
          href={`/crm/${lead.id}`}
          className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow block"
        >
          <div className="flex items-start justify-between mb-1">
            <span className="font-medium text-gray-900 text-sm">{lead.full_name}</span>
            {lead.is_starred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          </div>
          <div className="text-xs text-gray-500 mb-1">{lead.mobile}</div>
          {lead.company_name && <div className="text-xs text-gray-400 truncate">{lead.company_name}</div>}
          {lead.estimated_value > 0 && (
            <div className="text-xs font-semibold text-emerald-600 mt-1">
              ₹{lead.estimated_value.toLocaleString('en-IN')}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${scoreColor(lead.lead_score)}`}>
              {lead.lead_score}
            </span>
            {lead.next_followup_date && (
              <span className="text-xs text-gray-400">{lead.next_followup_date}</span>
            )}
          </div>
        </Link>
      ))}
      {leads.length === 0 && (
        <div className="text-center text-gray-400 text-xs py-4">No leads in this stage</div>
      )}
    </div>
  );
}

export default function CRMPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" /></div>}>
      <CRMContent />
    </Suspense>
  );
}
