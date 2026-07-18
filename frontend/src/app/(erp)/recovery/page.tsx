import React from 'react';
import { Search, Settings, FileVideo, Play, Bell, IndianRupee, MessageCircle, Mail } from 'lucide-react';

export default function RecoveryPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Recovery</span>
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
            + Enter Customer
          </button>
          
          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            Appointments
          </button>

          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            + Update Amounts
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-3 py-2 border-b border-gray-200">
        <div className="border border-green-600 text-green-700 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Total Receivables : ₹ 8,14,578
        </div>
        
        <label className="flex items-center text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" className="mr-2 rounded border-gray-300" />
          Show only non-zero
        </label>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mt-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3 w-8"></th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3 text-center">Reminder</th>
              <th className="px-4 py-3 text-center">Internal Notes</th>
              <th className="px-4 py-3">Executive</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Row 1 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
              <td className="px-4 py-3 leading-tight">Ruchir saxena / Ruchir Saxena</td>
              <td className="px-4 py-3 text-right">2,00,000.00</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3">Jitendra Bharadwaj</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-3">
                <button className="flex items-center text-[#c85a17] text-xs font-medium"><Bell className="w-3.5 h-3.5 mr-1" /> Remind</button>
                <button className="flex items-center text-green-700 text-xs font-medium"><IndianRupee className="w-3.5 h-3.5 mr-1" /> Receive</button>
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
              <td className="px-4 py-3 leading-tight">Vijendra Pratap Singh</td>
              <td className="px-4 py-3 text-right">1,95,000.00</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3">Jitendra Bharadwaj</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-3">
                <button className="flex items-center text-[#c85a17] text-xs font-medium"><Bell className="w-3.5 h-3.5 mr-1" /> Remind</button>
                <button className="flex items-center text-green-700 text-xs font-medium"><IndianRupee className="w-3.5 h-3.5 mr-1" /> Receive</button>
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 3 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
              <td className="px-4 py-3 leading-tight">Madhu Rani Bharadwaj / Madhu Rani Bharadwaj</td>
              <td className="px-4 py-3 text-right">1,95,000.00</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3 text-center">-</td>
              <td className="px-4 py-3">Gyanendra Mishra</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-3">
                <button className="flex items-center text-[#c85a17] text-xs font-medium"><Bell className="w-3.5 h-3.5 mr-1" /> Remind</button>
                <button className="flex items-center text-green-700 text-xs font-medium"><IndianRupee className="w-3.5 h-3.5 mr-1" /> Receive</button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Mail className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row Empty */}
            <tr className="hover:bg-gray-50 text-gray-700 bg-[#fef7ec]">
              <td className="px-4 py-3"><input type="checkbox" className="rounded border-gray-300" /></td>
              <td className="px-4 py-3 leading-tight">Sunita Devi</td>
              <td className="px-4 py-3 text-right"><span className="text-blue-600 font-medium cursor-pointer">+ Set</span></td>
              <td className="px-4 py-3 text-center"><span className="text-blue-600 font-medium cursor-pointer">+ Set</span></td>
              <td className="px-4 py-3 text-center"><span className="text-blue-600 font-medium cursor-pointer">+ Enter</span></td>
              <td className="px-4 py-3">Jitendra Bharadwaj</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-3">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col md:flex-row justify-between items-center mt-4">
        <div>
          <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to see non-zero recovery only?
            </button>
            <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to update recovery amount when invoice is created?
            </button>
            <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50 ml-2">
              <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
            </button>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center border border-gray-200 rounded mt-4 md:mt-0 overflow-hidden bg-white">
          <button className="px-3 py-1 border-r border-gray-200 text-gray-400 hover:bg-gray-50">«</button>
          <button className="px-3 py-1 border-r border-gray-200 bg-[#162032] text-white">1</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">4</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">5</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">6</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">7</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">8</button>
          <button className="px-3 py-1 border-r border-gray-200 text-gray-600 hover:bg-gray-50">9</button>
          <button className="px-3 py-1 text-gray-600 hover:bg-gray-50">»</button>
        </div>
      </div>

    </div>
  );
}
