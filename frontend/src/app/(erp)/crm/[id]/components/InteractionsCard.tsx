'use client';

import React from 'react';
import { MessageCircle, Plus, Phone, Mail, MapPin, CheckCircle2, User, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InteractionsCardProps {
  followups: any[];
  reminders: any[];
  onLogInteraction: () => void;
  onSetReminder: () => void;
}

export default function InteractionsCard({ followups, reminders, onLogInteraction, onSetReminder }: InteractionsCardProps) {
  
  // Combine followups (past interactions) and pending reminders for a single timeline view in this card
  // Actually, keeping them separate might be cleaner: show pending reminders at top, then past interactions.
  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const pastInteractions = followups.slice(0, 5); // Show latest 5

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'visit': return <MapPin className="w-4 h-4" />;
      default: return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const d = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <MessageCircle className="w-4 h-4 mr-2 text-[#f97316]" />
          Interactions
        </h2>
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2" onClick={onSetReminder}>
            <Bell className="w-4 h-4 mr-1" /> Reminder
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-[#f97316] hover:text-[#ea580c] hover:bg-orange-50 px-2" onClick={onLogInteraction}>
            <Plus className="w-4 h-4 mr-1" /> Log
          </Button>
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
        
        {/* Pending Reminders Section */}
        {pendingReminders.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Pending Reminders</h3>
            <div className="space-y-2">
              {pendingReminders.map(rem => (
                <div key={rem.id} className="flex items-start p-2.5 bg-yellow-50/50 border border-yellow-100 rounded-md">
                  <div className="bg-yellow-100 text-yellow-600 p-1.5 rounded-full mr-3 shrink-0">
                    <Bell className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{rem.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(rem.remind_at).toLocaleDateString()} at {new Date(rem.remind_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Interactions Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Interactions</h3>
          {pastInteractions.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-2">No interactions logged yet.</p>
          ) : (
            <div className="relative border-l border-gray-200 ml-3 space-y-4">
              {pastInteractions.map((fw: any) => (
                <div key={fw.id} className="relative pl-6">
                  <span className="absolute -left-3.5 top-1 bg-white border-2 border-gray-200 rounded-full p-1 text-gray-500">
                    {getIcon(fw.followup_type)}
                  </span>
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 uppercase">
                        {fw.followup_type_display}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {formatTimeAgo(fw.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1.5 whitespace-pre-wrap leading-relaxed">
                      {fw.notes}
                    </p>
                    <div className="flex items-center text-[10px] text-gray-400 mt-2 font-medium">
                      <User className="w-3 h-3 mr-1" />
                      {fw.completed_by_name || 'System'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
