import React from 'react';
import { Search, ChevronDown, FileText, List, LineChart, Edit3, FileVideo } from 'lucide-react';

export default function PurchasesPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Supplier Invoices</span>
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
          
          <button className="flex items-center bg-[#c85a17] text-white p-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <FileText className="w-4 h-4" />
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white p-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <List className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            GST 3B
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <LineChart className="w-4 h-4" />
          </button>

          <div className="flex-1 xl:ml-8"></div>

          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Enter Supplier Invoice
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Enter Debit Note
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
          <span>This Month</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
          <span>All Executives</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Count 2
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Pre-Tax ₹ 6,34,920.00
        </div>
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Total ₹ 6,66,666.00
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mt-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Invoice No.</th>
              <th className="px-4 py-3">Invoice Date</th>
              <th className="px-4 py-3 text-right">Taxable (₹)</th>
              <th className="px-4 py-3 text-right">Amount (₹)</th>
              <th className="px-4 py-3">Entered by</th>
              <th className="px-4 py-3">GSTIN</th>
              <th className="px-4 py-3">Credit Month</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Row 1 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3">SURYANEST ENERGY PRIVATE LIMITED</td>
              <td className="px-4 py-3">Mr SURYANEST</td>
              <td className="px-4 py-3">3</td>
              <td className="px-4 py-3">02-Jul</td>
              <td className="px-4 py-3 text-right">2,25,000.00</td>
              <td className="px-4 py-3 text-right">2,36,250.00</td>
              <td className="px-4 py-3">Jitendra Bharadwaj</td>
              <td className="px-4 py-3">09ABTCS35...</td>
              <td className="px-4 py-3">Jul 2026</td>
              <td className="px-4 py-3 flex justify-end">
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3">NAV Solutions (VISHAL BHASIN)</td>
              <td className="px-4 py-3">Mr Vishal Bhasin</td>
              <td className="px-4 py-3">NAN/2026-27/390</td>
              <td className="px-4 py-3">03-Jul</td>
              <td className="px-4 py-3 text-right">4,09,920.00</td>
              <td className="px-4 py-3 text-right">4,30,416.00</td>
              <td className="px-4 py-3">Jitendra Bharadwaj</td>
              <td className="px-4 py-3">09ASIPB45...</td>
              <td className="px-4 py-3">Jul 2026</td>
              <td className="px-4 py-3 flex justify-end">
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Details */}
      <div className="mt-4">
        <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to Update Stock after/ while Entering Supplier Invoice?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Not able to upload JSON as it shows Incorrect HSN(s)!
          </button>
        </div>
      </div>

    </div>
  );
}
