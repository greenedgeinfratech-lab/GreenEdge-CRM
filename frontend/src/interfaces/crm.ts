// ============================================================
// CRM Module TypeScript Interfaces
// ============================================================

export type LeadStatus = 'open' | 'in_progress' | 'on_hold' | 'won' | 'lost' | 'converted';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type FollowupType = 'call' | 'whatsapp' | 'email' | 'office_meeting' | 'site_visit' | 'online_meeting' | 'other';
export type FollowupStatus = 'pending' | 'completed' | 'missed' | 'cancelled';
export type AppointmentType = 'call' | 'office_meeting' | 'site_visit' | 'online_meeting';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
export type TimelineEventType =
  | 'lead_created' | 'lead_updated' | 'stage_changed' | 'assigned'
  | 'followup_logged' | 'call_logged' | 'whatsapp_sent' | 'email_sent'
  | 'site_visit' | 'note_added' | 'attachment_added'
  | 'appointment_created' | 'appointment_done'
  | 'won' | 'lost' | 'converted' | 'score_updated' | 'duplicate_flagged';

// ── Pipeline Config ──────────────────────────────────────────

export interface LeadStage {
  id: string;
  name: string;
  sequence: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  is_default: boolean;
  is_active: boolean;
  lead_count: number;
  pipeline_value: number;
}

export interface LeadSource {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface LeadTag {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
}

export interface LostReason {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

// ── Lead ────────────────────────────────────────────────────

export interface Lead {
  id: string;
  lead_number: string;
  full_name: string;
  first_name: string;
  last_name?: string;
  company_name?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  secondary_email?: string;
  alternate_contact?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  social_links?: Record<string, string>;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;

  // Pipeline
  stage?: LeadStage | null;
  stage_name?: string;
  stage_color?: string;
  status: LeadStatus;
  priority: LeadPriority;

  // Classification
  source?: LeadSource | null;
  source_name?: string;
  tags: LeadTag[];
  lost_reason?: LostReason | null;
  lost_notes?: string;

  // Opportunity
  estimated_value: number;
  product_interested?: string;
  requirements?: string;

  // Assignment
  assigned_to?: string | null;
  assigned_to_name?: string;

  // Dates
  last_contact_date?: string;
  next_followup_date?: string;
  last_followup_date?: string;
  won_at?: string;
  lost_at?: string;
  converted_at?: string;

  // Scoring & flags
  lead_score: number;
  lead_score_details?: Record<string, unknown>;
  is_starred: boolean;
  is_duplicate: boolean;

  // Counts (in detail view)
  followup_count?: number;
  note_count?: number;
  attachment_count?: number;

  created_at: string;
  updated_at: string;
}

export interface LeadProduct {
  id: string;
  product_name: string;
  quantity: number;
  estimated_price: number;
  unit?: string;
  notes?: string;
}

// ── Create / Update payloads ────────────────────────────────

export interface LeadCreatePayload {
  first_name: string;
  last_name?: string;
  company_name?: string;
  mobile: string;
  alternate_mobile?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  stage?: string;
  source?: string;
  priority?: LeadPriority;
  estimated_value?: number;
  product_interested?: string;
  requirements?: string;
  assigned_to?: string;
  next_followup_date?: string;
  tags?: string[];
  override_duplicate?: boolean;
}

export type LeadUpdatePayload = Partial<LeadCreatePayload>;

// ── Activities ───────────────────────────────────────────────

export interface LeadFollowup {
  id: string;
  followup_type: FollowupType;
  followup_type_display: string;
  notes?: string;
  next_followup_date?: string;
  status: FollowupStatus;
  status_display: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  date?: string;
  duration?: number;
  outcome?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
}

export interface LeadFollowupCreatePayload {
  followup_type: FollowupType;
  notes?: string;
  next_followup_date?: string;
  date?: string;
  duration?: number;
  outcome?: string;
  assigned_to?: string;
  schedule_reminder?: boolean;
  reminder_time?: string;
}

export interface Appointment {
  id: string;
  title: string;
  appointment_type: AppointmentType;
  type_display: string;
  notes?: string;
  start_time: string;
  end_time?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  status: AppointmentStatus;
  status_display: string;
  location?: string;
  meeting_link?: string;
  created_at: string;
}

export interface AppointmentCreatePayload {
  title: string;
  appointment_type: AppointmentType;
  notes?: string;
  start_time: string;
  end_time?: string;
  assigned_to?: string;
  location?: string;
  meeting_link?: string;
}

export interface LeadNote {
  id: string;
  text: string;
  pinned: boolean;
  history?: any[];
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface LeadAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_url?: string;
  file_size?: number;
  file_type: string;
  mime_type?: string;
  uploaded_by?: string;
  uploaded_by_name?: string;
  created_at: string;
}

export interface LeadAssignmentHistory {
  id: string;
  from_employee?: string;
  from_employee_name?: string;
  to_employee?: string;
  to_employee_name?: string;
  changed_by?: string;
  changed_by_name?: string;
  reason?: string;
  changed_at: string;
}

export interface LeadTimelineEvent {
  id: string;
  event_type: TimelineEventType;
  event_type_display: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
  performed_by?: string;
  performed_by_name?: string;
  performed_at: string;
  related_followup_id?: number;
  related_note_id?: number;
  related_appointment_id?: number;
}

// ── Analytics ───────────────────────────────────────────────

export interface CRMAnalyticsSummary {
  total_active: number;
  total_won: number;
  total_lost: number;
  conversion_rate: number;
  total_pipeline_value: number;
  won_value: number;
  avg_score: number;
  todays_followups: number;
  overdue_followups: number;
  todays_appointments: number;
}

export interface CRMAnalytics {
  summary: CRMAnalyticsSummary;
  by_stage: LeadStage[];
  by_source: { source__name: string; count: number; value: number }[];
  by_priority: { priority: LeadPriority; count: number }[];
  monthly_trend: {
    month: string;
    new_leads: number;
    won: number;
    lost: number;
    value: number;
  }[];
  financial_year: {
    start: string;
    new_leads: number;
    won_count: number;
    won_value: number;
  };
}

// ── Filter Params ────────────────────────────────────────────

export interface LeadFilters {
  stage?: string;
  status?: string;
  priority?: string;
  source?: string;
  assigned_to?: string;
  tag?: string;
  is_starred?: boolean;
  city?: string;
  state?: string;
  min_value?: number;
  max_value?: number;
  min_score?: number;
  next_followup?: string;
  next_followup_before?: string;
  next_followup_after?: string;
  created_after?: string;
  created_before?: string; // YYYY-MM-DDTHH:mm:ss
  has_appointments?: boolean; // Keep for legacy
  country?: string;
  product_interested?: string;
  last_contact_before?: string; // YYYY-MM-DD
  next_followup_isnull?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// ── API Response Wrappers ────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, unknown> | null;
}

export interface DuplicateCheckResult {
  has_duplicate: boolean;
  message: string | null;
  lead_id: string | null;
  match_type: 'mobile' | 'email' | 'company_name' | null;
}

export interface BulkActionPayload {
  lead_ids: string[];
  action: 'assign' | 'change_stage' | 'delete' | 'star' | 'unstar';
  employee_id?: string;
  stage_id?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; reason: string }[];
  duplicates: { row: number; existing_lead_id: string; reason: string }[];
}

// ── Reminders ────────────────────────────────────────────────

export type ReminderType = 'call' | 'email' | 'whatsapp' | 'visit' | 'meeting' | 'custom';
export type ReminderStatus = 'pending' | 'completed' | 'cancelled';
export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Reminder {
  id: string;
  lead: string;
  title: string;
  description?: string;
  reminder_type: ReminderType;
  reminder_type_display: string;
  priority: ReminderPriority;
  priority_display: string;
  status: ReminderStatus;
  status_display: string;
  remind_at: string;
  completed_at?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  notification_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderCreatePayload {
  title: string;
  reminder_type: string;
  remind_at: string;
  priority?: string;
  description?: string;
  assigned_to?: string;
}

// ── Quotations ────────────────────────────────────────────────

export interface QuotationItem {
  id?: string;
  item_description: string;
  hsn_sac?: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxable: number;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent?: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt?: number;
  amt: number;
  lead_time?: string;
}

export interface Quotation {
  id: string;
  lead?: string | null;
  lead_name?: string;
  customer_name: string;
  contact_person?: string;
  address?: string;
  sales_credit?: string;
  same_as_billing: boolean;
  shipping_address?: string;
  quote_number?: string;
  reference?: string;
  quote_date?: string;
  valid_till?: string;
  notes?: string;
  bank_details?: string;
  terms_conditions?: any[];
  extra_charge: number;
  custom_discount: number;
  total_taxable: number;
  total_cgst: number;
  total_sgst: number;
  total_igst?: number;
  grand_total: number;
  share_email: boolean;
  share_whatsapp: boolean;
  print_after_save: boolean;
  alert_on_opening: boolean;
  type: string;
  status: string;
  items: QuotationItem[];
  created_at: string;
  updated_at: string;
  created_by?: string;
  issued_by_name?: string;
}

// ── Product Catalog ──────────────────────────────────────────

export interface ProductCatalog {
  id: string;
  name: string;
  code?: string;
  item_type: 'Stock' | 'Service';
  category?: string;
  sub_category?: string;
  classification?: string;
  importance?: string;
  opng_qty?: number;
  unit: string;
  at_store?: string;
  source?: string;
  min_stock_qty?: number;
  lead_time?: number;
  std_cost?: number;
  purch_cost?: number;
  rate: number;
  hsn_sac?: string;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent: number;
  mrp?: number;
  description?: string;
  internal_notes?: string;
  tags?: string[];
  stock_qty: number;
  created_at?: string;
  updated_at?: string;
}

// ── Invoices ──────────────────────────────────────────────────

export interface InvoiceItem {
  id?: string;
  item_description: string;
  hsn_sac?: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxable: number;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent?: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt?: number;
  amt: number;
}

export interface Invoice {
  id: string;
  type: string;
  lead?: string | null;
  lead_name?: string;
  customer_name: string;
  contact_person?: string;
  sales_credit?: string;
  billing_address?: string;
  same_as_billing: boolean;
  shipping_details?: string;
  invoice_no: string;
  reference?: string;
  invoice_date?: string;
  due_date?: string;
  customer_ledger?: string;
  income_ledger?: string;
  voucher_no?: string;
  voucher_date?: string;
  notes?: string;
  bank_details?: string;
  terms_conditions?: string[];
  recovery_amt?: number;
  recovery_notes?: string;
  invoice_status?: string;
  status_internal_notes?: string;
  share_email?: boolean;
  share_whatsapp?: boolean;
  print_after_save?: boolean;
  extra_charge?: number;
  custom_discount?: number;
  total_taxable?: number;
  total_cgst?: number;
  total_sgst?: number;
  total_igst?: number;
  grand_total?: number;
  items?: InvoiceItem[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  issued_by_name?: string;
}

// ── Purchase Orders ───────────────────────────────────────────────

export interface PurchaseOrderItem {
  id?: string;
  item_description: string;
  hsn_sac?: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxable: number;
  cgst_percent: number;
  sgst_percent: number;
  igst_percent?: number;
  cgst_amt: number;
  sgst_amt: number;
  igst_amt?: number;
  amt: number;
}

export interface PurchaseOrder {
  id: string;
  supplier_name: string;
  contact_person?: string;
  source_address?: string;
  shipping_details?: string;
  po_no: string;
  reference?: string;
  po_date?: string;
  due_date?: string;
  notes?: string;
  terms_conditions?: string[];
  status?: string;
  share_email?: boolean;
  share_whatsapp?: boolean;
  print_after_save?: boolean;
  extra_charge?: number;
  custom_discount?: number;
  total_taxable?: number;
  total_cgst?: number;
  total_sgst?: number;
  total_igst?: number;
  grand_total?: number;
  items?: PurchaseOrderItem[];
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  created_by_name?: string;
}

// ── Customer ──────────────────────────────────────────────────

export interface CustomerContact {
  id?: string;
  name: string;
  designation?: string;
  mobile?: string;
  email?: string;
  is_primary?: boolean;
}

export interface Customer {
  id: string;
  customer_number?: string;
  name: string;
  company_name?: string;
  customer_type?: string;
  status?: string;
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  secondary_email?: string;
  phone?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  billing_address?: string;
  shipping_address?: string;
  industry?: string;
  source?: string;
  tags?: string[];
  credit_limit?: number;
  outstanding?: number;
  total_orders?: number;
  total_invoices?: number;
  assigned_to?: string;
  assigned_to_name?: string;
  converted_from_lead?: string;
  converted_from_lead_name?: string;
  notes?: string;
  contacts?: CustomerContact[];
  contact_count?: number;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

export interface CustomerCreatePayload {
  name: string;
  company_name?: string;
  customer_type?: string;
  status?: string;
  mobile?: string;
  alternate_mobile?: string;
  email?: string;
  secondary_email?: string;
  phone?: string;
  website?: string;
  gst_number?: string;
  pan_number?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  billing_address?: string;
  shipping_address?: string;
  industry?: string;
  source?: string;
  tags?: string[];
  credit_limit?: number;
  outstanding?: number;
  assigned_to?: string;
  msme_no?: string;
  category?: string;
  total_orders?: number;
  notes?: string;
  contacts?: CustomerContact[];
}

export type CustomerUpdatePayload = Partial<CustomerCreatePayload>;

// ── Transactions (Journal Entries) ──────────────────────────

export interface Transaction {
  id: string;
  date: string;
  voucher_no: string;
  debit_ledger: string;
  debit_ledger_name: string;
  credit_ledger: string;
  credit_ledger_name: string;
  amount: number;
  narration: string;
  reference_type?: string;
  reference_id?: string;
  reference_no?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  created_by_name: string;
}

// ── Invoice Payments ─────────────────────────────────────────

export interface InvoicePayment {
  id: string;
  invoice: string;
  invoice_no: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: 'Cash' | 'Bank Transfer' | 'UPI' | 'Cheque' | 'NEFT' | 'RTGS' | 'Other';
  reference_no?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}
