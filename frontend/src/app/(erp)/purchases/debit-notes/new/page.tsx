'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { leadsApi, debitNotesApi } from '@/services/crmService';
import CreateCustomerModal from '../../../quotes/new/components/CreateCustomerModal';
import EnterItemModal from '../../../quotes/new/components/EnterItemModal';

type Item = { item_description: string; hsn_sac: string; qty: number; unit: string; rate: number; discount: number; cgst_percent: number; sgst_percent: number };

const emptyItem = (): Item => ({ item_description: '', hsn_sac: '', qty: 1, unit: 'Nos', rate: 0, discount: 0, cgst_percent: 0, sgst_percent: 0 });
const supplierLedgers = ['Sundry Creditors - Test', 'Trade Payables - Test'];
const pnlLedgers = ['Purchase Returns - Test', 'Purchase Expense - Test'];

const today = new Date().toISOString().slice(0, 10);

export default function CreateDebitNotePage() {
  const [partyName, setPartyName] = useState('');
  const [address, setAddress] = useState('');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [debitNoteNo, setDebitNoteNo] = useState('DN-1');
  const [reference, setReference] = useState('');
  const [noteDate, setNoteDate] = useState(today);
  const [dueDate, setDueDate] = useState(today);
  const [supplierLedger, setSupplierLedger] = useState('');
  const [pnlLedger, setPnlLedger] = useState('');
  const [voucherNo, setVoucherNo] = useState('');
  const [voucherDate, setVoucherDate] = useState(today);
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [notes, setNotes] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [termDraft, setTermDraft] = useState('');
  const [extraCharge, setExtraCharge] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [shareEmail, setShareEmail] = useState(false);
  const [shareWhatsapp, setShareWhatsapp] = useState(false);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [isCreateSupplierOpen, setIsCreateSupplierOpen] = useState(false);
  const [isEnterItemOpen, setIsEnterItemOpen] = useState(false);
  const [enterItemType, setEnterItemType] = useState<'stock' | 'service'>('stock');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.list({ page_size: 100 }),
  });

  const leads = (leadsResponse?.data as any)?.results || (leadsResponse?.data as any)?.data?.results || [];

  const filteredLeads = leads.filter((lead: any) => {
    const query = partyName.toLowerCase().trim();
    if (!query) return true;
    const companyMatch = (lead.company_name || '').toLowerCase().includes(query);
    const fullNameMatch = (lead.full_name || '').toLowerCase().includes(query);
    return companyMatch || fullNameMatch;
  });

  const totals = useMemo(() => items.reduce((sum, item) => {
    const taxable = Math.max(0, item.qty * item.rate - item.discount);
    const cgst = taxable * item.cgst_percent / 100;
    const sgst = taxable * item.sgst_percent / 100;
    return { taxable: sum.taxable + taxable, cgst: sum.cgst + cgst, sgst: sum.sgst + sgst };
  }, { taxable: 0, cgst: 0, sgst: 0 }), [items]);
  const grandTotal = totals.taxable + totals.cgst + totals.sgst + extraCharge - customDiscount;

  const setItem = (index: number, key: keyof Item, value: string) => {
    setItems(current => current.map((item, i) => i === index
      ? { ...item, [key]: ['item_description', 'hsn_sac', 'unit'].includes(key) ? value : Number(value) || 0 }
      : item));
  };

  const addItemFromModal = (item: { name: string; rate: number; unit: string; hsnSac: string; description: string }) => {
    setItems(current => [
      ...current,
      {
        item_description: item.name,
        hsn_sac: item.hsnSac,
        qty: 1,
        unit: item.unit || 'Nos',
        rate: item.rate || 0,
        discount: 0,
        cgst_percent: 0,
        sgst_percent: 0
      }
    ]);
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!partyName.trim()) { setError('Party is required.'); return; }
    if (!debitNoteNo.trim()) { setError('Debit Note No. is required.'); return; }
    const validItems = items.filter(item => item.item_description.trim());
    if (!validItems.length) { setError('Add at least one item description.'); return; }
    setSaving(true); setError('');
    try {
      await debitNotesApi.create({
        party_name: partyName, address, debit_note_no: debitNoteNo, reference,
        note_date: noteDate, due_date: dueDate || null, supplier_ledger: supplierLedger,
        pnl_ledger: pnlLedger, voucher_no: voucherNo, voucher_date: voucherDate || null,
        notes, bank_details: bankDetails, terms_conditions: terms,
        share_email: shareEmail, share_whatsapp: shareWhatsapp, print_after_save: printAfterSave,
        extra_charge: extraCharge, custom_discount: customDiscount,
        total_taxable: totals.taxable, total_cgst: totals.cgst, total_sgst: totals.sgst,
        grand_total: grandTotal,
        items: validItems.map(item => {
          const taxable = Math.max(0, item.qty * item.rate - item.discount);
          const cgstAmt = taxable * item.cgst_percent / 100;
          const sgstAmt = taxable * item.sgst_percent / 100;
          return { ...item, taxable, cgst_amt: cgstAmt, sgst_amt: sgstAmt, amount: taxable + cgstAmt + sgstAmt };
        }),
      });
      window.location.assign('/purchases');
    } catch (requestError: unknown) {
      if (isAxiosError<{ errors?: Record<string, string[]>; detail?: string }>(requestError)) {
        const data = requestError.response?.data;
        setError(data?.errors ? Object.values(data.errors).flat().join(' ') : data?.detail ?? requestError.message);
      } else {
        setError('Could not save the debit note.');
      }
    } finally { setSaving(false); }
  };

  const { showToast } = useToast();

  return <form onSubmit={save} className="max-w-[1800px] mx-auto p-3 space-y-3 text-sm bg-[#f7f7f7] min-h-screen">
    <div className="flex items-center justify-between"><h1 className="text-2xl text-gray-800">Create Debit Note</h1><div className="flex gap-2"><Link href="/purchases" className="flex items-center gap-1 bg-[#162032] text-white px-3 py-1.5 rounded"><ArrowLeft size={15} /> Back</Link><button disabled={saving} className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded disabled:opacity-60"><Check size={15} /> {saving ? 'Saving…' : 'Save'}</button></div></div>
    {error && <div className="border border-red-200 bg-red-50 text-red-700 px-3 py-2 rounded">{error}</div>}
    <Section title="Basic Information"><div className="grid grid-cols-[100px_minmax(0,390px)] gap-2 items-start"><label>Party :</label><div className="relative w-full">
      <div className="flex items-center gap-2">
        <input
          required
          value={partyName}
          onChange={e => { setPartyName(e.target.value); setShowPartyDropdown(true); setLeadId(null); }}
          onFocus={() => setShowPartyDropdown(true)}
          className="input"
          placeholder="Select or enter supplier"
        />
        <button type="button" onClick={() => setIsCreateSupplierOpen(true)} className="inline-flex items-center justify-center h-10 w-10 rounded bg-green-100 text-green-800 hover:bg-green-200 border border-gray-300"><Plus size={16} /></button>
      </div>
      {showPartyDropdown && filteredLeads.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-gray-300 bg-white shadow-lg">
          {filteredLeads.map((lead: any) => (
            <button
              key={lead.id}
              type="button"
              onClick={() => {
                setLeadId(lead.id);
                setPartyName(lead.company_name || lead.full_name || '');
                setAddress(lead.address || '');
                setShowPartyDropdown(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-100"
            >
              <div className="font-semibold">{lead.company_name || lead.full_name}</div>
              <div className="text-xs text-gray-500">{lead.city ? `${lead.city}, ${lead.state}` : lead.address}</div>
            </button>
          ))}
        </div>
      )}
    </div></div></Section>
    <div className="grid grid-cols-1 xl:grid-cols-[3fr_1fr] gap-3"><Section title="Customer Details"><div className="grid grid-cols-[100px_1fr] gap-2"><label>Address :</label><textarea value={address} onChange={e => setAddress(e.target.value)} className="input h-24 resize-none" placeholder="Supplier billing address" /></div></Section><Section title="Document Details"><div className="space-y-2"><Field label="DN No." value={debitNoteNo} setValue={setDebitNoteNo} required /><Field label="Reference" value={reference} setValue={setReference} /><Field label="Note Date" value={noteDate} setValue={setNoteDate} type="date" required /><Field label="Due Date" value={dueDate} setValue={setDueDate} type="date" /></div></Section></div>
    <Section title="Accounts Update"><div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-3"><SelectField label="Supplier Ledger" value={supplierLedger} setValue={setSupplierLedger} options={supplierLedgers} /><Field label="Voucher No." value={voucherNo} setValue={setVoucherNo} /><SelectField label="P&L Ledger" value={pnlLedger} setValue={setPnlLedger} options={pnlLedgers} /><Field label="Voucher Date" value={voucherDate} setValue={setVoucherDate} type="date" /></div></Section>
    <Section title="Item List"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] border-collapse"><thead><tr className="text-left border-b">{['No.', 'Item & Description', 'HSN/SAC', 'Qty', 'Unit', 'Rate (₹)', 'Discount (₹)', 'Taxable (₹)', 'CGST (₹)', 'SGST (₹)', 'Amt (₹)', ''].map(label => <th key={label} className="p-2 font-semibold">{label}</th>)}</tr></thead><tbody>{items.map((item, index) => { const taxable = Math.max(0, item.qty * item.rate - item.discount); const cgst = taxable * item.cgst_percent / 100; const sgst = taxable * item.sgst_percent / 100; return <tr key={index} className="border-b"><td className="p-2">{index + 1}</td><td className="p-2"><input value={item.item_description} onChange={e => setItem(index, 'item_description', e.target.value)} className="table-input" /></td><td className="p-2"><input value={item.hsn_sac} onChange={e => setItem(index, 'hsn_sac', e.target.value)} className="table-input" /></td><td className="p-2"><input type="number" min="0" value={item.qty} onChange={e => setItem(index, 'qty', e.target.value)} className="table-input" /></td><td className="p-2"><input value={item.unit} onChange={e => setItem(index, 'unit', e.target.value)} className="table-input" /></td><td className="p-2"><input type="number" min="0" value={item.rate} onChange={e => setItem(index, 'rate', e.target.value)} className="table-input" /></td><td className="p-2"><input type="number" min="0" value={item.discount} onChange={e => setItem(index, 'discount', e.target.value)} className="table-input" /></td><td className="p-2 text-right">{taxable.toFixed(2)}</td><td className="p-2"><input type="number" min="0" value={item.cgst_percent} onChange={e => setItem(index, 'cgst_percent', e.target.value)} className="table-input" /></td><td className="p-2"><input type="number" min="0" value={item.sgst_percent} onChange={e => setItem(index, 'sgst_percent', e.target.value)} className="table-input" /></td><td className="p-2 text-right">{(taxable + cgst + sgst).toFixed(2)}</td><td className="p-2"><button type="button" onClick={() => setItems(current => current.length === 1 ? current : current.filter((_, i) => i !== index))} className="text-red-600"><Trash2 size={16} /></button></td></tr>})}</tbody></table></div><div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => { setEnterItemType('stock'); setIsEnterItemOpen(true); }} className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1.5 rounded"><Plus size={14} /> Add Stock Item</button>
      <button type="button" onClick={() => { setEnterItemType('service'); setIsEnterItemOpen(true); }} className="flex items-center gap-1 bg-orange-100 text-orange-800 px-3 py-1.5 rounded"><Plus size={14} /> Add Service / Non-Stock Item</button>
    </div></Section>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3"><Section title="Terms & Conditions"><div className="flex gap-2"><input value={termDraft} onChange={e => setTermDraft(e.target.value)} className="input" placeholder="Add a term" /><button type="button" onClick={() => { if (termDraft.trim()) { setTerms(current => [...current, termDraft.trim()]); setTermDraft(''); } }} className="bg-green-100 text-green-800 px-3 rounded"><Plus size={15} /></button></div>{terms.map((term, i) => <p key={`${term}-${i}`} className="mt-2">• {term}</p>)}</Section><Section title="Notes"><textarea value={notes} onChange={e => setNotes(e.target.value)} className="input h-24 resize-none" /></Section><Section title="Bank Details"><input value={bankDetails} onChange={e => setBankDetails(e.target.value)} className="input" placeholder="Select / enter bank details" /></Section></div>
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-3"><Section title="Share"><div className="flex gap-5">{[[shareEmail, setShareEmail, 'Email'], [shareWhatsapp, setShareWhatsapp, 'Whatsapp'], [printAfterSave, setPrintAfterSave, 'Print document after saving']].map(([checked, setChecked, label]) => <label key={label as string} className="flex gap-2"><input type="checkbox" checked={checked as boolean} onChange={e => (setChecked as (value: boolean) => void)(e.target.checked)} />{label as string}</label>)}</div></Section><Section title="Total"><div className="space-y-2 text-right"><div>Taxable: ₹ {totals.taxable.toFixed(2)}</div><div>GST: ₹ {(totals.cgst + totals.sgst).toFixed(2)}</div><div className="flex justify-end gap-2"><label>Extra charge</label><input type="number" min="0" value={extraCharge} onChange={e => setExtraCharge(Number(e.target.value) || 0)} className="w-24 border rounded px-2" /></div><div className="flex justify-end gap-2"><label>Discount</label><input type="number" min="0" value={customDiscount} onChange={e => setCustomDiscount(Number(e.target.value) || 0)} className="w-24 border rounded px-2" /></div><div className="border-t pt-2 font-bold">Grand Total: ₹ {grandTotal.toFixed(2)}</div></div></Section></div>
    <button disabled={saving} className="flex items-center gap-1 bg-green-700 text-white px-4 py-2 rounded disabled:opacity-60"><Check size={16} /> {saving ? 'Saving…' : 'Save Debit Note'}</button>

    <CreateCustomerModal
      isOpen={isCreateSupplierOpen}
      onClose={() => setIsCreateSupplierOpen(false)}
      title="Create Supplier"
      onSuccess={(supplierName, billingAddress, contactName, id, stateVal) => {
        setLeadId(id);
        setPartyName(supplierName);
        setAddress(billingAddress);
        setShowPartyDropdown(false);
        showToast('Supplier created successfully and selected.');
      }}
    />

    <EnterItemModal
      isOpen={isEnterItemOpen}
      itemType={enterItemType}
      onClose={() => setIsEnterItemOpen(false)}
      onSaveItem={(itemDetails) => {
        addItemFromModal(itemDetails);
      }}
    />

    <style jsx global>{`.input { width: 100%; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.375rem 0.625rem; background: white; } .input:focus, .table-input:focus { outline: none; border-color: #16a34a; } .table-input { width: 100%; min-width: 4rem; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.3rem 0.45rem; background: white; }`}</style>
  </form>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <section className="bg-white border border-gray-200 rounded p-3"><h2 className="font-semibold text-gray-800 mb-3">{title}</h2>{children}</section>; }
function Field({ label, value, setValue, type = 'text', required = false }: { label: string; value: string; setValue: (value: string) => void; type?: string; required?: boolean }) { return <label className="grid grid-cols-[100px_1fr] gap-2 items-center"><span>{label} :</span><input required={required} type={type} value={value} onChange={e => setValue(e.target.value)} className="input" /></label>; }
function SelectField({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) { return <label className="grid grid-cols-[100px_1fr] gap-2 items-center"><span>{label} :</span><select value={value} onChange={e => setValue(e.target.value)} className="input"><option value="">Select Ledger</option>{options.map(option => <option key={option}>{option}</option>)}</select></label>; }
