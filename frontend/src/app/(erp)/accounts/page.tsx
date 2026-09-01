'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Star, Scale, TrendingUp, FileText, Landmark, Package, ReceiptText, WalletCards, ArrowRightLeft, Printer, Download, Loader2, Trash2 } from 'lucide-react';
import { invoicesApi, purchOrdersApi, accountsApi } from '@/services/crmService';
import type { Invoice, Transaction } from '@/interfaces/crm';

type Document = { id: string; grand_total?: number | string; invoice_status?: string };
type LedgerDisplay = { name: string; amount: number; side: 'Dr' | 'Cr'; href: string };

function unwrap<T>(response: unknown): T[] {
  const root = (response as { data?: unknown })?.data ?? response;
  const payload = (root as { data?: unknown })?.data ?? root;
  if (Array.isArray(payload)) return payload as T[];
  return payload && Array.isArray((payload as { results?: unknown }).results) ? (payload as { results: T[] }).results : [];
}
const formatAmount = (value: number, side: 'Dr' | 'Cr') => `${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${side}`;

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [hideZeroes, setHideZeroes] = useState(false);
  const [favourites, setFavourites] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try { return JSON.parse(localStorage.getItem('account-favourite-ledgers') || '[]'); } catch { return []; }
  });
  const [find, setFind] = useState('');

  const invoicesQuery = useQuery({ queryKey: ['accounts-invoices'], queryFn: () => invoicesApi.list({ page_size: 100 }) });
  const purchasesQuery = useQuery({ queryKey: ['accounts-purchase-orders'], queryFn: () => purchOrdersApi.list({ page_size: 100 }) });

  // Fetch ledgers from backend for dropdown
  const ledgersQuery = useQuery({
    queryKey: ['accounts-ledgers'],
    queryFn: () => accountsApi.listLedgers(),
  });
  const apiLedgers: { id: string; name: string }[] = useMemo(() => {
    const raw = ledgersQuery.data as any;
    const payload = raw?.data?.data ?? raw?.data ?? raw;
    if (Array.isArray(payload)) return payload;
    if (payload?.results) return payload.results;
    return [];
  }, [ledgersQuery.data]);

  // Fetch transactions from backend
  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: () => accountsApi.listTransactions(),
  });
  const transactions: Transaction[] = useMemo(() => {
    const raw = transactionsQuery.data as any;
    const payload = raw?.data?.data ?? raw?.data ?? raw;
    if (Array.isArray(payload)) return payload;
    if (payload?.results) return payload.results;
    return [];
  }, [transactionsQuery.data]);

  const invoices = unwrap<Invoice>(invoicesQuery.data);
  const purchases = unwrap<Document>(purchasesQuery.data);
  const totalInvoiced = invoices.reduce((total, item) => total + Number(item.grand_total || 0), 0);
  const outstanding = invoices.filter((item) => ['Unpaid', 'Partially Paid', 'Overdue'].includes(item.invoice_status || 'Unpaid')).reduce((total, item) => total + Number(item.grand_total || 0), 0);
  const paid = invoices.filter((item) => item.invoice_status === 'Paid').reduce((total, item) => total + Number(item.grand_total || 0), 0);
  const totalPurchases = purchases.reduce((total, item) => total + Number(item.grand_total || 0), 0);

  const ledgers: LedgerDisplay[] = useMemo(() => [
    { name: 'Current Assets', amount: paid, side: 'Dr', href: '/invoices' },
    { name: 'Fixed Assets', amount: 0, side: 'Dr', href: '/inventory' },
    { name: 'Equity', amount: 0, side: 'Cr', href: '/reports' },
    { name: 'Long Term Liabilities', amount: 0, side: 'Cr', href: '/purch-orders' },
    { name: 'Short Term Liabilities', amount: outstanding, side: 'Cr', href: '/recovery' },
    { name: 'Direct Income', amount: 0, side: 'Cr', href: '/reports' },
    { name: 'Indirect Income', amount: 0, side: 'Cr', href: '/reports' },
    { name: 'Sales', amount: totalInvoiced, side: 'Cr', href: '/invoices' },
    { name: 'Direct Expense', amount: totalPurchases, side: 'Dr', href: '/purch-orders' },
    { name: 'Indirect Expense', amount: 0, side: 'Dr', href: '/purchases' },
    { name: 'Purchase', amount: totalPurchases, side: 'Dr', href: '/purch-orders' },
  ], [outstanding, paid, totalInvoiced, totalPurchases]);

  const visibleLedgers = ledgers.filter((ledger) => !hideZeroes || ledger.amount !== 0);
  const foundLedgers = ledgers.filter((ledger) => ledger.name.toLowerCase().includes(find.toLowerCase()));
  const toggleFavourite = (name: string) => setFavourites((current) => {
    const next = current.includes(name) ? current.filter((item) => item !== name) : [...current, name];
    localStorage.setItem('account-favourite-ledgers', JSON.stringify(next));
    return next;
  });

  // Journal entry form
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [jDate, setJDate] = useState(new Date().toISOString().split('T')[0]);
  const [jDebitId, setJDebitId] = useState('');
  const [jCreditId, setJCreditId] = useState('');
  const [jAmount, setJAmount] = useState('');
  const [jNarration, setJNarration] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Create transaction mutation
  const createMutation = useMutation({
    mutationFn: (payload: {
      date: string;
      debit_ledger: string;
      credit_ledger: string;
      amount: number;
      narration?: string;
    }) => accountsApi.createTransaction(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setJDebitId('');
      setJCreditId('');
      setJAmount('');
      setJNarration('');
      setShowJournalForm(false);
    },
  });

  // Delete transaction mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleAddJournal = async () => {
    if (!jDebitId || !jCreditId || !jAmount || Number(jAmount) <= 0) return;
    setSubmitting(true);
    try {
      await createMutation.mutateAsync({
        date: jDate,
        debit_ledger: jDebitId,
        credit_ledger: jCreditId,
        amount: Number(jAmount),
        narration: jNarration || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJournal = (id: string) => {
    if (!window.confirm('Delete this journal entry?')) return;
    deleteMutation.mutate(id);
  };

  // Print journal entries
  const handlePrintJournal = () => {
    if (transactions.length === 0) return;
    const pw = window.open('', '_blank');
    if (!pw) return;
    const rows = transactions.map(e => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${e.date}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#dc2626">${e.debit_ledger_name} <small>Dr</small></td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-weight:500;color:#16a34a">${e.credit_ledger_name} <small>Cr</small></td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">₹${Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb">${e.narration || '-'}</td>
      </tr>
    `).join('');
    const totalDr = transactions.reduce((s, e) => s + Number(e.amount), 0);
    pw.document.write(`
      <html><head><title>Journal Entries</title>
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:12px}h1{font-size:18px;margin-bottom:4px}.meta{font-size:12px;color:#666;margin-bottom:16px}table{width:100%;border-collapse:collapse}th{background:#f3f4f6;padding:6px 8px;border-bottom:2px solid #d1d5db;text-align:left}.total{font-weight:700;border-top:2px solid #333;padding-top:8px;margin-top:8px}</style></head><body>
        <h1>Journal Entries</h1>
        <div class="meta">Generated: ${new Date().toLocaleString('en-IN')} | ${transactions.length} entries</div>
        <table><thead><tr><th>Date</th><th>Debit Ledger</th><th>Credit Ledger</th><th style="text-align:right">Amount</th><th>Narration</th></tr></thead><tbody>${rows}</tbody>
        <tr><td colspan="3" class="total">Total</td><td style="text-align:right;font-weight:700" class="total">₹${totalDr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td></td></tr>
        </tbody></table>
      </body></html>
    `);
    pw.document.close();
    setTimeout(() => pw.print(), 400);
  };

  // Export journal entries as CSV
  const handleExportJournal = () => {
    if (transactions.length === 0) return;
    const headers = ['Date', 'Voucher No', 'Debit Ledger', 'Credit Ledger', 'Amount', 'Narration'];
    const rows = transactions.map(e => [e.date, e.voucher_no || '', e.debit_ledger_name, e.credit_ledger_name, Number(e.amount).toFixed(2), e.narration || '']);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal_entries_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return <main className="mx-auto max-w-[1750px] p-4"><div className="grid gap-5 xl:grid-cols-[1fr_.98fr]">
    <section><div className="overflow-hidden rounded border border-gray-300 bg-white shadow-sm"><div className="flex items-center justify-between border-b p-3"><h1 className="text-2xl font-semibold">Groups &amp; Ledgers</h1><div className="flex items-center gap-3"><label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={hideZeroes} onChange={(event) => setHideZeroes(event.target.checked)} />Hide zeroes</label><button onClick={() => document.getElementById('ledger-search')?.focus()} className="rounded bg-[#ef8317] p-2 text-white" title="Find ledger"><Plus className="h-4 w-4" /></button></div></div>
      {visibleLedgers.map((ledger) => <div key={ledger.name} className="flex items-center gap-3 border-b px-5 py-3 last:border-0"><button onClick={() => toggleFavourite(ledger.name)} className="text-gray-400 hover:text-amber-500" title="Favourite ledger"><Star className={`h-4 w-4 ${favourites.includes(ledger.name) ? 'fill-amber-400 text-amber-400' : ''}`} /></button><Link href={ledger.href} className="flex-1 font-semibold text-[#002b5c] hover:underline">{ledger.name}</Link><span className="text-sm">{formatAmount(ledger.amount, ledger.side)}</span></div>)}
      {invoicesQuery.isLoading && <p className="p-6 text-center text-sm text-gray-500">Loading balances…</p>}
    </div><Link href="/recovery" className="mt-3 inline-flex items-center gap-1 rounded bg-[#ef8317] px-3 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Create Ledger / Sub-Group</Link></section>
    <aside className="space-y-5"><section className="rounded border border-gray-300 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-4"><h2 className="text-2xl font-semibold">Favourite Ledgers</h2><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-white" /><input id="ledger-search" value={find} onChange={(event) => setFind(event.target.value)} placeholder="Find Ledger" className="w-36 rounded bg-[#123556] py-2 pl-8 pr-2 text-sm text-white placeholder:text-white/80" /></div></div>
      {find ? <div className="mt-5 space-y-2">{foundLedgers.map((ledger) => <button key={ledger.name} onClick={() => toggleFavourite(ledger.name)} className="flex w-full items-center justify-between rounded bg-slate-50 px-3 py-2 text-left text-sm hover:bg-slate-100"><span>{ledger.name}</span><Star className={`h-4 w-4 ${favourites.includes(ledger.name) ? 'fill-amber-400 text-amber-400' : 'text-gray-400'}`} /></button>)}</div> : favourites.length ? <div className="mt-5 space-y-2">{ledgers.filter((ledger) => favourites.includes(ledger.name)).map((ledger) => <Link key={ledger.name} href={ledger.href} className="flex justify-between rounded bg-slate-50 px-3 py-2 text-sm hover:bg-slate-100"><span>{ledger.name}</span><span>{formatAmount(ledger.amount, ledger.side)}</span></Link>)}</div> : <p className="mt-5 rounded bg-slate-100 p-4 text-sm">Click <Star className="inline h-4 w-4" /> next to a ledger to mark it as a favourite.</p>}</section>
      <section className="rounded border border-gray-300 bg-white p-5 shadow-sm"><h2 className="mb-5 text-2xl font-semibold">Quick Access</h2><div className="grid grid-cols-3 gap-3">{[{ label: 'Balance Sheet', href: '/reports', icon: Scale, navy: true }, { label: 'Profit & Loss', href: '/reports', icon: TrendingUp, navy: true }, { label: 'Trial Balance', href: '/reports', icon: FileText, navy: true }, { label: 'GSTR-3B', href: '/reports', icon: ReceiptText }, { label: 'Reconciliation', href: '/recovery', icon: WalletCards }, { label: 'Stock Value', href: '/inventory', icon: Package }, { label: 'Purchase Orders', href: '/purch-orders', icon: FileText }, { label: 'Credit Notes', href: '/purchases/debit-notes', icon: ReceiptText }, { label: 'Debit Notes', href: '/purchases/debit-notes', icon: Landmark }].map((item) => <Link key={item.label} href={item.href} className={`flex items-center justify-center gap-1 rounded px-2 py-2 text-center text-sm font-medium text-white ${item.navy ? 'bg-[#123556]' : 'bg-green-700'}`}><item.icon className="h-4 w-4" />{item.label}</Link>)}</div></section></aside>
  </div><section className="mt-6"><h2 className="mb-3 text-lg font-medium">Training Materials</h2><div className="flex flex-wrap gap-3">{['How to delete a Ledger?', 'How to import Ledgers?', 'How to add or modify opening balances of a Ledger?', 'How to manage Ledger?'].map((label) => <button key={label} className="rounded border border-[#123556] bg-white px-3 py-2 text-sm text-[#123556]">ⓘ {label}</button>)}<Link href="/reports" className="rounded border border-green-700 bg-white px-3 py-2 text-sm text-green-700">▶ Watch Training</Link></div></section>

    {/* Quick Journal Entry */}
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-medium">Quick Journal Entry</h2>
        <div className="flex items-center gap-2">
          {transactions.length > 0 && (
            <>
              <button onClick={handleExportJournal} className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button onClick={handlePrintJournal} className="flex items-center gap-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </>
          )}
          <button onClick={() => setShowJournalForm(!showJournalForm)} className="flex items-center gap-1 rounded bg-[#123556] px-3 py-2 text-sm font-medium text-white hover:bg-[#1a3d66]">
            <ArrowRightLeft className="h-4 w-4" /> {showJournalForm ? 'Cancel' : 'New Entry'}
          </button>
        </div>
      </div>

      {showJournalForm && (
        <div className="rounded border border-gray-300 bg-white p-4 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input type="date" value={jDate} onChange={e => setJDate(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Debit Ledger</label>
              <select value={jDebitId} onChange={e => setJDebitId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="">Select ledger</option>
                {apiLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Credit Ledger</label>
              <select value={jCreditId} onChange={e => setJCreditId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
                <option value="">Select ledger</option>
                {apiLedgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount (₹)</label>
              <input type="number" min="0" step="0.01" value={jAmount} onChange={e => setJAmount(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="0.00" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Narration</label>
              <input type="text" value={jNarration} onChange={e => setJNarration(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Description..." />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button onClick={handleAddJournal}
              disabled={!jDebitId || !jCreditId || !jAmount || Number(jAmount) <= 0 || submitting}
              className="flex items-center gap-1 rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {submitting ? 'Posting...' : 'Post Entry'}
            </button>
          </div>
        </div>
      )}

      {transactionsQuery.isLoading && (
        <div className="flex items-center justify-center p-6 gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading journal entries...
        </div>
      )}

      {!transactionsQuery.isLoading && transactions.length > 0 && (
        <div className="rounded border border-gray-300 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Voucher</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Debit Ledger</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Credit Ledger</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Narration</th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600">{entry.date}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs">{entry.voucher_no || '-'}</td>
                  <td className="px-4 py-2 font-medium text-red-700">{entry.debit_ledger_name} <span className="text-xs text-gray-400">Dr</span></td>
                  <td className="px-4 py-2 font-medium text-green-700">{entry.credit_ledger_name} <span className="text-xs text-gray-400">Cr</span></td>
                  <td className="px-4 py-2 text-right font-bold">₹{Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs">{entry.narration || '-'}</td>
                  <td className="px-4 py-2 text-center">
                    <button onClick={() => handleDeleteJournal(entry.id)} className="text-red-500 hover:text-red-700 text-xs inline-flex items-center gap-0.5">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!transactionsQuery.isLoading && transactions.length === 0 && !showJournalForm && (
        <p className="text-sm text-gray-400 bg-white rounded border border-gray-200 p-4">No journal entries yet. Click &quot;New Entry&quot; to record a debit/credit transaction.</p>
      )}
    </section>
  </main>;
}
