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
  Reminder, ReminderCreatePayload, Quotation, ProductCatalog, Invoice, PurchaseOrder,
  Customer, CustomerCreatePayload, CustomerUpdatePayload,
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
    return api.post<{ data: ImportResult }>(`${BASE}/leads/import/`, fd);
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

export const debitNotesApi = {
  list: () => api.get(`${BASE}/debit-notes/`),
  create: (data: Record<string, unknown>) => api.post(`${BASE}/debit-notes/`, data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`${BASE}/debit-notes/${id}/`, data),
};

// ── Products Catalog ────────────────────────────────────────

export const productsApi = {
  list: (params?: { search?: string; item_type?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    if (params?.search) p.set('search', params.search);
    if (params?.item_type) p.set('item_type', params.item_type);
    if (params?.page) p.set('page', String(params.page));
    if (params?.page_size) p.set('page_size', String(params.page_size));
    return api.get<{ data: PaginatedResponse<ProductCatalog> }>(`${BASE}/products/?${p}`);
  },

  get: (id: string) =>
    api.get<{ data: ProductCatalog }>(`${BASE}/products/${id}/`),

  create: (data: Partial<ProductCatalog>) =>
    api.post<{ data: ProductCatalog }>(`${BASE}/products/`, data),

  update: (id: string, data: Partial<ProductCatalog>) =>
    api.patch<{ data: ProductCatalog }>(`${BASE}/products/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/products/${id}/`),
};

// ── Invoices ──────────────────────────────────────────────────

export const invoicesApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<Invoice> }>(`${BASE}/invoices/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: Invoice }>(`${BASE}/invoices/${id}/`),

  create: (data: Partial<Invoice>) =>
    api.post<{ data: Invoice }>(`${BASE}/invoices/`, data),

  update: (id: string, data: Partial<Invoice>) =>
    api.patch<{ data: Invoice }>(`${BASE}/invoices/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${BASE}/invoices/${id}/`),

  // Invoice Payments
  listPayments: (invoiceId: string) =>
    api.get(`${BASE}/invoice-payments/?invoice=${invoiceId}`),
  createPayment: (payload: {
    invoice: string;
    amount: number;
    payment_date: string;
    method?: string;
    reference_no?: string;
    notes?: string;
  }) => api.post<{ data: any }>(`${BASE}/invoice-payments/`, payload),
  deletePayment: (id: string) => api.delete(`${BASE}/invoice-payments/${id}/`),

  // Convert Quotation → Invoice
  convertToInvoice: (quotationId: string) =>
    api.post<{ data: { invoice_id: string; invoice_no: string } }>(`${BASE}/quotations/${quotationId}/convert-to-invoice/`),
};

// ── Purchase Orders ───────────────────────────────────────────

export const purchOrdersApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<PurchaseOrder> }>(`${BASE}/purchase-orders/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: PurchaseOrder }>(`${BASE}/purchase-orders/${id}/`),

  create: (data: Partial<PurchaseOrder>) =>
    api.post<{ data: PurchaseOrder }>(`${BASE}/purchase-orders/`, data),

  update: (id: string, payload: Partial<PurchaseOrder>) =>
    api.patch<{ data: PurchaseOrder }>(`${BASE}/purchase-orders/${id}/`, payload),

  delete: (id: string) =>
    api.delete(`${BASE}/purchase-orders/${id}/`),
};

export const accountsApi = {
  listGroups: () => api.get(`${BASE}/account-groups/`),
  createGroup: (payload: { name: string; parent?: string; sequence?: number }) => api.post(`${BASE}/account-groups/`, payload),
  listLedgers: (params: { search?: string; favourite?: boolean } = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.favourite) query.set('favourite', 'true');
    return api.get(`${BASE}/ledgers/?${query}`);
  },
  createLedger: (payload: { group: string; name: string; code?: string; opening_balance: number; balance_side: 'Dr' | 'Cr'; notes?: string }) => api.post(`${BASE}/ledgers/`, payload),
  updateLedger: (id: string, payload: Record<string, unknown>) => api.patch(`${BASE}/ledgers/${id}/`, payload),
  deleteLedger: (id: string) => api.delete(`${BASE}/ledgers/${id}/`),

  // Transactions (Journal Entries)
  listTransactions: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) query.set(k, v); });
    return api.get(`${BASE}/transactions/?${query}`);
  },
  createTransaction: (payload: {
    date: string;
    voucher_no?: string;
    debit_ledger: string;
    credit_ledger: string;
    amount: number;
    narration?: string;
    reference_type?: string;
    reference_id?: string;
    reference_no?: string;
  }) => api.post(`${BASE}/transactions/`, payload),
  deleteTransaction: (id: string) => api.delete(`${BASE}/transactions/${id}/`),
};

// ── Customers ─────────────────────────────────────────────────

// Customer routes are registered directly under /api/v1/customers/.
// Keep this empty so callers do not produce /customers/customers/.
const CUSTOMER_BASE = '';

export const customersApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<Customer> }>(`${CUSTOMER_BASE}/customers/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: Customer }>(`${CUSTOMER_BASE}/customers/${id}/`),

  create: (data: CustomerCreatePayload) =>
    api.post<{ data: Customer }>(`${CUSTOMER_BASE}/customers/`, data),

  update: (id: string, data: CustomerUpdatePayload) =>
    api.patch<{ data: Customer }>(`${CUSTOMER_BASE}/customers/${id}/`, data),

  delete: (id: string) =>
    api.delete(`${CUSTOMER_BASE}/customers/${id}/`),

  toggleStatus: (id: string) =>
    api.post<{ data: { status: string } }>(`${CUSTOMER_BASE}/customers/${id}/toggle_status/`),

  summary: () =>
    api.get<{ data: any }>(`${CUSTOMER_BASE}/customers/summary/`),

  interactions: (id: string) =>
    api.get<{ data: any[] }>(`${CUSTOMER_BASE}/customers/${id}/interactions/`),

  addInteraction: (id: string, data: { interaction_type: string; notes?: string; scheduled_for?: string }) =>
    api.post<{ data: any }>(`${CUSTOMER_BASE}/customers/${id}/interactions/`, data),

  sendEmail: (id: string, data: { email?: string; subject?: string; message: string }) =>
    api.post(`${CUSTOMER_BASE}/customers/${id}/send_email/`, data),

  sendWhatsApp: (id: string, data: { mobile?: string; message: string }) =>
    api.post(`${CUSTOMER_BASE}/customers/${id}/send_whatsapp/`, data),

  receivePayment: (id: string, amount: number, notes?: string) =>
    api.post<{ data: Customer }>(`${CUSTOMER_BASE}/customers/${id}/receive_payment/`, { amount, notes }),
};

// ── Manufacturing ───────────────────────────────────────────────

export const manufacturingApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<any> }>(`/manufacturing/jobs/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: any }>(`/manufacturing/jobs/${id}/`),

  create: (data: any) =>
    api.post<{ data: any }>(`/manufacturing/jobs/`, data),

  updateStatus: (id: string, status: string) =>
    api.post<{ data: any }>(`/manufacturing/jobs/${id}/update-status/`, { status }),

  summary: () =>
    api.get<{ data: any }>(`/manufacturing/jobs/summary/`),
};

// ── Support ────────────────────────────────────────────────────

export const supportApi = {
  list: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        params.set(key, String(val));
      }
    });
    return api.get<{ data: PaginatedResponse<any> }>(`/support/tickets/?${params}`);
  },

  get: (id: string) =>
    api.get<{ data: any }>(`/support/tickets/${id}/`),

  create: (data: any) =>
    api.post<{ data: any }>(`/support/tickets/`, data),

  resolve: (id: string) =>
    api.post<{ data: any }>(`/support/tickets/${id}/resolve/`),

  close: (id: string) =>
    api.post<{ data: any }>(`/support/tickets/${id}/close/`),

  addComment: (id: string, text: string, is_internal = false) =>
    api.post<{ data: any }>(`/support/tickets/${id}/comments/`, { text, is_internal }),

  summary: () =>
    api.get<{ data: any }>(`/support/tickets/summary/`),
};
