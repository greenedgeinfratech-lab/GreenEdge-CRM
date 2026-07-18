'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import { usersApi } from '@/services/userService';

interface AssignLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeId: string, reason: string) => void;
  currentAssigneeId?: string;
  isLoading?: boolean;
}

export default function AssignLeadModal({ isOpen, onClose, onSubmit, currentAssigneeId, isLoading }: AssignLeadModalProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [reason, setReason] = useState('');

  const { data: employeesData } = useQuery({
    queryKey: CRM_KEYS.employees(),
    queryFn: () => usersApi.listEmployees().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
  
  const employeesList = (employeesData as any)?.data?.results || (employeesData as any)?.data || (employeesData as any)?.results || employeesData || [];
  const employees = Array.isArray(employeesList) ? employeesList : [];

  useEffect(() => {
    if (isOpen) {
      setEmployeeId(currentAssigneeId || '');
      setReason('');
    }
  }, [isOpen, currentAssigneeId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    onSubmit(employeeId, reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Lead</DialogTitle>
          <DialogDescription>
            Reassign this lead to a different team member.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Assignee <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="" disabled>-- Select User --</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name} {emp.id === currentAssigneeId ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for reassignment (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Workload balancing"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#f97316] hover:bg-[#ea580c] text-white" disabled={isLoading || !employeeId || employeeId === currentAssigneeId}>
              {isLoading ? 'Assigning...' : 'Assign Lead'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
