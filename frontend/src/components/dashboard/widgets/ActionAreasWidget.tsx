'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { ActionAreasData } from '@/interfaces/dashboard';
import { CardGridSkeleton } from '../skeletons/WidgetSkeleton';
import { WidgetError } from '../ErrorBoundary';

function formatAmount(value: number): string {
  if (value >= 10000000) return `₹ ${(value / 10000000).toFixed(2)} Cr`;
  if (value >= 100000) return `₹ ${(value / 100000).toFixed(2)} L`;
  return `₹ ${value.toLocaleString('en-IN')}`;
}

interface ActionCardProps {
  label: string;
  url: string;
  amount?: number;
  count?: number;
  colSpan?: boolean;
}

function ActionCard({ label, url, amount, count, colSpan }: ActionCardProps) {
  return (
    <Link href={url}>
      <div
        className={`border border-gray-200 rounded p-2 flex flex-col justify-center hover:border-green-400 hover:bg-green-50 transition-colors cursor-pointer ${colSpan ? 'col-span-2' : ''}`}
      >
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        {amount !== undefined ? (
          <div className="font-semibold text-sm">
            {formatAmount(amount)}{' '}
            {count !== undefined && (
              <span className="text-gray-400 text-xs font-normal">({count})</span>
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-xs">
            {count !== undefined ? `${count} item${count !== 1 ? 's' : ''}` : '—'}
          </div>
        )}
      </div>
    </Link>
  );
}

interface Props {
  data?: ActionAreasData;
  isLoading: boolean;
  error?: Error | null;
}

export default function ActionAreasWidget({ data, isLoading, error }: Props) {
  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm h-80 flex flex-col">
      <CardGridSkeleton cols={2} />
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 h-80 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">Action Areas</h2>
        <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
      </div>

      {error || !data || data.error ? (
        <WidgetError widgetName="Action Areas" />
      ) : (
        <div className="flex-1 grid grid-cols-2 gap-3">
          <ActionCard
            label="Open Orders"
            url={data.open_orders?.url ?? '/orders'}
            amount={data.open_orders?.amount}
            count={data.open_orders?.count}
          />
          <ActionCard
            label="Under Stock Items"
            url={data.under_stock_products?.url ?? '/inventory?filter=low-stock'}
            count={data.under_stock_products?.count}
          />
          <ActionCard
            label="Purchase Orders"
            url={data.open_purchase_orders?.url ?? '/purch-orders'}
            count={data.open_purchase_orders?.count}
          />
          <ActionCard
            label="Support Tickets"
            url={data.open_support_tickets?.url ?? '/support'}
            count={data.open_support_tickets?.count}
          />
          <ActionCard
            label="Pending Quotations"
            url={data.pending_quotations?.url ?? '/quotes'}
            count={data.pending_quotations?.count}
            colSpan
          />
          <ActionCard
            label="Account Recovery"
            url={data.outstanding_recovery?.url ?? '/recovery'}
            amount={data.outstanding_recovery?.amount}
            count={data.outstanding_recovery?.count}
            colSpan
          />
        </div>
      )}
    </div>
  );
}
