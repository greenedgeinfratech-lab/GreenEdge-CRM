import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { 
  MessageSquare, CheckCircle, XCircle, Users, 
  Calendar, CalendarX, UserX, AlertTriangle, 
  MapPin, DollarSign, PieChart as PieChartIcon, BarChart2 
} from 'lucide-react';
import api from '@/lib/api';

const fetchDashboardData = async (period: string) => {
  const { data } = await api.get(`/crm/raw-dashboard/?period=${period}`);
  return data;
};

const COLORS = ['#d97706', '#ea580c', '#f59e0b', '#ca8a04', '#eab308'];

export default function RawLeadsDashboard() {
  const [period, setPeriod] = useState('this_month');
  
  const { data, isLoading } = useQuery({
    queryKey: ['raw_leads_dashboard', period],
    queryFn: () => fetchDashboardData(period),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
  }

  const kpiData = data || {};

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-normal text-gray-800">Raw Leads Dashboard</h2>
          <select 
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-40 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-orange-500 bg-white"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_year">This Year</option>
          </select>
        </div>

        {/* Top KPIs (Orange) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads Received', value: kpiData.leads_received, icon: MessageSquare },
            { label: 'Qualified Leads', value: kpiData.qualified_leads, icon: CheckCircle },
            { label: 'Rejected Leads', value: kpiData.rejected_leads, icon: XCircle },
            { label: 'Active Leads', value: kpiData.active_leads, icon: Users },
          ].map((item, i) => (
            <div key={i} className="bg-[#c2590e] text-white p-4 rounded-sm shadow-sm flex justify-between items-start">
              <div>
                <div className="text-sm font-medium mb-1">{item.label}</div>
                <div className="text-3xl">{item.value || 0}</div>
              </div>
              <item.icon className="w-5 h-5 opacity-80" />
            </div>
          ))}
        </div>

        {/* Secondary KPIs (Grey) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Appointments', value: kpiData.appointments, icon: Calendar },
            { label: 'Missed Appointments', value: kpiData.missed_appointments, icon: CalendarX },
            { label: 'No Interactions', value: kpiData.no_interactions, icon: UserX },
            { label: 'Unassigned Leads', value: kpiData.unassigned_leads, icon: AlertTriangle },
          ].map((item, i) => (
            <div key={i} className="bg-gray-100 border border-gray-200 text-gray-800 p-4 rounded-sm shadow-sm flex justify-between items-start">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-1">{item.label}</div>
                <div className="text-3xl font-medium">{item.value || 0}</div>
              </div>
              <item.icon className="w-5 h-5 text-gray-600" />
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Travel History', icon: MapPin },
            { label: 'Sales Credit Report', icon: DollarSign },
            { label: 'Source Analysis', icon: PieChartIcon },
            { label: 'Product Analysis', icon: BarChart2 },
          ].map((item, i) => (
            <button key={i} className="bg-gray-100 border border-gray-200 hover:bg-gray-200 transition-colors text-gray-700 p-3 rounded-sm flex justify-between items-center text-sm">
              <span>{item.label}</span>
              <item.icon className="w-4 h-4 text-gray-600" />
            </button>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="flex flex-col items-center">
            <h3 className="text-center text-gray-700 mb-4">Source-wise Leads</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.source_wise || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }: any) => (percent || 0) > 0 ? `${((percent || 0) * 100).toFixed(0)}%` : ''}
                  >
                    {(kpiData.source_wise || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex flex-col gap-1 text-xs text-gray-600">
              {(kpiData.source_wise || []).map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h3 className="text-center text-gray-700 mb-4">Product-wise Leads</h3>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.product_wise || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }: any) => (percent || 0) > 0 ? `${((percent || 0) * 100).toFixed(0)}%` : ''}
                  >
                    {(kpiData.product_wise || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
             <div className="mt-4 flex flex-col gap-1 text-xs text-gray-600">
              {(kpiData.product_wise || []).map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {entry.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Key Data) */}
      <div className="w-full lg:w-64 bg-[#f3f4f6] border border-[#e5e7eb] p-6 flex flex-col gap-6 mt-[72px]">
        <h3 className="text-lg text-gray-800 border-b border-gray-300 pb-2">Key Data</h3>
        
        {[
          { label: 'Max Converted', value: kpiData.key_data?.max_converted || '-' },
          { label: 'Max Count', value: kpiData.key_data?.max_count || '-' },
          { label: 'Most Missed Appointments', value: kpiData.key_data?.most_missed_appointments || '-' },
          { label: 'Most Uncontacted', value: kpiData.key_data?.most_uncontacted || '-' },
          { label: 'Most Rejected', value: kpiData.key_data?.most_rejected || '-' },
          { label: 'Best Source', value: kpiData.key_data?.best_source || '-' },
          { label: 'Best Product', value: kpiData.key_data?.best_product || '-' },
          { label: 'Max Inquiries from', value: '-' },
        ].map((stat, i) => (
          <div key={i} className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{stat.label}</span>
            <span className="text-sm text-gray-800">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
