import React from 'react';
import { Search, LineChart, Clock, Pause, XCircle, Check } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      
      {/* Top Header / Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Tasks</span>
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
            + Create Task
          </button>

          <button className="flex items-center bg-[#162032] text-white p-1.5 rounded text-sm font-medium hover:bg-[#1a2b4c]">
            <LineChart className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        
        {/* Inbox */}
        <div className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-4 min-h-[600px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl text-gray-800 font-medium">Inbox</h2>
              <p className="text-gray-500 text-xs mt-1">Tasks assigned to me</p>
            </div>
            
            <div className="flex space-x-2 text-sm">
              <button className="bg-[#162032] text-white px-3 py-1.5 rounded flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" /> Pending
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <Pause className="w-3.5 h-3.5 mr-1" /> Paused
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelled
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <Check className="w-3.5 h-3.5 mr-1" /> Completed
              </button>
            </div>
          </div>

          <div className="bg-[#f8f9fa] border border-gray-200 px-4 py-3 inline-block rounded text-sm text-gray-600 cursor-pointer hover:bg-gray-100">
            Click here to create a task.
          </div>
        </div>

        {/* Outbox */}
        <div className="flex-1 bg-white border border-gray-200 rounded shadow-sm p-4 min-h-[600px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl text-gray-800 font-medium">Outbox</h2>
              <p className="text-gray-500 text-xs mt-1">Tasks created by me and assigned to others</p>
            </div>
            
            <div className="flex space-x-2 text-sm">
              <button className="bg-[#162032] text-white px-3 py-1.5 rounded flex items-center font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" /> Pending
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <Pause className="w-3.5 h-3.5 mr-1" /> Paused
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <XCircle className="w-3.5 h-3.5 mr-1" /> Cancelled
              </button>
              <button className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded flex items-center hover:bg-gray-200">
                <Check className="w-3.5 h-3.5 mr-1" /> Completed
              </button>
            </div>
          </div>

          <div className="bg-[#f8f9fa] border border-gray-200 px-4 py-3 inline-block rounded text-sm text-gray-600 cursor-pointer hover:bg-gray-100">
            Click here to create a task.
          </div>
        </div>

      </div>

    </div>
  );
}
