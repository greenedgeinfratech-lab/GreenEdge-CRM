'use client';

import React from 'react';
import { Phone, Mail, Building, MapPin, Globe, Copy, FileText, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

interface ContactCardProps {
  lead: any;
}

export default function ContactCard({ lead }: ContactCardProps) {
  const { showToast } = useToast();

  const handleCopy = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    showToast(`${type} copied to clipboard`);
  };

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center">
          <Phone className="w-4 h-4 mr-2 text-[#f97316]" />
          Contact Information
        </h2>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-4">
          
          <div className="flex items-start">
            <Phone className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Mobile</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900">{lead?.mobile || '-'}</p>
                {lead?.mobile && (
                  <div className="flex space-x-2">
                    <button onClick={() => handleCopy(lead.mobile, 'Mobile')} className="text-gray-400 hover:text-gray-600">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={`tel:${lead.mobile}`} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                      Call
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <Mail className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Email</p>
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-900 truncate pr-2" title={lead?.email || ''}>
                  {lead?.email || '-'}
                </p>
                {lead?.email && (
                  <div className="flex space-x-2 shrink-0">
                    <button onClick={() => handleCopy(lead.email, 'Email')} className="text-gray-400 hover:text-gray-600">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <a href={`mailto:${lead.email}`} className="text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                      Send
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <Building className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Company</p>
              <p className="text-sm font-medium text-gray-900">{lead?.company_name || '-'}</p>
            </div>
          </div>

          <div className="flex items-start">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Location</p>
              <p className="text-sm font-medium text-gray-900">
                {[lead?.city, lead?.state, lead?.country].filter(Boolean).join(', ') || '-'}
              </p>
            </div>
          </div>

          <div className="flex items-start">
            <FileText className="w-4 h-4 text-gray-400 mt-0.5 mr-3 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">GST / PAN</p>
              <p className="text-sm font-medium text-gray-900">
                {lead?.gst_number ? `GST: ${lead.gst_number}` : lead?.pan_number ? `PAN: ${lead.pan_number}` : '-'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
