'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { CRM_KEYS, LEAD_MUTATION_INVALIDATIONS } from '@/lib/crmQueryKeys';
import { crmConfigApi, leadsApi } from '@/services/crmService';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';

interface LeadPipelineProps {
  leadId: string;
  currentStageId?: string;
  isWon?: boolean;
  isLost?: boolean;
}

export default function LeadPipeline({ leadId, currentStageId, isWon, isLost }: LeadPipelineProps) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();

  const { data: stagesData } = useQuery({
    queryKey: CRM_KEYS.stages(),
    queryFn: () => crmConfigApi.getStages().then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });

  const stages = stagesData?.data || [];

  const changeStageMutation = useMutation({
    mutationFn: (stageId: string) => leadsApi.changeStage(leadId, stageId),
    onSuccess: () => {
      LEAD_MUTATION_INVALIDATIONS.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.commandCenter(leadId) });
      showToast('Stage updated successfully');
    },
    onError: () => showToast('Failed to update stage', 'error'),
  });

  const handleStageClick = async (stage: any) => {
    if (stage.id === currentStageId) return;

    if (stage.is_lost) {
      // For lost stage, we should ideally open a modal to capture lost reason.
      // For now, we'll just confirm.
      const isConfirmed = await confirm({
        title: 'Mark as Lost',
        message: 'Are you sure you want to mark this lead as lost?',
        confirmText: 'Mark Lost',
        variant: 'destructive',
      });
      if (!isConfirmed) return;
    } else {
      const isConfirmed = await confirm({
        title: 'Change Stage',
        message: `Move lead to ${stage.name}?`,
        confirmText: 'Move',
      });
      if (!isConfirmed) return;
    }

    changeStageMutation.mutate(stage.id);
  };

  if (!stages.length) return null;

  // Find index of current stage to determine which are "completed"
  const currentIndex = stages.findIndex((s: any) => s.id === currentStageId);

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center space-x-1 min-w-max">
          {stages.map((stage: any, index: number) => {
            const isCurrent = stage.id === currentStageId;
            const isCompleted = currentIndex > index && !isWon && !isLost;
            const isTerminal = stage.is_won || stage.is_lost;

            let bgColor = 'bg-gray-100';
            let textColor = 'text-gray-500';
            let borderColor = 'border-gray-200';

            if (isCurrent) {
              bgColor = stage.is_won ? 'bg-green-600' : stage.is_lost ? 'bg-red-600' : 'bg-[#162032]';
              textColor = 'text-white';
              borderColor = stage.is_won ? 'border-green-600' : stage.is_lost ? 'border-red-600' : 'border-[#162032]';
            } else if (isCompleted) {
              bgColor = 'bg-green-50';
              textColor = 'text-green-700';
              borderColor = 'border-green-200';
            }

            // Optional: color from DB if provided and active
            if (isCurrent && !isTerminal && stage.color) {
              // We could apply custom inline styles here, but Tailwind classes are safer for contrast
              // We'll stick to our theme colors for active states.
            }

            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => handleStageClick(stage)}
                  disabled={changeStageMutation.isPending}
                  className={`
                    flex items-center px-4 py-2 text-sm font-medium rounded-full border transition-colors
                    ${bgColor} ${textColor} ${borderColor}
                    ${!isCurrent ? 'hover:bg-gray-200 hover:border-gray-300' : ''}
                    ${changeStageMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  {isCompleted && <Check className="w-4 h-4 mr-1.5" />}
                  {stage.name}
                </button>
                {index < stages.length - 1 && (
                  <div className={`w-8 h-px ${isCompleted ? 'bg-green-300' : 'bg-gray-300'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
