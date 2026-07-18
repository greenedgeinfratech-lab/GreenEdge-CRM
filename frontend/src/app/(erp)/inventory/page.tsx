import React from 'react';
import { Search, ChevronDown, Check, LogOut, LogIn, Settings, LineChart, Maximize2, FileVideo, Play } from 'lucide-react';

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Action Buttons */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Inventory</span>
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
            <LogOut className="w-4 h-4 mr-1" /> Out / Issue
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <LogIn className="w-4 h-4 mr-1" /> In / Receive
          </button>

          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Add Item
          </button>

          <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            ✓ Import Items
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Settings className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <LineChart className="w-4 h-4" />
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 1 Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex gap-2">
          <button className="bg-gray-500 text-white px-4 py-1.5 rounded text-sm font-medium border border-gray-500">
            All
          </button>
          
          <button className="bg-white text-green-600 px-3 py-1.5 rounded text-sm font-medium border border-green-600 flex items-center">
            <div className="w-2.5 h-2.5 bg-green-600 mr-2"></div> Products
          </button>

          <button className="bg-white text-orange-500 px-3 py-1.5 rounded text-sm font-medium border border-orange-500 flex items-center">
            <div className="w-2.5 h-2.5 bg-orange-500 mr-2"></div> Materials
          </button>

          <button className="bg-white text-[#162032] px-3 py-1.5 rounded text-sm font-medium border border-[#162032] flex items-center">
            <div className="w-2.5 h-2.5 bg-[#162032] mr-2"></div> Spares
          </button>

          <button className="bg-white text-blue-600 px-3 py-1.5 rounded text-sm font-medium border border-blue-600 flex items-center">
            <div className="w-2.5 h-2.5 bg-blue-600 mr-2"></div> Assemblies
          </button>
        </div>

        <div className="border border-orange-500 text-orange-600 bg-white px-3 py-1.5 rounded text-sm font-medium">
          Valuation : Standard Cost
        </div>
      </div>

      {/* Row 2 Filters */}
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
          <span>All Categories</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
        
        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
          <span>All Sub-Categories</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[140px] justify-between">
          <span>All Stock Items</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[160px] justify-between">
          <span>All Importance Levels</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[120px] justify-between">
          <span>All Items</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex items-center ml-2 border border-green-500 rounded overflow-hidden">
          <input 
            type="text" 
            placeholder="Search by Tag" 
            className="px-3 py-1.5 text-sm w-40 focus:outline-none"
          />
          <button className="bg-green-100 p-1.5 px-2 border-l border-green-500 text-green-700 hover:bg-green-200">
            <Check className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mt-2">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3 text-center">Importance</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Rate</th>
              <th className="px-4 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="px-4 py-6">
                <div className="bg-[#e9ecef] border border-gray-200 px-4 py-2 inline-block rounded text-sm text-gray-600">
                  No stock items found.
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        {/* Table Pagination Footer */}
        <div className="flex justify-end items-center p-3 border-t border-gray-200 text-sm text-gray-500 space-x-6">
          <div className="flex items-center">
            <span className="mr-2">Items per page:</span>
            <select className="border-none bg-transparent focus:outline-none font-medium text-gray-700 cursor-pointer">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center space-x-4">
            <span>0 of 0</span>
            <div className="flex space-x-2">
              <button className="text-gray-400 cursor-not-allowed">{'<'}</button>
              <button className="text-gray-400 cursor-not-allowed">{'>'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Training Materials */}
      <div className="mt-4">
        <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
        <div className="flex flex-wrap gap-2 mb-2">
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Getting an alert "Sorry, you cannot enter opening qty for an item in the new Financial Year." while adding an item!
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to print barcode of a material item?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to enter MRP in item price?
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> Not able to delete an item!
          </button>
          <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
            +16 more <ChevronDown className="w-3 h-3 ml-1" />
          </button>
        </div>
        <div>
          <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50">
            <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
          </button>
        </div>
      </div>

    </div>
  );
}
