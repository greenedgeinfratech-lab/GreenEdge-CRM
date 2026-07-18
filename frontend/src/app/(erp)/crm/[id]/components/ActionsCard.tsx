'use client';

import React from 'react';
import { 
  UserPlus, FileText, FileCheck, ShoppingCart, 
  Receipt, PlayCircle, History, MessageSquare, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionsCardProps {
  onAssign: () => void;
  onUpdateStatus: () => void;
  onBusinessHistory: () => void;
}

export default function ActionsCard({ onAssign, onUpdateStatus, onBusinessHistory }: ActionsCardProps) {
  
  const futureModules = [
    { name: 'Quote', icon: FileText, color: 'text-blue-500' },
    { name: 'PI', icon: FileCheck, color: 'text-indigo-500' },
    { name: 'Order', icon: ShoppingCart, color: 'text-green-500' },
    { name: 'Invoice', icon: Receipt, color: 'text-purple-500' },
  ];

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <PlayCircle className="w-4 h-4 mr-2 text-[#f97316]" />
          Quick Actions
        </h2>
      </div>
      <div className="p-4 flex-1">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button 
            variant="outline" 
            className="w-full justify-start text-gray-700 font-medium h-10 border-gray-200 hover:bg-gray-50"
            onClick={onAssign}
          >
            <UserPlus className="w-4 h-4 mr-2 text-blue-500" />
            Assign Lead
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-gray-700 font-medium h-10 border-gray-200 hover:bg-gray-50"
            onClick={onUpdateStatus}
          >
            <MessageSquare className="w-4 h-4 mr-2 text-green-500" />
            Update Status
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start text-gray-700 font-medium h-10 border-gray-200 hover:bg-gray-50 col-span-2"
            onClick={onBusinessHistory}
          >
            <History className="w-4 h-4 mr-2 text-purple-500" />
            View Business History
          </Button>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            Convert To (ERP Modules)
          </p>
          <div className="grid grid-cols-2 gap-3 relative group">
            {futureModules.map((mod) => (
              <Button 
                key={mod.name}
                variant="outline" 
                className="w-full justify-start text-gray-400 font-medium h-10 border-gray-100 bg-gray-50 cursor-not-allowed"
                disabled
              >
                <mod.icon className={`w-4 h-4 mr-2 opacity-50 ${mod.color}`} />
                {mod.name}
              </Button>
            ))}
            
            {/* Hover overlay for Coming Soon */}
            <div className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded backdrop-blur-[1px]">
              <span className="flex items-center text-sm font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                <AlertCircle className="w-4 h-4 mr-1.5 text-[#f97316]" />
                Coming in Phase 2
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
