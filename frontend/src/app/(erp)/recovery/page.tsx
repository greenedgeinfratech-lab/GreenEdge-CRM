'use client';

import { useState } from 'react';
import type { AxiosResponse } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { Search, Bell, IndianRupee, MessageCircle, Plus, Calendar, Play, HelpCircle, Trash2 } from 'lucide-react';
import { customersApi, invoicesApi } from '@/services/crmService';
import { usersApi } from '@/services/userService';
import type { ApiResponse, Customer, Invoice, PaginatedResponse } from '@/interfaces/crm';
import CreateCustomerModal from '@/components/CreateCustomerModal';
import CustomerRecoveryDialog from '@/components/CustomerRecoveryDialog';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';

interface Executive {
  id: string;
  first_name: string;
  last_name: string;
}

interface CustomerRecovery {
  id: string;
  customer_name: string;
  amount: number;
  reminder?: string;
  internal_notes?: string;
  executive?: string;
  assigned_to?: string;
  customer?: Customer;
}

export default function RecoveryPage() {
  const [search, setSearch] = useState('');
  const [nonZeroOnly, setNonZeroOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [createCustomerOpen, setCreateCustomerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedAction, setSelectedAction] = useState<'remind' | 'appointment' | 'amount' | 'whatsapp' | 'email' | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const itemsPerPage = 10;

  const { data: executivesResponse, isLoading: isLoadingExecutives } = useQuery<AxiosResponse<ApiResponse<PaginatedResponse<Executive>>>>({
    queryKey: ['executives'],
    queryFn: () => usersApi.listEmployees({ page_size: 100 }),
  });

  const executives = executivesResponse?.data?.data?.results ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['recovery-invoices'],
    queryFn: () => invoicesApi.list({ invoice_status: 'Unpaid' }),
  });

  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['recovery-customers'],
    queryFn: () => customersApi.list({ page_size: 100 }),
  });

  const invoices = data?.data?.data?.results || [];
  const customers = customersData?.data?.data?.results || [];
  
  // Transform invoices to recovery data
  const recoveryByCustomer = new Map<string, CustomerRecovery>();
  const normalizeCustomerName = (name?: string) => (name || '-').trim().toLowerCase();

  invoices.forEach((inv: Invoice) => {
    const customerName = inv.customer_name || '-';
    recoveryByCustomer.set(normalizeCustomerName(customerName), {
      id: inv.id,
      customer_name: customerName,
      amount: Number(inv.grand_total) || 0,
      reminder: '-',
      internal_notes: inv.recovery_notes || '-',
      executive: '',
    });
  });

  customers.forEach((customer: Customer) => {
    const customerName = customer.company_name || customer.name || '-';
    const key = normalizeCustomerName(customerName);
    const invoiceRecovery = recoveryByCustomer.get(key);
    const hasOutstanding = customer.outstanding !== undefined && customer.outstanding !== null;
    const outstanding = hasOutstanding ? Number(customer.outstanding) : (invoiceRecovery?.amount || 0);

    recoveryByCustomer.set(key, {
      id: customer.id,
      customer_name: customerName,
      amount: outstanding,
      reminder: invoiceRecovery?.reminder || '-',
      internal_notes: customer.notes || invoiceRecovery?.internal_notes || '-',
      executive: customer.assigned_to_name || invoiceRecovery?.executive || 'Unassigned',
      assigned_to: customer.assigned_to || '',
      customer,
    });
  });

  const recoveryData = Array.from(recoveryByCustomer.values());

  const filteredData = recoveryData.filter((item: CustomerRecovery) => {
    if (nonZeroOnly && item.amount <= 0) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.customer_name.toLowerCase().includes(q);
    }
    return true;
  });

  const totalReceivable = filteredData.reduce((sum: number, item: CustomerRecovery) => sum + item.amount, 0);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIdx, startIdx + itemsPerPage);
  const isPageSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedIds.includes(item.id));

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  };

  const togglePageSelection = (checked: boolean) => {
    if (checked) {
      setSelectedIds((current) => Array.from(new Set([...current, ...paginatedData.map((item) => item.id)])));
    } else {
      setSelectedIds((current) => current.filter((id) => !paginatedData.some((item) => item.id === id)));
    }
  };

  const findCustomerByName = (name: string) => {
    const normalizedName = normalizeCustomerName(name);
    return customers.find((customer) => {
      const customerName = (customer.company_name || customer.name || '').trim().toLowerCase();
      return customerName === normalizedName;
    });
  };

  const openRecoveryCustomer = async (item: CustomerRecovery, action: 'remind' | 'appointment' | 'amount' | 'whatsapp' | 'email' | null = null) => {
    setSelectedAction(action);
    if (item.customer) {
      setSelectedCustomer(item.customer);
      return;
    }

    const existingCustomer = findCustomerByName(item.customer_name);
    if (existingCustomer) {
      setSelectedCustomer(existingCustomer);
      return;
    }

    try {
      const response = await customersApi.create({
        name: item.customer_name,
        company_name: item.customer_name,
        customer_type: 'business',
        status: 'active',
        outstanding: item.amount,
      });
      const customer = response.data.data;
      setSelectedCustomer(customer);
      await refetchCustomers();
      showToast('Customer record created and linked to this recovery entry.');
    } catch {
      showToast('Could not create the customer record for this recovery entry.', 'error');
    }
  };

  const openSelectedCustomer = async (action: 'appointment' | 'amount') => {
    const selected = recoveryData.find((item) => selectedIds.includes(item.id));
    if (!selected) {
      showToast('Select a customer row first.', 'info');
      return;
    }
    await openRecoveryCustomer(selected, action === 'appointment' ? 'appointment' : 'amount');
    showToast(action === 'appointment' ? 'Choose a date and time, then save an appointment.' : 'Update the outstanding balance and save changes.', 'info');
  };

  const deleteCustomer = async (item: CustomerRecovery) => {
    if (!item.customer) {
      showToast('Only existing customers can be deleted.', 'error');
      return;
    }

    const confirmed = await confirm({
      title: 'Delete customer?',
      message: `Delete ${item.customer_name} and remove their customer record? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await customersApi.delete(item.customer.id);
      await refetchCustomers();
      setSelectedIds((current) => current.filter((id) => id !== item.id));
      showToast('Customer deleted successfully.');
    } catch {
      showToast('Could not delete the customer.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExecutiveChange = async (item: CustomerRecovery, assignedTo: string) => {
    if (!item.customer) {
      showToast('Create a customer record before assigning an executive.', 'error');
      return;
    }

    try {
      await customersApi.update(item.customer.id, { assigned_to: assignedTo });
      await refetchCustomers();
      showToast('Executive assignment updated.');
    } catch {
      showToast('Could not update the executive.', 'error');
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 bg-gray-50 min-h-screen">
      {/* Top Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        {/* Header with Title and Total */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-800">Recovery</h1>
            <div className="border-2 border-green-500 bg-green-50 text-green-700 px-3 py-1 rounded font-semibold text-sm">
              Total Receivables ₹ {totalReceivable.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 w-40"
            />
            <button
              onClick={() => setCreateCustomerOpen(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-orange-700 transition"
            >
              <Plus className="w-4 h-4 inline mr-1" /> Enter Customer
            </button>
            <button onClick={() => openSelectedCustomer('appointment')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition">
              <Calendar className="w-4 h-4 inline mr-1" /> Appointments
            </button>
            <button onClick={() => openSelectedCustomer('amount')} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 transition">
              Update Amounts
            </button>
            <button onClick={() => { setCurrentPage(1); showToast(search ? `Showing results for “${search}”.` : 'Enter a name in Search to filter recovery records.', 'info'); }} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Checkbox */}
        <div className="flex justify-end mb-2">
          <label className="flex items-center text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={nonZeroOnly}
              onChange={(e) => setNonZeroOnly(e.target.checked)}
              className="mr-2 w-4 h-4 rounded"
            />
            Show only non-zero
          </label>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 font-semibold text-gray-800">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={isPageSelected} onChange={(event) => togglePageSelection(event.target.checked)} className="w-4 h-4 rounded" />
                </th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reminder</th>
                <th className="px-4 py-3">Internal Notes</th>
                <th className="px-4 py-3">Executive</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No recovery data found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item: CustomerRecovery) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleSelected(item.id)} className="w-4 h-4 rounded" />
                    </td>
                    <td className="px-4 py-3 font-medium text-blue-600">
                      <button onClick={() => openRecoveryCustomer(item)} className="hover:underline">{item.customer_name}</button>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {item.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.reminder}</td>
                    <td className="px-4 py-3 text-gray-500">{item.internal_notes}</td>
                    <td className="px-4 py-3">
                      {item.customer ? (
                        <select
                          value={item.assigned_to || ''}
                          onChange={(e) => handleExecutiveChange(item, e.target.value)}
                          disabled={isLoadingExecutives}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
                        >
                          <option value="">Unassigned</option>
                          {executives.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                              {emp.first_name} {emp.last_name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        item.executive
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        <button
                          onClick={() => openRecoveryCustomer(item, 'remind')}
                          className="text-orange-600 font-medium text-xs hover:underline flex items-center gap-1"
                          title="Send reminder"
                        >
                          <Bell className="w-4 h-4" /> Remind
                        </button>
                        <button
                          onClick={() => openRecoveryCustomer(item, 'amount')}
                          className="text-green-600 font-medium text-xs hover:underline flex items-center gap-1"
                          title="Record payment"
                        >
                          <IndianRupee className="w-4 h-4" /> Receive
                        </button>
                        <button
                          onClick={() => openRecoveryCustomer(item, 'whatsapp')}
                          className="bg-green-100 text-green-700 p-1 rounded hover:bg-green-200 transition"
                          title="Send WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openRecoveryCustomer(item, 'email')}
                          className="bg-yellow-100 text-yellow-700 p-1 rounded hover:bg-yellow-200 transition"
                          title="Send Email"
                        >
                          ✉
                        </button>
                        {item.customer && (
                          <button
                            onClick={() => deleteCustomer(item)}
                            disabled={deletingId === item.id}
                            className="bg-red-100 text-red-700 p-1 rounded hover:bg-red-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages || 1}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                ←
              </button>

              {generatePageNumbers().map((page, idx) => (
                <button
                  key={idx}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === '...'}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : page === '...'
                      ? 'cursor-default text-gray-500'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Training Materials */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Training Materials</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => showToast('Enable “Show only non-zero” to hide customers with a zero outstanding balance.', 'info')} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400 transition">
            <HelpCircle className="w-4 h-4" />
            How to see non-zero recovery only?
          </button>
          <button onClick={() => showToast('Open a customer, edit Outstanding balance, and click Save changes.', 'info')} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400 transition">
            <HelpCircle className="w-4 h-4" />
            How to update recovery amount when invoice is created?
          </button>
          <button onClick={() => showToast('Recovery workflow: select a customer, open it, then record reminders, appointments, or payments.', 'info')} className="flex items-center gap-2 px-4 py-2 border-2 border-green-600 text-green-600 rounded text-sm font-medium hover:bg-green-50 transition">
            <Play className="w-4 h-4" />
            Watch Training
          </button>
        </div>
      </div>

      {/* Create Customer Modal */}
      <CreateCustomerModal
        open={createCustomerOpen}
        onOpenChange={setCreateCustomerOpen}
        onSuccess={() => {
          refetchCustomers();
        }}
      />
      <CustomerRecoveryDialog
        customer={selectedCustomer}
        action={selectedAction}
        open={Boolean(selectedCustomer)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCustomer(null);
            setSelectedAction(null);
          }
        }}
        onUpdated={() => refetchCustomers()}
      />
    </div>
  );
}
