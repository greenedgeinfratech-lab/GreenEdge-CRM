'use client';

import React from 'react';
import { Briefcase, IndianRupee, Thermometer, Target, Tag } from 'lucide-react';

interface BusinessOpportunityCardProps {
  lead: any;
}

export default function BusinessOpportunityCard({ lead }: BusinessOpportunityCardProps) {
  
  const formatCurrency = (val: number | string | undefined | null) => {
    const num = Number(val);
    if (isNaN(num) || val == null) return '-';
    if (num >= 10_00_000) return `₹${(num / 10_00_000).toFixed(1)}L`;
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num.toFixed(0)}`;
  };

  const priorityBadge = (p: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-700 border-red-200',
      high:   'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-blue-100 text-blue-700 border-blue-200',
      low:    'bg-gray-100 text-gray-600 border-gray-200',
    };
    return map[p] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Briefcase className="w-4 h-4 mr-2 text-[#f97316]" />
          Business Opportunity
        </h2>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-4">
          
          <div className="flex items-start">
            <Target className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Source</p>
              <p className="text-sm font-medium text-gray-900">{lead?.source_name || 'Manual'}</p>
            </div>
          </div>

          <div className="flex items-start">
            <IndianRupee className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Estimated Value</p>
              <p className="text-sm font-medium text-green-600">
                {lead?.estimated_value ? formatCurrency(lead.estimated_value) : 'Not specified'}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <Thermometer className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Priority</p>
              {lead?.priority ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${priorityBadge(lead.priority)}`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                </span>
              ) : (
                <span className="text-sm font-medium text-gray-900">-</span>
              )}
            </div>
          </div>

          <div className="flex items-start">
            <Tag className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {lead?.tags && lead.tags.length > 0 ? (
                  lead.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm font-medium text-gray-400 text-xs">No tags</span>
                )}
              </div>
            </div>
          </div>

          {lead?.requirements && (
            <div className="pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-500 mb-1">Requirements</p>
              <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border border-gray-100 whitespace-pre-wrap">
                {lead.requirements}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
