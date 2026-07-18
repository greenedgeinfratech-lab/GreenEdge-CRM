import React from 'react';
import { Search, ChevronDown, MessageCircle, Mail, Calendar, FileVideo } from 'lucide-react';

export default function SuppliersPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 bg-white p-3 border-b border-gray-200">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center space-x-4 text-xl text-gray-800">
            <span>Suppliers</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[180px] justify-between">
              <span>All Executives</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[180px] justify-between">
              <span>All Cities</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[180px] justify-between">
              <span>All States</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              + Enter Supplier
            </button>
            
            <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
              Appointments
            </button>
            
            <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
              ✓ Import Suppliers
            </button>

            <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
              <Calendar className="w-4 h-4" />
            </button>
          </div>

          <div className="flex space-x-2 mt-1">
            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              Supplier Invoices
            </button>
            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              Purchase Orders
            </button>
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mt-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3 text-center">Relation</th>
              <th className="px-4 py-3 text-center">Last Talk</th>
              <th className="px-4 py-3">Next Action</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* Rows */}
            {[
              { name: 'TITAN SOLAR', actions: ['mail'] },
              { name: 'SAVAS TECHNOLOGY TECHNOLOGY', actions: ['wa', 'mail'] },
              { name: 'RS STEEL', actions: ['wa', 'mail'] },
              { name: 'R.k flex', actions: ['wa', 'mail'] },
              { name: 'AISHA LIGHTS / AISHA LIGHTS', actions: ['wa', 'mail'] },
              { name: 'AISHA LIGHTS / AISHA LIGHTS', actions: ['mail'] },
              { name: 'AV COMPUTER SERVICE / AV COMPUTER SERVICE', actions: ['wa'] },
              { name: 'Amit Hardware and Peripherals / Amit Hardware', actions: ['wa', 'mail'], highlighted: true },
              { name: 'Apex computer / Puneet Gupta', actions: ['wa', 'mail'] },
              { name: 'Arise Enterprises / Arise Enterprises', actions: ['mail'] },
            ].map((row, idx) => (
              <tr key={idx} className={`text-gray-700 hover:bg-gray-50 ${row.highlighted ? 'bg-orange-50/50' : ''}`}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-center">
                  <div className="w-3 h-3 bg-green-600 mx-auto rounded-sm"></div>
                </td>
                <td className="px-4 py-3 text-center">
                  {row.highlighted ? (
                    <span className="text-gray-500 cursor-pointer text-xs">+ Enter</span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.highlighted ? (
                    <span className="text-gray-500 cursor-pointer text-xs">+ Set</span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
                <td className="px-4 py-3 flex justify-end items-center space-x-1">
                  {row.actions.includes('wa') && (
                    <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                  )}
                  {row.actions.includes('mail') && (
                    <button className="p-1 bg-orange-100 text-orange-700 rounded"><Mail className="w-4 h-4" /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Details */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-2">
        <div>
          <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Customers Related
            </button>
            <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> What is the usefulness of Connections?
            </button>
            <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
              <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to add a branch?
            </button>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center border border-gray-200 rounded mt-4 md:mt-0 overflow-hidden bg-white text-sm">
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-400 hover:bg-gray-50">«</button>
          <button className="px-3 py-1.5 border-r border-gray-200 bg-[#162032] text-white">1</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">4</button>
          <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50">»</button>
        </div>
      </div>

    </div>
  );
}
