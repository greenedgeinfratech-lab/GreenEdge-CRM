'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CompleteApptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (outcome: string, remarks: string) => void;
  isLoading?: boolean;
}

export default function CompleteApptModal({ isOpen, onClose, onSubmit, isLoading }: CompleteApptModalProps) {
  const [outcome, setOutcome] = useState('Completed successfully');
  const [remarks, setRemarks] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome.trim()) return;
    onSubmit(outcome, remarks);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Appointment</DialogTitle>
          <DialogDescription>
            Record the outcome of this appointment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Outcome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g. Completed successfully, Client not available"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks (Optional)
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#f97316] hover:bg-[#ea580c] text-white" disabled={isLoading || !outcome.trim()}>
              {isLoading ? 'Saving...' : 'Mark as Completed'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
