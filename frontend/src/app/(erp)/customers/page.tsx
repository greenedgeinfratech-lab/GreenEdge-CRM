'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, ChevronDown, Plus, Phone, Mail, Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { customersApi } from '@/services/crmService';
import { CRM_KEYS } from '@/lib/crmQueryKeys';
import type { Customer } from '@/interfaces/crm';

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const filters = { search, status: statusFilter, customer_type: typeFilter, page };
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: CRM_KEYS.customers(filters),
    queryFn: () => customersApi.list(filters),
  });

  // API responses are wrapped by the shared renderer: { data: { count, results } }.
  // Support both wrapped and direct responses so existing customers never appear as an empty list.
  const payload: any = data?.data?.data ?? data?.data;
  const customers: Customer[] = payload?.results ?? (Array.isArray(payload) ? payload : []);
  const totalCount = payload?.count ?? customers.length;
  const totalPages = Math.ceil(totalCount / 10);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.delete(id);
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
    } catch {
      alert('Could not delete the customer.');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await customersApi.toggleStatus(id);
      queryClient.invalidateQueries({ queryKey: CRM_KEYS.customers() });
    } catch {
      alert('Could not update customer status.');
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-2">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-3 border-b border-gray-200">
        <div className="flex items-center space-x-4 text-xl text-gray-800">
          <span>Customers</span>
          <span className="text-sm text-gray-500">({totalCount} total)</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm w-48 focus:outline-none focus:border-blue-500"
            />
          </div>

          <Link
            href="/customers/new"
            className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10]"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Customer
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[150px] justify-between">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-transparent outline-none w-full"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        </div>

        <div className="flex items-center border border-gray-300 bg-white rounded text-sm px-3 py-1.5 min-w-[150px] justify-between">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="bg-transparent outline-none w-full"
          >
            <option value="">All Types</option>
            <option value="individual">Individual</option>
            <option value="business">Business</option>
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-white border-b border-gray-200 text-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Outstanding</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-red-600">Could not load customers. <button onClick={() => refetch()} className="underline">Try again</button></td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No customers found. Create your first customer to get started.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 text-gray-700">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      {c.company_name && <div className="text-xs text-gray-500">{c.company_name}</div>}
                      {c.customer_number && <div className="text-xs text-gray-400">{c.customer_number}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.mobile && (
                      <div className="flex items-center gap-1 text-xs">
                        <Phone className="w-3 h-3" /> {c.mobile}
                      </div>
                    )}
                    {c.email && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="w-3 h-3" /> {c.email}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {[c.city, c.state].filter(Boolean).join(', ') || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                      {c.customer_type || 'Business'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={`text-xs px-2 py-0.5 rounded-full cursor-pointer ${
                        c.status === 'active' ? 'bg-green-100 text-green-700' :
                        c.status === 'inactive' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      }`}
                      onClick={() => handleToggleStatus(c.id)}
                      title="Toggle active/inactive status"
                    >
                      {c.status || 'active'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-xs font-medium">
                    ₹{(c.outstanding || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/customers/${c.id}/edit`}
                        className="p-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            «
          </button>
          {Array.from({ length: Math.min(totalPages, 9) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1.5 border border-gray-200 rounded text-sm ${
                page === p ? 'bg-[#162032] text-white' : 'hover:bg-gray-50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 border border-gray-200 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}
