'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Trash2, ArrowLeft, Save, Printer, Upload, Check } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { leadsApi, quotationsApi } from '@/services/crmService';
import CreateCustomerModal from './components/CreateCustomerModal';
import SelectItemModal from './components/SelectItemModal';

interface QuoteItem {
  id: number;
  itemDescription: string;
  hsnSac: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxable: number;
  cgstPercent: number;
  sgstPercent: number;
  cgstAmt: number;
  sgstAmt: number;
  amt: number;
  leadTime: string;
}

interface TermCondition {
  id: number;
  text: string;
}

function CreateQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const quoteId = searchParams.get('id');

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.list({ page_size: 100 })
  });

  const { data: quoteResponse, isLoading: isLoadingQuote } = useQuery({
    queryKey: ['quotation', quoteId],
    queryFn: () => quotationsApi.get(quoteId!),
    enabled: !!quoteId,
  });

  const leads = (leadsResponse?.data as any)?.results || (leadsResponse?.data as any)?.data?.results || [];
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isSelectItemOpen, setIsSelectItemOpen] = useState(false);

  // State for form data
  const [leadId, setLeadId] = useState<string | null>(null);
  const [customer, setCustomer] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [salesCredit, setSalesCredit] = useState('Piyush Nirmal');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');

  const [quoteNo, setQuoteNo] = useState('192');
  const [reference, setReference] = useState('');
  const [quoteDate, setQuoteDate] = useState('2026-07-12');
  const [validTill, setValidTill] = useState('2026-07-12');

  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 1,
      itemDescription: '',
      hsnSac: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      discount: 0,
      taxable: 0,
      cgstPercent: 9,
      sgstPercent: 9,
      cgstAmt: 0,
      sgstAmt: 0,
      amt: 0,
      leadTime: ''
    }
  ]);

  const [terms, setTerms] = useState<TermCondition[]>([]);
  const [notes, setNotes] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  
  // Share options
  const [shareEmail, setShareEmail] = useState(false);
  const [shareWhatsapp, setShareWhatsapp] = useState(false);
  const [printAfterSave, setPrintAfterSave] = useState(false);
  const [alertOnOpening, setAlertOnOpening] = useState(false);

  // Extra charges / discount
  const [extraCharge, setExtraCharge] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);

  // Calculations
  const [totalTaxable, setTotalTaxable] = useState(0);
  const [totalCgst, setTotalCgst] = useState(0);
  const [totalSgst, setTotalSgst] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Populate data when editing
  useEffect(() => {
    if (quoteResponse?.data?.data) {
      const q = quoteResponse.data.data;
      setLeadId(q.lead || null);
      setCustomer(q.customer_name || '');
      setContactPerson(q.contact_person || '');
      setAddress(q.address || '');
      setSalesCredit(q.sales_credit || 'Piyush Nirmal');
      setSameAsBilling(q.same_as_billing);
      setShippingAddress(q.shipping_address || '');
      setQuoteNo(q.quote_number || '');
      setReference(q.reference || '');
      setQuoteDate(q.quote_date || '');
      setValidTill(q.valid_till || '');
      setNotes(q.notes || '');
      setBankDetails(q.bank_details || '');
      setTerms(q.terms_conditions?.map((t: any, idx: number) => ({ id: idx, text: t.text || t })) || []);
      setExtraCharge(Number(q.extra_charge) || 0);
      setCustomDiscount(Number(q.custom_discount) || 0);
      setShareEmail(q.share_email || false);
      setShareWhatsapp(q.share_whatsapp || false);
      setPrintAfterSave(q.print_after_save || false);
      setAlertOnOpening(q.alert_on_opening || false);
      if (q.items && q.items.length > 0) {
        setItems(q.items.map((item: any, idx: number) => ({
          id: item.id || idx,
          itemDescription: item.item_description,
          hsnSac: item.hsn_sac || '',
          qty: item.qty,
          unit: item.unit,
          rate: Number(item.rate),
          discount: Number(item.discount),
          taxable: Number(item.taxable),
          cgstPercent: Number(item.cgst_percent),
          sgstPercent: Number(item.sgst_percent),
          cgstAmt: Number(item.cgst_amt),
          sgstAmt: Number(item.sgst_amt),
          amt: Number(item.amt),
          leadTime: item.lead_time || ''
        })));
      }
    }
  }, [quoteResponse]);

  const filteredLeads = leads.filter((l: any) => {
    const query = customer.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (l.full_name || '').toLowerCase().includes(query);
    const companyMatch = (l.company_name || '').toLowerCase().includes(query);
    return nameMatch || companyMatch;
  });

  // Recalculate item amount
  const updateItemAmount = (item: QuoteItem) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const discount = Number(item.discount) || 0;
    
    const taxable = Math.max(0, (qty * rate) - discount);
    const cgstAmt = (taxable * (item.cgstPercent || 0)) / 100;
    const sgstAmt = (taxable * (item.sgstPercent || 0)) / 100;
    const amt = taxable + cgstAmt + sgstAmt;

    return {
      ...item,
      taxable: parseFloat(taxable.toFixed(2)),
      cgstAmt: parseFloat(cgstAmt.toFixed(2)),
      sgstAmt: parseFloat(sgstAmt.toFixed(2)),
      amt: parseFloat(amt.toFixed(2))
    };
  };

  const handleItemChange = (id: number, field: keyof QuoteItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        return updateItemAmount(updated);
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        itemDescription: '',
        hsnSac: '',
        qty: 1,
        unit: 'Nos',
        rate: 0,
        discount: 0,
        taxable: 0,
        cgstPercent: 9,
        sgstPercent: 9,
        cgstAmt: 0,
        sgstAmt: 0,
        amt: 0,
        leadTime: ''
      }
    ]);
  };

  const handleSelectItems = (selectedItems: { description: string; rate?: number; hsnSac?: string }[]) => {
    setItems(prev => {
      const isEmptyFirstRow = prev.length === 1 && prev[0].itemDescription === '' && prev[0].rate === 0;
      const initial = isEmptyFirstRow ? [] : prev;
      
      const newItems = selectedItems.map((item, idx) => {
        const qty = 1;
        const rate = item.rate || 0;
        const discount = 0;
        const taxable = qty * rate;
        const cgstPercent = 9;
        const sgstPercent = 9;
        const cgstAmt = (taxable * cgstPercent) / 100;
        const sgstAmt = (taxable * sgstPercent) / 100;
        const amt = taxable + cgstAmt + sgstAmt;

        return {
          id: Date.now() + idx,
          itemDescription: item.description,
          hsnSac: item.hsnSac || '',
          qty,
          unit: 'Nos',
          rate,
          discount,
          taxable,
          cgstPercent,
          sgstPercent,
          cgstAmt,
          sgstAmt,
          amt,
          leadTime: ''
        };
      });
      
      return [...initial, ...newItems];
    });
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddTerm = () => {
    setTerms(prev => [...prev, { id: Date.now(), text: '' }]);
  };

  const handleRemoveTerm = (id: number) => {
    setTerms(prev => prev.filter(t => t.id !== id));
  };

  const handleTermChange = (id: number, value: string) => {
    setTerms(prev => prev.map(t => t.id === id ? { ...t, text: value } : t));
  };

  // Recalculate totals
  useEffect(() => {
    let taxableSum = 0;
    let cgstSum = 0;
    let sgstSum = 0;

    items.forEach(item => {
      taxableSum += item.taxable;
      cgstSum += item.cgstAmt;
      sgstSum += item.sgstAmt;
    });

    const subTotal = taxableSum + cgstSum + sgstSum;
    const finalTotal = subTotal + Number(extraCharge) - Number(customDiscount);

    setTotalTaxable(parseFloat(taxableSum.toFixed(2)));
    setTotalCgst(parseFloat(cgstSum.toFixed(2)));
    setTotalSgst(parseFloat(sgstSum.toFixed(2)));
    setGrandTotal(parseFloat(finalTotal.toFixed(2)));
  }, [items, extraCharge, customDiscount]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!customer) {
      showToast('Please select or enter a Customer', 'error');
      return;
    }

    const payload = {
      lead: leadId,
      customer_name: customer,
      contact_person: contactPerson,
      address: address,
      sales_credit: salesCredit,
      same_as_billing: sameAsBilling,
      shipping_address: sameAsBilling ? address : shippingAddress,
      quote_number: quoteNo,
      reference: reference,
      quote_date: quoteDate,
      valid_till: validTill,
      notes: notes,
      bank_details: bankDetails,
      terms_conditions: terms.map(t => ({ text: t.text })),
      extra_charge: extraCharge,
      custom_discount: customDiscount,
      total_taxable: totalTaxable,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      grand_total: grandTotal,
      share_email: shareEmail,
      share_whatsapp: shareWhatsapp,
      print_after_save: printAfterSave,
      alert_on_opening: alertOnOpening,
      type: 'Quotation',
      items: items.map(item => ({
        item_description: item.itemDescription,
        hsn_sac: item.hsnSac,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        discount: item.discount,
        taxable: item.taxable,
        cgst_percent: item.cgstPercent,
        sgst_percent: item.sgstPercent,
        cgst_amt: item.cgstAmt,
        sgst_amt: item.sgstAmt,
        amt: item.amt,
        lead_time: item.leadTime
      }))
    };

    try {
      if (quoteId) {
        await quotationsApi.update(quoteId, payload);
        showToast('Quotation updated successfully!', 'success');
      } else {
        await quotationsApi.create(payload);
        showToast('Quotation saved successfully!', 'success');
      }
      router.push('/quotes');
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save quotation.', 'error');
    }
  };

  if (quoteId && isLoadingQuote) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 font-semibold">
        Loading quotation details...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 bg-[#f8f9fa] text-[13px] text-gray-700 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-sm">
        <h1 className="text-lg font-bold text-gray-800">{quoteId ? 'Edit Quotation' : 'Create Quote'}</h1>
        
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-sm bg-white font-semibold text-gray-600 hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print Settings
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/quotes')} 
            className="flex items-center gap-1.5 bg-[#1a252c] text-white px-3 py-1.5 rounded-sm font-semibold hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button 
            type="button" 
            onClick={() => handleSave()} 
            className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-sm font-semibold hover:bg-green-800"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 p-4 rounded-sm">
          <h3 className="text-[#145a32] font-bold text-[14px] mb-3">Basic Information</h3>
          <div className="flex items-center gap-2 max-w-xl">
            <label className="w-24 shrink-0">Customer :</label>
            <div className="relative flex-1 flex items-center">
              <input 
                value={customer} 
                onChange={e => {
                  setCustomer(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                placeholder="Search or enter customer name" 
                className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
                required
              />
              
              {showDropdown && filteredLeads.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto">
                  {filteredLeads.map((lead: any) => (
                    <button
                      key={lead.id}
                      type="button"
                      onMouseDown={() => {
                        const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.full_name || '';
                        setCustomer(lead.company_name || name);
                        setContactPerson(name);
                        setLeadId(lead.id);
                        
                        // Construct structured address
                        const addrParts = [];
                        if (lead.address) addrParts.push(lead.address);
                        if (lead.city) addrParts.push(lead.city);
                        
                        const stateCountry = [lead.state, lead.country].filter(Boolean).join(', ');
                        if (stateCountry) {
                          addrParts.push(stateCountry + (lead.pincode ? ` - ${lead.pincode}` : ''));
                        } else if (lead.pincode) {
                          addrParts.push(lead.pincode);
                        }
                        
                        setAddress(addrParts.join('\n'));
                        setShowDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-50 text-[13px] border-b border-gray-100 last:border-0 flex flex-col"
                    >
                      <span className="font-bold text-gray-800">{lead.company_name || lead.full_name}</span>
                      {lead.company_name && <span className="text-[11px] text-gray-500">Contact: {lead.full_name}</span>}
                      {lead.mobile && <span className="text-[11px] text-gray-400">Mobile: {lead.mobile}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" className="bg-gray-100 border border-gray-300 p-1.5 rounded-sm hover:bg-gray-200"><Search className="w-4 h-4 text-gray-600" /></button>
            <button 
              type="button" 
              onClick={() => setIsCreateCustomerOpen(true)}
              className="bg-green-700 text-white p-1.5 rounded-sm hover:bg-green-800"
            >
              <Plus className="w-4 h-4" />
            </button>

          </div>
        </div>

        {/* Customer Details & Document Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Customer Details */}
          <div className="lg:col-span-8 bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-4">
            <h3 className="text-[#145a32] font-bold text-[14px]">Customer Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Contact Person :</label>
                <input 
                  value={contactPerson} 
                  onChange={e => setContactPerson(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Sales Credit :</label>
                <input 
                  value={salesCredit} 
                  onChange={e => setSalesCredit(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>

              <div className="flex items-start gap-2">
                <label className="w-28 shrink-0 pt-1.5">Address :</label>
                <div className="flex flex-col gap-2 flex-1">
                  <textarea 
                    value={address} 
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter Billing Address" 
                    rows={2} 
                    className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none"
                  />
                  <button type="button" className="text-green-700 font-semibold self-start text-xs hover:underline">+ Click here to add an address.</button>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <label className="w-28 shrink-0 pt-1.5">Shipping Address :</label>
                <div className="flex flex-col gap-2 flex-1">
                  <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sameAsBilling} 
                      onChange={e => setSameAsBilling(e.target.checked)} 
                      className="rounded-sm"
                    />
                    Same as Billing address
                  </label>
                  {!sameAsBilling && (
                    <textarea 
                      value={shippingAddress} 
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Enter Shipping Address" 
                      rows={2} 
                      className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="lg:col-span-4 bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-4">
            <h3 className="text-[#145a32] font-bold text-[14px]">Document Details</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Quotation No. :</label>
                <input 
                  value={quoteNo} 
                  onChange={e => setQuoteNo(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Reference :</label>
                <input 
                  value={reference} 
                  onChange={e => setReference(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Quotation Date :</label>
                <input 
                  type="date" 
                  value={quoteDate} 
                  onChange={e => setQuoteDate(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Valid till :</label>
                <input 
                  type="date" 
                  value={validTill} 
                  onChange={e => setValidTill(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Item List Table */}
        <div className="bg-white border border-gray-200 p-4 rounded-sm overflow-x-auto">
          <h3 className="text-[#145a32] font-bold text-[14px] mb-3">Item List</h3>
          
          <table className="w-full text-left border-collapse border border-gray-200 min-w-[1200px]">
            <thead className="bg-[#f8f9fa] border-b border-gray-200">
              <tr>
                <th className="border border-gray-200 px-2 py-2 text-center w-12">No.</th>
                <th className="border border-gray-200 px-3 py-2">Item & Description</th>
                <th className="border border-gray-200 px-2 py-2 w-28">HSN/SAC</th>
                <th className="border border-gray-200 px-2 py-2 w-20">Qty</th>
                <th className="border border-gray-200 px-2 py-2 w-24">Unit</th>
                <th className="border border-gray-200 px-2 py-2 w-28">Rate (₹)</th>
                <th className="border border-gray-200 px-2 py-2 w-28">Discount (₹)</th>
                <th className="border border-gray-200 px-2 py-2 w-28">Taxable (₹)</th>
                <th className="border border-gray-200 px-2 py-2 w-20">CGST (%)</th>
                <th className="border border-gray-200 px-2 py-2 w-20">SGST (%)</th>
                <th className="border border-gray-200 px-2 py-2 w-32">Amt (₹)</th>
                <th className="border border-gray-200 px-2 py-2 w-28">Lead Time</th>
                <th className="border border-gray-200 px-2 py-2 text-center w-12"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-2 py-1.5 text-center font-semibold text-gray-500">{idx + 1}</td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      value={item.itemDescription} 
                      onChange={e => handleItemChange(item.id, 'itemDescription', e.target.value)}
                      placeholder="Type item description..." 
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm"
                      required
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      value={item.hsnSac} 
                      onChange={e => handleItemChange(item.id, 'hsnSac', e.target.value)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm"
                      min="1"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <select 
                      value={item.unit} 
                      onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                      className="w-full px-1.5 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm bg-white"
                    >
                      <option>Nos</option>
                      <option>Pcs</option>
                      <option>Kgs</option>
                      <option>Boxes</option>
                    </select>
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      type="number" 
                      value={item.rate || ''} 
                      onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm text-right"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      type="number" 
                      value={item.discount || ''} 
                      onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm text-right"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right font-medium text-gray-700 bg-gray-50">
                    {item.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      type="number" 
                      value={item.cgstPercent} 
                      onChange={e => handleItemChange(item.id, 'cgstPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm text-right"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      type="number" 
                      value={item.sgstPercent} 
                      onChange={e => handleItemChange(item.id, 'sgstPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm text-right"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-right font-bold text-[#145a32] bg-gray-50">
                    {item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5">
                    <input 
                      value={item.leadTime} 
                      onChange={e => handleItemChange(item.id, 'leadTime', e.target.value)}
                      placeholder="e.g. 2 days" 
                      className="w-full px-2 py-1 outline-none border border-transparent focus:border-green-600 rounded-sm"
                    />
                  </td>
                  <td className="border border-gray-200 px-2 py-1.5 text-center">
                    <button 
                      type="button" 
                      disabled={items.length === 1}
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-600 hover:text-red-800 disabled:opacity-30 disabled:hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            type="button" 
            onClick={() => setIsSelectItemOpen(true)}
            className="flex items-center gap-1 bg-green-700 hover:bg-green-800 text-white px-3 py-1.5 rounded-sm font-semibold mt-3"
          >
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>

        {/* Bottom Details Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column: Terms, Notes, Bank, File, Share */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Terms & Conditions */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-3">
              <h3 className="text-[#145a32] font-bold text-[14px]">Terms & Conditions</h3>
              <div className="flex flex-col gap-2">
                {terms.map((term, idx) => (
                  <div key={term.id} className="flex items-center gap-2">
                    <span className="font-semibold text-gray-500 w-6 text-center">{idx + 1}.</span>
                    <input 
                      value={term.text} 
                      onChange={e => handleTermChange(term.id, e.target.value)}
                      placeholder="Enter term / condition" 
                      className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1"
                    />
                    <button type="button" onClick={() => handleRemoveTerm(term.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={handleAddTerm}
                className="flex items-center gap-1 text-green-700 hover:text-green-800 font-semibold self-start text-xs border border-green-700 rounded-sm px-2.5 py-1 hover:bg-green-50"
              >
                + Add Term / Condition
              </button>
            </div>

            {/* Notes & Bank Details & File Upload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Notes & Upload */}
              <div className="flex flex-col gap-4">
                <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-2">
                  <h3 className="text-gray-800 font-bold">Notes</h3>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Enter notes..." 
                    rows={3} 
                    className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none"
                  />
                </div>
                
                <div className="bg-white border border-gray-200 p-4 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-600">Upload File :</span>
                    <button type="button" className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-sm font-semibold">
                      <Upload className="w-4 h-4" /> Upload File
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-2 h-fit">
                <h3 className="text-gray-800 font-bold">Bank Details</h3>
                <select 
                  value={bankDetails} 
                  onChange={e => setBankDetails(e.target.value)}
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full bg-white"
                >
                  <option value="">Select Bank Account</option>
                  <option value="sbi">State Bank of India (A/C: 1234567890)</option>
                  <option value="hdfc">HDFC Bank (A/C: 9876543210)</option>
                </select>
              </div>
            </div>

            {/* Share */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-2">
              <h3 className="text-gray-800 font-bold">Share</h3>
              <div className="flex flex-wrap gap-6 mt-1">
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={shareEmail} onChange={e => setShareEmail(e.target.checked)} className="rounded-sm" />
                  Email
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={shareWhatsapp} onChange={e => setShareWhatsapp(e.target.checked)} className="rounded-sm" />
                  Whatsapp
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={printAfterSave} onChange={e => setPrintAfterSave(e.target.checked)} className="rounded-sm" />
                  Print Document after Saving
                </label>
                <label className="flex items-center gap-1.5 font-semibold text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={alertOnOpening} onChange={e => setAlertOnOpening(e.target.checked)} className="rounded-sm" />
                  Alert me on Opening
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Calculations */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-4">
              <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxable Value:</span>
                  <span className="font-semibold">₹ {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">CGST Amount:</span>
                  <span className="font-semibold text-gray-600">₹ {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SGST Amount:</span>
                  <span className="font-semibold text-gray-600">₹ {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-gray-800 text-[14px]">Total :</span>
                  <span className="font-bold text-gray-800 text-[14px]">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
                  <span className="font-bold text-gray-900 text-base">Grand Total :</span>
                  <span className="font-bold text-green-700 text-lg">₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    const val = prompt('Enter Extra Charge (INR):', String(extraCharge));
                    if (val !== null) setExtraCharge(parseFloat(val) || 0);
                  }}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-sm font-semibold text-center"
                >
                  + Add Extra Charge
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const val = prompt('Enter Discount (INR):', String(customDiscount));
                    if (val !== null) setCustomDiscount(parseFloat(val) || 0);
                  }}
                  className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2 rounded-sm font-semibold text-center"
                >
                  + Add Discount
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Save Actions */}
        <div className="flex gap-2 mt-2">
          <button 
            type="submit" 
            className="flex items-center gap-1.5 bg-green-700 text-white px-5 py-2.5 rounded-sm font-semibold hover:bg-green-800 text-sm"
          >
            <Check className="w-4 h-4" /> Save
          </button>
          <button 
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              if (!customer) {
                showToast('Please select or enter a Customer', 'error');
                return;
              }
              
              const payload = {
                lead: leadId,
                customer_name: customer,
                contact_person: contactPerson,
                address: address,
                sales_credit: salesCredit,
                same_as_billing: sameAsBilling,
                shipping_address: sameAsBilling ? address : shippingAddress,
                quote_number: quoteNo,
                reference: reference,
                quote_date: quoteDate,
                valid_till: validTill,
                notes: notes,
                bank_details: bankDetails,
                terms_conditions: terms.map(t => ({ text: t.text })),
                extra_charge: extraCharge,
                custom_discount: customDiscount,
                total_taxable: totalTaxable,
                total_cgst: totalCgst,
                total_sgst: totalSgst,
                grand_total: grandTotal,
                share_email: shareEmail,
                share_whatsapp: shareWhatsapp,
                print_after_save: printAfterSave,
                alert_on_opening: alertOnOpening,
                type: 'Quotation',
                items: items.map(item => ({
                  item_description: item.itemDescription,
                  hsn_sac: item.hsnSac,
                  qty: item.qty,
                  unit: item.unit,
                  rate: item.rate,
                  discount: item.discount,
                  taxable: item.taxable,
                  cgst_percent: item.cgstPercent,
                  sgst_percent: item.sgstPercent,
                  cgst_amt: item.cgstAmt,
                  sgst_amt: item.sgstAmt,
                  amt: item.amt,
                  lead_time: item.leadTime
                }))
              };

              try {
                if (quoteId) {
                  await quotationsApi.update(quoteId, payload);
                  showToast('Quotation updated successfully!', 'success');
                } else {
                  await quotationsApi.create(payload);
                  showToast('Quotation saved successfully!', 'success');
                }
                
                // Clear inputs to start another
                setCustomer('');
                setContactPerson('');
                setAddress('');
                setLeadId(null);
                setItems([{
                  id: Date.now(),
                  itemDescription: '',
                  hsnSac: '',
                  qty: 1,
                  unit: 'Nos',
                  rate: 0,
                  discount: 0,
                  taxable: 0,
                  cgstPercent: 9,
                  sgstPercent: 9,
                  cgstAmt: 0,
                  sgstAmt: 0,
                  amt: 0,
                  leadTime: ''
                }]);
                setTerms([]);
                setNotes('');
                setExtraCharge(0);
                setCustomDiscount(0);
              } catch (err: any) {
                showToast(err?.response?.data?.detail || 'Failed to save quotation.', 'error');
              }
            }}
            className="flex items-center gap-1.5 bg-green-700 text-white px-5 py-2.5 rounded-sm font-semibold hover:bg-green-800 text-sm"
          >
            <Check className="w-4 h-4" /> Save & Enter Another
          </button>
        </div>

      </form>

      <CreateCustomerModal 
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        onSuccess={(customerName, billingAddress, contactName, newId) => {
          setCustomer(customerName);
          setContactPerson(contactName);
          setAddress(billingAddress);
          setLeadId(newId);
        }}
      />

      <SelectItemModal 
        isOpen={isSelectItemOpen}
        onClose={() => setIsSelectItemOpen(false)}
        onSelectItems={handleSelectItems}
      />
    </div>
  );
}

export default function CreateQuotePage() {
  return (
    <Suspense fallback={<div className="p-4 font-semibold text-gray-500">Loading form...</div>}>
      <CreateQuoteContent />
    </Suspense>
  );
}
