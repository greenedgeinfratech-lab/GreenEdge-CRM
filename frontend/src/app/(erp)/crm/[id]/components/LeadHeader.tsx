'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Star, StarOff, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CRM_KEYS, LEAD_MUTATION_INVALIDATIONS } from '@/lib/crmQueryKeys';
import { leadsApi } from '@/services/crmService';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';

interface LeadHeaderProps {
  leadId: string;
  lead: any;
  onEdit: () => void;
}

export default function LeadHeader({ leadId, lead, onEdit }: LeadHeaderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const starMutation = useMutation({
    mutationFn: () => leadsApi.toggleStar(leadId),
    onSuccess: () => {
      LEAD_MUTATION_INVALIDATIONS.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.commandCenter(leadId) });
      showToast(lead.is_starred ? 'Removed from starred' : 'Added to starred');
    },
    onError: () => showToast('Failed to update star status', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(leadId),
    onSuccess: () => {
      LEAD_MUTATION_INVALIDATIONS.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      showToast('Lead deleted successfully');
      router.push('/crm');
    },
    onError: () => showToast('Failed to delete lead', 'error'),
  });

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Delete Lead',
      message: `Are you sure you want to delete lead ${lead?.lead_number}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (isConfirmed) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6 bg-white p-4 rounded-md shadow-sm border border-gray-100">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={() => router.push('/crm')} className="text-gray-500 hover:text-gray-900 h-8 w-8">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <span>{lead?.full_name}</span>
            {lead?.company_name && (
              <span className="text-gray-500 font-normal text-lg">
                @ {lead.company_name}
              </span>
            )}
          </h1>
          <div className="text-sm text-gray-500 mt-0.5 flex items-center space-x-2">
            <span>Lead ID: {lead?.lead_number}</span>
            <span>•</span>
            <span>Created {new Date(lead?.created_at).toLocaleDateString()}</span>
            {lead?.assigned_to_name && (
              <>
                <span>•</span>
                <span>Assigned to: {lead.assigned_to_name}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300 h-9 bg-white"
          onClick={() => starMutation.mutate()}
          disabled={starMutation.isPending}
        >
          {lead?.is_starred ? (
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-2" />
          ) : (
            <StarOff className="w-4 h-4 text-gray-400 mr-2" />
          )}
          {lead?.is_starred ? 'Starred' : 'Star'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="text-gray-600 border-gray-300 h-9 bg-white"
          onClick={onEdit}
        >
          <Edit className="w-4 h-4 mr-2 text-gray-500" />
          Edit
        </Button>

        <Button
          variant="destructive"
          size="sm"
          className="h-9"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
