'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw, RotateCcw } from 'lucide-react';
import { dashboardService } from '@/services/dashboardService';
import { WidgetErrorBoundary } from '@/components/dashboard/ErrorBoundary';
import CrmFunnelWidget from '@/components/dashboard/widgets/CrmFunnelWidget';
import SalesOverviewWidget from '@/components/dashboard/widgets/SalesOverviewWidget';
import ActionAreasWidget from '@/components/dashboard/widgets/ActionAreasWidget';
import ShortcutsWidget from '@/components/dashboard/widgets/ShortcutsWidget';
import TasksWidget from '@/components/dashboard/widgets/TasksWidget';
import ActivityFeedWidget from '@/components/dashboard/widgets/ActivityFeedWidget';
import {
  ShortcutsSkeleton,
  FeedSkeleton,
  TasksSkeleton,
} from '@/components/dashboard/skeletons/WidgetSkeleton';

export default function DashboardPage() {
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboardData,
    refetchInterval: 60 * 1000,   // 60 seconds auto-refresh
    staleTime: 30 * 1000,
    retry: 2,
  });

  // Role-based widget visibility
  const visibleWidgets = data?.visible_widgets ?? '__all__';
  const isVisible = (widget: string) =>
    visibleWidgets === '__all__' || visibleWidgets.includes(widget);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-[1600px] mx-auto p-2">

      {/* ── Main Left Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col gap-6">

        {/* Refresh bar */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Loading dashboard...'}
          </div>
          <div className="flex items-center gap-2">
            {isFetching && (
              <span className="text-xs text-blue-500 flex items-center gap-1">
                <RotateCcw className="w-3 h-3 animate-spin" />
                Refreshing...
              </span>
            )}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 px-2.5 py-1 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Top 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* CRM Funnel */}
          {isVisible('crm_funnel') && (
            <WidgetErrorBoundary widgetName="CRM Funnel">
              <CrmFunnelWidget
                data={data?.crm_funnel}
                isLoading={isLoading}
                error={error as Error | null}
              />
            </WidgetErrorBoundary>
          )}

          {/* Sales Overview */}
          {isVisible('sales_overview') && (
            <WidgetErrorBoundary widgetName="Sales Overview">
              <SalesOverviewWidget
                data={data?.sales_overview}
                isLoading={isLoading}
                error={error as Error | null}
                currency={data?.company?.currency ?? 'INR'}
              />
            </WidgetErrorBoundary>
          )}

          {/* Action Areas */}
          {isVisible('action_areas') && (
            <WidgetErrorBoundary widgetName="Action Areas">
              <ActionAreasWidget
                data={data?.action_areas}
                isLoading={isLoading}
                error={error as Error | null}
              />
            </WidgetErrorBoundary>
          )}
        </div>

        {/* Shortcuts */}
        {isVisible('shortcuts') && (
          <WidgetErrorBoundary widgetName="Shortcuts">
            {isLoading ? (
              <div className="bg-white border border-gray-200 rounded shadow-sm">
                <ShortcutsSkeleton />
              </div>
            ) : (
              <ShortcutsWidget
                shortcuts={data?.shortcuts}
                isLoading={false}
              />
            )}
          </WidgetErrorBoundary>
        )}

        {/* Bottom Row — Activity Feed + Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Activity Feed (replaces "Find Vendors on Biziverse") */}
          {isVisible('activity_feed') && (
            <WidgetErrorBoundary widgetName="Activity Feed">
              <div className="md:col-span-2">
                {isLoading ? (
                  <div className="bg-white border border-gray-200 rounded shadow-sm">
                    <FeedSkeleton />
                  </div>
                ) : (
                  <ActivityFeedWidget
                    feed={data?.activity_feed}
                    isLoading={false}
                  />
                )}
              </div>
            </WidgetErrorBoundary>
          )}

          {/* Tasks */}
          {isVisible('tasks') && (
            <WidgetErrorBoundary widgetName="Tasks">
              {isLoading ? (
                <div className="bg-white border border-gray-200 rounded shadow-sm">
                  <TasksSkeleton />
                </div>
              ) : (
                <TasksWidget
                  data={data?.tasks}
                  isLoading={false}
                  error={error as Error | null}
                />
              )}
            </WidgetErrorBoundary>
          )}
        </div>

      </div>
      {/* ── End Main Left ────────────────────────────────────────────────── */}


      {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
      <div className="w-full lg:w-[320px] flex flex-col gap-6">

        {/* Company Card */}
        <WidgetErrorBoundary widgetName="Company Info">
          <div className="bg-white border border-gray-200 rounded shadow-sm p-5">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-3">
                  {data?.company?.logo ? (
                    <img src={data.company.logo} alt="Company Logo" className="w-10 h-10 rounded object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm border-2 border-green-600">
                      {(data?.company?.name?.[0] ?? 'G').toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                      {data?.company?.name ?? 'Your Company'}
                    </h3>
                    <p className="text-xs text-gray-500">FY {data?.company?.financial_year ?? '—'}</p>
                  </div>
                </div>
                {data?.user && (
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-600">
                      Logged in as <span className="font-medium">{data.user.name}</span>
                    </p>
                    {data.user.last_login && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Last login: {new Date(data.user.last_login).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </WidgetErrorBoundary>

        {/* KPI Summary */}
        {isVisible('kpis') && data?.kpis && !isLoading && (
          <WidgetErrorBoundary widgetName="KPIs">
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4">
              <h2 className="text-gray-800 font-semibold text-sm mb-3">Key Metrics</h2>
              <div className="space-y-2">
                {[
                  { label: 'Pipeline Value', value: data.kpis.total_pipeline },
                  { label: 'Won This FY', value: data.kpis.won_this_fy },
                  { label: 'Monthly Revenue', value: data.kpis.monthly_revenue },
                  { label: 'Outstanding Recovery', value: data.kpis.outstanding_recovery },
                  { label: 'Open Orders', value: data.kpis.open_orders },
                ].map(kpi => (
                  <div key={kpi.label} className="flex justify-between items-center py-1 border-b border-gray-50">
                    <span className="text-xs text-gray-500">{kpi.label}</span>
                    <span className="text-xs font-semibold text-gray-800">
                      {formatINR(kpi.value)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center py-1">
                  <span className="text-xs text-gray-500">Conversion Rate</span>
                  <span className="text-xs font-semibold text-green-600">
                    {data.kpis.conversion_rate ?? 0}%
                  </span>
                </div>
              </div>
            </div>
          </WidgetErrorBoundary>
        )}

        {/* Notifications Panel */}
        {isVisible('notifications') && (
          <WidgetErrorBoundary widgetName="Notifications">
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4 flex-1">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-gray-800 font-semibold text-sm">
                  Notifications
                  {(data?.notifications?.unread_count ?? 0) > 0 && (
                    <span className="ml-2 bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                      {data!.notifications.unread_count}
                    </span>
                  )}
                </h2>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (data?.notifications?.recent?.length ?? 0) === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-gray-500">No notifications yet.</p>
                  <p className="text-[10px] text-gray-400 mt-1">You&apos;ll see alerts here when modules are active.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data!.notifications.recent.slice(0, 5).map(n => (
                    <div key={n.id} className={`flex gap-2 ${!n.is_read ? 'opacity-100' : 'opacity-60'}`}>
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs flex-shrink-0">
                        {n.type === 'payment' ? '💰' : n.type === 'lead' ? '🎯' : 'ℹ️'}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">{n.title}</p>
                        <p className="text-[10px] text-gray-400">{n.message.slice(0, 60)}{n.message.length > 60 ? '...' : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </WidgetErrorBoundary>
        )}

      </div>
      {/* ── End Right Sidebar ──────────────────────────────────────────────── */}

    </div>
  );
}

function formatINR(value: number): string {
  if (!value) return '₹ 0';
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)}K`;
  return `₹ ${value.toLocaleString('en-IN')}`;
}
