/**
 * CRM API Service
 * ================
 * All API calls for the CRM module.
 * Uses the shared axios `api` instance (with cookie auth + interceptors).
 */

import api from '@/lib/api';
import type {
  Lead, LeadStage, LeadSource, LeadTag, LostReason,
  LeadCreatePayload, LeadUpdatePayload,
  LeadFollowup, LeadFollowupCreatePayload,
  Appointment, AppointmentCreatePayload,
  LeadNote, LeadAttachment, LeadAssignmentHistory, LeadTimelineEvent,
  CRMAnalytics, LeadFilters,
  PaginatedResponse, DuplicateCheckResult, BulkActionPayload, ImportResult,
  Reminder, ReminderCreatePayload, Quotation,
} from '@/interfaces/crm';

const BASE = '/crm';

// ── Helper to build query string from filters ────────────────────────────────

function buildParams(filters: LeadFilters): URLSearchParams {
  const p = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      p.set(key, String(val));
    }
  });
  return p;
}

// ── Pipeline Configuration ───────────────────────────────────────────────────

export const crmConfigApi = {
  getStages: () =>
    api.get<{ data: LeadStage[] }>(`${BASE}/stages/`),

  createStage: (data: Partial<LeadStage>) =>
    api.post<{ data: LeadStage }>(`${BASE}/stages/`, data),

  updateStage: (id: string, data: Partial<LeadStage>) =>
    api.patch<{ data: LeadStage }>(`${BASE}/stages/${id}/`, data),

  deleteStage: (id: string) =>
    api.delete(`${BASE}/stages/${id}/`),

  reorderStages: (stages: { id: string; sequence: number }[]) =>
    api.post(`${BASE}/stages/reorder/`, { stages }),

  seedDefaults: () =>
    api.post(`${BASE}/stages/seed-defaults/`),

  getSources: () =>
    api.get<{ data: LeadSource[] }>(`${BASE}/sources/`),

  createSource: (data: Partial<LeadSource>) =>
    api.post<{ data: LeadSource }>(`${BASE}/sources/`, data),

  getTags: () =>
    api.get<{ data: LeadTag[] }>(`${BASE}/tags/`),

  createTag: (data: Partial<LeadTag>) =>
    api.post<{ data: LeadTag }>(`${BASE}/tags/`, data),

  getLostReasons: () =>
    api.get<{ data: LostReason[] }>(`${BASE}/lost-reasons/`),

  createLostReason: (data: Partial<LostReason>) =>
    api.post<{ data: LostReason }>(`${BASE}/lost-reasons/`, data),
};

// ── Leads ───────────────────────────────────────────────────────────────────

export const leadsApi = {
  list: (filters: LeadFilters = {}) => {
    const params = buildParams(filters);
    return api.get<{ data: PaginatedResponse<Lead> }>(`${BASE}/leads/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: Lead }>(`${BASE}/leads/${id}/`),

  create: (data: LeadCreatePayload) =>
    api.post<{ data: Lead }>(`${BASE}/leads/`, data),

  getCommandCenter: (id: string) =>
    api.get<{ data: any }>(`${BASE}/leads/${id}/command-center/`),

  update: (id: string, data: LeadUpdatePayload) =>
    api.patch<{ data: Lead }>(`${BASE}/leads/${id}/`, data),

  updateStatus: (id: string, status: string) =>
    api.patch<{ data: Lead }>(`${BASE}/leads/${id}/`, { status }),

  delete: (id: string) =>
    api.delete(`${BASE}/leads/${id}/`),

  changeStage: (id: string, stageId: string, lostReasonId?: string, lostNotes?: string) =>
    api.post<{ data: Lead }>(`${BASE}/leads/${id}/stage/`, {
      stage_id: stageId,
      lost_reason: lostReasonId,
      lost_notes: lostNotes,
    }),

  assign: (id: string, employeeId: string, reason?: string) =>
    api.post<{ data: Lead }>(`${BASE}/leads/${id}/assign/`, {
      employee_id: employeeId,
      reason,
    }),

  toggleStar: (id: string) =>
    api.post<{ data: { is_starred: boolean } }>(`${BASE}/leads/${id}/star/`),

  checkDuplicate: (data: { mobile?: string; email?: string; company_name?: string }) =>
    api.post<{ data: DuplicateCheckResult }>(`${BASE}/leads/check-duplicate/`, data),

  convert: (id: string) =>
    api.post<{ data: { success: boolean; message: string; customer_id?: string } }>(
      `${BASE}/leads/${id}/convert/`
    ),

  bulk: (payload: BulkActionPayload) =>
    api.post(`${BASE}/leads/bulk/`, payload),

  export: (filters: LeadFilters = {}) => {
    const params = buildParams(filters);
    // Direct browser download
    window.open(`http://localhost:8000/api/v1/crm/leads/export/?${params}`, '_blank');
  },

  import: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ data: ImportResult }>(`${BASE}/leads/import/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── Follow-ups ───────────────────────────────────────────────────────────────

export const followupsApi = {
  list: (leadId: string) =>
    api.get<{ data: LeadFollowup[] }>(`${BASE}/leads/${leadId}/followups/`),

  create: (leadId: string, data: LeadFollowupCreatePayload) =>
    api.post<{ data: LeadFollowup }>(`${BASE}/leads/${leadId}/followups/`, data),

  complete: (leadId: string, followupId: string) =>
    api.post<{ data: LeadFollowup }>(`${BASE}/leads/${leadId}/followups/${followupId}/complete/`),

  delete: (leadId: string, followupId: string) =>
    api.delete(`${BASE}/leads/${leadId}/followups/${followupId}/`),
};

// ── Appointments ─────────────────────────────────────────────────────────────

export const appointmentsApi = {
  list: (leadId: string) =>
    api.get<{ data: Appointment[] }>(`${BASE}/leads/${leadId}/appointments/`),

  create: (leadId: string, data: AppointmentCreatePayload) =>
    api.post<{ data: Appointment }>(`${BASE}/leads/${leadId}/appointments/`, data),

  update: (leadId: string, apptId: string, data: Partial<AppointmentCreatePayload>) =>
    api.patch<{ data: Appointment }>(`${BASE}/leads/${leadId}/appointments/${apptId}/`, data),

  delete: (leadId: string, apptId: string) =>
    api.delete(`${BASE}/leads/${leadId}/appointments/${apptId}/`),

  complete: (leadId: string, apptId: string, payload: { outcome: string, remarks: string }) =>
    api.post<{ data: Appointment }>(`${BASE}/leads/${leadId}/appointments/${apptId}/complete/`, payload),

  cancel: (leadId: string, apptId: string) =>
    api.post<{ data: Appointment }>(`${BASE}/leads/${leadId}/appointments/${apptId}/cancel/`),

  reschedule: (leadId: string, apptId: string, startTime: string, endTime?: string) =>
    api.post<{ data: Appointment }>(`${BASE}/leads/${leadId}/appointments/${apptId}/reschedule/`, { start_time: startTime, end_time: endTime }),
};

// ── Notes ────────────────────────────────────────────────────────────────────

export const notesApi = {
  list: (leadId: string) =>
    api.get<{ data: LeadNote[] }>(`${BASE}/leads/${leadId}/notes/`),

  create: (leadId: string, text: string, pinned = false) =>
    api.post<{ data: LeadNote }>(`${BASE}/leads/${leadId}/notes/`, { text, pinned }),

  update: (leadId: string, noteId: string, text: string, pinned = false) =>
    api.patch<{ data: LeadNote }>(`${BASE}/leads/${leadId}/notes/${noteId}/`, { text, pinned }),

  delete: (leadId: string, noteId: string) =>
    api.delete(`${BASE}/leads/${leadId}/notes/${noteId}/`),
};

// ── Attachments ───────────────────────────────────────────────────────────────

export const attachmentsApi = {
  list: (leadId: string) =>
    api.get<{ data: LeadAttachment[] }>(`${BASE}/leads/${leadId}/attachments/`),

  upload: (leadId: string, file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post<{ data: LeadAttachment }>(`${BASE}/leads/${leadId}/attachments/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  delete: (leadId: string, attachmentId: string) =>
    api.delete(`${BASE}/leads/${leadId}/attachments/${attachmentId}/`),
};

// ── Timeline ─────────────────────────────────────────────────────────────────

export const timelineApi = {
  get: (leadId: string) =>
    api.get<{ data: LeadTimelineEvent[] }>(`${BASE}/leads/${leadId}/timeline/`),
};

export const assignmentHistoryApi = {
  get: (leadId: string) =>
    api.get<{ data: LeadAssignmentHistory[] }>(`${BASE}/leads/${leadId}/assignment-history/`),
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const analyticsApi = {
  get: () =>
    api.get<{ data: CRMAnalytics }>(`${BASE}/analytics/`),

  dashboard: () =>
    api.get(`${BASE}/dashboard/`),
};

// ── Reminders ────────────────────────────────────────────────────────────────

export const remindersApi = {
  list: (leadId: string) =>
    api.get<{ data: Reminder[] }>(`${BASE}/leads/${leadId}/reminders/`),

  create: (leadId: string, data: ReminderCreatePayload) =>
    api.post<{ data: Reminder }>(`${BASE}/leads/${leadId}/reminders/`, data),

  update: (leadId: string, reminderId: string, data: Partial<ReminderCreatePayload>) =>
    api.patch<{ data: Reminder }>(`${BASE}/leads/${leadId}/reminders/${reminderId}/`, data),

  delete: (leadId: string, reminderId: string) =>
    api.delete(`${BASE}/leads/${leadId}/reminders/${reminderId}/`),

  complete: (leadId: string, reminderId: string) =>
    api.post<{ data: Reminder }>(`${BASE}/leads/${leadId}/reminders/${reminderId}/complete/`),

  cancel: (leadId: string, reminderId: string) =>
    api.post<{ data: Reminder }>(`${BASE}/leads/${leadId}/reminders/${reminderId}/cancel/`),
};

// ── Quotations ────────────────────────────────────────────────

export const quotationsApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<Quotation> }>(`${BASE}/quotations/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: Quotation }>(`${BASE}/quotations/${id}/`),

  create: (data: Partial<Quotation>) =>
    api.post<{ data: Quotation }>(`${BASE}/quotations/`, data),

  update: (id: string, data: Partial<Quotation>) =>
    api.patch<{ data: Quotation }>(`${BASE}/quotations/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/quotations/${id}/`),
};

// ── Orders ───────────────────────────────────────────────────

export const ordersApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<any> }>(`${BASE}/orders/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: any }>(`${BASE}/orders/${id}/`),

  create: (data: Partial<any>) =>
    api.post<{ data: any }>(`${BASE}/orders/`, data),

  update: (id: string, data: Partial<any>) =>
    api.patch<{ data: any }>(`${BASE}/orders/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/orders/${id}/`),
};


