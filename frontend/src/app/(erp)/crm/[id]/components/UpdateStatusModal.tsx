'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (status: string) => void;
  currentStatus?: string;
  isLoading?: boolean;
}

export default function UpdateStatusModal({ isOpen, onClose, onSubmit, currentStatus, isLoading }: UpdateStatusModalProps) {
  const [status, setStatus] = useState('active');

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus || 'active');
    }
  }, [isOpen, currentStatus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!status) return;
    onSubmit(status);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Lead Status</DialogTitle>
          <DialogDescription>
            Change the operational status of this lead. (Note: this is different from the Pipeline Stage).
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="new">New</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#f97316] hover:bg-[#ea580c] text-white" disabled={isLoading || status === currentStatus}>
              {isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
