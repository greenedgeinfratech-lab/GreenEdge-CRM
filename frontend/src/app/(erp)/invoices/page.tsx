import React from 'react';
import { Printer, RefreshCw, FileText, Settings, Calendar, ChevronDown, FileVideo, Play } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Invoices</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
            <span>This Month</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          
          <Calendar className="w-5 h-5 text-gray-400 mx-1" />
          
          <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
            <span>All Invoices</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>

          <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
            <span>All Executives</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="flex-1 xl:ml-8"></div>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white p-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <RefreshCw className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#c85a17] text-white p-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <FileText className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#c85a17] text-white p-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <Settings className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            Credit Notes
          </button>

          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Create Invoice
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Create Credit Note
          </button>
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="bg-[#f0f2f5] border-t border-b border-gray-200 px-4 py-2 mt-2 inline-block self-start rounded text-sm text-gray-600">
        No invoices found in this period (Jul-2026)
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-40">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Create a B2B Invoice</h3>
            <p className="text-gray-500 text-sm">Generate an invoice for business clients with detailed billing.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Create B2B Invoice
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-40">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Create a POS/Retail Invoice</h3>
            <p className="text-gray-500 text-sm">Generate a quick invoice for retail customers.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Create POS / Retail Invoice
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-40">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Configure Print Settings</h3>
            <p className="text-gray-500 text-sm">Set up your invoice print header, logo, and layout before creating Invoice.</p>
          </div>
          <button className="bg-[#162032] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#1a2b4c] self-start mt-4 flex items-center">
            <Printer className="w-4 h-4 mr-2" /> Print Settings
          </button>
        </div>

      </div>

      {/* Footer Training Materials */}
      <div className="mt-6">
        <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Sales Invoice - Generate, Edit, Delete, Send, Print
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Sales - Delivery, Dispatch, Stock update
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to update recovery amount when invoice is created?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Sales Invoice - Customization
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            +8 more <ChevronDown className="w-3 h-3 ml-1" />
          </button>
          
          <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50 ml-2">
            <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
          </button>
        </div>
      </div>

    </div>
  );
}
