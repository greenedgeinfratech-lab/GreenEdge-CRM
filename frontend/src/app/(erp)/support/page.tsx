import React from 'react';
import { Search, Printer, ChevronDown, CheckSquare, RefreshCw, RotateCcw } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Support Ticketing</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search" 
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Add
          </button>
          
          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          
          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <CheckSquare className="w-4 h-4" />
          </button>
          
          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <RefreshCw className="w-4 h-4" />
          </button>
          
          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between">
          <span>Pending</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[160px] justify-between">
          <span>Select Executive</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="bg-[#e9ecef] border border-gray-200 px-4 py-2 mt-2 inline-block self-start rounded text-sm text-gray-600">
        No support tickets found.
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-48 max-w-[450px]">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Enter a Support Ticket</h3>
            <p className="text-gray-500 text-sm">Log a new support ticket to track and resolve customer issues efficiently.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Enter Ticket
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-48 max-w-[450px]">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Enter a Customer</h3>
            <p className="text-gray-500 text-sm">Add customer details to keep a record of your clients and maintain their tickets.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Enter Customer
          </button>
        </div>

      </div>

    </div>
  );
}
