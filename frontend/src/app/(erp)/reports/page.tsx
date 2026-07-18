import React from 'react';
import { Search } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Reports</span>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 mt-1 px-2">
        {[
          "Leads & Prospects",
          "Quotations, Orders, Support",
          "Sales & Purchase",
          "Accounts",
          "Inventory",
          "Manufacturing",
          "Tasks"
        ].map((tab, idx) => (
          <button key={idx} className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-8 mt-4 px-2">
        
        {/* Section 1: Leads & Prospects */}
        <div>
          <h2 className="text-lg font-semibold text-[#1a2b4c] border-t-4 border-[#1a2b4c] pt-2 mb-4">
            Leads & Prospects
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">Lead Interactions</div>
              <div className="p-4 text-sm text-gray-600">Monitor interaction efforts by your team with your leads.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">Prospect Interactions</div>
              <div className="p-4 text-sm text-gray-600">Monitor interactions with serious prospects.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">No Interaction</div>
              <div className="p-4 text-sm text-gray-600">Qualified leads with no recent interactions.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">Follow-ups</div>
              <div className="p-4 text-sm text-gray-600">Track pending follow-up activities.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">No Appointments</div>
              <div className="p-4 text-sm text-gray-600">Prospects without any scheduled appointments.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">Missed Appointments</div>
              <div className="p-4 text-sm text-gray-600">Review appointments that were not conducted.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#162032] text-white px-4 py-2 font-medium">Travel History</div>
              <div className="p-4 text-sm text-gray-600">View visits and travel logs of sales team.</div>
            </div>

          </div>
        </div>

        {/* Section 2: Quotations, Orders, Support */}
        <div>
          <h2 className="text-lg font-semibold text-[#c85a17] border-t-4 border-[#c85a17] pt-2 mb-4">
            Quotations, Orders, Support
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#c85a17] text-white px-4 py-2 font-medium">Quote Items Summary</div>
              <div className="p-4 text-sm text-gray-600">View itemized summary of quotations and proforma invoices.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#c85a17] text-white px-4 py-2 font-medium">Order Delay Analysis</div>
              <div className="p-4 text-sm text-gray-600">Review reasons for delay in processing and delivering orders.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-[#c85a17] text-white px-4 py-2 font-medium">Support Delay Analysis</div>
              <div className="p-4 text-sm text-gray-600">Identify and analyze reasons for delay in customer support.</div>
            </div>

          </div>
        </div>

        {/* Section 3: Sales & Purchases */}
        <div>
          <h2 className="text-lg font-semibold text-green-700 border-t-4 border-green-700 pt-2 mb-4">
            Sales & Purchases
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-green-700 text-white px-4 py-2 font-medium">Sales Register</div>
              <div className="p-4 text-sm text-gray-600">Detailed register of all sales invoices.</div>
            </div>

            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col h-32 hover:shadow-md cursor-pointer">
              <div className="bg-green-700 text-white px-4 py-2 font-medium">Purchase Register</div>
              <div className="p-4 text-sm text-gray-600">Detailed register of all supplier invoices.</div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
