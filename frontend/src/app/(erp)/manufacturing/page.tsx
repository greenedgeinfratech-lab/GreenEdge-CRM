'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Clock, AlertTriangle, CheckCircle, X, Search, Loader2 } from 'lucide-react';
import { purchOrdersApi, productsApi, manufacturingApi } from '@/services/crmService';

export default function ManufacturingPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [productName, setProductName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('Nos');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // Queries
  const { data: poData } = useQuery({
    queryKey: ['manufacturing-pos'],
    queryFn: () => purchOrdersApi.list({}),
  });

  const { data: productData } = useQuery({
    queryKey: ['manufacturing-products'],
    queryFn: () => productsApi.list({ item_type: 'Stock' }),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['manufacturing-jobs', statusFilter, search],
    queryFn: () => manufacturingApi.list({ status: statusFilter, search }),
  });

  // Create Job Mutation
  const createJobMutation = useMutation({
    mutationFn: (newJob: any) => manufacturingApi.create(newJob),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-jobs'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  // Status Change Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => manufacturingApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturing-jobs'] });
    },
  });

  const resetForm = () => {
    setTitle('');
    setProductName('');
    setQuantity('1');
    setUnit('Nos');
    setPriority('medium');
    setDueDate('');
    setDescription('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    createJobMutation.mutate({
      title,
      product_name: productName,
      quantity: Number(quantity),
      unit,
      priority,
      due_date: dueDate || undefined,
      description,
    });
  };

  const purchaseOrders = (poData?.data as any)?.data?.results || (poData?.data as any)?.results || (poData as any)?.results || [];
  const products = (productData?.data as any)?.data?.results || (productData?.data as any)?.results || (productData as any)?.results || [];
  const lowStockItems = products.filter((p: any) => (p.stock_qty || 0) <= 10);
  const jobs = (jobsData?.data as any)?.data?.results || (jobsData?.data as any)?.results || (Array.isArray(jobsData?.data?.data) ? jobsData.data.data : []);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span className="font-semibold">Manufacturing & Production</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" /> Create Job
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Package className="w-4 h-4 text-blue-500" /> Products in Stock
          </div>
          <div className="text-2xl font-bold text-gray-800">{products.length}</div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Purchase Orders
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {purchaseOrders.filter((o: any) => o.status !== 'received').length}
          </div>
        </div>
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> Low Stock Items
          </div>
          <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
        </div>
      </div>

      {/* Production Jobs Management */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Production Jobs</h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1 border rounded text-sm w-48 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-gray-100 p-0.5 rounded text-xs">
              {['all', 'draft', 'in_progress', 'on_hold', 'completed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded capitalize font-medium ${
                    statusFilter === st ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium">
              <tr>
                <th className="px-4 py-3">Job No</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobsLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading production jobs...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No production jobs found matching current filters.
                  </td>
                </tr>
              ) : (
                jobs.map((job: any) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{job.job_no}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{job.title}</td>
                    <td className="px-4 py-3 text-gray-600">{job.product_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-medium">{job.quantity} {job.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded capitalize font-medium ${
                        job.priority === 'high' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {job.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {job.due_date ? new Date(job.due_date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[job.status] || 'bg-gray-100'}`}>
                        {job.status_display || job.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {job.status !== 'completed' && (
                        <button
                          onClick={() => statusMutation.mutate({ id: job.id, status: 'completed' })}
                          className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 hover:bg-green-100"
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Items Reference Table */}
      {lowStockItems.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden shadow-sm mt-2">
          <div className="px-4 py-3 border-b bg-orange-50">
            <h3 className="font-semibold text-orange-800">Low Stock Inventory Items</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Item Name</th>
                <th className="px-4 py-2 text-left">Code</th>
                <th className="px-4 py-2 text-right">Current Stock</th>
                <th className="px-4 py-2 text-right">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {lowStockItems.map((p: any) => (
                <tr key={p.id}>
                  <td className="px-4 py-2 font-medium">{p.name}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{p.code || '—'}</td>
                  <td className="px-4 py-2 text-right text-orange-600 font-bold">{p.stock_qty || 0}</td>
                  <td className="px-4 py-2 text-right">₹{(p.rate || 0).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Create Job */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Create Production Job</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Assemble 50 Solar Inverters"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    placeholder="Item to produce"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Quantity</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createJobMutation.isPending}
                  className="px-4 py-1.5 rounded text-sm bg-[#c85a17] text-white font-medium hover:bg-[#b04a10] disabled:opacity-50"
                >
                  {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
