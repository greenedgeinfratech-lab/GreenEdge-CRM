'use client';

import { Plus } from 'lucide-react';
import { SalesOverviewData } from '@/interfaces/dashboard';
import { WidgetSkeleton } from '../skeletons/WidgetSkeleton';
import { WidgetError } from '../ErrorBoundary';

function formatAmount(value: number, currency = 'INR'): string {
  if (currency === 'INR') {
    if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
    return `₹ ${value.toLocaleString('en-IN')}`;
  }
  return value.toLocaleString();
}

interface Props {
  data?: SalesOverviewData;
  isLoading: boolean;
  error?: Error | null;
  currency?: string;
}

export default function SalesOverviewWidget({ data, isLoading, error, currency = 'INR' }: Props) {
  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm h-80 flex flex-col">
      <WidgetSkeleton rows={5} />
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">Sales Overview</h2>
        <div className="flex space-x-2 text-gray-400">
          <Plus className="w-4 h-4 cursor-pointer hover:text-gray-600" />
        </div>
      </div>

      {error || !data || data.error ? (
        <WidgetError widgetName="Sales Overview" />
      ) : (
        <div className="flex-1 flex flex-col justify-between text-sm text-gray-700">
          {/* Financial Year */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">
              Fin Year <span className="text-xs">({data.financial_year?.label})</span>
            </span>
            <span className="font-semibold">{formatAmount(data.financial_year?.amount ?? 0, currency)}</span>
          </div>

          {/* Last Month */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">
              Last Month <span className="text-xs">({data.last_month?.label})</span>
            </span>
            <span className="font-semibold">{formatAmount(data.last_month?.amount ?? 0, currency)}</span>
          </div>

          {/* This Month */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">
              This Month <span className="text-xs">({data.this_month?.label})</span>
            </span>
            <span className="font-semibold">{formatAmount(data.this_month?.amount ?? 0, currency)}</span>
          </div>

          {/* Yesterday */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">
              Yesterday <span className="text-xs">({data.yesterday?.label})</span>
            </span>
            <span className="font-semibold">{formatAmount(data.yesterday?.amount ?? 0, currency)}</span>
          </div>

          {/* Today */}
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500">
              Today <span className="text-xs">({data.today?.label})</span>
            </span>
            <span className="font-semibold">{formatAmount(data.today?.amount ?? 0, currency)}</span>
          </div>

          {/* Future Orders */}
          {data.future_orders && (
            <div className="mt-2 pt-2">
              <div className="flex justify-between mb-1">
                <span className="text-gray-500 text-xs">
                  Future <span className="text-[10px]">(Pending Orders)</span>
                </span>
                <span className="font-semibold text-xs">
                  {formatAmount(data.future_orders.amount, currency)}
                </span>
              </div>
              <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-500"
                  style={{ width: `${Math.min(data.future_orders.percentage ?? 0, 100)}%` }}
                />
              </div>
            </div>
          )}

          {data.is_mock && (
            <div className="text-[10px] text-orange-400 text-right mt-1">demo data</div>
          )}
        </div>
      )}
    </div>
  );
}
