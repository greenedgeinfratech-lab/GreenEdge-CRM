'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer, RefreshCw, FileText, Calendar, Plus, Loader2, AlertCircle, FileCheck, Trash2, Search, X, CreditCard, Banknote,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/services/crmService';
import type { Invoice, InvoicePayment } from '@/interfaces/crm';
import InvoicePdfView from './components/InvoicePdfView';

export default function InvoicesPage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [period, setPeriod] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment modal state
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Fetch invoices
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['invoices-list'],
    queryFn: async () => {
      const res = await invoicesApi.list();
      const rawData = res.data as { data?: { data?: unknown; results?: unknown } | unknown; results?: unknown };
      const payload = rawData?.data ?? rawData;
      if (Array.isArray(payload)) return payload as Invoice[];
      if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) return (payload as { data: Invoice[] }).data;
      if (payload && typeof payload === 'object' && Array.isArray((payload as { results?: unknown }).results)) return (payload as { results: Invoice[] }).results;
      if (Array.isArray(rawData?.results)) return rawData.results as Invoice[];
      return [];
    },
  });

  // Fetch payments for selected invoice
  const { data: paymentsData } = useQuery({
    queryKey: ['invoice-payments', paymentInvoice?.id],
    queryFn: async () => {
      if (!paymentInvoice) return [];
      const res = await invoicesApi.listPayments(paymentInvoice.id);
      const raw = res.data as any;
      const payload = raw?.data?.data ?? raw?.data ?? raw;
      if (Array.isArray(payload)) return payload as InvoicePayment[];
      if (payload?.results) return payload.results as InvoicePayment[];
      return [];
    },
    enabled: !!paymentInvoice,
  });

  const payments: InvoicePayment[] = paymentsData || [];

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (payload: {
      invoice: string;
      amount: number;
      payment_date: string;
      method: string;
      reference_no?: string;
      notes?: string;
    }) => invoicesApi.createPayment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
      setPaymentAmount('');
      setPaymentRef('');
      setPaymentNotes('');
    },
  });

  // Delete payment mutation
  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
    },
  });

  const invoices: Invoice[] = data || [];
  const visibleInvoices = invoices.filter((invoice) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [invoice.invoice_no, invoice.customer_name, invoice.contact_person].some((value) => value?.toLowerCase().includes(term));
    const matchesStatus = statusFilter === 'All' || invoice.invoice_status === statusFilter;
    if (period !== 'month' || !invoice.invoice_date) return matchesSearch && matchesStatus;
    const date = new Date(invoice.invoice_date);
    const now = new Date();
    return matchesSearch && matchesStatus && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const handleDeleteInvoice = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;
    setDeletingId(id);
    try {
      await invoicesApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
    } catch {
      alert('Failed to delete invoice.');
    } finally {
      setDeletingId(null);
    }
  };

  const updateStatus = async (invoice: Invoice, invoice_status: string) => {
    try {
      await invoicesApi.update(invoice.id, { invoice_status });
      queryClient.invalidateQueries({ queryKey: ['invoices-list'] });
    } catch { alert('Could not update invoice status.'); }
  };

  const handleRecordPayment = async () => {
    if (!paymentInvoice || !paymentAmount || Number(paymentAmount) <= 0) return;
    await createPaymentMutation.mutateAsync({
      invoice: paymentInvoice.id,
      amount: Number(paymentAmount),
      payment_date: paymentDate,
      method: paymentMethod,
      reference_no: paymentRef || undefined,
      notes: paymentNotes || undefined,
    });
  };

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentInvoice(invoice);
    setPaymentAmount(String(Number(invoice.grand_total || 0) - Number(invoice.recovery_amt || 0)));
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Cash');
    setPaymentRef('');
    setPaymentNotes('');
  };

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstanding = paymentInvoice ? Number(paymentInvoice.grand_total || 0) - totalPaid : 0;

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4">
      {/* Top Header / Actions */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-4 border border-gray-200 rounded shadow-xs">
        <div className="flex items-center space-x-3 text-xl text-gray-800 font-semibold">
          <FileCheck className="w-6 h-6 text-[#c85a17]" />
          <span>Invoices</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select value={period} onChange={(event) => setPeriod(event.target.value)} className="border border-gray-300 bg-white rounded px-3 py-1.5 text-sm text-gray-700"><option value="all">All time</option><option value="month">This month</option></select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border border-gray-300 bg-white rounded px-3 py-1.5 text-sm text-gray-700"><option value="All">All invoices</option><option value="Unpaid">Unpaid</option><option value="Partial">Partially paid</option><option value="Paid">Paid</option><option value="Overdue">Overdue</option></select>
          <div className="relative"><Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="w-36 rounded border border-gray-300 py-1.5 pl-8 pr-2 text-sm" /></div>

          <button
            onClick={() => refetch()}
            className="flex items-center bg-[#c85a17] text-white p-2 rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button onClick={() => window.print()} className="flex items-center bg-[#c85a17] text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"><Printer className="w-4 h-4 mr-1.5" /> Print</button>

          <Link
            href="/invoices/create-b2b"
            className="flex items-center bg-[#c85a17] text-white px-3.5 py-1.5 rounded text-sm font-medium hover:bg-[#b04a10] shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" /> Create B2B Invoice
          </Link>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-semibold text-gray-800 text-base">All Invoices</h2>
          <span className="text-xs text-gray-500 font-medium">
            {visibleInvoices.length} invoice{visibleInvoices.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm gap-2">
            <Loader2 size={24} className="animate-spin text-[#c85a17]" />
            <span>Fetching invoices…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-red-500 text-sm gap-2">
            <AlertCircle size={22} />
            <span>Failed to load invoices.</span>
            <button onClick={() => refetch()} className="text-xs underline text-gray-600">Retry</button>
          </div>
        ) : visibleInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-gray-400 text-sm gap-3">
            <FileText size={36} className="text-gray-300" />
            <p className="text-gray-600 font-medium">No invoices found.</p>
            <Link
              href="/invoices/create-b2b"
              className="bg-[#c85a17] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#b04a10] transition-colors"
            >
              + Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-700">
                  <th className="py-2.5 px-3 font-semibold">Invoice No.</th>
                  <th className="py-2.5 px-3 font-semibold">Type</th>
                  <th className="py-2.5 px-3 font-semibold">Customer Name</th>
                  <th className="py-2.5 px-3 font-semibold">Invoice Date</th>
                  <th className="py-2.5 px-3 font-semibold">Due Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Grand Total (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Paid (₹)</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-semibold text-[#c85a17]">
                      {inv.invoice_no || 'DRAFT'}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-700">
                      {inv.type || 'B2B Invoice'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-800">{inv.customer_name || 'Walk-in Customer'}</div>
                      {inv.contact_person && (
                        <div className="text-[11px] text-gray-400">Attn: {inv.contact_person}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {inv.invoice_date || '-'}
                    </td>
                    <td className="py-3 px-3 text-gray-600">
                      {inv.due_date || '-'}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-gray-900">
                      ₹ {Number(inv.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-green-700">
                      ₹ {Number(inv.recovery_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <select value={inv.invoice_status || 'Unpaid'} onChange={(event) => updateStatus(inv, event.target.value)} className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px]"><option>Unpaid</option><option>Partial</option><option>Paid</option><option>Overdue</option></select>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {inv.invoice_status !== 'Paid' && (
                          <button onClick={() => openPaymentModal(inv)}
                            className="p-1 text-gray-400 hover:text-green-700 transition-colors"
                            title="Record Payment"
                          >
                            <Banknote size={15} />
                          </button>
                        )}
                        <button onClick={() => setSelectedInvoice(inv)}
                          className="p-1 text-gray-400 hover:text-green-700 transition-colors"
                          title="Print Invoice"
                        >
                          <Printer size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          disabled={deletingId === inv.id}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete invoice"
                        >
                          {deletingId === inv.id ? (
                            <Loader2 size={14} className="animate-spin text-red-600" />
                          ) : (
                            <Trash2 size={15} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
        <div className="bg-white border border-gray-200 rounded p-5 shadow-xs flex flex-col justify-between h-38">
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">Create a B2B Invoice</h3>
            <p className="text-gray-500 text-xs">Generate an invoice with Biziverse-style item selection &amp; tax calculations.</p>
          </div>
          <Link
            href="/invoices/create-b2b"
            className="bg-[#c85a17] text-white px-3.5 py-1.5 rounded text-xs font-medium hover:bg-[#b04a10] self-start mt-3 inline-block transition-colors"
          >
            + Create B2B Invoice
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 shadow-xs flex flex-col justify-between h-38">
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">Create POS / Retail Invoice</h3>
            <p className="text-gray-500 text-xs">Generate quick over-the-counter receipts for retail walk-in sales.</p>
          </div>
          <Link
            href="/invoices/create-b2b?type=retail"
            className="bg-[#162032] text-white px-3.5 py-1.5 rounded text-xs font-medium hover:bg-[#1a2b4c] self-start mt-3 inline-block transition-colors"
          >
            + Create Retail Invoice
          </Link>
        </div>

        <div className="bg-white border border-gray-200 rounded p-5 shadow-xs flex flex-col justify-between h-38">
          <div>
            <h3 className="font-semibold text-gray-800 text-base mb-1">Print Settings</h3>
            <p className="text-gray-500 text-xs">Configure invoice layout, company logo, terms and header format.</p>
          </div>
          <button onClick={() => window.print()} className="bg-gray-100 border border-gray-300 text-gray-700 px-3.5 py-1.5 rounded text-xs font-medium hover:bg-gray-200 self-start mt-3 flex items-center gap-1.5 transition-colors"><Printer size={14} /> Print invoice list</button>
        </div>
      </div>

      {/* Print PDF Modal */}
      {selectedInvoice && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"><div className="mx-auto max-w-5xl rounded bg-white p-4 shadow-xl"><div className="mb-3 flex justify-end gap-2"><button onClick={() => setSelectedInvoice(null)} className="rounded border px-3 py-1.5 text-sm">Close</button><button onClick={() => window.print()} className="inline-flex items-center gap-1 rounded bg-[#c85a17] px-3 py-1.5 text-sm text-white"><Printer size={14} />Print</button></div><InvoicePdfView invoice={selectedInvoice} /></div></div>}

      {/* Record Payment Modal */}
      {paymentInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-green-600" /> Record Payment
              </h3>
              <button onClick={() => setPaymentInvoice(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Invoice</span><span className="font-semibold">{paymentInvoice.invoice_no || 'DRAFT'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Customer</span><span className="font-medium">{paymentInvoice.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Grand Total</span><span className="font-semibold">₹{Number(paymentInvoice.grand_total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Already Paid</span><span className="font-semibold text-green-700">₹{Number(paymentInvoice.recovery_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                <div className="flex justify-between border-t border-gray-200 mt-2 pt-2"><span className="text-gray-800 font-semibold">Outstanding</span><span className="font-bold text-red-700">₹{outstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
                  <input type="number" min="0" step="0.01" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                  <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Reference No.</label>
                  <input type="text" value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input type="text" value={paymentNotes} onChange={e => setPaymentNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Optional notes..." />
              </div>
            </div>

            {/* Payment History */}
            {payments.length > 0 && (
              <div className="px-5 pb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment History</h4>
                <div className="max-h-40 overflow-y-auto space-y-1.5">
                  {payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-xs">
                      <div>
                        <span className="font-semibold text-green-700">₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="text-gray-400 ml-2">{p.payment_date} · {p.method}</span>
                        {p.reference_no && <span className="text-gray-400 ml-1">· Ref: {p.reference_no}</span>}
                      </div>
                      <button onClick={() => deletePaymentMutation.mutate(p.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button onClick={() => setPaymentInvoice(null)} className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleRecordPayment}
                disabled={!paymentAmount || Number(paymentAmount) <= 0 || createPaymentMutation.isPending}
                className="flex items-center gap-1 rounded bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {createPaymentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                {createPaymentMutation.isPending ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
