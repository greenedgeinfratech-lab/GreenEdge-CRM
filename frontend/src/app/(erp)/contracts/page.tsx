import React from 'react';
import { ChevronDown, FileVideo, Play, FileText } from 'lucide-react';

export default function ContractsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Contracts</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column */}
        <div className="flex-1">
          
          {/* Secondary Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
              <button className="bg-[#c85a17] text-white px-3 py-1.5">Default View</button>
              <button className="text-[#c85a17] px-3 py-1.5 border-l border-[#c85a17] bg-white hover:bg-orange-50">Table View</button>
            </div>

            <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between">
              <span>Active</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Renewals:</span>
              <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between">
                <span>This Month</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1"></div>

            <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
              + Add Contract
            </button>
          </div>

          {/* Empty State Notification */}
          <div className="bg-[#e9ecef] text-gray-600 px-4 py-2 rounded text-sm inline-block mb-4 border border-gray-200">
            No contracts for selected filters
          </div>

          {/* Create Contract Card */}
          <div className="bg-white border border-gray-200 rounded shadow-sm p-5 max-w-lg mb-8">
            <h3 className="font-semibold text-gray-800 text-lg mb-2">Click here to add a contract.</h3>
            <p className="text-gray-500 text-sm mb-4">Generate a contract for business clients with details.</p>
            <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10]">
              + Create Contract
            </button>
          </div>

          {/* Footer Materials */}
          <div>
            <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to manage Service Contracts?
              </button>
              
              <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50 ml-2">
                <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
              </button>
            </div>

            <h3 className="text-gray-800 font-medium mb-3">Learning Materials</h3>
            <div className="bg-white border border-gray-200 rounded shadow-sm p-4 w-full max-w-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>How to manage Service Contracts?</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-4 mt-14 lg:mt-0">
          
          <div className="bg-white border border-gray-200 rounded shadow-sm p-6 text-center">
            <div className="text-gray-600 mb-1 text-sm">Renewals This Month</div>
            <div className="text-xl font-bold text-[#162032]">0 (₹ 0)</div>
          </div>

          <div className="bg-white border border-gray-200 rounded shadow-sm p-6 text-center">
            <div className="text-gray-600 mb-1 text-sm">Renewals Next Month</div>
            <div className="text-xl font-bold text-[#162032]">0 (₹ 0)</div>
          </div>

          <div className="bg-white border border-gray-200 rounded shadow-sm p-6 text-center">
            <div className="text-gray-600 mb-1 text-sm">Renewals 12 Months</div>
            <div className="text-xl font-bold text-[#162032]">0 (₹ 0)</div>
          </div>

        </div>
      </div>

    </div>
  );
}
