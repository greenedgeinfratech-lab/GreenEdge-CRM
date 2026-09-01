'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import {
  Printer, ArrowLeft, Check, Search, Plus, Copy, Info,
  ChevronDown, X, User, Building2, Loader2, AlertCircle, MapPin, Phone, Mail,
  Trash2, FileText, Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsApi, invoicesApi } from '@/services/crmService';
import type { Lead, LeadCreatePayload, ProductCatalog, InvoiceItem } from '@/interfaces/crm';
import SelectItemModal from '../components/SelectItemModal';
import InvoicePdfView from '../components/InvoicePdfView';

// ─── Customer type (mapped from Lead) ────────────────────────────────────────

interface Customer {
  id: string;
  name: string;
  business: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstin?: string;
}

type LeadListPayload = {
  count?: number;
  results?: Lead[];
  data?: Lead[] | { count?: number; results?: Lead[] };
};

function getLeadPage(payload: LeadListPayload): { count?: number; results: Lead[] } {
  const nestedPayload = Array.isArray(payload.data) ? undefined : payload.data;
  return {
    count: payload.count ?? nestedPayload?.count,
    results: payload.results ?? (Array.isArray(payload.data) ? payload.data : nestedPayload?.results) ?? [],
  };
}

async function getAllCustomersForInvoice(): Promise<Lead[]> {
  const allLeads: Lead[] = [];
  const pageSize = 100;
  let page = 1;
  let total: number | undefined;

  do {
    const res = await leadsApi.list({ page, page_size: pageSize, ordering: 'first_name' });
    const leadPage = getLeadPage(res.data as unknown as LeadListPayload);
    allLeads.push(...leadPage.results);
    total = leadPage.count;
    page += 1;
  } while (total !== undefined && allLeads.length < total);

  return allLeads;
}

function leadToCustomer(lead: Lead): Customer {
  return {
    id: lead.id,
    name: lead.full_name,
    business: lead.company_name ?? '',
    phone: lead.mobile ?? '',
    email: lead.email ?? '',
    address: lead.address ?? '',
    city: lead.city ?? '',
    state: lead.state ?? '',
    country: lead.country ?? '',
    pincode: lead.pincode ?? '',
    gstin: lead.gst_number,
  };
}

function customerAddress(customer: Customer): string {
  const locality = [customer.city, customer.state, customer.country, customer.pincode]
    .filter(Boolean)
    .join(', ');
  return [customer.address, locality].filter(Boolean).join(customer.address && locality ? '\n' : '');
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh',
];

// Pre-configured bank accounts for the dropdown
const BANK_ACCOUNTS: { label: string; value: string }[] = [
  {
    label: 'Canara Bank - (85141010001650)',
    value: 'Canara Bank\nA/C No: 85141010001650\nIFSC: CNRB0008514\nBranch: Main Branch',
  },
  {
    label: 'State Bank of India - (43279551326)',
    value: 'State Bank of India\nA/C No: 43279551326\nIFSC: SBIN0001234\nBranch: Main Branch',
  },
];

const TEST_CUSTOMER_LEDGERS = [
  'Sundry Debtors - Primary',
  'Trade Receivables',
  'Walk-in Customer Ledger',
];

const TEST_INCOME_LEDGERS = [
  'Sales Income',
  'Service & Commission Income',
  'Consulting Income',
];

// Helper to compute tax and row amount accurately
// applyIgst = true  → inter-state (IGST only, CGST/SGST = 0)
// applyIgst = false → intra-state UP (CGST + SGST, IGST = 0)
function calculateItemRow(item: InvoiceItem, applyIgst: boolean = false): InvoiceItem {
  const qty = Math.max(1, Number(item.qty) || 1);
  const rate = Math.max(0, Number(item.rate) || 0);
  const discount = Math.max(0, Number(item.discount) || 0);
  const taxable = Math.max(0, qty * rate - discount);
  const cgst_percent = Number(item.cgst_percent) || 0;
  const sgst_percent = Number(item.sgst_percent) || 0;
  const igst_percent = Number(item.igst_percent) || (cgst_percent + sgst_percent);

  let cgst_amt: number;
  let sgst_amt: number;
  let igst_amt: number;
  let amt: number;

  if (applyIgst) {
    // Inter-state: only IGST
    const effectiveIgst = igst_percent || (cgst_percent + sgst_percent);
    cgst_amt = 0;
    sgst_amt = 0;
    igst_amt = (taxable * effectiveIgst) / 100;
    amt = taxable + igst_amt;
  } else {
    // Intra-state (Uttar Pradesh): CGST + SGST
    cgst_amt = (taxable * cgst_percent) / 100;
    sgst_amt = (taxable * sgst_percent) / 100;
    igst_amt = 0;
    amt = taxable + cgst_amt + sgst_amt;
  }

  return {
    ...item,
    qty,
    rate,
    discount,
    taxable,
    cgst_percent,
    sgst_percent,
    igst_percent: igst_percent || (cgst_percent + sgst_percent),
    cgst_amt,
    sgst_amt,
    igst_amt,
    amt,
  };
}

// ─── Search Customer Modal ────────────────────────────────────────────────────

function SearchCustomerModal({
  onClose,
  onSelect,
  initialQuery = '',
}: {
  onClose: () => void;
  onSelect: (c: Customer) => void;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leads-for-invoice-search'],
    queryFn: getAllCustomersForInvoice,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const customers: Customer[] = (data ?? []).map(leadToCustomer);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.business.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.includes(query)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Search Customer</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Search by name, business or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        <div className="overflow-y-auto max-h-72">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400 text-sm">
              <Loader2 size={18} className="animate-spin" /> Loading customers…
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-sm text-red-500">
              <AlertCircle size={20} />
              <span>Failed to load customers.</span>
              <button onClick={() => refetch()} className="text-xs underline text-gray-500">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">
              {query ? 'No customers match your search.' : 'No customers found in CRM.'}
            </p>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c); onClose(); }}
                className="w-full flex items-start gap-3 px-5 py-3 hover:bg-green-50 border-b border-gray-50 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={14} className="text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 truncate">{c.name}</p>
                  {c.business && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Building2 size={11} /> {c.business}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">{c.phone} {c.city ? `· ${c.city}` : ''}</p>
                </div>
                {c.gstin && (
                  <span className="text-xs text-green-600 bg-green-50 border border-green-200 rounded px-1.5 py-0.5 flex-shrink-0">GST</span>
                )}
              </button>
            ))
          )}
        </div>

        <div className="px-5 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-200">
          {!isLoading && !isError && (
            <span className="text-xs text-gray-400">{filtered.length} customer{filtered.length !== 1 ? 's' : ''} found</span>
          )}
          <button onClick={onClose} className="ml-auto px-4 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create Customer Modal ────────────────────────────────────────────────────

const EMPTY_FORM = {
  salutation: 'Mr.',
  firstName: '',
  lastName: '',
  gstin: '',
  businessName: '',
  businessCode: '',
  createLedger: false,
  mobile: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  country: 'India',
  pincode: '',
  addSalesDetails: false,
  addMoreDetails: false,
};

function CreateCustomerModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (c: Customer) => void;
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const queryClient = useQueryClient();

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!form.firstName) { setSaveError('First name is required.'); return; }
    const mobile = form.mobile.replace(/[\s-]/g, '');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setSaveError('Enter a valid 10-digit mobile number starting with 6–9.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const customerPayload: LeadCreatePayload & { gst_number?: string } = {
        first_name: form.firstName,
        last_name: form.lastName || undefined,
        company_name: form.businessName || undefined,
        mobile,
        email: form.email || undefined,
        gst_number: form.gstin || undefined,
        address: [form.addressLine1, form.addressLine2].filter(Boolean).join(', ') || undefined,
        city: form.city || undefined,
        state: form.state || undefined,
        country: form.country || 'India',
        pincode: form.pincode || undefined,
      };
      const res = await leadsApi.create(customerPayload);
      const createdLead = res.data as unknown as Lead | { data: Lead };
      const lead = 'id' in createdLead ? createdLead : createdLead.data;
      queryClient.invalidateQueries({ queryKey: ['leads-for-invoice-search'] });
      onSave(leadToCustomer(lead));
      onClose();
    } catch (err: unknown) {
      setSaveError(
        isAxiosError(err) ? err.response?.data?.message || err.message : 'Failed to save customer.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">Create Customer</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-700 text-white text-sm rounded hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Contact Name *</label>
              <div className="flex gap-2">
                <select
                  value={form.salutation}
                  onChange={(e) => set('salutation', e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-sm w-20 bg-white"
                >
                  {['Mr.', 'Mrs.', 'Ms.', 'Dr.'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={(e) => set('firstName', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={(e) => set('lastName', e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">GSTIN</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => set('gstin', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => set('businessName', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 mb-1 block flex items-center gap-1">
                <Phone size={13} /> Mobile *
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => set('mobile', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 sticky bottom-0 bg-white">
          {saveError && (
            <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
              <AlertCircle size={13} /> {saveError}
            </p>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-700 text-white text-sm rounded hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={onClose} className="px-4 py-1.5 bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Create B2B Invoice Page ─────────────────────────────────────────────

function CreateB2BInvoiceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Basic Form States
  const [invoiceType, setInvoiceType] = useState<'B2B Invoice' | 'Cash Memo'>(() => searchParams.get('type') === 'retail' ? 'Cash Memo' : 'B2B Invoice');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerInput, setCustomerInput] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [salesCredit, setSalesCredit] = useState('Piyush Nirmal');
  const [billingAddress, setBillingAddress] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingDetails, setShippingDetails] = useState('');

  // Document & Ledger States
  const [invoiceNo, setInvoiceNo] = useState(() => `INV-${Math.floor(1000 + Math.random() * 9000)}`);
  const [reference, setReference] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [customerLedger, setCustomerLedger] = useState('Sundry Debtors - Primary');
  const [incomeLedger, setIncomeLedger] = useState('Sales Income');
  const [voucherNo, setVoucherNo] = useState('1');
  const [voucherDate, setVoucherDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Notes & Details
  const [notes, setNotes] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [recoveryAmt, setRecoveryAmt] = useState<number | ''>(0);
  const [recoveryNotes, setRecoveryNotes] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('Unpaid');

  // Share & Print
  const [shareEmail, setShareEmail] = useState(false);
  const [shareWhatsapp, setShareWhatsapp] = useState(false);
  const [printAfterSave, setPrintAfterSave] = useState(false);

  // Line Items State
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [showSelectItemModal, setShowSelectItemModal] = useState(false);

  // Terms & Conditions
  const [termsConditions, setTermsConditions] = useState<string[]>([
    'Payment due within 15 days of invoice date.',
    'Goods once sold will not be taken back.',
  ]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [newTermInput, setNewTermInput] = useState('');

  // Charges & Discounts
  const [extraCharge, setExtraCharge] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState<number | ''>(0);

  // Customer Modals
  const [showSearch, setShowSearch] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copyTooltip, setCopyTooltip] = useState(false);

  // Save & Print States
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [printedInvoiceData, setPrintedInvoiceData] = useState<any>(null);

  // GST regime: IGST for inter-state (outside Uttar Pradesh), CGST+SGST for intra-state
  const COMPANY_STATE = 'Uttar Pradesh';
  const customerState = selectedCustomer?.state ?? '';
  const isIGST = customerState !== '' && customerState !== COMPANY_STATE;

  // Auto-calculated Totals
  const totalTaxable = items.reduce((sum, item) => sum + (item.taxable || 0), 0);
  const totalCgst = items.reduce((sum, item) => sum + (item.cgst_amt || 0), 0);
  const totalSgst = items.reduce((sum, item) => sum + (item.sgst_amt || 0), 0);
  const totalIgst = items.reduce((sum, item) => sum + (item.igst_amt || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.amt || 0), 0);
  const grandTotal = Math.max(0, subtotal + Number(extraCharge || 0) - Number(customDiscount || 0));

  const handleSelectCustomer = (c: Customer) => {
    const address = customerAddress(c);
    setSelectedCustomer(c);
    setCustomerInput(c.name);
    setContactPerson(c.name);
    setBillingAddress(address);
    setSameAsBilling(true);
    setShippingDetails(address);
    // Recalculate all existing rows with updated GST regime
    const newIsIGST = c.state !== '' && c.state !== 'Uttar Pradesh';
    setItems((prev) => prev.map((item) => calculateItemRow(item, newIsIGST)));
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerInput('');
    setContactPerson('');
    setBillingAddress('');
    setSameAsBilling(true);
    setShippingDetails('');
  };

  // Add items selected from Biziverse Modal
  const handleSelectCatalogItems = (selectedProducts: ProductCatalog[]) => {
    const newItems: InvoiceItem[] = selectedProducts.map((p) =>
      calculateItemRow({
        item_description: p.name,
        hsn_sac: p.hsn_sac || '',
        qty: 1,
        unit: p.unit || 'Nos',
        rate: Number(p.rate) || 0,
        discount: 0,
        taxable: Number(p.rate) || 0,
        cgst_percent: Number(p.cgst_percent) || 0,
        sgst_percent: Number(p.sgst_percent) || 0,
        igst_percent: (Number(p.cgst_percent) || 0) + (Number(p.sgst_percent) || 0),
        cgst_amt: 0,
        sgst_amt: 0,
        igst_amt: 0,
        amt: 0,
      }, isIGST)
    );
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleUpdateRow = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      updated[index] = calculateItemRow(target, isIGST);
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveInvoice = async (redirectAfter: boolean = true) => {
    if (!customerInput && !selectedCustomer) {
      setSaveError('Please select or enter a customer.');
      return;
    }
    if (items.length === 0) {
      setSaveError('Please click "+ Add Item" to select at least one item.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        type: invoiceType,
        lead: selectedCustomer?.id || null,
        customer_name: customerInput || selectedCustomer?.name || 'Customer',
        contact_person: contactPerson,
        sales_credit: salesCredit,
        billing_address: billingAddress,
        same_as_billing: sameAsBilling,
        shipping_details: shippingDetails,
        invoice_no: invoiceNo,
        reference: reference,
        invoice_date: invoiceDate,
        due_date: dueDate,
        customer_ledger: customerLedger,
        income_ledger: incomeLedger,
        voucher_no: voucherNo,
        voucher_date: voucherDate,
        notes,
        bank_details: bankDetails,
        terms_conditions: termsConditions,
        recovery_amt: Number(recoveryAmt) || 0,
        recovery_notes: recoveryNotes,
        invoice_status: invoiceStatus,
        share_email: shareEmail,
        share_whatsapp: shareWhatsapp,
        print_after_save: printAfterSave,
        extra_charge: Number(extraCharge) || 0,
        custom_discount: Number(customDiscount) || 0,
        total_taxable: totalTaxable,
        total_cgst: isIGST ? 0 : totalCgst,
        total_sgst: isIGST ? 0 : totalSgst,
        total_igst: isIGST ? totalIgst : 0,
        grand_total: grandTotal,
        items: items.map((item) => calculateItemRow(item, isIGST)),
      };

      await invoicesApi.create(payload as any);
      setSaveSuccess('Invoice saved successfully!');

      // Set print preview data and launch print dialog
      setPrintedInvoiceData(payload);
      setTimeout(() => {
        window.print();
      }, 500);
      
      if (redirectAfter) {
        setTimeout(() => router.push('/invoices'), 2000);
      } else {
        // Reset form for next invoice
        setItems([]);
        setInvoiceNo(`INV-${Math.floor(1000 + Math.random() * 9000)}`);
        setSaveSuccess('Invoice saved & PDF generated! Ready to enter another.');
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail || err?.message || 'Failed to save invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Search Customer Modal */}
      {showSearch && (
        <SearchCustomerModal
          onClose={() => setShowSearch(false)}
          onSelect={handleSelectCustomer}
          initialQuery={customerInput}
        />
      )}

      {/* Create Customer Modal */}
      {showCreate && (
        <CreateCustomerModal
          onClose={() => setShowCreate(false)}
          onSave={handleSelectCustomer}
        />
      )}

      {/* Biziverse Select Item Modal */}
      {showSelectItemModal && (
        <SelectItemModal
          onClose={() => setShowSelectItemModal(false)}
          onSelectItems={handleSelectCatalogItems}
        />
      )}

      {/* Extra Charge / Discount Modals */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-xs shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800 text-sm">Add Extra Charge</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                placeholder="0.00"
                value={tempAmount}
                onChange={(e) => setTempAmount(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full border border-gray-300 rounded pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#c85a17]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setShowExtraModal(false)} className="px-3 py-1 border rounded text-xs text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  setExtraCharge(Number(tempAmount) || 0);
                  setShowExtraModal(false);
                }}
                className="px-3 py-1 bg-[#c85a17] text-white rounded text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-xs shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800 text-sm">Add Custom Discount</h3>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
              <input
                type="number"
                placeholder="0.00"
                value={tempAmount}
                onChange={(e) => setTempAmount(e.target.value ? parseFloat(e.target.value) : '')}
                className="w-full border border-gray-300 rounded pl-7 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#c85a17]"
              />
            </div>
            <div className="flex justify-end gap-2 mt-1">
              <button onClick={() => setShowDiscountModal(false)} className="px-3 py-1 border rounded text-xs text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  setCustomDiscount(Number(tempAmount) || 0);
                  setShowDiscountModal(false);
                }}
                className="px-3 py-1 bg-[#c85a17] text-white rounded text-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800 text-sm">Add Term / Condition</h3>
            <textarea
              placeholder="e.g. 18% GST applicable as per government rules."
              value={newTermInput}
              onChange={(e) => setNewTermInput(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 text-sm h-20 resize-none focus:outline-none focus:border-green-600"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTermModal(false)} className="px-3 py-1 border rounded text-xs text-gray-600">Cancel</button>
              <button
                onClick={() => {
                  if (newTermInput.trim()) {
                    setTermsConditions((prev) => [...prev, newTermInput.trim()]);
                    setNewTermInput('');
                  }
                  setShowTermModal(false);
                }}
                className="px-3 py-1 bg-green-700 text-white rounded text-xs"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 bg-[#f8f9fa] min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-2 mb-1">
          <h1 className="text-2xl text-gray-700 font-normal">Create Invoice</h1>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1.5 bg-[#e9ecef] border border-[#ced4da] rounded text-sm text-gray-700 hover:bg-gray-200">
              <Printer size={16} /> Print Settings
            </button>
            <Link href="/invoices" className="flex items-center gap-1 px-3 py-1.5 bg-[#162032] text-white rounded text-sm hover:bg-[#1a2b4c]">
              <ArrowLeft size={16} /> Back
            </Link>
            <button
              onClick={() => handleSaveInvoice(true)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 disabled:opacity-60"
            >
              {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={16} />}
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Global Notifications */}
        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex items-center gap-2">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
            <Check size={16} /> {saveSuccess}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
            <h2 className="font-semibold text-gray-800 mb-4">Basic Information</h2>
            <div className="grid grid-cols-[150px_1fr] gap-4 items-center mb-4">
              <label className="text-sm text-gray-600">Type :</label>
              <div className="flex items-center gap-6 text-sm text-gray-700">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="invoiceType"
                    checked={invoiceType === 'B2B Invoice'}
                    onChange={() => setInvoiceType('B2B Invoice')}
                    className="w-4 h-4 text-[#162032] focus:ring-[#162032]"
                  />
                  B2B Invoice
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="radio"
                    name="invoiceType"
                    checked={invoiceType === 'Cash Memo'}
                    onChange={() => setInvoiceType('Cash Memo')}
                    className="w-4 h-4 text-[#162032] focus:ring-[#162032]"
                  />
                  Cash Memo
                </label>
              </div>

              <label className="text-sm text-gray-600">Customer :</label>
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={customerInput}
                  onFocus={() => setShowSearch(true)}
                  onClick={() => setShowSearch(true)}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    setSelectedCustomer(null);
                  }}
                  placeholder="Select or enter customer…"
                  className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:border-green-500"
                />

                <button
                  onClick={() => setShowSearch(true)}
                  title="Search existing customer"
                  className="p-1.5 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 transition-colors"
                >
                  <Search size={16} className="text-gray-600" />
                </button>

                <button
                  onClick={() => setShowCreate(true)}
                  title="Create new customer"
                  className="p-1.5 bg-green-100 border border-green-300 text-green-700 rounded hover:bg-green-200 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {selectedCustomer && (
              <div className="ml-[166px] max-w-md">
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded px-3 py-2 text-sm text-green-800">
                  <User size={14} className="flex-shrink-0" />
                  <div className="min-w-0">
                    <span className="font-medium">{selectedCustomer.name}</span>
                    {selectedCustomer.business && (
                      <span className="text-green-600 ml-2">· {selectedCustomer.business}</span>
                    )}
                  </div>
                  <button onClick={clearCustomer} className="ml-auto text-green-500 hover:text-green-700">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col xl:flex-row gap-4">
            {/* Customer Details */}
            <div className="flex-1 bg-white border border-gray-200 rounded p-4 shadow-xs">
              <h2 className="font-semibold text-gray-800 mb-4">Customer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Contact Person:</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Sales Credit :</label>
                  <input
                    type="text"
                    value={salesCredit}
                    onChange={(e) => setSalesCredit(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                  <label className="text-sm text-gray-600 mt-2">Billing Address :</label>
                  <textarea
                    value={billingAddress}
                    onChange={(e) => {
                      setBillingAddress(e.target.value);
                      if (sameAsBilling) setShippingDetails(e.target.value);
                    }}
                    placeholder="Enter billing address…"
                    className="w-full border border-gray-300 rounded p-2 text-sm h-24 resize-none focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                    <label className="text-sm text-gray-600">Shipping Address :</label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sameAsBilling}
                        onChange={(e) => {
                          setSameAsBilling(e.target.checked);
                          if (e.target.checked) setShippingDetails(billingAddress);
                        }}
                        className="w-4 h-4 rounded text-[#162032] focus:ring-[#162032]"
                      />
                      Same as Billing address
                    </label>
                  </div>
                  <div className="grid grid-cols-[120px_1fr] items-start gap-2">
                    <label className="text-sm text-gray-600 mt-2">Shipping Details :</label>
                    <textarea
                      value={shippingDetails}
                      onChange={(e) => setShippingDetails(e.target.value)}
                      placeholder="Enter shipping details…"
                      className="w-full border border-gray-300 rounded p-2 text-sm h-24 resize-none focus:outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="w-full xl:w-96 bg-white border border-gray-200 rounded p-4 shadow-xs">
              <h2 className="font-semibold text-gray-800 mb-4">Document Details</h2>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Invoice No. :</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full font-mono text-gray-800 focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Reference :</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="PO No / Ref"
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Invoice Date :</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                  <label className="text-sm text-gray-600">Due Date :</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Accounts Update */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
            <h2 className="font-semibold text-gray-800 mb-4">Accounts Update</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-4xl">
              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <label className="text-sm text-gray-600">Customer Ledger :</label>
                <select
                  value={customerLedger}
                  onChange={(e) => setCustomerLedger(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:border-green-500"
                >
                  {TEST_CUSTOMER_LEDGERS.map((ledger) => (
                    <option key={ledger} value={ledger}>{ledger}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2 pl-0 md:pl-4">
                <label className="text-sm text-gray-600">Voucher No. :</label>
                <input
                  type="text"
                  value={voucherNo}
                  onChange={(e) => setVoucherNo(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                />
              </div>

              <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                <label className="text-sm text-gray-600">Income Ledger :</label>
                <select
                  value={incomeLedger}
                  onChange={(e) => setIncomeLedger(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:border-green-500"
                >
                  {TEST_INCOME_LEDGERS.map((ledger) => (
                    <option key={ledger} value={ledger}>{ledger}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2 pl-0 md:pl-4">
                <label className="text-sm text-gray-600">Voucher Date :</label>
                <input
                  type="date"
                  value={voucherDate}
                  onChange={(e) => setVoucherDate(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* ─── Item List Table ──────────────────────────────────────────────── */}
          <div className="bg-white border border-gray-200 rounded p-4 overflow-x-auto shadow-xs">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-gray-800">Item List</h2>
                {isIGST ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    IGST (Inter-state)
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                    CGST + SGST (Intra-state UP)
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                {items.length} item{items.length !== 1 ? 's' : ''} added
              </span>
            </div>

            <table className="w-full text-xs text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="border-b border-gray-200 text-gray-700 bg-gray-50">
                  <th className="py-2.5 px-2 font-semibold w-10 text-center">No.</th>
                  <th className="py-2.5 px-2 font-semibold">Item &amp; Description</th>
                  <th className="py-2.5 px-2 font-semibold w-24">HSN/SAC</th>
                  <th className="py-2.5 px-2 font-semibold w-20 text-center">Qty</th>
                  <th className="py-2.5 px-2 font-semibold w-20">Unit</th>
                  <th className="py-2.5 px-2 font-semibold w-28 text-right">Rate (₹)</th>
                  <th className="py-2.5 px-2 font-semibold w-24 text-right">Discount (₹)</th>
                  <th className="py-2.5 px-2 font-semibold w-28 text-right">Taxable (₹)</th>
                  {isIGST ? (
                    <th className="py-2.5 px-2 font-semibold w-48 text-right" colSpan={2}>IGST (₹)</th>
                  ) : (
                    <>
                      <th className="py-2.5 px-2 font-semibold w-24 text-right">CGST (₹)</th>
                      <th className="py-2.5 px-2 font-semibold w-24 text-right">SGST (₹)</th>
                    </>
                  )}
                  <th className="py-2.5 px-2 font-semibold w-28 text-right">Amt (₹)</th>
                  <th className="py-2.5 px-2 font-semibold w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-400 text-sm">
                      No items added yet. Click <strong className="text-[#c85a17]">"+ Add Item"</strong> below to choose items from catalog.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2 px-2 text-center text-gray-500 font-medium">{idx + 1}</td>
                      
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.item_description}
                          onChange={(e) => handleUpdateRow(idx, 'item_description', e.target.value)}
                          className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-medium text-gray-800 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.hsn_sac || ''}
                          onChange={(e) => handleUpdateRow(idx, 'hsn_sac', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs font-mono text-gray-600 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateRow(idx, 'qty', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-center font-semibold text-gray-800 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => handleUpdateRow(idx, 'unit', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-600 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleUpdateRow(idx, 'rate', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-right font-medium text-gray-800 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2 text-right">
                        <input
                          type="number"
                          value={item.discount}
                          onChange={(e) => handleUpdateRow(idx, 'discount', e.target.value)}
                          className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-right text-gray-600 focus:outline-none focus:border-green-600"
                        />
                      </td>

                      <td className="py-2 px-2 text-right font-medium text-gray-700">
                        ₹ {item.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      {isIGST ? (
                        <td className="py-2 px-2 text-right text-blue-600" colSpan={2}>
                          ₹ {(item.igst_amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          <span className="block text-[10px] text-blue-400">({item.igst_percent || 0}%)</span>
                        </td>
                      ) : (
                        <>
                          <td className="py-2 px-2 text-right text-gray-500">
                            ₹ {item.cgst_amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className="block text-[10px] text-gray-400">({item.cgst_percent}%)</span>
                          </td>
                          <td className="py-2 px-2 text-right text-gray-500">
                            ₹ {item.sgst_amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            <span className="block text-[10px] text-gray-400">({item.sgst_percent}%)</span>
                          </td>
                        </>
                      )}

                      <td className="py-2 px-2 text-right font-semibold text-gray-900">
                        ₹ {item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => handleRemoveRow(idx)}
                          className="text-gray-400 hover:text-red-600 p-1"
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Biziverse-Style Add Item Button */}
            <button
              onClick={() => setShowSelectItemModal(true)}
              className="flex items-center gap-1.5 bg-[#c85a17] text-white text-xs px-3.5 py-2 rounded mt-3 hover:bg-[#b04a10] font-medium shadow-xs transition-colors"
            >
              <Plus size={14} /> Add Item
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
            <div className="flex flex-col gap-4">
              {/* Terms & Conditions */}
              <div className="bg-white border border-gray-200 rounded p-4 min-h-[140px] shadow-xs">
                <h2 className="font-semibold text-gray-800 mb-3">Terms &amp; Conditions</h2>
                <ul className="flex flex-col gap-1.5 mb-3 text-xs text-gray-700 list-disc pl-5">
                  {termsConditions.map((term, index) => (
                    <li key={index} className="flex items-center justify-between group">
                      <span>{term}</span>
                      <button
                        onClick={() => setTermsConditions((prev) => prev.filter((_, i) => i !== index))}
                        className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                      >
                        <X size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setShowTermModal(true)}
                  className="flex items-center gap-1 bg-[#fff7f2] text-[#c85a17] border border-[#f5d0b0] text-xs px-3 py-1.5 rounded hover:bg-[#ffe3ce] font-medium w-fit transition-colors"
                >
                  <Plus size={14} /> Add Term / Condition
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded p-4 h-36 shadow-xs">
                  <h2 className="font-semibold text-gray-800 mb-2 text-sm">Notes</h2>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes visible on invoice…"
                    className="w-full border border-gray-300 rounded p-2 text-xs h-20 resize-none focus:outline-none focus:border-green-500"
                  />
                </div>
                <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
                  <h2 className="font-semibold text-gray-800 mb-2 text-sm">Bank Details</h2>
                  <div className="relative">
                    <select
                      value={bankDetails}
                      onChange={(e) => setBankDetails(e.target.value)}
                      className="w-full appearance-none border border-gray-300 rounded px-3 py-2 pr-8 text-sm bg-white text-gray-700 focus:outline-none focus:border-[#0097a7] focus:ring-1 focus:ring-[#0097a7] cursor-pointer"
                    >
                      <option value="">Select</option>
                      {BANK_ACCOUNTS.map((bank) => (
                        <option key={bank.label} value={bank.value}>
                          {bank.label}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
                      <ChevronDown size={15} className="text-gray-400" />
                    </div>
                  </div>
                  {bankDetails && (
                    <div className="mt-2 px-3 py-2 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600 whitespace-pre-line leading-relaxed">
                      {bankDetails}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Recovery */}
              <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
                <h2 className="font-semibold text-gray-800 mb-4">Payment Recovery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 font-medium">Update Recovery Amt</label>
                      <div className="flex items-center gap-2">
                        <div className="flex relative w-36">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">₹</span>
                          <input
                            type="number"
                            value={recoveryAmt}
                            onChange={(e) => setRecoveryAmt(e.target.value ? parseFloat(e.target.value) : '')}
                            className="border border-gray-300 rounded px-3 py-1.5 pl-7 text-xs w-full text-right font-medium focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 font-medium">Internal Notes</label>
                      <textarea
                        value={recoveryNotes}
                        onChange={(e) => setRecoveryNotes(e.target.value)}
                        className="w-full border border-gray-300 rounded p-2 text-xs h-14 resize-none focus:outline-none focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-gray-600 font-medium">Update Invoice Status</label>
                      <select
                        value={invoiceStatus}
                        onChange={(e) => setInvoiceStatus(e.target.value)}
                        className="w-40 border border-gray-300 rounded px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-green-500"
                      >
                        <option>Unpaid</option>
                        <option>Partially Paid</option>
                        <option>Paid</option>
                        <option>Overdue</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share */}
              <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
                <h2 className="font-semibold text-gray-800 mb-3 text-sm">Share Options</h2>
                <div className="flex flex-wrap items-center gap-6">
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareEmail}
                      onChange={(e) => setShareEmail(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    Email Document
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shareWhatsapp}
                      onChange={(e) => setShareWhatsapp(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    WhatsApp Document
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printAfterSave}
                      onChange={(e) => setPrintAfterSave(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    Print Document after Saving
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column (Totals Sticky Card) */}
            <div className="bg-white border border-gray-200 rounded p-4 self-start sticky top-4 shadow-xs flex flex-col gap-3">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                <h2 className="font-semibold text-gray-800 text-sm">Invoice Summary</h2>
                {isIGST ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 uppercase tracking-wide">IGST</span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">CGST+SGST</span>
                )}
              </div>
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>Taxable Amount :</span>
                <span className="font-medium text-gray-800">
                  ₹ {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isIGST ? (
                <div className="flex justify-between text-xs text-blue-700">
                  <span>IGST Total :</span>
                  <span className="font-medium">
                    ₹ {totalIgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>CGST Total :</span>
                    <span className="font-medium text-gray-800">
                      ₹ {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>SGST Total :</span>
                    <span className="font-medium text-gray-800">
                      ₹ {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between text-xs text-gray-600">
                <span>Subtotal :</span>
                <span className="font-medium text-gray-800">
                  ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {extraCharge > 0 && (
                <div className="flex justify-between text-xs text-green-700">
                  <span>Extra Charge :</span>
                  <span className="font-medium">
                    + ₹ {extraCharge.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {customDiscount > 0 && (
                <div className="flex justify-between text-xs text-red-600">
                  <span>Custom Discount :</span>
                  <span className="font-medium">
                    - ₹ {customDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-3 flex justify-between text-sm font-bold text-gray-900">
                <span>Grand Total :</span>
                <span className="text-[#c85a17]">
                  ₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => { setTempAmount(extraCharge); setShowExtraModal(true); }}
                  className="flex items-center gap-1 bg-[#fff7f2] text-[#c85a17] border border-[#f5d0b0] text-xs px-2.5 py-1.5 rounded hover:bg-[#ffe3ce] font-medium"
                >
                  <Plus size={13} /> Extra Charge
                </button>
                <button
                  onClick={() => { setTempAmount(customDiscount); setShowDiscountModal(true); }}
                  className="flex items-center gap-1 bg-[#fff7f2] text-[#c85a17] border border-[#f5d0b0] text-xs px-2.5 py-1.5 rounded hover:bg-[#ffe3ce] font-medium"
                >
                  <Plus size={13} /> Discount
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex gap-3 pb-8 mt-2">
            <button
              onClick={() => handleSaveInvoice(true)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 disabled:opacity-60 shadow-xs cursor-pointer"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              {isSaving ? 'Saving & Generating PDF…' : 'Save & Print PDF Invoice'}
            </button>

            <button
              onClick={() => handleSaveInvoice(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800 disabled:opacity-60 shadow-xs cursor-pointer"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Save &amp; Enter Another
            </button>
          </div>
        </div>
      </div>

      {/* Hidden container for printing PDF formatted like Biziverse */}
      {printedInvoiceData && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
          <InvoicePdfView invoice={printedInvoiceData} />
        </div>
      )}
    </>
  );
}

export default function CreateB2BInvoicePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-gray-500">
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          Loading invoice form…
        </div>
      </div>
    }>
      <CreateB2BInvoiceContent />
    </Suspense>
  );
}
