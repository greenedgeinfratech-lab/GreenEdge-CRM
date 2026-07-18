'use client';

import React from 'react';
import { Calendar, CheckSquare, Plus, Clock, MapPin, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AppointmentsCardProps {
  appointments: any[];
  onCreate: () => void;
  onComplete: (appt: any) => void;
  onReschedule: (appt: any) => void;
  onCancel: (appt: any) => void;
}

export default function AppointmentsCard({ appointments, onCreate, onComplete, onReschedule, onCancel }: AppointmentsCardProps) {
  
  // Show only pending/scheduled appointments
  const activeAppts = appointments.filter((a) => a.status === 'scheduled');

  const formatDateTime = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-[#f97316]" />
          Upcoming Appointments
        </h2>
        <Button variant="ghost" size="sm" className="h-7 text-[#f97316] hover:text-[#ea580c] hover:bg-orange-50 px-2" onClick={onCreate}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {activeAppts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-6">
            <Calendar className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">No upcoming appointments</p>
            <p className="text-xs text-gray-400 mt-1">Schedule a meeting or site visit to move this deal forward.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={onCreate}>
              Schedule Appointment
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAppts.map((appt) => {
              const start = formatDateTime(appt.start_time);
              return (
                <div key={appt.id} className="border border-gray-200 rounded-md p-3 relative bg-white hover:border-[#f97316] transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm">{appt.title}</h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 uppercase mt-1">
                        {appt.appointment_type_display}
                      </span>
                    </div>
                    
                    {/* Action buttons appear on hover on desktop */}
                    <div className="flex items-center space-x-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity bg-white">
                      <button onClick={() => onComplete(appt)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Mark Done">
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => onReschedule(appt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Reschedule">
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button onClick={() => onCancel(appt)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancel">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-start text-xs text-gray-600">
                      <Clock className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                      <span>{start.date} at {start.time}</span>
                    </div>
                    {appt.location && (
                      <div className="flex items-start text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400 shrink-0" />
                        <span className="truncate">{appt.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
