'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Users, TrendingUp, Target, AlertCircle, Loader2, ChevronDown, Printer } from 'lucide-react';
import { CRM_KEYS } from '@/lib/crmQueryKeys';

export default function LeadsReportPage() {
  const [dateFilter, setDateFilter] = useState('All Time');
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: CRM_KEYS.analytics(),
    queryFn: async () => {
      const { analyticsApi } = await import('@/services/crmService');
      return analyticsApi.get();
    },
  });

  const analytics = data?.data?.data || data?.data || {} as any;
  const summary = analytics.summary || {};
  const byStage: any[] = analytics.by_stage || [];
  const bySource: any[] = analytics.by_source || [];
  const byPriority: any[] = analytics.by_priority || [];
  const trend: any[] = analytics.monthly_trend || [];

  // Apply date filter to monthly trend
  const filteredTrend = trend.filter((m: any) => {
    if (dateFilter === 'All Time') return true;
    if (!m.month) return true;
    const monthStr = String(m.month).toLowerCase();
    const now = new Date();
    const thisMonth = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = lastMonthDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
    if (dateFilter === 'This Month') return monthStr.includes(thisMonth) || monthStr === `${thisMonth} ${now.getFullYear()}`;
    if (dateFilter === 'Last Month') return monthStr.includes(lastMonth);
    if (dateFilter === 'This Quarter') {
      const q = Math.floor(now.getMonth() / 3);
      const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const quarterMonths = months.slice(q * 3, q * 3 + 3);
      return quarterMonths.some(qm => monthStr.includes(qm));
    }
    if (dateFilter === 'This Year') return monthStr.includes(String(now.getFullYear()));
    return true;
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const stageRows = byStage.map((s: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${s.color || '#6b7280'};margin-right:8px"></span>${s.name}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${s.count}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(s.value || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const sourceRows = bySource.map((s: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${s.source__name || 'Unknown'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${s.count}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(s.value || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    const trendRows = filteredTrend.map((m: any) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${m.month}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">${m.new_leads}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#16a34a;font-weight:600">${m.won}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;color:#ef4444">${m.lost}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right">₹${Number(m.value || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');
    printWindow.document.write(`
      <html><head><title>Leads Report</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:12px}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}h2{font-size:14px;margin:16px 0 8px;color:#1f2937}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}.kpi{display:inline-block;margin-right:24px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:6px}.kpi-label{font-size:11px;color:#6b7280}.kpi-value{font-size:18px;font-weight:700}</style></head><body>
        <h1>CRM & Leads Report</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | Filter: ${dateFilter}</div>
        <div style="margin-bottom:16px">
          <div class="kpi"><div class="kpi-label">Active Leads</div><div class="kpi-value" style="color:#2563eb">${summary.total_active || 0}</div></div>
          <div class="kpi"><div class="kpi-label">Won Leads</div><div class="kpi-value" style="color:#16a34a">${summary.total_won || 0}</div></div>
          <div class="kpi"><div class="kpi-label">Lost Leads</div><div class="kpi-value" style="color:#ef4444">${summary.total_lost || 0}</div></div>
          <div class="kpi"><div class="kpi-label">Conversion Rate</div><div class="kpi-value" style="color:#9333ea">${summary.conversion_rate || 0}%</div></div>
        </div>
        <h2>Pipeline by Stage</h2>
        <table><thead><tr><th>Stage</th><th style="text-align:right">Count</th><th style="text-align:right">Value</th></tr></thead><tbody>${stageRows}</tbody></table>
        <h2>Leads by Source</h2>
        <table><thead><tr><th>Source</th><th style="text-align:right">Leads</th><th style="text-align:right">Value</th></tr></thead><tbody>${sourceRows}</tbody></table>
        <h2>Monthly Trend</h2>
        <table><thead><tr><th>Month</th><th style="text-align:right">New</th><th style="text-align:right">Won</th><th style="text-align:right">Lost</th><th style="text-align:right">Won Value</th></tr></thead><tbody>${trendRows}</tbody></table>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading report data…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="w-6 h-6 mr-2" />
        Failed to load report. Please try again.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto p-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </Link>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl text-gray-800 font-medium">CRM & Leads Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[130px] justify-between cursor-pointer hover:bg-gray-50">
              <span>{dateFilter}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showDateDropdown && (
              <div className="absolute z-10 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg">
                {['All Time', 'This Month', 'Last Month', 'This Quarter', 'This Year'].map(opt => (
                  <button key={opt} onClick={() => { setDateFilter(opt); setShowDateDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${dateFilter === opt ? 'bg-green-50 text-green-700 font-medium' : 'text-gray-700'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handlePrint} className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Leads', value: summary.total_active || 0, icon: Users, color: 'text-blue-600' },
          { label: 'Won Leads', value: summary.total_won || 0, icon: Target, color: 'text-green-600' },
          { label: 'Lost Leads', value: summary.total_lost || 0, icon: AlertCircle, color: 'text-red-500' },
          { label: 'Conversion Rate', value: `${summary.conversion_rate || 0}%`, icon: TrendingUp, color: 'text-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <kpi.icon className="w-4 h-4" /> {kpi.label}
            </div>
            <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline by Stage */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Lead Pipeline by Stage</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {byStage.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No stage data</td></tr>
              ) : byStage.map((s: any) => (
                <tr key={s.id || s.name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: s.color || '#6b7280' }} />
                    {s.name}
                  </td>
                  <td className="px-4 py-2.5 text-sm text-right">{s.count}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{Number(s.value || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Leads by Source */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Leads by Source</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Leads</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bySource.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-400">No source data</td></tr>
              ) : bySource.map((s: any) => (
                <tr key={s.source__name} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">{s.source__name || 'Unknown'}</td>
                  <td className="px-4 py-2.5 text-sm text-right">{s.count}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{Number(s.value || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white border rounded-lg overflow-hidden md:col-span-2">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Monthly Lead Trend</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">New Leads</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Won</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Lost</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Won Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTrend.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">No trend data</td></tr>
              ) : filteredTrend.map((m: any) => (
                <tr key={m.month} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-sm font-medium">{m.month}</td>
                  <td className="px-4 py-2.5 text-sm text-right">{m.new_leads}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-green-600 font-medium">{m.won}</td>
                  <td className="px-4 py-2.5 text-sm text-right text-red-500">{m.lost}</td>
                  <td className="px-4 py-2.5 text-sm text-right">₹{Number(m.value || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* By Priority */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Leads by Priority</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {byPriority.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No data</p>
            ) : byPriority.map((p: any) => {
              const color = p.priority === 'high' ? 'bg-red-100 text-red-700' : p.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
              return (
                <div key={p.priority} className="flex items-center justify-between px-4 py-3">
                  <span className={`px-2 py-0.5 text-xs rounded-full capitalize font-medium ${color}`}>{p.priority}</span>
                  <span className="text-sm font-bold text-gray-800">{p.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Follow-up Summary */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Follow-up Summary</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {[
              { label: "Today's Follow-ups", value: summary.todays_followups || 0, color: 'text-blue-600' },
              { label: 'Overdue Follow-ups', value: summary.overdue_followups || 0, color: 'text-red-600' },
              { label: "Today's Appointments", value: summary.todays_appointments || 0, color: 'text-green-600' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-600">{row.label}</span>
                <span className={`text-lg font-bold ${row.color}`}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}