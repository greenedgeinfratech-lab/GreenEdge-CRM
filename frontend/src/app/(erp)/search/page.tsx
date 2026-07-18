import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchPage() {
  const industries = [
    "Associations",
    "Auto & Auto Components",
    "Banking & Finance",
    "Chemicals & Pharmaceuticals",
    "Construction & Realty",
    "Consultation & Training",
    "Electricals",
    "Electronics",
    "Engineering & Machinery",
    "Food & Agriculture",
    "Gems & Jewellery"
  ];

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-4 border-b border-gray-200">
        <div>
          <h2 className="text-sm text-gray-500 mb-1">Biziverse B2B Network</h2>
          <h1 className="text-2xl text-gray-800 font-medium">Supplier Search</h1>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Select Industry & Segment" 
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="mt-2 text-gray-500 text-sm mb-2 px-2">
        Quick Search
      </div>

      {/* Columns Area */}
      <div className="flex flex-col md:flex-row gap-6 px-2">
        
        {/* Column 1: Industry */}
        <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Select Industry</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <ul className="text-sm text-gray-700">
              {industries.map((item, index) => (
                <li key={index} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Column 2: Segment */}
        <div className="flex-1 bg-white border border-gray-200 shadow-sm rounded flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Select Segment</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="p-4">
            <div className="bg-[#f8f9fa] border border-gray-200 px-4 py-3 inline-block rounded text-sm text-gray-600 w-full text-center">
              Please choose an industry.
            </div>
          </div>
        </div>

        {/* Column 3: Location */}
        <div className="w-full md:w-72 flex flex-col gap-4">
          <div className="bg-white border border-gray-200 shadow-sm rounded p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Location</h3>
            
            <div className="flex items-center border border-gray-300 rounded text-sm px-3 py-2 justify-between cursor-pointer">
              <span>All India</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <button className="bg-[#e86c00] text-white py-3 rounded font-medium hover:bg-[#b04a10] shadow-sm flex items-center justify-center">
            <Search className="w-4 h-4 mr-2" /> Search
          </button>
        </div>

      </div>

    </div>
  );
}
