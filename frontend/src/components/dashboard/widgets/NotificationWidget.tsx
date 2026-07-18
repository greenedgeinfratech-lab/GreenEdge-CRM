'use client';

import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { NotificationsData, NotificationItem, NotificationType } from '@/interfaces/dashboard';
import { dashboardService } from '@/services/dashboardService';

const TYPE_CONFIG: Record<NotificationType | 'default', { color: string; icon: string }> = {
  info:    { color: 'text-blue-500 bg-blue-50',   icon: 'ℹ️' },
  success: { color: 'text-green-500 bg-green-50', icon: '✅' },
  warning: { color: 'text-yellow-600 bg-yellow-50', icon: '⚠️' },
  error:   { color: 'text-red-500 bg-red-50',     icon: '❌' },
  task:    { color: 'text-purple-500 bg-purple-50', icon: '📋' },
  lead:    { color: 'text-blue-600 bg-blue-50',   icon: '🎯' },
  order:   { color: 'text-indigo-600 bg-indigo-50', icon: '🛒' },
  invoice: { color: 'text-orange-500 bg-orange-50', icon: '🧾' },
  payment: { color: 'text-green-600 bg-green-50', icon: '💰' },
  support: { color: 'text-pink-600 bg-pink-50',   icon: '🎫' },
  system:  { color: 'text-gray-500 bg-gray-50',   icon: '⚙️' },
  default: { color: 'text-gray-500 bg-gray-50',   icon: '📝' },
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

interface Props {
  data?: NotificationsData;
  isLoading?: boolean;
}

export default function NotificationWidget({ data, isLoading }: Props) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['dashboard'] });

  const markReadMutation = useMutation({
    mutationFn: dashboardService.markNotificationRead,
    onSuccess: invalidate,
  });

  const markAllMutation = useMutation({
    mutationFn: dashboardService.markAllNotificationsRead,
    onSuccess: invalidate,
  });

  const unread = data?.unread_count ?? 0;
  const notifications = data?.recent ?? [];

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        id="notification-bell"
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-10 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800 text-sm">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
                  {unread} new
                </span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  title="Mark all read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const config = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.default;
                return (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 transition-colors ${n.is_read ? 'bg-white' : 'bg-blue-50/40'}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${n.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                        {n.title}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400">{timeAgo(n.created_at)}</span>
                        {n.related_url && (
                          <Link
                            href={n.related_url}
                            className="text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-0.5"
                            onClick={() => setOpen(false)}
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            Open
                          </Link>
                        )}
                      </div>
                    </div>
                    {!n.is_read && (
                      <button
                        onClick={() => markReadMutation.mutate(n.id)}
                        className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5 hover:bg-blue-700"
                        title="Mark read"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
