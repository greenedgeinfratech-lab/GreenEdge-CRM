'use client';

import { ActivityItem } from '@/interfaces/dashboard';
import { FeedSkeleton } from '../skeletons/WidgetSkeleton';

// Map activity types to icons and colours
const ACTIVITY_CONFIG: Record<string, { icon: string; color: string }> = {
  lead_created:      { icon: '🎯', color: 'bg-blue-100 text-blue-600' },
  lead_assigned:     { icon: '👤', color: 'bg-purple-100 text-purple-600' },
  quotation_created: { icon: '📄', color: 'bg-yellow-100 text-yellow-700' },
  quotation_sent:    { icon: '✉️', color: 'bg-yellow-100 text-yellow-700' },
  order_created:     { icon: '🛒', color: 'bg-indigo-100 text-indigo-600' },
  order_approved:    { icon: '✅', color: 'bg-green-100 text-green-600' },
  invoice_generated: { icon: '🧾', color: 'bg-orange-100 text-orange-600' },
  payment_received:  { icon: '💰', color: 'bg-green-100 text-green-700' },
  support_created:   { icon: '🎫', color: 'bg-pink-100 text-pink-600' },
  support_closed:    { icon: '🔒', color: 'bg-gray-100 text-gray-600' },
  employee_added:    { icon: '🧑‍💼', color: 'bg-teal-100 text-teal-600' },
  default:           { icon: '📝', color: 'bg-gray-100 text-gray-500' },
};

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function formatTime(timestamp: string): string {
  const d = new Date(timestamp);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Mock feed for when activity log is empty
const MOCK_FEED: ActivityItem[] = [
  { id: 'm1', type: 'lead_created',      description: 'New lead "Infra Corp" was added to CRM',    timestamp: new Date(Date.now() - 25 * 60000).toISOString(), user: 'System' },
  { id: 'm2', type: 'quotation_sent',    description: 'Quotation QT-0012 sent to GreenBuild Ltd',   timestamp: new Date(Date.now() - 90 * 60000).toISOString(), user: 'Sales Exec' },
  { id: 'm3', type: 'order_approved',    description: 'Order ORD-0034 confirmed and dispatched',    timestamp: new Date(Date.now() - 180 * 60000).toISOString(), user: 'Operations' },
  { id: 'm4', type: 'invoice_generated', description: 'Invoice INV-0056 generated for ₹1,25,000',   timestamp: new Date(Date.now() - 300 * 60000).toISOString(), user: 'Accounts' },
  { id: 'm5', type: 'payment_received',  description: 'Payment of ₹80,000 received from Skyline Co', timestamp: new Date(Date.now() - 480 * 60000).toISOString(), user: 'Accounts' },
];

interface Props {
  feed?: ActivityItem[];
  isLoading: boolean;
}

export default function ActivityFeedWidget({ feed, isLoading }: Props) {
  if (isLoading) return (
    <div className="bg-white border border-gray-200 rounded shadow-sm flex-1">
      <FeedSkeleton />
    </div>
  );

  const items = (feed && feed.length > 0) ? feed : MOCK_FEED;
  const isMock = !feed || feed.length === 0;

  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm p-4 flex-1">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-800 font-semibold text-lg">Activity Feed</h2>
        {isMock && (
          <span className="text-[10px] text-orange-400 bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
            demo
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {items.map((item, i) => {
          const config = ACTIVITY_CONFIG[item.type] ?? ACTIVITY_CONFIG.default;
          const isLast = i === items.length - 1;

          return (
            <div key={item.id} className="flex gap-3">
              {/* Timeline connector */}
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${config.color}`}>
                  {config.icon}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-200 my-1 min-h-[16px]" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-3">
                <p className="text-xs text-gray-700 leading-snug">{item.description}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-gray-400">{formatTime(item.timestamp)}</span>
                  <span className="text-[10px] text-gray-400">·</span>
                  <span className="text-[10px] text-gray-500">{item.user}</span>
                  <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(item.timestamp)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
