'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, FileText, Pencil, Plus, Save, Search } from 'lucide-react';
import { ordersApi } from '@/services/crmService';
import { useToast } from '@/providers/ToastProvider';

type Order = {
  id: string; order_number?: string; customer_name?: string; order_date?: string;
  due_date?: string; grand_total?: number | string; status?: string;
  terms_conditions?: string[]; notes?: string;
};

const currency = (value: number | string | undefined) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const isClosed = (status?: string) => ['cancelled', 'canceled'].includes((status || '').toLowerCase());

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Order | null>(null);
  const [terms, setTerms] = useState('');
  const [renewalDate, setRenewalDate] = useState('');
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { data, isLoading, isError } = useQuery({ queryKey: ['contracts'], queryFn: () => ordersApi.list({ page_size: 200 }) });
  const orders: Order[] = (data?.data as any)?.data?.results || (data?.data as any)?.results || (data as any)?.results || [];
  const contracts = orders.filter((order) => !isClosed(order.status) && `${order.customer_name} ${order.order_number}`.toLowerCase().includes(search.toLowerCase()));
  const today = new Date();
  const renewalSoon = contracts.filter((order) => {
    if (!order.due_date) return false;
    const days = (new Date(order.due_date).getTime() - today.getTime()) / 86_400_000;
    return days >= 0 && days <= 30;
  });

  const openEditor = (contract: Order) => {
    setEditing(contract);
    setTerms((contract.terms_conditions || []).join('\n'));
    setRenewalDate(contract.due_date || '');
  };
  const saveContract = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await ordersApi.update(editing.id, {
        terms_conditions: terms.split('\n').map((term) => term.trim()).filter(Boolean),
        due_date: renewalDate || null,
      });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setEditing(null);
      showToast('Contract terms and renewal date saved.', 'success');
    } catch {
      showToast('Could not save the contract.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold text-gray-900">Contracts</h1><p className="text-sm text-gray-600">Confirmed orders, their terms, and renewal dates.</p></div>
        <Link href="/orders/new" className="inline-flex items-center justify-center gap-2 rounded bg-[#c85a17] px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" />Create contract</Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Active contracts" value={contracts.length} />
        <Stat label="Contract value" value={currency(contracts.reduce((total, item) => total + Number(item.grand_total || 0), 0))} />
        <Stat label="Renewals in 30 days" value={renewalSoon.length} alert={renewalSoon.length > 0} />
      </div>

      {renewalSoon.length > 0 && <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><AlertCircle className="h-4 w-4" />{renewalSoon.length} contract{renewalSoon.length === 1 ? '' : 's'} need renewal review soon.</div>}

      <div className="rounded border border-gray-200 bg-white">
        <div className="border-b p-3"><div className="relative max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer or contract number" className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm" /></div></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-gray-50 text-left text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Contract</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Renewal date</th><th className="px-4 py-3">Terms</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y">
          {isLoading && <tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading contracts…</td></tr>}
          {isError && <tr><td colSpan={6} className="p-8 text-center text-red-600">Could not load contracts.</td></tr>}
          {!isLoading && !isError && contracts.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-gray-500"><FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />No active contracts found.</td></tr>}
          {contracts.map((contract) => <tr key={contract.id}><td className="px-4 py-3 font-medium">{contract.order_number || 'Draft'}</td><td className="px-4 py-3">{contract.customer_name || '—'}</td><td className="px-4 py-3">{currency(contract.grand_total)}</td><td className="px-4 py-3">{contract.due_date ? new Date(contract.due_date).toLocaleDateString('en-IN') : 'Not set'}</td><td className="max-w-xs truncate px-4 py-3 text-gray-600">{contract.terms_conditions?.length ? `${contract.terms_conditions.length} terms` : 'Not set'}</td><td className="px-4 py-3"><button onClick={() => openEditor(contract)} className="inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"><Pencil className="h-4 w-4" />Manage</button></td></tr>)}
        </tbody></table></div>
      </div>

      {editing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div className="w-full max-w-xl rounded-lg bg-white p-5 shadow-xl"><div className="mb-4"><h2 className="text-lg font-semibold">Manage {editing.order_number || 'contract'}</h2><p className="text-sm text-gray-600">Keep each contract term on a separate line. The renewal date is used for reminders.</p></div><label className="block text-sm font-medium">Contract terms<textarea value={terms} onChange={(event) => setTerms(event.target.value)} rows={7} placeholder="Payment is due within 30 days\nService period…" className="mt-1 w-full rounded border border-gray-300 p-3 text-sm" /></label><label className="mt-4 block text-sm font-medium">Renewal date<input type="date" value={renewalDate} onChange={(event) => setRenewalDate(event.target.value)} className="mt-1 block rounded border border-gray-300 px-3 py-2 text-sm" /></label><div className="mt-5 flex justify-end gap-2"><button onClick={() => setEditing(null)} className="rounded border px-4 py-2 text-sm">Cancel</button><button disabled={saving} onClick={saveContract} className="inline-flex items-center gap-2 rounded bg-[#1a365d] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save contract'}</button></div></div></div>}
    </div>
  );
}

function Stat({ label, value, alert = false }: { label: string; value: string | number; alert?: boolean }) {
  return <div className="rounded border border-gray-200 bg-white p-4"><div className="text-sm text-gray-600">{label}</div><div className={`mt-1 text-2xl font-semibold ${alert ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div></div>;
}
