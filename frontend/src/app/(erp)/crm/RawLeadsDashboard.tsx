import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle, Calendar, CalendarX, CheckCircle, DollarSign,
  MessageSquare, Users, UserX, XCircle,
} from 'lucide-react';
import api from '@/lib/api';

type BreakdownItem = { name: string; value: number };
type AnalyticsBreakdown = {
  source__name?: string;
  name?: string;
  priority?: string;
  count?: number;
  value?: number;
};

const fetchDashboardData = async () => {
  const { data } = await api.get('/crm/analytics/');
  return data;
};

const formatCurrency = (value: number | string | undefined | null) => {
  const number = Number(value);
  if (Number.isNaN(number) || value == null) return '—';
  if (number >= 100000) return `₹${(number / 100000).toFixed(1)}L`;
  if (number >= 1000) return `₹${(number / 1000).toFixed(1)}K`;
  return `₹${number.toFixed(0)}`;
};

export default function RawLeadsDashboard() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['lead-dashboard'],
    queryFn: fetchDashboardData,
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading lead dashboard…</div>;

  if (isError) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-5 text-center text-red-700">
        <div className="flex items-center justify-center gap-2"><AlertCircle className="h-5 w-5" />Failed to load the lead dashboard.</div>
        <p className="mt-2 text-sm">{(error as Error)?.message || 'Please refresh and try again.'}</p>
      </div>
    );
  }

  const summary = data?.summary ?? {};
  const sourceItems: BreakdownItem[] = (data?.by_source ?? []).map((item: AnalyticsBreakdown) => ({
    name: item.source__name || item.name || 'Unknown', value: item.count ?? item.value ?? 0,
  }));
  const priorityItems: BreakdownItem[] = (data?.by_priority ?? []).map((item: AnalyticsBreakdown) => ({
    name: item.priority || item.name || 'Unknown', value: item.count ?? 0,
  }));
  const metrics = [
    { label: 'Active leads', value: summary.total_active ?? 0, icon: Users },
    { label: 'Won leads', value: summary.total_won ?? 0, icon: CheckCircle },
    { label: 'Lost leads', value: summary.total_lost ?? 0, icon: XCircle },
    { label: 'Pipeline value', value: formatCurrency(summary.total_pipeline_value), icon: DollarSign },
    { label: 'Follow-ups today', value: summary.todays_followups ?? 0, icon: Calendar },
    { label: 'Overdue follow-ups', value: summary.overdue_followups ?? 0, icon: CalendarX },
    { label: 'Appointments today', value: summary.todays_appointments ?? 0, icon: MessageSquare },
    { label: 'Average score', value: summary.avg_score ? `${Number(summary.avg_score).toFixed(0)}%` : '—', icon: UserX },
  ];

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-normal text-gray-800">Lead dashboard</h2>
        <p className="mt-1 text-sm text-gray-600">A quick view of your active pipeline and today&apos;s work.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between text-sm text-gray-600">
              {metric.label}<metric.icon className="h-4 w-4 text-[#1a365d]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{metric.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">Pipeline health</h3>
          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-gray-600">Conversion rate</dt><dd className="font-medium">{Number(summary.conversion_rate || 0).toFixed(1)}%</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Won value</dt><dd className="font-medium">{formatCurrency(summary.won_value)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-600">Pipeline stages</dt><dd className="font-medium">{(data?.by_stage ?? []).length}</dd></div>
          </dl>
        </div>
        {[{ title: 'Leads by source', items: sourceItems }, { title: 'Leads by priority', items: priorityItems }].map((breakdown) => (
          <div key={breakdown.title} className="rounded border border-gray-200 bg-white p-4">
            <h3 className="font-medium text-gray-900">{breakdown.title}</h3>
            {breakdown.items.length ? (
              <ul className="mt-3 space-y-2 text-sm">
                {breakdown.items.map((item) => (
                  <li key={item.name} className="flex justify-between"><span className="capitalize text-gray-600">{item.name}</span><span className="font-medium">{item.value}</span></li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm text-gray-500">No active leads to show.</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
