'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Edit3, Phone, Mail, Copy, Plus, Trash2, Check, Bell, User, Calendar, X,
  FileText, MessageCircle, Star, Paperclip, ArrowRight, CheckCircle2, AlertCircle,
  Building2, MapPin, Link as LinkIcon, DollarSign, Tag, HelpCircle, Loader2
} from 'lucide-react';
import {
  leadsApi, followupsApi, appointmentsApi, notesApi, attachmentsApi, crmConfigApi
} from '@/services/crmService';
import { usersApi } from '@/services/userService';
import type { Lead, LeadStage, Appointment, LeadFollowup, LeadNote, LeadAttachment } from '@/interfaces/crm';
import LeadEditModal from './components/LeadEditModal';


function formatCurrency(val: number | string | undefined | null): string {
  const num = Number(val);
  if (isNaN(num) || val == null) return '-';
  if (num >= 10_00_000) return `₹${(num / 10_00_000).toFixed(1)}L`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
  if (num >= 1_000) return `₹${(num / 1_00_000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
}

export default function LeadCommandCenterPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── Modal / Dialog States ──────────────────────────────────────────────────
  const [isEditContactOpen, setIsEditContactOpen] = useState(false);
  const [isPlusContactOpen, setIsPlusContactOpen] = useState(false);
  const [isEditOpportunityOpen, setIsEditOpportunityOpen] = useState(false);
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isInteractionOpen, setIsInteractionOpen] = useState(false);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  
  // Edit forms local state
  const [contactForm, setContactForm] = useState({
    first_name: '', last_name: '', company_name: '', mobile: '', email: '',
    address: '', city: '', state: '', country: 'India', pincode: ''
  });
  const [plusContactForm, setPlusContactForm] = useState({
    secondary_email: '', alternate_contact: '', website: '', gst_number: '', pan_number: '',
    twitter: '', linkedin: '', facebook: ''
  });
  const [opportunityForm, setOpportunityForm] = useState({
    source: '', estimated_value: 0, requirements: '', lost_notes: '', priority: 'medium', probability: 50
  });
  const [interactionForm, setInteractionForm] = useState({
    followup_type: 'call', notes: '', duration: '', outcome: '', next_followup_date: '',
    assigned_to: '', schedule_reminder: false, reminder_time: '', date: ''
  });
  const [reminderForm, setReminderForm] = useState({
    reminder_type: 'system', remind_when: 'tomorrow', custom_time: ''
  });

  // Appt reschedule
  const [rescheduleAppt, setRescheduleAppt] = useState<Appointment | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState('');

  // Premium Coming Soon Banner State
  const [comingSoonModule, setComingSoonModule] = useState<string | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: commandCenterRes, isLoading, isError } = useQuery({
    queryKey: ['lead-command-center', id],
    queryFn: () => leadsApi.getCommandCenter(id),
  });

  const { data: stagesResponse } = useQuery({
    queryKey: ['lead-stages'],
    queryFn: () => crmConfigApi.getStages(),
  });

  const { data: sourcesResponse } = useQuery({
    queryKey: ['lead-sources'],
    queryFn: () => crmConfigApi.getSources(),
  });

  const { data: employeesResponse } = useQuery({
    queryKey: ['employees'],
    queryFn: () => usersApi.listEmployees(),
  });

  const commandCenter = (commandCenterRes?.data as any)?.data || commandCenterRes?.data;
  const lead: Lead = commandCenter?.lead;
  const appointments: Appointment[] = commandCenter?.appointments || [];
  const followups: LeadFollowup[] = commandCenter?.followups || [];
  const notes: LeadNote[] = commandCenter?.notes || [];
  const timeline = commandCenter?.timeline || [];
  const history = commandCenter?.business_history || [];
  const attachments: LeadAttachment[] = commandCenter?.attachments || [];
  const scoreDetails = lead?.lead_score_details as any;

  const stages: LeadStage[] = (stagesResponse?.data as any)?.data?.results || (stagesResponse?.data as any)?.data || [];
  const sources = (sourcesResponse?.data as any)?.data?.results || (sourcesResponse?.data as any)?.data || [];
  let employeesData = (employeesResponse as any)?.data?.results || (employeesResponse as any)?.data?.data || (employeesResponse as any)?.data || [];
  const employees = Array.isArray(employeesData) ? employeesData : [];

  // ── Mutations ───────────────────────────────────────────────────────────
  const updateLeadMutation = useMutation({
    mutationFn: (payload: any) => leadsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditContactOpen(false);
      setIsPlusContactOpen(false);
      setIsEditOpportunityOpen(false);
      setIsStatusOpen(false);
      setIsReassignOpen(false);
    },
    onError: (err: any) => alert(err?.response?.data?.detail || 'Failed to update lead.')
  });

  const changeStageMutation = useMutation({
    mutationFn: (stageId: string) => leadsApi.changeStage(id, stageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    }
  });

  const assignLeadMutation = useMutation({
    mutationFn: ({ empId, reason }: { empId: string, reason?: string }) => leadsApi.assign(id, empId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsReassignOpen(false);
    }
  });

  const deleteLeadMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      router.push('/crm');
    }
  });

  const starMutation = useMutation({
    mutationFn: () => leadsApi.toggleStar(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] }),
  });

  // Notes
  const createNoteMutation = useMutation({
    mutationFn: (text: string) => notesApi.create(id, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] })
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, text }: { noteId: string, text: string }) => notesApi.update(id, noteId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] })
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) => notesApi.delete(id, noteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] })
  });

  // Attachments
  const uploadFileMutation = useMutation({
    mutationFn: (file: File) => attachmentsApi.upload(id, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] })
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId: string) => attachmentsApi.delete(id, fileId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] })
  });

  // Interactions / Followups
  const logInteractionMutation = useMutation({
    mutationFn: (payload: any) => followupsApi.create(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] });
      setIsInteractionOpen(false);
      setInteractionForm({
        followup_type: 'call', notes: '', duration: '', outcome: '', next_followup_date: '',
        assigned_to: '', schedule_reminder: false, reminder_time: '', date: ''
      });
    }
  });

  // Appointments
  const completeApptMutation = useMutation({
    mutationFn: ({ apptId, outcome, remarks }: any) => appointmentsApi.complete(id, apptId, { outcome, remarks }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] }),
  });

  const cancelApptMutation = useMutation({
    mutationFn: (apptId: string) => appointmentsApi.cancel(id, apptId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] }),
  });

  const rescheduleApptMutation = useMutation({
    mutationFn: ({ apptId, startTime }: { apptId: string, startTime: string }) => appointmentsApi.reschedule(id, apptId, startTime),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead-command-center', id] });
      setRescheduleAppt(null);
    }
  });

  // Helpers
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (isLoading) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-lg text-center flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#154360]" />
        <span>Loading Command Center...</span>
      </div>
    </div>
  );
  
  if (isError || !lead) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-lg text-center text-red-600 font-semibold">Failed to load Command Center.</div>
    </div>
  );

  const nextAppt = appointments.find(a => a.status === 'scheduled');
  const pastInteractions = followups.filter(f => f.status === 'completed');

  // Trigger modals
  const openEditContact = () => {
    setContactForm({
      first_name: lead.first_name,
      last_name: lead.last_name || '',
      company_name: lead.company_name || '',
      mobile: lead.mobile,
      email: lead.email || '',
      address: lead.address || '',
      city: lead.city || '',
      state: lead.state || '',
      country: lead.country || 'India',
      pincode: lead.pincode || ''
    });
    setIsEditContactOpen(true);
  };

  const openPlusContact = () => {
    setPlusContactForm({
      secondary_email: lead.secondary_email || '',
      alternate_contact: lead.alternate_contact || '',
      website: lead.website || '',
      gst_number: lead.gst_number || '',
      pan_number: lead.pan_number || '',
      twitter: (lead.social_links as any)?.twitter || '',
      linkedin: (lead.social_links as any)?.linkedin || '',
      facebook: (lead.social_links as any)?.facebook || ''
    });
    setIsPlusContactOpen(true);
  };

  const openEditOpportunity = () => {
    setOpportunityForm({
      source: lead.source?.id || '',
      estimated_value: lead.estimated_value || 0,
      requirements: lead.requirements || '',
      lost_notes: lead.lost_notes || '',
      priority: lead.priority || 'medium',
      probability: (lead as any).probability || 50
    });
    setIsEditOpportunityOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center pt-10 pb-10 overflow-y-auto font-sans">
      <div className="bg-[#f5f6f8] w-full max-w-[1200px] h-fit min-h-[600px] rounded-lg shadow-2xl flex flex-col relative overflow-hidden border border-gray-300">
        
        {/* Modal Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-bold text-[#2b3a4a] leading-none">{lead.full_name}</h1>
            <button onClick={openEditContact} className="text-[#154360] hover:text-[#0b2433] ml-1">
              <Edit3 className="w-[18px] h-[18px]" />
            </button>
            <button onClick={() => starMutation.mutate()} className="text-yellow-500 ml-1">
              <Star className={`w-5 h-5 ${lead.is_starred ? 'fill-yellow-400' : 'text-gray-300'}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/crm/new')}
              className="px-4 py-1.5 bg-white text-[#d68910] border border-[#d68910] rounded text-sm font-semibold hover:bg-orange-50"
            >
              New
            </button>
            <button 
              onClick={() => { if(confirm('Are you sure you want to delete this lead?')) deleteLeadMutation.mutate(); }}
              className="px-4 py-1.5 bg-[#922b21] text-white rounded text-sm font-semibold hover:bg-[#7b241c] flex items-center gap-2"
            >
              <Trash2 className="w-[14px] h-[14px]" /> Delete
            </button>
            <button onClick={() => router.push('/crm')} className="text-gray-500 hover:text-gray-800 ml-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stage Pipeline Header Bar */}
        <div className="bg-[#ebedf0] px-6 py-3 border-b border-gray-200 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-[700px]">
            {stages.map((stage) => {
              const isCurrent = lead.stage?.id === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    if (confirm(`Move lead to "${stage.name}" stage?`)) {
                      changeStageMutation.mutate(stage.id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    isCurrent 
                      ? 'bg-[#154360] text-white border-[#154360] shadow-sm'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {stage.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Contact Information */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-[16px] font-bold text-[#154360]">Contact Information</h3>
                <div className="flex gap-2">
                  <button onClick={openPlusContact} className="w-7 h-7 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433]">
                    <Plus className="w-4 h-4" />
                  </button>
                  <button onClick={openEditContact} className="w-7 h-7 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433]">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-3 bg-[#f2f4f4] border border-gray-200 rounded-t border-b-0">
                  <div className="p-2 text-[13px] font-bold text-[#2b3a4a]">Name</div>
                  <div className="p-2 text-[13px] font-bold text-[#2b3a4a]">Mobile</div>
                  <div className="p-2 text-[13px] font-bold text-[#2b3a4a]">Email</div>
                </div>
                <div className="grid grid-cols-3 bg-[#fdf2e9] border border-gray-200 rounded-b">
                  <div className="p-2 text-[13px] text-gray-800 break-words">
                    {lead.full_name}
                    {lead.company_name && <div className="text-xs text-gray-500 font-semibold mt-1">{lead.company_name}</div>}
                  </div>
                  <div className="p-2 text-[13px] text-gray-800 flex flex-col gap-1">
                    <span>{lead.mobile}</span>
                    {lead.alternate_mobile && <span className="text-xs text-gray-500">Alt: {lead.alternate_mobile}</span>}
                    <div className="flex items-center gap-2">
                      <a href={`https://wa.me/91${lead.mobile}`} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                        </svg>
                      </a>
                      <a href={`tel:${lead.mobile}`} className="text-[#154360] hover:text-[#0b2433]">
                        <Phone className="w-4 h-4" />
                      </a>
                      <button onClick={() => copyToClipboard(lead.mobile)} className="text-gray-500 hover:text-gray-800">
                        <Copy className="w-[14px] h-[14px]" />
                      </button>
                    </div>
                  </div>
                  <div className="p-2 text-[13px] text-gray-800 flex flex-col gap-1 break-words">
                    <span>{lead.email || '-'}</span>
                    {lead.secondary_email && <span className="text-xs text-gray-500 font-semibold">{lead.secondary_email}</span>}
                    {lead.email && (
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${lead.email}`} className="text-[#154360] hover:text-[#0b2433]">
                          <Mail className="w-4 h-4" />
                        </a>
                        <button onClick={() => copyToClipboard(lead.email || '')} className="text-gray-500 hover:text-gray-800">
                          <Copy className="w-[14px] h-[14px]" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Opportunity */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-[16px] font-bold text-[#154360]">Business Opportunity</h3>
                <button onClick={openEditOpportunity} className="w-7 h-7 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433]">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="px-3 py-2 border border-gray-200 rounded w-fit text-[13px] text-gray-700 bg-[#fbfcfc]">
                  Received on <span className="font-bold">{new Date(lead.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span> from <span className="font-bold">{lead.source?.name || 'Manual'}</span>
                </div>
                {lead.requirements && (
                  <div className="px-3 py-2 border border-gray-200 rounded w-fit text-[13px] text-gray-700 bg-[#fbfcfc]">
                    Needs: {lead.requirements}
                  </div>
                )}
                <div className="px-3 py-2 border border-gray-200 rounded w-fit text-[13px] text-gray-700 bg-[#fbfcfc]">
                  Value: <span className="font-bold">₹{parseFloat(lead.estimated_value as any).toLocaleString('en-IN')}</span>
                </div>
                <div className="px-3 py-2 border border-gray-200 rounded w-fit text-[13px] text-gray-700 bg-[#fbfcfc]">
                  Priority: <span className="font-bold capitalize">{lead.priority}</span>
                </div>
                {lead.lost_notes && (
                  <div className="px-3 py-2 border border-gray-200 rounded w-fit text-[13px] text-gray-700 bg-[#fbfcfc]">
                    Notes: {lead.lost_notes}
                  </div>
                )}
              </div>
            </div>

            {/* Documents & Attachments Card */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <h3 className="text-[16px] font-bold text-[#154360]">Documents & Attachments</h3>
                <label className="w-7 h-7 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433] cursor-pointer">
                  <Plus className="w-4 h-4" />
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if(file) uploadFileMutation.mutate(file);
                    }}
                  />
                </label>
              </div>
              <div className="p-4 flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                {attachments.length > 0 ? attachments.map((file) => (
                  <div key={file.id} className="flex justify-between items-center border border-gray-100 p-2 rounded bg-gray-50 text-[13px]">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                      <a 
                        href={`http://localhost:8000/media/${file.file_path}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-[#154360] hover:underline truncate"
                      >
                        {file.file_name}
                      </a>
                    </div>
                    <button 
                      onClick={() => { if(confirm('Delete this file?')) deleteFileMutation.mutate(file.id); }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 text-[13px] py-4">No attachments uploaded yet.</div>
                )}
              </div>
            </div>

            {/* Lead Score Card */}
            {scoreDetails && (
              <div className="bg-white rounded border border-gray-200 shadow-sm p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[15px] font-bold text-[#154360]">Lead Score Details</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    scoreDetails.category === 'Hot' ? 'bg-red-100 text-red-700' :
                    scoreDetails.category === 'Warm' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {scoreDetails.category} ({scoreDetails.score}%)
                  </span>
                </div>
                {scoreDetails.reasons && (
                  <div className="text-xs flex flex-col gap-1.5">
                    {scoreDetails.reasons.positive?.map((r: string, idx: number) => (
                      <div key={idx} className="text-green-700 flex items-center gap-1">✓ {r}</div>
                    ))}
                    {scoreDetails.reasons.negative?.map((r: string, idx: number) => (
                      <div key={idx} className="text-red-700 flex items-center gap-1">✗ {r}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* Actions Card */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-[16px] font-bold text-[#154360]">Actions</h3>
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setIsReassignOpen(true)}
                    className="px-4 py-2 bg-[#154360] text-white rounded text-[13px] font-semibold flex items-center gap-2 hover:bg-[#0b2433]"
                  >
                    <User className="w-[14px] h-[14px]" /> Reassign
                  </button>
                  <button 
                    onClick={() => setIsStatusOpen(true)}
                    className="px-4 py-2 bg-[#154360] text-white rounded text-[13px] font-semibold flex items-center gap-2 hover:bg-[#0b2433]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path><path d="M3 22v-6h6"></path><path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path></svg> 
                    Update Status
                  </button>
                  <button onClick={() => setComingSoonModule('Quotation')} className="px-4 py-2 bg-[#1d8348] text-white rounded text-[13px] font-semibold hover:bg-[#145a32]">+ Quote</button>
                  <button onClick={() => setComingSoonModule('Proforma Invoice')} className="px-4 py-2 bg-[#1d8348] text-white rounded text-[13px] font-semibold hover:bg-[#145a32]">+ PI</button>
                  <button onClick={() => setComingSoonModule('Sales Order')} className="px-4 py-2 bg-[#1d8348] text-white rounded text-[13px] font-semibold hover:bg-[#145a32]">+ Order</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setComingSoonModule('Invoice')} className="px-4 py-2 bg-[#1d8348] text-white rounded text-[13px] font-semibold hover:bg-[#145a32]">+ Invoice</button>
                  <button 
                    onClick={() => setComingSoonModule('Business History details')}
                    className="px-4 py-2 bg-[#1d8348] text-white rounded text-[13px] font-semibold flex items-center gap-2 hover:bg-[#145a32]"
                  >
                    <FileText className="w-[14px] h-[14px]" /> Business History
                  </button>
                </div>
              </div>
            </div>

            {/* Coming Soon Alert Message Box */}
            {comingSoonModule && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div className="text-[13px] text-yellow-800">
                    <span className="font-bold">{comingSoonModule} Module</span> is currently Coming Soon! Clicking this button will automatically open Quotes/PI once constructed.
                  </div>
                </div>
                <button onClick={() => setComingSoonModule(null)} className="text-yellow-600 hover:text-yellow-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Business Interactions Section */}
            <div className="mt-2">
              <div className="flex justify-between items-center mb-2 px-1">
                <h3 className="text-[16px] font-bold text-[#154360]">Business Interactions</h3>
                <span className="text-[13px] text-gray-700">Assigned to <span className="font-bold">{lead.assigned_to_name || 'Unassigned'}</span></span>
              </div>

              <div className="flex flex-col gap-4">
                
                {/* Next Appointment Card */}
                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-[#fbfcfc] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-[14px] font-bold text-gray-800">
                      Next Appointment {nextAppt ? `(${nextAppt.type_display})` : '(None)'}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          if(!nextAppt) return alert('No upcoming appointment to complete');
                          const outcome = prompt('Enter meeting outcome:');
                          if(outcome) completeApptMutation.mutate({ apptId: nextAppt.id, outcome, remarks: '' });
                        }}
                        className={`px-3 py-1 text-white rounded text-[12px] font-semibold flex items-center gap-1.5 ${nextAppt ? 'bg-[#1d8348] hover:bg-[#145a32]' : 'bg-gray-300 cursor-not-allowed'}`}
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Done
                      </button>
                      {nextAppt && (
                        <>
                          <button 
                            onClick={() => { if(confirm('Cancel this appointment?')) cancelApptMutation.mutate(nextAppt.id); }}
                            className="w-7 h-7 bg-[#922b21] text-white rounded flex items-center justify-center hover:bg-[#7b241c]"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setRescheduleAppt(nextAppt);
                              setRescheduleTime(nextAppt.start_time.split('Z')[0]);
                            }}
                            className="w-7 h-7 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433]"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex justify-between items-center text-[13px] text-gray-700">
                    <div>
                      {nextAppt ? (
                        <>
                          <span>{new Date(nextAppt.start_time).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          <span className="mx-2">-</span>
                          <span>{nextAppt.title || 'Nothing'}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">No scheduled appointments.</span>
                      )}
                    </div>
                    {nextAppt && (
                      <div className="flex items-center gap-1.5 font-semibold">
                        <User className="w-3.5 h-3.5" /> {nextAppt.assigned_to_name || lead.assigned_to_name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactions Card */}
                <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden mb-6">
                  <div className="bg-[#fbfcfc] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-[14px] font-bold text-gray-800">Interactions</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsReminderOpen(true)}
                        className="w-8 h-8 bg-[#154360] text-white rounded flex items-center justify-center hover:bg-[#0b2433]"
                      >
                        <Bell className="w-4 h-4 fill-white" />
                      </button>
                      <button 
                        onClick={() => setIsInteractionOpen(true)}
                        className="px-4 py-1 bg-[#154360] text-white rounded text-[13px] font-semibold flex items-center gap-1.5 hover:bg-[#0b2433]"
                      >
                        <Plus className="w-4 h-4" /> Enter Interaction
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#f8f9f9]">
                    <div className="flex flex-col gap-3 h-[300px] overflow-y-auto">
                      {pastInteractions.length > 0 ? pastInteractions.map((evt: any) => (
                        <div key={evt.id} className="bg-white border border-gray-200 rounded p-3 shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[12px] font-bold text-gray-500">
                              {evt.completed_by_name} - {evt.followup_type_display}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(evt.date || evt.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                          <div className="text-[13px] text-gray-800 whitespace-pre-wrap">
                            {evt.notes || 'Logged an interaction.'}
                          </div>
                          {evt.duration && <div className="text-xs text-gray-400 mt-2">Duration: {evt.duration} mins | Outcome: {evt.outcome || 'N/A'}</div>}
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-400 text-sm">No recent interactions found.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Note & Versions Feed */}
            <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden p-4 mb-10">
              <h4 className="text-[16px] font-bold text-[#154360] mb-3">Notes & Version History</h4>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.target as any;
                  const text = target.noteText.value.trim();
                  if(text) {
                    createNoteMutation.mutate(text);
                    target.noteText.value = '';
                  }
                }}
                className="flex gap-2 mb-4"
              >
                <input 
                  name="noteText" 
                  type="text" 
                  placeholder="Type a note and press enter..." 
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm outline-none focus:border-[#154360]"
                />
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded text-sm font-semibold hover:bg-[#0b2433]">Add</button>
              </form>
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="border-b border-gray-100 pb-3 text-[13px]">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-700">{n.created_by_name || 'User'}</span>
                      <div className="flex gap-2 text-xs text-gray-400">
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                        <button 
                          onClick={() => {
                            const newText = prompt('Edit note:', n.text);
                            if(newText) updateNoteMutation.mutate({ noteId: n.id, text: newText });
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => { if(confirm('Delete note?')) deleteNoteMutation.mutate(n.id); }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-800">{n.text}</p>
                    {n.history && n.history.length > 0 && (
                      <div className="mt-2 pl-3 border-l-2 border-gray-200 text-xs text-gray-500">
                        <div className="font-semibold mb-1">Version history:</div>
                        {n.history.map((h: any, idx: number) => (
                          <div key={idx} className="mb-1">
                            "{h.text}" - updated by {h.updated_by} on {new Date(h.updated_at).toLocaleDateString()}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── MODAL DIALOGS ────────────────────────────────────────────────────── */}

      {/* Edit Contact Info Modal */}
      {isEditContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Edit Contact Details</h3>
              <button onClick={() => setIsEditContactOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateLeadMutation.mutate(contactForm);
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">First Name</label>
                  <input required value={contactForm.first_name} onChange={e=>setContactForm({...contactForm, first_name: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Last Name</label>
                  <input value={contactForm.last_name} onChange={e=>setContactForm({...contactForm, last_name: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Company Name</label>
                <input value={contactForm.company_name} onChange={e=>setContactForm({...contactForm, company_name: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Mobile</label>
                  <input required value={contactForm.mobile} onChange={e=>setContactForm({...contactForm, mobile: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Email</label>
                  <input type="email" value={contactForm.email} onChange={e=>setContactForm({...contactForm, email: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Address</label>
                <textarea rows={2} value={contactForm.address} onChange={e=>setContactForm({...contactForm, address: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-gray-600 mb-1">City</label>
                  <input value={contactForm.city} onChange={e=>setContactForm({...contactForm, city: e.target.value})} className="w-full px-2 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">State</label>
                  <input value={contactForm.state} onChange={e=>setContactForm({...contactForm, state: e.target.value})} className="w-full px-2 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 mb-1">Pincode</label>
                  <input value={contactForm.pincode} onChange={e=>setContactForm({...contactForm, pincode: e.target.value})} className="w-full px-2 py-2 border rounded" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsEditContactOpen(false)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plus (Extended Contact details) Modal */}
      {isPlusContactOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Extended & Tax Details</h3>
              <button onClick={() => setIsPlusContactOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateLeadMutation.mutate({
                  ...plusContactForm,
                  social_links: {
                    twitter: plusContactForm.twitter,
                    linkedin: plusContactForm.linkedin,
                    facebook: plusContactForm.facebook
                  }
                });
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">GSTIN</label>
                  <input value={plusContactForm.gst_number} onChange={e=>setPlusContactForm({...plusContactForm, gst_number: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">PAN</label>
                  <input value={plusContactForm.pan_number} onChange={e=>setPlusContactForm({...plusContactForm, pan_number: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Secondary Email</label>
                  <input type="email" value={plusContactForm.secondary_email} onChange={e=>setPlusContactForm({...plusContactForm, secondary_email: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Alt Phone Contact</label>
                  <input value={plusContactForm.alternate_contact} onChange={e=>setPlusContactForm({...plusContactForm, alternate_contact: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Website</label>
                <input type="url" value={plusContactForm.website} onChange={e=>setPlusContactForm({...plusContactForm, website: e.target.value})} className="w-full px-3 py-2 border rounded focus:border-[#154360] outline-none" />
              </div>
              <div className="border-t pt-3 mt-1">
                <span className="font-bold text-gray-700 block mb-2 text-xs uppercase">Social Media Handles</span>
                <div className="grid grid-cols-3 gap-2">
                  <input placeholder="Twitter" value={plusContactForm.twitter} onChange={e=>setPlusContactForm({...plusContactForm, twitter: e.target.value})} className="px-2 py-1.5 border rounded text-xs" />
                  <input placeholder="LinkedIn" value={plusContactForm.linkedin} onChange={e=>setPlusContactForm({...plusContactForm, linkedin: e.target.value})} className="px-2 py-1.5 border rounded text-xs" />
                  <input placeholder="Facebook" value={plusContactForm.facebook} onChange={e=>setPlusContactForm({...plusContactForm, facebook: e.target.value})} className="px-2 py-1.5 border rounded text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsPlusContactOpen(false)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Opportunity Info Modal */}
      {isEditOpportunityOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Edit Business Opportunity</h3>
              <button onClick={() => setIsEditOpportunityOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                updateLeadMutation.mutate(opportunityForm);
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Lead Source</label>
                  <select value={opportunityForm.source} onChange={e=>setOpportunityForm({...opportunityForm, source: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]">
                    <option value="">Select Source</option>
                    {sources.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Est. Value (INR)</label>
                  <input type="number" required value={opportunityForm.estimated_value} onChange={e=>setOpportunityForm({...opportunityForm, estimated_value: parseFloat(e.target.value) || 0})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Priority</label>
                  <select value={opportunityForm.priority} onChange={e=>setOpportunityForm({...opportunityForm, priority: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Probability (%)</label>
                  <input type="number" min="0" max="100" value={opportunityForm.probability} onChange={e=>setOpportunityForm({...opportunityForm, probability: parseInt(e.target.value) || 50})} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Requirements</label>
                <textarea rows={3} value={opportunityForm.requirements} onChange={e=>setOpportunityForm({...opportunityForm, requirements: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsEditOpportunityOpen(false)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reassign Modal */}
      <LeadEditModal 
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        lead={lead}
        employees={employees}
        stages={stages}
        sources={sources}
        onSubmit={(data) => {
          if (data.stage_id && data.stage_id !== lead.stage?.id) {
            changeStageMutation.mutate(data.stage_id);
          }
          const { source_id, stage_id, ...payload } = data;
          updateLeadMutation.mutate({
            ...payload,
            source: source_id || null,
            assigned_to: data.assigned_to || null,
          });
        }}
        isLoading={updateLeadMutation.isPending}
      />

      {/* Update Status Modal */}
      {isStatusOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Update Lead Status</h3>
              <button onClick={() => setIsStatusOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {[
                { key: 'open', label: 'Open' },
                { key: 'contacted', label: 'Contacted' },
                { key: 'qualified', label: 'Qualified' },
                { key: 'follow_up', label: 'Follow-up' },
                { key: 'won', label: 'Won' },
                { key: 'lost', label: 'Lost' },
                { key: 'archived', label: 'Archived' },
              ].map(st => (
                <button
                  key={st.key}
                  onClick={() => updateLeadMutation.mutate({ status: st.key })}
                  className={`w-full text-left px-4 py-3 rounded text-[13px] font-semibold border hover:bg-gray-50 ${lead.status === st.key ? 'border-[#154360] text-[#154360] bg-blue-50/50' : 'border-gray-200 text-gray-700'}`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Enter Interaction Modal */}
      {isInteractionOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Log Interaction / Follow-up</h3>
              <button onClick={() => setIsInteractionOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                logInteractionMutation.mutate({
                  ...interactionForm,
                  duration: parseInt(interactionForm.duration) || null,
                  date: interactionForm.date ? new Date(interactionForm.date).toISOString() : undefined,
                  reminder_time: interactionForm.reminder_time ? new Date(interactionForm.reminder_time).toISOString() : undefined
                });
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Interaction Type</label>
                  <select value={interactionForm.followup_type} onChange={e=>setInteractionForm({...interactionForm, followup_type: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]">
                    <option value="call">Phone Call</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="office_meeting">Office Meeting</option>
                    <option value="site_visit">Site Visit</option>
                    <option value="video_call">Video Call</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Interaction Date & Time</label>
                  <input type="datetime-local" value={interactionForm.date} onChange={e=>setInteractionForm({...interactionForm, date: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Duration (minutes)</label>
                  <input type="number" placeholder="e.g. 15" value={interactionForm.duration} onChange={e=>setInteractionForm({...interactionForm, duration: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Outcome</label>
                  <input placeholder="e.g. Connected / Left Voicemail" value={interactionForm.outcome} onChange={e=>setInteractionForm({...interactionForm, outcome: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              </div>
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Remarks / Conversation Notes</label>
                <textarea rows={3} required value={interactionForm.notes} onChange={e=>setInteractionForm({...interactionForm, notes: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]" />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t pt-3 mt-1">
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Schedule Next Follow-up</label>
                  <input type="date" value={interactionForm.next_followup_date} onChange={e=>setInteractionForm({...interactionForm, next_followup_date: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Assigned Employee</label>
                  <select value={interactionForm.assigned_to} onChange={e=>setInteractionForm({...interactionForm, assigned_to: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]">
                    <option value="">Lead Owner (Default)</option>
                    {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="checkbox" 
                  id="sched_rem" 
                  checked={interactionForm.schedule_reminder} 
                  onChange={e=>setInteractionForm({...interactionForm, schedule_reminder: e.target.checked})} 
                />
                <label htmlFor="sched_rem" className="text-gray-600 font-semibold">Enable reminder alert notification</label>
              </div>
              {interactionForm.schedule_reminder && (
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Reminder Alert Time</label>
                  <input type="datetime-local" required value={interactionForm.reminder_time} onChange={e=>setInteractionForm({...interactionForm, reminder_time: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsInteractionOpen(false)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Save Interaction</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Reschedule Appointment</h3>
              <button onClick={() => setRescheduleAppt(null)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                rescheduleApptMutation.mutate({
                  apptId: rescheduleAppt.id,
                  startTime: new Date(rescheduleTime).toISOString()
                });
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div>
                <label className="block text-gray-600 font-semibold mb-1">New Date & Time</label>
                <input 
                  type="datetime-local" 
                  required 
                  value={rescheduleTime} 
                  onChange={e => setRescheduleTime(e.target.value)} 
                  className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setRescheduleAppt(null)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Reschedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bell Notification Alert Modal */}
      {isReminderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full overflow-hidden border border-gray-300">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-[#154360]">Schedule Quick Reminder</h3>
              <button onClick={() => setIsReminderOpen(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                let alertStr = '';
                if(reminderForm.remind_when === 'tomorrow') alertStr = 'Tomorrow';
                else if(reminderForm.remind_when === 'next_week') alertStr = 'Next Week';
                else alertStr = reminderForm.custom_time;

                alert(`Reminder successfully scheduled for ${alertStr}`);
                setIsReminderOpen(false);
              }}
              className="p-6 flex flex-col gap-4 text-sm"
            >
              <div>
                <label className="block text-gray-600 font-semibold mb-1">Remind Me</label>
                <select value={reminderForm.remind_when} onChange={e=>setReminderForm({...reminderForm, remind_when: e.target.value})} className="w-full px-3 py-2 border rounded outline-none focus:border-[#154360]">
                  <option value="tomorrow">Tomorrow Morning (9:00 AM)</option>
                  <option value="next_week">Next Week</option>
                  <option value="custom">Custom Date & Time</option>
                </select>
              </div>
              {reminderForm.remind_when === 'custom' && (
                <div>
                  <label className="block text-gray-600 font-semibold mb-1">Pick Date & Time</label>
                  <input type="datetime-local" required value={reminderForm.custom_time} onChange={e=>setReminderForm({...reminderForm, custom_time: e.target.value})} className="w-full px-3 py-2 border rounded" />
                </div>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setIsReminderOpen(false)} className="px-4 py-2 border rounded font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[#154360] text-white rounded font-semibold hover:bg-[#0b2433]">Set Reminder</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

