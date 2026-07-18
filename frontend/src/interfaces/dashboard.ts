// ─── CRM Funnel ─────────────────────────────────────────────────────────────

export interface CrmStageColours {
  bg_left: string;
  bg_right: string;
}

export interface CrmStage {
  stage: string;
  count: number;
  value: number;
  width: string;
  colours: CrmStageColours;
  url: string;
}

export interface CrmFunnelSummary {
  total_active_leads: number;
  total_pipeline_value: number;
  won_count: number;
  won_value: number;
  conversion_rate: number;
}

export interface CrmFunnelData {
  stages: CrmStage[];
  summary: CrmFunnelSummary;
  is_mock?: boolean;
  error?: string;
}

// ─── Sales Overview ──────────────────────────────────────────────────────────

export interface SalesPeriod {
  label: string;
  amount: number;
  order_count?: number;
  percentage?: number;
}

export interface SalesOverviewData {
  today: SalesPeriod;
  yesterday: SalesPeriod;
  this_month: SalesPeriod;
  last_month: SalesPeriod;
  financial_year: SalesPeriod;
  future_orders: SalesPeriod & { percentage: number };
  is_mock?: boolean;
  error?: string;
}

// ─── Action Areas ────────────────────────────────────────────────────────────

export interface ActionAreaItem {
  amount?: number;
  count: number;
  url: string;
  is_mock?: boolean;
}

export interface ActionAreasData {
  open_orders: ActionAreaItem;
  pending_quotations: ActionAreaItem;
  outstanding_recovery: ActionAreaItem;
  under_stock_products: ActionAreaItem;
  open_purchase_orders: ActionAreaItem;
  open_support_tickets: ActionAreaItem;
  error?: string;
}

// ─── Shortcuts ───────────────────────────────────────────────────────────────

export interface Shortcut {
  label: string;
  url: string;
  icon: string;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskSummary {
  today_count: number;
  pending_count: number;
  in_progress_count: number;
  completed_today_count: number;
  error?: string;
}

export interface TasksData {
  summary: TaskSummary;
  items: Task[];
}

// ─── Activity Feed ───────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user: string;
  related_model?: string;
  related_object_id?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationType =
  | 'info' | 'success' | 'warning' | 'error'
  | 'task' | 'lead' | 'order' | 'invoice' | 'payment' | 'support' | 'system';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  related_url?: string;
  created_at: string;
  read_at?: string;
}

export interface NotificationsData {
  unread_count: number;
  recent: NotificationItem[];
}

// ─── Company / User ──────────────────────────────────────────────────────────

export interface CompanyInfo {
  id: string;
  name: string;
  financial_year: string;
  currency: string;
  logo?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  last_login?: string;
}

// ─── KPIs ────────────────────────────────────────────────────────────────────

export interface KPIs {
  total_pipeline: number;
  won_this_fy: number;
  conversion_rate: number;
  outstanding_recovery: number;
  open_orders: number;
  monthly_revenue: number;
}

// ─── Charts ──────────────────────────────────────────────────────────────────

export interface ChartDataPoint {
  name?: string;
  month?: string;
  value?: number;
  fill?: string;
  revenue?: number;
  target?: number;
  rate?: number;
}

export interface ChartsData {
  crm_funnel: ChartDataPoint[];
  sales_trend: ChartDataPoint[];
  monthly_conversion: ChartDataPoint[];
}

// ─── Full Dashboard Response ─────────────────────────────────────────────────

export interface DashboardData {
  company: CompanyInfo;
  user: UserInfo;
  visible_widgets: string[] | '__all__';
  crm_funnel: CrmFunnelData;
  sales_overview: SalesOverviewData;
  action_areas: ActionAreasData;
  shortcuts: Shortcut[];
  tasks: TasksData;
  activity_feed: ActivityItem[];
  notifications: NotificationsData;
  kpis: KPIs;
  charts: ChartsData;
}

// ─── Legacy types kept for backward compat ───────────────────────────────────

export interface KPI {
  title: string;
  value: string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface FunnelStage {
  name: string;
  value: number;
  fill: string;
}

export interface SalesData {
  month: string;
  revenue: number;
  target: number;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  avatar?: string;
}
