import React from 'react';
import Link from 'next/link';
import { Search, Printer, Filter, RefreshCw, FileText, ChevronDown, MessageCircle, Edit3 } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Orders</span>
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
          
          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Printer className="w-4 h-4 mr-1" /> Print Settings
          </button>
          
          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Filter className="w-4 h-4" />
          </button>
          
          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <RefreshCw className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <FileText className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <span className="w-4 h-4 flex items-center justify-center">↺</span>
          </button>

          <Link href="/orders/new">
            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              + Enter Order
            </button>
          </Link>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Enter Quick Order
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Enter Delivery
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
          <button className="bg-white text-[#c85a17] px-3 py-1">Commitment View (Pending)</button>
          <button className="bg-[#c85a17] text-white px-3 py-1 border-l border-[#c85a17]">Item View</button>
          <button className="bg-white text-[#c85a17] px-3 py-1 border-l border-[#c85a17]">Summary View</button>
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1 ml-2">
          <span className="mr-8">Pending</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2">
        <div className="bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium">
          Overdue 1
        </div>
        <div className="bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium">
          Today 0
        </div>
        <div className="bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium">
          Tomorrow 0
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mt-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Order No.</th>
              <th className="px-4 py-3">Cstr P.O.</th>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Due Date</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Pndg</th>
              <th className="px-4 py-3 text-right">Done</th>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3 text-right">Total (₹)</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 w-64 leading-tight">Madhu Rani Bharadwaj / Mr. Madhu Rani Bharadwaj</td>
              <td className="px-4 py-3">1</td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 w-64 leading-tight">540 WATT Mono Half Cut Bifacial Solar Module</td>
              <td className="px-4 py-3 text-red-600">23-Aug-24</td>
              <td className="px-4 py-3 text-right">6</td>
              <td className="px-4 py-3 text-right">6</td>
              <td className="px-4 py-3 text-right">0</td>
              <td className="px-4 py-3">nos</td>
              <td className="px-4 py-3 text-right">70,828.80</td>
              <td className="px-4 py-3">Received</td>
              <td className="px-4 py-3 flex justify-end space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}
