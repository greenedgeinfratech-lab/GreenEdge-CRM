import React from 'react';
import { Check, Edit3, X } from 'lucide-react';

export default function StorePage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Setup Website</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex w-48 h-8 rounded overflow-hidden shadow-sm">
            <div className="w-1/2 bg-[#e86c00] flex items-center justify-center text-white text-xs font-medium">50%</div>
            <div className="w-1/2 bg-orange-100"></div>
          </div>
          
          <button className="bg-yellow-500 text-white px-6 py-1.5 rounded text-sm font-medium hover:bg-yellow-600 shadow-sm">
            Preview
          </button>
          
          <button className="bg-green-600 text-white px-6 py-1.5 rounded text-sm font-medium hover:bg-green-700 shadow-sm">
            Save
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 mt-4 bg-white p-6 rounded shadow-sm min-h-[600px]">
        
        {/* Left Navigation Steps */}
        <div className="w-full md:w-64 flex flex-col gap-6">
          <div className="flex items-center space-x-3 text-[#e86c00] font-medium">
            <div className="w-6 h-6 rounded-full bg-[#e86c00] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>Basic</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-[#e86c00] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>Products & Market</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-[#e86c00] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>Purchases</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs">
              4
            </div>
            <span>Header</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-gray-300 text-white flex items-center justify-center text-xs">
              5
            </div>
            <span>Offer</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-[#e86c00] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>Catalog</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-400 font-medium">
            <div className="w-6 h-6 rounded-full bg-[#e86c00] text-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <span>About Company</span>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="flex-1 max-w-[900px] border border-gray-200 rounded overflow-hidden">
          
          {/* Header Bar */}
          <div className="flex border-b border-gray-200">
            <div className="bg-[#e86c00] text-white px-6 py-2 w-64 rounded-br-3xl font-medium text-sm">
              Basic Info
            </div>
            <div className="text-gray-400 text-sm px-4 py-2 flex-1">
              Set up the tagline, business description, logo, etc.
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              
              {/* Row 1 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Company Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  defaultValue="Greenedge Infratech Pvt. Ltd." 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#e86c00]"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Tagline</label>
                <input 
                  type="text" 
                  defaultValue="Nature Protects, if she is Protected" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#e86c00]"
                />
              </div>

              {/* Row 2 */}
              <div className="flex justify-center items-center mt-2 relative">
                <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center text-white shadow-md relative">
                  {/* Mock Logo Graphic */}
                  <div className="flex flex-col items-center">
                    <span className="text-3xl font-bold">G</span>
                    <span className="text-xs">GreenEdge</span>
                  </div>
                </div>
                <button className="absolute top-4 right-8 text-green-500 hover:text-green-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2">
                <label className="flex items-center text-sm text-gray-600 mb-1">
                  Description
                  <div className="bg-yellow-500 text-white rounded-full p-1 ml-2">
                    <Edit3 className="w-3 h-3" />
                  </div>
                </label>
                <p className="text-sm text-gray-600 leading-relaxed mt-2">
                  From initial consultation to ongoing maintenance, we provide end-to-end solar energy services tailored to your specific needs and budget.
                </p>
              </div>

              {/* Row 3 */}
              <div>
                <label className="block text-sm text-gray-600 mb-1">Location <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    defaultValue="Aligarh" 
                    className="w-1/2 border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#e86c00]"
                  />
                  <input 
                    type="text" 
                    defaultValue="Uttar Pradesh" 
                    readOnly
                    className="w-1/2 bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div className="mt-4">
                <label className="block text-sm text-gray-600 mb-1">GSTIN</label>
                <input 
                  type="text" 
                  defaultValue="09AAGCG2B02H1Z5" 
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-[#e86c00]"
                />
              </div>

            </div>
          </div>
          
        </div>
      </div>

      {/* Floating Bottom Save Button */}
      <div className="flex justify-end pr-4">
        <button className="bg-green-600 text-white px-8 py-2 rounded text-sm font-medium hover:bg-green-700 shadow-md">
          Save
        </button>
      </div>

    </div>
  );
}
