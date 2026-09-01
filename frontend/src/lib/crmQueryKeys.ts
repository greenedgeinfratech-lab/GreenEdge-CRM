/**
 * CRM Query Key Factory
 * =====================
 * Centralized, typed React Query key definitions for the CRM module.
 *
 * Usage:
 *   useQuery({ queryKey: CRM_KEYS.commandCenter(id), ... })
 *   queryClient.invalidateQueries({ queryKey: CRM_KEYS.leads() })
 */

export const CRM_KEYS = {
  // Lead list with optional filter hash
  leads: (filters?: Record<string, unknown>) =>
    filters ? ['leads', filters] : ['leads'],

  // Single lead detail
  lead: (id: string) => ['lead', id],

  // Full command center aggregate (main detail page query)
  commandCenter: (id: string) => ['lead-command-center', id],

  // Pipeline configuration
  stages: () => ['lead-stages'],
  sources: () => ['lead-sources'],
  tags: () => ['lead-tags'],
  lostReasons: () => ['lost-reasons'],

  // Analytics / Dashboard
  analytics: () => ['crm-analytics'],
  dashboard: () => ['dashboard'],

  // Employees (for select dropdowns)
  employees: () => ['employees'],

  // Customers
  customers: (filters?: Record<string, unknown>) =>
    filters ? ['customers', filters] : ['customers'],
  customer: (id: string) => ['customer', id],
  customerSummary: () => ['customer-summary'],
} as const;

/**
 * The minimal set of keys to invalidate after any lead mutation.
 * Ensures the list, detail, and dashboard all refresh.
 */
export const LEAD_MUTATION_INVALIDATIONS = [
  CRM_KEYS.leads(),
  CRM_KEYS.analytics(),
  CRM_KEYS.dashboard(),
] as const;
