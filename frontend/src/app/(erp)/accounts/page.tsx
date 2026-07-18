import React from 'react';
import { Search, BarChart3, Plus, Star, FileVideo, Play, FileText, ClipboardList, Database, RefreshCw, ShoppingCart, Receipt } from 'lucide-react';

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Accounts</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 text-gray-600">
            FY 2026-2027
          </div>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            + Enter Voucher
          </button>
          
          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <ShoppingCart className="w-4 h-4 mr-1" /> Purchases
          </button>

          <button className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]">
            <FileText className="w-4 h-4 mr-1" /> Sales
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        {/* Left Column */}
        <div className="flex-1 max-w-[800px]">
          
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-800">Groups & Ledgers</h2>
            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded border-gray-300" />
                Hide zeroes
              </label>
              <button className="bg-[#c85a17] text-white p-1 rounded hover:bg-[#b04a10]">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden text-sm">
            {[
              { name: 'Current Assets', amount: '29,36,420.77 Db' },
              { name: 'Fixed Assets', amount: '0.00 Db' },
              { name: 'Equity', amount: '0.00 Db' },
              { name: 'Long Term Liabilities', amount: '0.00 Db' },
              { name: 'Short Term Liabilities', amount: '3,96,251.50 Db' },
              { name: 'Direct Income', amount: '0.00 Db' },
              { name: 'Indirect Income', amount: '0.00 Db' },
              { name: 'Sales', amount: '0.00 Db' },
              { name: 'Direct Expense', amount: '3,10,000.00 Cr' },
              { name: 'Indirect Expense', amount: '11,33,505.00 Cr' },
              { name: 'Purchase', amount: '12,75,000.00 Db' }
            ].map((item, index) => (
              <div key={index} className="flex justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 text-gray-700 font-medium">
                <span>{item.name}</span>
                <span>{item.amount}</span>
              </div>
            ))}
          </div>

          <button className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] mt-4">
            + Create Ledger / Sub-Group
          </button>

          {/* Footer Materials */}
          <div className="mt-8">
            <h3 className="text-gray-800 font-medium mb-3">Training Materials</h3>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to delete a Ledger?
              </button>
              <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to import Ledgers?
              </button>
              <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to add or modify opening balances of a Ledger?
              </button>
              <button className="flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                <FileVideo className="w-4 h-4 mr-2 text-gray-500" /> How to manage Ledger?
              </button>
              <button className="flex items-center bg-white border border-green-500 text-green-700 px-3 py-1.5 rounded text-sm font-medium hover:bg-green-50">
                <Play className="w-4 h-4 mr-1 fill-current" /> Watch Training
              </button>
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-[450px] flex flex-col gap-4">
          
          {/* Favourite Ledgers */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Favourite Ledgers</h2>
              <button className="flex items-center bg-[#162032] text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-[#1a2b4c]">
                <Search className="w-3.5 h-3.5 mr-1" /> Find Ledger
              </button>
            </div>
            <div className="p-4 bg-gray-50 text-gray-500 text-sm m-4 rounded border border-gray-100">
              Click <Star className="w-4 h-4 inline mx-1 text-gray-400" /> next to the name of a ledger to mark it as favourite.
            </div>
          </div>

          {/* Quick Access */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-800">Quick Access</h2>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2">
              <button className="bg-[#162032] text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-[#1a2b4c] text-center">
                <FileText className="w-3 h-3 mr-1" /> Balance Sheet
              </button>
              <button className="bg-[#162032] text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-[#1a2b4c] text-center">
                <BarChart3 className="w-3 h-3 mr-1" /> Profit & Loss
              </button>
              <button className="bg-[#162032] text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-[#1a2b4c] text-center">
                <ClipboardList className="w-3 h-3 mr-1" /> Trial Balance
              </button>
              
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <Database className="w-3 h-3 mr-1" /> GSTR 3B
              </button>
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <RefreshCw className="w-3 h-3 mr-1" /> Reconciliation
              </button>
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <Database className="w-3 h-3 mr-1" /> Stock Value
              </button>
              
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <ShoppingCart className="w-3 h-3 mr-1" /> Purchase Orders
              </button>
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <Receipt className="w-3 h-3 mr-1" /> Credit Notes
              </button>
              <button className="bg-green-700 text-white text-xs py-2 px-1 rounded flex items-center justify-center font-medium hover:bg-green-800 text-center">
                <Receipt className="w-3 h-3 mr-1" /> Debit Notes
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
