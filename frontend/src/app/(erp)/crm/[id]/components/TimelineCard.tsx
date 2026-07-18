'use client';

import React, { useState } from 'react';
import { Activity, ChevronDown, ChevronUp, User, Calendar, MessageCircle, FileText, CheckCircle2, RotateCcw } from 'lucide-react';
import { LeadTimelineEvent } from '@/interfaces/crm';

interface TimelineCardProps {
  timeline: LeadTimelineEvent[];
}

export default function TimelineCard({ timeline }: TimelineCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Take first 3 for collapsed view
  const visibleTimeline = isExpanded ? timeline : timeline.slice(0, 3);
  const hasMore = timeline.length > 3;

  const getIcon = (type: string) => {
    switch (type) {
      case 'lead_created': return <User className="w-4 h-4 text-green-500" />;
      case 'stage_changed': return <RotateCcw className="w-4 h-4 text-blue-500" />;
      case 'appointment_created': 
      case 'appointment_completed':
      case 'appointment_cancelled': return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'followup_added': return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case 'note_added': return <FileText className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  // Group by date
  const groupedTimeline = visibleTimeline.reduce((acc: any, event: any) => {
    const dateStr = new Date(event.performed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(event);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col mb-6">
      <div 
        className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Activity className="w-4 h-4 mr-2 text-[#f97316]" />
          Activity Timeline
          <span className="ml-2 bg-gray-200 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
            {timeline.length} events
          </span>
        </h2>
        <button className="text-gray-400 hover:text-gray-600">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>
      
      <div className={`p-4 transition-all duration-300 ${isExpanded ? 'max-h-[600px] overflow-y-auto custom-scrollbar' : ''}`}>
        {timeline.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-2">No activity recorded yet.</p>
        ) : (
          <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
            {Object.entries(groupedTimeline).map(([date, events]: [string, any]) => (
              <div key={date} className="relative">
                <span className="inline-block bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-1 rounded ml-4 mb-4">
                  {date}
                </span>
                <div className="space-y-4">
                  {events.map((event: any) => (
                    <div key={event.id} className="relative pl-6 group">
                      <span className="absolute -left-3.5 top-0.5 bg-white border border-gray-200 rounded-full p-1 z-10 group-hover:border-[#f97316] transition-colors">
                        {getIcon(event.event_type)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        {event.body && (
                          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{event.body}</p>
                        )}
                        <div className="flex items-center text-[10px] text-gray-400 mt-1 font-medium">
                          {event.performed_by_name || 'System'} • {new Date(event.performed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {!isExpanded && hasMore && (
          <div className="mt-4 pt-4 border-t border-gray-50 text-center">
            <button 
              onClick={() => setIsExpanded(true)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800"
            >
              View {timeline.length - 3} older events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
