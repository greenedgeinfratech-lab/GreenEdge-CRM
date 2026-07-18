'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Printer, FileText, Calendar, Bell, Edit3, HelpCircle, FileVideo, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import { quotationsApi } from '@/services/crmService';
import type { Quotation } from '@/interfaces/crm';

function QuotationsContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All Status',
    executive: 'All Executives',
    date_range: 'All Time',
  });

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch quotations from API
  const { data: quotesResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['quotations', filters],
    queryFn: () => quotationsApi.list({
      search: filters.search,
      type: filters.type,
      status: filters.status,
      executive: filters.executive,
      date_range: filters.date_range,
    }),
    staleTime: 10000,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      showToast('Quotation deleted successfully!', 'success');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.detail || 'Failed to delete quotation.', 'error');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this quotation?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSendNotification = (quoteNo: string) => {
    showToast(`Notification for Quote No. ${quoteNo} sent successfully!`, 'success');
  };

  const quotations: Quotation[] = (quotesResponse?.data as any)?.results || (quotesResponse?.data as any)?.data?.results || [];

  // Summary Metrics calculations
  const count = quotations.length;
  const preTaxSum = quotations.reduce((acc, q) => acc + Number(q.total_taxable), 0);
  const totalSum = quotations.reduce((acc, q) => acc + Number(q.grand_total), 0);

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Quotations</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-64 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <FileText className="w-4 h-4" />
          </button>
          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium">
            <span className="w-4 h-4 mr-1 flex items-center justify-center">📈</span>
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-[#f0f2f5] p-2 rounded">
        <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'All' }))}
            className={`${filters.type === 'All' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1`}
          >
            All
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'Quotations' }))}
            className={`${filters.type === 'Quotations' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1 border-l border-[#c85a17]`}
          >
            Quotations
          </button>
          <button 
            onClick={() => setFilters(f => ({ ...f, type: 'Proforma Invoices' }))}
            className={`${filters.type === 'Proforma Invoices' ? 'bg-[#c85a17] text-white' : 'text-[#c85a17]'} px-3 py-1 border-l border-[#c85a17]`}
          >
            Proforma Invoices
          </button>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <Calendar className="w-4 h-4 text-gray-500 mr-2" />
          <select 
            value={filters.date_range}
            onChange={e => setFilters(f => ({ ...f, date_range: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Time">All Time</option>
            <option value="this_month">This Month</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <select 
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Status">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-2 py-1">
          <select 
            value={filters.executive}
            onChange={e => setFilters(f => ({ ...f, executive: e.target.value }))}
            className="outline-none bg-white text-gray-700"
          >
            <option value="All Executives">All Executives</option>
            <option value="Piyush Nirmal">Piyush Nirmal</option>
            <option value="Jitendra Bharadwaj">Jitendra Bharadwaj</option>
            <option value="Gyanendra Mishra">Gyanendra Mishra</option>
          </select>
        </div>
        
        <div className="flex-1"></div>

        <Link href="/quotes/new">
          <button className="flex items-center bg-[#e86c00] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#d96500]">
            + Create Quotation
          </button>
        </Link>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Count {count}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Pre-Tax ₹ {preTaxSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Total ₹ {totalSum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 gap-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading quotations...
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 font-semibold">
            Failed to load quotations from database.
          </div>
        ) : quotations.length === 0 ? (
          <div className="p-8 text-center text-gray-400 font-semibold">
            No quotations found. Click "+ Create Quotation" to get started.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Quote No.</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Amount (₹)</th>
                <th className="px-4 py-3">Valid till</th>
                <th className="px-4 py-3">Issued on</th>
                <th className="px-4 py-3">Issued by</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Executive</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3 font-semibold">{quote.quote_number || '-'}</td>
                  <td className="px-4 py-3">{quote.lead_name || quote.customer_name}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">
                    {Number(quote.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3">{quote.valid_till || '-'}</td>
                  <td className="px-4 py-3">{quote.quote_date || '-'}</td>
                  <td className="px-4 py-3">{quote.issued_by_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.type === 'Proforma Invoice' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {quote.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{quote.sales_credit || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      quote.status === 'Declined' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex justify-end space-x-1 items-center">
                    <button 
                      onClick={() => handleSendNotification(quote.quote_number || 'Draft')}
                      title="Send Notification"
                      className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => router.push(`/quotes/new?id=${quote.id}`)}
                      title="Edit"
                      className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(quote.id)}
                      title="Delete"
                      className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Materials */}
      <div className="mt-4">
        <h3 className="text-gray-800 font-medium mb-2">Training Materials</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Quotations - Generate, Edit, Delete, Print, Send
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to convert Quotation into P.I.?
          </button>
        </div>

        <h3 className="text-gray-800 font-medium mb-2">Help Materials</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileText className="w-4 h-4 mr-2 text-blue-600" /> Quotations
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-600" /> How to create a Quotation?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-blue-600" /> How to generate Invoice from a Quotation?
          </button>
        </div>
        
        <div>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-50">
            <HelpCircle className="w-4 h-4 mr-2 text-gray-700" /> Need Help
          </button>
        </div>
      </div>

    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-4 font-semibold text-gray-500">Loading quotations...</div>}>
      <QuotationsContent />
    </Suspense>
  );
}
