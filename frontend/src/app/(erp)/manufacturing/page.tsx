import React from 'react';
import { LineChart, Settings, FileVideo, Play } from 'lucide-react';

export default function ManufacturingPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Production Jobs</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Quick Entry
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Create Job
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <LineChart className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1 Filters */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <div className="flex bg-white rounded border border-[#c85a17] overflow-hidden text-sm">
          <button className="bg-[#c85a17] text-white px-4 py-1.5 font-medium">Pending</button>
          <button className="text-[#c85a17] px-4 py-1.5 font-medium hover:bg-orange-50">History</button>
        </div>
      </div>

      {/* Summary Boxes */}
      <div className="flex gap-2 mt-1">
        <div className="border border-gray-300 bg-white text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm">
          WIP 0
        </div>
        <div className="border border-gray-300 bg-white text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm">
          Overdue 0
        </div>
        <div className="border border-gray-300 bg-white text-gray-700 px-3 py-1.5 rounded text-sm font-medium shadow-sm">
          Total Jobs 0
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="bg-[#e9ecef] border border-gray-200 px-4 py-2 mt-2 inline-block self-start rounded text-sm text-gray-600">
        No production jobs found.
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        
        {/* Card 1 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-48 max-w-[450px]">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Create a Production Job</h3>
            <p className="text-gray-500 text-sm">Create a production job so you can track its progress stage-wise.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Create Job
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-gray-200 rounded p-5 shadow-sm flex flex-col justify-between h-48 max-w-[450px]">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Add a Product</h3>
            <p className="text-gray-500 text-sm">Enter a product for which you want to launch a production job.</p>
          </div>
          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] self-start mt-4">
            + Add Product
          </button>
        </div>

      </div>

      {/* Footer Training Materials */}
      <div className="mt-4">
        <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> What is WIP - Work In Process Number?
          </button>
          
          <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50">
            <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
          </button>
        </div>
      </div>

    </div>
  );
}
