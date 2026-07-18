'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LeadFollowupCreatePayload } from '@/interfaces/crm';

interface InteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LeadFollowupCreatePayload) => void;
  isLoading?: boolean;
}

export default function InteractionModal({ isOpen, onClose, onSubmit, isLoading }: InteractionModalProps) {
  const [followupType, setFollowupType] = useState<any>('call');
  const [notes, setNotes] = useState('');
  const [hasNextFollowup, setHasNextFollowup] = useState(false);
  const [nextFollowupDate, setNextFollowupDate] = useState('');

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFollowupType('call');
      setNotes('');
      setHasNextFollowup(false);
      setNextFollowupDate('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) return;

    onSubmit({
      followup_type: followupType,
      notes: notes.trim(),
      next_followup_date: hasNextFollowup && nextFollowupDate ? `${nextFollowupDate}T10:00:00Z` : undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Log Interaction</DialogTitle>
          <DialogDescription>
            Record details of a communication or meeting with this lead.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interaction Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['call', 'email', 'whatsapp', 'visit', 'meeting', 'other'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFollowupType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border ${
                    followupType === type
                      ? 'bg-[#f97316] text-white border-[#f97316]'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes / Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What was discussed?"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-[#f97316] focus:ring-[#f97316]"
                checked={hasNextFollowup}
                onChange={(e) => setHasNextFollowup(e.target.checked)}
              />
              <span className="text-sm font-medium text-gray-700">Schedule next follow-up</span>
            </label>
            
            {hasNextFollowup && (
              <div className="mt-2 pl-6">
                <input
                  type="date"
                  required={hasNextFollowup}
                  className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#f97316] focus:border-[#f97316] text-sm"
                  value={nextFollowupDate}
                  onChange={(e) => setNextFollowupDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">
                  A task will be automatically created for this date.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#f97316] hover:bg-[#ea580c] text-white" disabled={isLoading || !notes.trim()}>
              {isLoading ? 'Saving...' : 'Log Interaction'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
