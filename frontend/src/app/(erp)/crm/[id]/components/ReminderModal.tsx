'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import { usersApi } from '@/services/userService';
import { ReminderType, ReminderPriority, ReminderCreatePayload } from '@/interfaces/crm';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ReminderCreatePayload) => void;
  isLoading?: boolean;
}

export default function ReminderModal({ isOpen, onClose, onSubmit, isLoading }: ReminderModalProps) {
  const [title, setTitle] = useState('');
  const [reminderType, setReminderType] = useState<ReminderType>('call');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [remindAtDate, setRemindAtDate] = useState('');
  const [remindAtTime, setRemindAtTime] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const { data: employeesData } = useQuery({
    queryKey: CRM_KEYS.employees(),
    queryFn: () => usersApi.listEmployees().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
  
  const employeesList = (employeesData as any)?.data?.results || (employeesData as any)?.data || (employeesData as any)?.results || employeesData || [];
  const employees = Array.isArray(employeesList) ? employeesList : [];

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setReminderType('call');
      setPriority('medium');
      setDescription('');
      setAssignedTo('');
      
      // Default to tomorrow 10:00 AM
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      tmrw.setHours(10, 0, 0, 0);
      
      setRemindAtDate(tmrw.toISOString().split('T')[0]);
      setRemindAtTime('10:00');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !remindAtDate || !remindAtTime) return;

    // Combine date and time
    const dateTime = new Date(`${remindAtDate}T${remindAtTime}`);

    onSubmit({
      title: title.trim(),
      reminder_type: reminderType,
      priority,
      remind_at: dateTime.toISOString(),
      description: description.trim() || undefined,
      assigned_to: assignedTo || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          <DialogDescription>
            Create a new reminder for this lead.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Call to discuss pricing"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
                value={reminderType}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
              >
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="visit">Visit</option>
                <option value="meeting">Meeting</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ReminderPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
                value={remindAtDate}
                onChange={(e) => setRemindAtDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
                value={remindAtTime}
                onChange={(e) => setRemindAtTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign To (Optional)
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">-- Self (Default) --</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any details about this reminder..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#f97316] hover:bg-[#ea580c] text-white" disabled={isLoading || !title.trim() || !remindAtDate || !remindAtTime}>
              {isLoading ? 'Saving...' : 'Set Reminder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
