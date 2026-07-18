import React from 'react';
import { Search, ChevronDown, Smile, MessageCircle, Mail, Edit3, Grid, FileVideo } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Customers</span>
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
            ✓ Import Customers
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Secondary Filters */}
      <div className="flex flex-wrap items-center gap-2">
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
            {/* Row 1 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Jeetendra Bahadur</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 2 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Ratneshwari Saraswat</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 3 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Sarvesh Devi</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Mail className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 4 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Sunita Devi</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 5 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Sunita</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 6 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Sudha Devi</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
            {/* Row 7 */}
            <tr className="hover:bg-gray-50 text-gray-700">
              <td className="px-4 py-3 font-medium">Avani Edu Solutions Pvt. Ltd</td>
              <td className="px-4 py-3 text-center">
                <div className="w-3 h-3 bg-[#e86c00] mx-auto rounded-sm"></div>
              </td>
              <td className="px-4 py-3 text-center">
                <Smile className="w-5 h-5 text-gray-300 mx-auto" />
              </td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 flex justify-end items-center space-x-1">
                <button className="p-1 bg-green-100 text-green-700 rounded"><MessageCircle className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Mail className="w-4 h-4" /></button>
                <button className="p-1 bg-orange-100 text-orange-700 rounded"><Edit3 className="w-4 h-4" /></button>
              </td>
            </tr>
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
        <div className="flex items-center border border-gray-200 rounded mt-4 md:mt-0 overflow-hidden bg-white text-sm mt-6">
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-400 hover:bg-gray-50">«</button>
          <button className="px-3 py-1.5 border-r border-gray-200 bg-[#162032] text-white">1</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">2</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">3</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">4</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">5</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">6</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">7</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">8</button>
          <button className="px-3 py-1.5 border-r border-gray-200 text-gray-600 hover:bg-gray-50">9</button>
          <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50">»</button>
        </div>
      </div>

    </div>
  );
}
