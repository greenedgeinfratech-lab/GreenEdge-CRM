'use client';

import Link from 'next/link';
import { Settings, Plus } from 'lucide-react';
import { CrmFunnelData } from '@/interfaces/dashboard';
import { FunnelSkeleton } from '../skeletons/WidgetSkeleton';
import { WidgetError } from '../ErrorBoundary';

function formatIndianCurrency(value: number): string {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  if (value >= 1000) return `₹ ${(value / 1000).toFixed(1)}K`;
  return `₹ ${value.toLocaleString('en-IN')}`;
}

interface Props {
  data?: CrmFunnelData;
  isLoading: boolean;
  error?: Error | null;
}

export default function CrmFunnelWidget({ data, isLoading, error }: Props) {
  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm h-80 flex flex-col">
      <FunnelSkeleton />
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">CRM Funnel</h2>
        <div className="flex space-x-2 text-gray-400">
          <Settings className="w-4 h-4 cursor-pointer hover:text-gray-600" />
          <Link href="/crm">
            <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
          </Link>
        </div>
      </div>

      {error || !data || data.error ? (
        <WidgetError widgetName="CRM Funnel" />
      ) : data.stages.length === 0 ? (
        /* Empty state */
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="text-gray-400 text-3xl mb-2">📊</div>
          <p className="text-gray-600 font-medium text-sm">No CRM data available yet.</p>
          <p className="text-gray-400 text-xs mt-1">Start by creating your first Lead.</p>
          <Link
            href="/crm"
            className="mt-3 text-xs text-green-600 border border-green-400 px-3 py-1 rounded hover:bg-green-50 transition-colors"
          >
            Go to CRM
          </Link>
        </div>
      ) : (
        /* Funnel bars — each is a navigation link */
        <div className="flex-1 flex flex-col justify-around text-xs font-medium text-white">
          {data.stages.map((stage) => (
            <Link key={stage.stage} href={stage.url} className="block">
              <div
                className="flex hover:opacity-90 transition-opacity cursor-pointer"
                style={{ width: stage.width }}
                title={`${stage.stage}: ${stage.count} lead${stage.count !== 1 ? 's' : ''}`}
              >
                <div
                  className="py-1.5 px-3 rounded-l w-24 flex-shrink-0"
                  style={{ backgroundColor: stage.colours.bg_left }}
                >
                  {stage.stage}
                </div>
                <div
                  className="py-1.5 px-3 rounded-r flex-1 flex justify-end"
                  style={{
                    backgroundColor: stage.colours.bg_right,
                    color: stage.stage === 'Visit' || stage.stage === 'Proposal' ? '#164e63' : undefined,
                  }}
                >
                  {formatIndianCurrency(stage.value)} ({stage.count})
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && !data.error && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs text-gray-500">
          <span>Pipeline: {formatIndianCurrency(data.summary.total_pipeline_value)}</span>
          <span>Won: {data.summary.won_count} ({data.summary.conversion_rate}%)</span>
          {data.is_mock && <span className="text-orange-400 text-[10px]">demo data</span>}
        </div>
      )}
    </div>
  );
}
