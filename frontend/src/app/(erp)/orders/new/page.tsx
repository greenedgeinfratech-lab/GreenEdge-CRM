'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Plus, Trash2, ArrowLeft, Save, Printer, Upload, Check } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useQuery } from '@tanstack/react-query';
import { leadsApi, ordersApi } from '@/services/crmService';
import CreateCustomerModal from '../../quotes/new/components/CreateCustomerModal';
import SelectItemModal from '../../quotes/new/components/SelectItemModal';

interface OrderItemState {
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

function CreateOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const orderId = searchParams.get('id');

  const { data: leadsResponse } = useQuery({
    queryKey: ['leads-all'],
    queryFn: () => leadsApi.list({ page_size: 100 })
  });

  const { data: orderResponse, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId!),
    enabled: !!orderId,
  });

  const leads = (leadsResponse?.data as any)?.results || (leadsResponse?.data as any)?.data?.results || [];
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);
  const [isSelectItemOpen, setIsSelectItemOpen] = useState(false);

  // Form State
  const [leadId, setLeadId] = useState<string | null>(null);
  const [customer, setCustomer] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [address, setAddress] = useState('');
  const [salesCredit, setSalesCredit] = useState('Piyush Nirmal');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [executive, setExecutive] = useState('Piyush Nirmal');

  const [orderNo, setOrderNo] = useState('2');
  const [reference, setReference] = useState('');
  const [orderDate, setOrderDate] = useState('2026-07-17');
  const [dueDate, setDueDate] = useState('2026-07-17');
  const [customerPoNo, setCustomerPoNo] = useState('');

  const [items, setItems] = useState<OrderItemState[]>([
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

  // Extra charges / discount
  const [extraCharge, setExtraCharge] = useState(0);
  const [customDiscount, setCustomDiscount] = useState(0);
  const [showExtraField, setShowExtraField] = useState(false);
  const [showDiscountField, setShowDiscountField] = useState(false);

  // Calculations
  const [totalTaxable, setTotalTaxable] = useState(0);
  const [totalCgst, setTotalCgst] = useState(0);
  const [totalSgst, setTotalSgst] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  // Set default dates to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setOrderDate(today);
    setDueDate(today);
  }, []);

  // Populate data when editing
  useEffect(() => {
    if (orderResponse?.data?.data) {
      const o = orderResponse.data.data;
      setLeadId(o.lead || null);
      setCustomer(o.customer_name || '');
      setContactPerson(o.contact_person || '');
      setAddress(o.address || '');
      setSalesCredit(o.sales_credit || 'Piyush Nirmal');
      setSameAsBilling(o.same_as_billing);
      setShippingAddress(o.shipping_address || '');
      setExecutive(o.executive || 'Piyush Nirmal');
      setOrderNo(o.order_number || '');
      setReference(o.reference || '');
      setOrderDate(o.order_date || '');
      setDueDate(o.due_date || '');
      setCustomerPoNo(o.customer_po_number || '');
      setNotes(o.notes || '');
      setBankDetails(o.bank_details || '');
      setTerms(o.terms_conditions?.map((t: any, idx: number) => ({ id: idx, text: t.text || t })) || []);
      setExtraCharge(Number(o.extra_charge) || 0);
      setCustomDiscount(Number(o.custom_discount) || 0);
      setShareEmail(o.share_email || false);
      setShareWhatsapp(o.share_whatsapp || false);
      setPrintAfterSave(o.print_after_save || false);
      if (o.extra_charge && Number(o.extra_charge) > 0) setShowExtraField(true);
      if (o.custom_discount && Number(o.custom_discount) > 0) setShowDiscountField(true);
      if (o.items && o.items.length > 0) {
        setItems(o.items.map((item: any, idx: number) => ({
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
  }, [orderResponse]);

  const filteredLeads = leads.filter((l: any) => {
    const query = customer.toLowerCase().trim();
    if (!query) return true;
    const nameMatch = (l.full_name || '').toLowerCase().includes(query);
    const companyMatch = (l.company_name || '').toLowerCase().includes(query);
    return nameMatch || companyMatch;
  });

  // Recalculate item amount
  const updateItemAmount = (item: OrderItemState) => {
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

  const handleItemChange = (id: number, field: keyof OrderItemState, value: any) => {
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

  const handleSave = async (enterAnother = false) => {
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
      executive: executive,
      order_number: orderNo,
      reference: reference,
      order_date: orderDate,
      due_date: dueDate,
      customer_po_number: customerPoNo,
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
      status: 'Received',
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
      if (orderId) {
        await ordersApi.update(orderId, payload);
        showToast('Order updated successfully!', 'success');
      } else {
        await ordersApi.create(payload);
        showToast('Order saved successfully!', 'success');
      }

      if (enterAnother) {
        // Reset form for next order
        setLeadId(null);
        setCustomer('');
        setContactPerson('');
        setAddress('');
        setShippingAddress('');
        setReference('');
        setCustomerPoNo('');
        setExtraCharge(0);
        setCustomDiscount(0);
        setItems([
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
        setTerms([]);
        setNotes('');
        setBankDetails('');
        // Increment order number guess
        const nextOrderNoGuess = String(Number(orderNo) + 1);
        if (!isNaN(Number(orderNo))) {
          setOrderNo(nextOrderNoGuess);
        }
      } else {
        router.push('/orders');
      }
    } catch (err: any) {
      showToast(err?.response?.data?.detail || 'Failed to save order.', 'error');
    }
  };

  if (orderId && isLoadingOrder) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 font-semibold">
        Loading order details...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 bg-[#f8f9fa] text-[13px] text-gray-700 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-sm">
        <h1 className="text-lg font-bold text-gray-800">{orderId ? 'Edit Sale Order' : 'Create Sale Order'}</h1>
        
        <div className="flex items-center gap-2">
          <button type="button" className="flex items-center gap-1.5 border border-gray-300 px-3 py-1.5 rounded-sm bg-white font-semibold text-gray-600 hover:bg-gray-50">
            <Printer className="w-4 h-4" /> Print Settings
          </button>
          <button 
            type="button" 
            onClick={() => router.push('/orders')} 
            className="flex items-center gap-1.5 bg-[#1a252c] text-white px-3 py-1.5 rounded-sm font-semibold hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button 
            type="button" 
            onClick={() => handleSave(false)} 
            className="flex items-center gap-1.5 bg-green-700 text-white px-3 py-1.5 rounded-sm font-semibold hover:bg-green-800"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        
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
                        
                        // Construct billing address
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
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Sales Credit :</label>
                <input 
                  value={salesCredit} 
                  onChange={e => setSalesCredit(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
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
                    className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 w-full resize-none bg-white"
                  />
                  <button type="button" className="text-green-700 font-semibold self-start text-xs hover:underline">+ Click here to add an address.</button>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0">Shipping Address :</label>
                  <label className="flex items-center gap-1.5 font-semibold text-gray-600">
                    <input 
                      type="checkbox" 
                      checked={sameAsBilling} 
                      onChange={e => setSameAsBilling(e.target.checked)}
                      className="rounded-sm"
                    />
                    Same as Billing address
                  </label>
                </div>
                
                {!sameAsBilling && (
                  <div className="flex items-start gap-2">
                    <label className="w-28 shrink-0 pt-1.5">Shipping Address :</label>
                    <textarea 
                      value={shippingAddress} 
                      onChange={e => setShippingAddress(e.target.value)}
                      placeholder="Enter Shipping Address" 
                      rows={2} 
                      className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 resize-none bg-white"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="w-28 shrink-0">Executive :</label>
                  <input 
                    value={executive} 
                    onChange={e => setExecutive(e.target.value)} 
                    className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Document Details */}
          <div className="lg:col-span-4 bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-4">
            <h3 className="text-[#145a32] font-bold text-[14px]">Document Details</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Order No. :</label>
                <input 
                  value={orderNo} 
                  onChange={e => setOrderNo(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Reference :</label>
                <input 
                  value={reference} 
                  onChange={e => setReference(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Order Date :</label>
                <input 
                  type="date"
                  value={orderDate} 
                  onChange={e => setOrderDate(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Due Date :</label>
                <input 
                  type="date"
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="w-28 shrink-0">Customer PO No. :</label>
                <input 
                  value={customerPoNo} 
                  onChange={e => setCustomerPoNo(e.target.value)} 
                  placeholder="Purchase Order Number"
                  className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Item List Table */}
        <div className="bg-white border border-gray-200 p-4 rounded-sm overflow-x-auto">
          <h3 className="text-[#145a32] font-bold text-[14px] mb-3">Item List</h3>
          
          <table className="w-full min-w-[1000px] border-collapse text-left text-xs mb-3">
            <thead>
              <tr className="border-y border-gray-200 text-gray-600 bg-gray-50">
                <th className="py-2 px-1.5 w-10">No.</th>
                <th className="py-2 px-1.5 w-1/4">Item & Description</th>
                <th className="py-2 px-1.5 w-24">HSN/SAC</th>
                <th className="py-2 px-1.5 w-16 text-right">Qty</th>
                <th className="py-2 px-1.5 w-20">Unit</th>
                <th className="py-2 px-1.5 w-24 text-right">Rate (₹)</th>
                <th className="py-2 px-1.5 w-24 text-right">Discount (₹)</th>
                <th className="py-2 px-1.5 w-24 text-right">Taxable (₹)</th>
                <th className="py-2 px-1.5 w-16 text-right">CGST %</th>
                <th className="py-2 px-1.5 w-16 text-right">SGST %</th>
                <th className="py-2 px-1.5 w-28 text-right">Amt (₹)</th>
                <th className="py-2 px-1.5 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50 align-top">
                  <td className="py-2 px-1.5 font-semibold text-gray-500 pt-3">{idx + 1}</td>
                  <td className="py-2 px-1.5">
                    <textarea 
                      value={item.itemDescription}
                      onChange={e => handleItemChange(item.id, 'itemDescription', e.target.value)}
                      placeholder="Type details or click '+ Add Item' to select standard materials"
                      rows={2}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 resize-none bg-white"
                      required
                    />
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      value={item.hsnSac}
                      onChange={e => handleItemChange(item.id, 'hsnSac', e.target.value)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 bg-white"
                    />
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      type="number"
                      value={item.qty}
                      onChange={e => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 text-right bg-white"
                      required
                    />
                  </td>
                  <td className="py-2 px-1.5">
                    <select
                      value={item.unit}
                      onChange={e => handleItemChange(item.id, 'unit', e.target.value)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 bg-white"
                    >
                      <option value="Nos">Nos</option>
                      <option value="Sets">Sets</option>
                      <option value="Kgs">Kgs</option>
                      <option value="Mtrs">Mtrs</option>
                      <option value="Boxes">Boxes</option>
                    </select>
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      type="number"
                      value={item.rate}
                      onChange={e => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 text-right bg-white"
                      required
                    />
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      type="number"
                      value={item.discount}
                      onChange={e => handleItemChange(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 text-right bg-white"
                    />
                  </td>
                  <td className="py-2 px-1.5 text-right font-medium text-gray-900 pt-3">
                    {item.taxable.toFixed(2)}
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      type="number"
                      value={item.cgstPercent}
                      onChange={e => handleItemChange(item.id, 'cgstPercent', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 text-right bg-white"
                    />
                  </td>
                  <td className="py-2 px-1.5">
                    <input 
                      type="number"
                      value={item.sgstPercent}
                      onChange={e => handleItemChange(item.id, 'sgstPercent', parseFloat(e.target.value) || 0)}
                      className="border border-gray-300 rounded-sm p-1.5 w-full outline-none focus:border-green-600 text-right bg-white"
                    />
                  </td>
                  <td className="py-2 px-1.5 text-right font-bold text-gray-900 pt-3">
                    {item.amt.toFixed(2)}
                  </td>
                  <td className="py-2 px-1.5 text-center pt-2">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700"
                      disabled={items.length <= 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={handleAddItem}
              className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-sm"
            >
              + Add Item
            </button>
            <button 
              type="button" 
              onClick={() => setIsSelectItemOpen(true)}
              className="border border-green-700 text-green-700 hover:bg-green-50 text-xs font-semibold px-3 py-1.5 rounded-sm"
            >
              Select Material
            </button>
          </div>
        </div>

        {/* Lower sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left panel: Terms, Notes, Bank, Share */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            
            {/* Terms & Conditions */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm">
              <h3 className="text-[#145a32] font-bold text-[14px] mb-3">Terms & Conditions</h3>
              
              <div className="flex flex-col gap-2 mb-3">
                {terms.map((term, idx) => (
                  <div key={term.id} className="flex items-center gap-2">
                    <span className="font-semibold text-gray-500 w-6 shrink-0">{idx + 1}.</span>
                    <input 
                      value={term.text}
                      onChange={e => handleTermChange(term.id, e.target.value)}
                      placeholder="Enter term or policy"
                      className="border border-gray-300 rounded-sm px-2.5 py-1.5 outline-none focus:border-green-600 flex-1 bg-white"
                    />
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTerm(term.id)}
                      className="text-red-500 hover:text-red-700 shrink-0 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={handleAddTerm}
                className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-sm"
              >
                + Add Term / Condition
              </button>
            </div>

            {/* Notes & Bank Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-2">
                <label className="font-bold text-[#145a32]">Notes :</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Enter internal or customer notes" 
                  rows={4} 
                  className="border border-gray-300 rounded-sm p-2 w-full outline-none focus:border-green-600 resize-none bg-white"
                />
              </div>

              <div className="bg-white border border-gray-200 p-4 rounded-sm flex flex-col gap-2">
                <label className="font-bold text-[#145a32]">Bank Details :</label>
                <select 
                  value={bankDetails} 
                  onChange={e => setBankDetails(e.target.value)}
                  className="border border-gray-300 rounded-sm p-2 w-full outline-none focus:border-green-600 bg-white"
                >
                  <option value="">Select Bank Account</option>
                  <option value="HDFC Bank Current A/C - 50200012345678 (IFSC: HDFC0000123)">HDFC Bank - Current Account</option>
                  <option value="State Bank of India Current A/C - 38012345678 (IFSC: SBIN0000888)">State Bank of India</option>
                </select>
                <p className="text-[11px] text-gray-400 mt-1">This will be printed on the invoice footer.</p>
              </div>
            </div>

            {/* Share settings */}
            <div className="bg-white border border-gray-200 p-4 rounded-sm">
              <h3 className="text-gray-800 font-bold text-[13px] mb-3">Share</h3>
              <div className="flex gap-6 font-semibold text-gray-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={shareEmail} onChange={e => setShareEmail(e.target.checked)} className="rounded-sm" />
                  Email
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={shareWhatsapp} onChange={e => setShareWhatsapp(e.target.checked)} className="rounded-sm" />
                  Whatsapp
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={printAfterSave} onChange={e => setPrintAfterSave(e.target.checked)} className="rounded-sm" />
                  Print Document after Saving
                </label>
              </div>
            </div>

          </div>

          {/* Right panel: Totals & Fees */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* Totals panel */}
            <div className="bg-white border border-gray-200 p-6 rounded-sm flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm font-semibold border-b border-gray-100 pb-2">
                <span>Total :</span>
                <span className="font-bold text-gray-900">₹ {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              {showExtraField && (
                <div className="flex justify-between items-center gap-2 text-xs">
                  <span>Extra Charge :</span>
                  <input 
                    type="number"
                    value={extraCharge}
                    onChange={e => setExtraCharge(parseFloat(e.target.value) || 0)}
                    className="border border-gray-300 rounded px-1.5 py-1 text-right w-24 bg-white"
                  />
                </div>
              )}

              {showDiscountField && (
                <div className="flex justify-between items-center gap-2 text-xs">
                  <span>Custom Discount :</span>
                  <input 
                    type="number"
                    value={customDiscount}
                    onChange={e => setCustomDiscount(parseFloat(e.target.value) || 0)}
                    className="border border-gray-300 rounded px-1.5 py-1 text-right w-24 bg-white"
                  />
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                <span>Total Taxable Value :</span>
                <span>₹ {totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Total CGST :</span>
                <span>₹ {totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Total SGST :</span>
                <span>₹ {totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-base font-bold border-t border-gray-200 pt-3 text-green-800">
                <span>Grand Total :</span>
                <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Adjustments buttons */}
            <div className="flex gap-2">
              <button 
                type="button" 
                onClick={() => { setShowExtraField(true); }}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-3 py-2 rounded-sm flex-1"
              >
                + Add Extra Charge
              </button>
              <button 
                type="button" 
                onClick={() => { setShowDiscountField(true); }}
                className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs px-3 py-2 rounded-sm flex-1"
              >
                + Add Discount
              </button>
            </div>

          </div>

        </div>

        {/* Bottom Actions */}
        <div className="flex gap-3 bg-white p-4 border border-gray-200 rounded-sm">
          <button 
            type="button" 
            onClick={() => handleSave(false)} 
            className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-sm"
          >
            ✓ Save
          </button>
          
          {!orderId && (
            <button 
              type="button" 
              onClick={() => handleSave(true)} 
              className="bg-green-700 hover:bg-green-800 text-white font-bold px-4 py-2 rounded-sm"
            >
              ✓ Save & Enter Another
            </button>
          )}

          <button 
            type="button" 
            onClick={() => router.push('/orders')} 
            className="border border-gray-300 text-gray-600 hover:bg-gray-100 font-bold px-4 py-2 rounded-sm bg-white"
          >
            Cancel
          </button>
        </div>

      </div>

      {/* Modals */}
      <CreateCustomerModal 
        isOpen={isCreateCustomerOpen} 
        onClose={() => setIsCreateCustomerOpen(false)} 
        onSuccess={(customerName, billingAddress, contactName, id) => {
          setCustomer(customerName);
          setContactPerson(contactName);
          setLeadId(id);
          setAddress(billingAddress);
          showToast('Customer created and selected!', 'success');
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

export default function CreateOrderPage() {
  return (
    <Suspense fallback={<div className="p-4 font-semibold text-gray-500">Loading order configuration...</div>}>
      <CreateOrderContent />
    </Suspense>
  );
}
