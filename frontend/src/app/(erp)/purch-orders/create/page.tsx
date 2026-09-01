'use client';

import React, { useState } from 'react';
import {
  Printer, ArrowLeft, Check, Search, Plus, Copy, Info,
  ChevronDown, X, Loader2, AlertCircle, Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { purchOrdersApi, leadsApi, customersApi } from '@/services/crmService';
import type { ProductCatalog, PurchaseOrderItem, Lead, Customer } from '@/interfaces/crm';
import SelectItemModal from '../../invoices/components/SelectItemModal';

interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
}



function calculateItemRow(item: PurchaseOrderItem, applyIgst: boolean = false): PurchaseOrderItem {
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
    const effectiveIgst = igst_percent || (cgst_percent + sgst_percent);
    cgst_amt = 0;
    sgst_amt = 0;
    igst_amt = (taxable * effectiveIgst) / 100;
    amt = taxable + igst_amt;
  } else {
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

export default function CreatePurchaseOrderPage() {
  const router = useRouter();

  // Fetch suppliers from API
  const { data: suppliersResponse } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => customersApi.list({ tags: 'supplier', page_size: 100 }),
    staleTime: 60000,
  });

  const suppliers: Supplier[] = ((suppliersResponse as any)?.data?.data?.results ?? []).map((c: Customer) => ({
    id: c.id,
    name: c.company_name || c.name,
    phone: c.mobile || '',
    address: [c.address, c.city, c.state].filter(Boolean).join(', ') || '',
  }));

  // Basic Information
  const [supplierInput, setSupplierInput] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  // Customer Details / Addresses
  const [contactPerson, setContactPerson] = useState('');
  const [sourceAddress, setSourceAddress] = useState('');
  const [shippingDetails, setShippingDetails] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Document Details
  const [poNo, setPoNo] = useState(() => `${Math.floor(30 + Math.random() * 90)}`);
  const [reference, setReference] = useState('');
  const [poDate, setPoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Line Items
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [showSelectItemModal, setShowSelectItemModal] = useState(false);

  // Terms & Conditions
  const [termsConditions, setTermsConditions] = useState<string[]>([]);
  const [showTermModal, setShowTermModal] = useState(false);
  const [newTermInput, setNewTermInput] = useState('');

  // Notes
  const [notes, setNotes] = useState('');

  // Extra Charges & Discounts
  const [extraCharge, setExtraCharge] = useState<number>(0);
  const [customDiscount, setCustomDiscount] = useState<number>(0);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempAmount, setTempAmount] = useState<number | ''>(0);

  // Share Options
  const [shareEmail, setShareEmail] = useState(false);
  const [shareWhatsapp, setShareWhatsapp] = useState(false);
  const [printAfterSave, setPrintAfterSave] = useState(false);

  // Save State
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Auto-calculated Totals
  const totalTaxable = items.reduce((sum, item) => sum + (item.taxable || 0), 0);
  const totalCgst = items.reduce((sum, item) => sum + (item.cgst_amt || 0), 0);
  const totalSgst = items.reduce((sum, item) => sum + (item.sgst_amt || 0), 0);
  const totalIgst = items.reduce((sum, item) => sum + (item.igst_amt || 0), 0);
  const subtotal = items.reduce((sum, item) => sum + (item.amt || 0), 0);
  const grandTotal = Math.max(0, subtotal + Number(extraCharge || 0) - Number(customDiscount || 0));

  const handleSelectSupplier = (s: Supplier) => {
    setSelectedSupplier(s);
    setSupplierInput(s.name);
    setSourceAddress(s.address);
    setShowSupplierDropdown(false);
  };

  const handleSelectCatalogItems = (selectedProducts: ProductCatalog[]) => {
    const newItems: PurchaseOrderItem[] = selectedProducts.map((p) =>
      calculateItemRow({
        item_description: p.name,
        hsn_sac: p.hsn_sac || '',
        qty: 1,
        unit: p.unit || 'nos',
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
      }, false)
    );
    setItems((prev) => [...prev, ...newItems]);
  };

  const handleUpdateRow = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: value };
      updated[index] = calculateItemRow(target, false);
      return updated;
    });
  };

  const handleRemoveRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePO = async (redirectAfter: boolean = true) => {
    if (!supplierInput && !selectedSupplier) {
      setSaveError('Please select or enter a supplier.');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    setSaveSuccess('');

    try {
      const payload = {
        supplier_name: supplierInput || selectedSupplier?.name || 'Supplier',
        contact_person: contactPerson,
        source_address: sourceAddress,
        shipping_details: shippingDetails,
        po_no: poNo,
        reference: reference,
        po_date: poDate,
        due_date: dueDate,
        notes: notes,
        terms_conditions: termsConditions,
        status: 'Pending',
        share_email: shareEmail,
        share_whatsapp: shareWhatsapp,
        print_after_save: printAfterSave,
        extra_charge: Number(extraCharge) || 0,
        custom_discount: Number(customDiscount) || 0,
        total_taxable: totalTaxable,
        total_cgst: totalCgst,
        total_sgst: totalSgst,
        total_igst: totalIgst,
        grand_total: grandTotal,
        items: items.map((item) => calculateItemRow(item, false)),
      };

      await purchOrdersApi.create(payload as any);
      setSaveSuccess('Purchase Order saved successfully!');

      if (redirectAfter) {
        setTimeout(() => router.push('/purch-orders'), 1200);
      } else {
        setItems([]);
        setPoNo(`${Math.floor(30 + Math.random() * 90)}`);
        setSaveSuccess('Purchase Order saved! Ready to enter another.');
      }
    } catch (err: any) {
      setSaveError(err?.response?.data?.detail || err?.message || 'Failed to save purchase order.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 bg-gray-100 min-h-screen text-gray-800 text-xs">
      
      {/* Top Action Bar */}
      <div className="flex justify-between items-center bg-white p-3 border border-gray-200 rounded shadow-xs">
        <h1 className="text-lg font-semibold text-gray-800">Create Purchase Order</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 bg-[#162032] text-white px-3 py-1.5 rounded text-xs hover:bg-[#1a2b4c]"
          >
            <Printer size={13} /> Print Settings
          </button>
          <Link
            href="/purch-orders"
            className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1.5 rounded text-xs hover:bg-gray-700"
          >
            <ArrowLeft size={13} /> Back
          </Link>
          <button
            onClick={() => handleSavePO(true)}
            disabled={isSaving}
            className="flex items-center gap-1 bg-green-700 text-white px-4 py-1.5 rounded text-xs font-semibold hover:bg-green-800 disabled:opacity-60"
          >
            {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={14} />}
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
          <AlertCircle size={15} />
          <span>{saveError}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-xs">
          <Check size={15} />
          <span>{saveSuccess}</span>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
        <h2 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wider text-gray-500">Basic Information</h2>
        <div className="flex items-center gap-2 max-w-xl relative">
          <label className="w-20 text-gray-600 font-medium">Supplier :</label>
          <div className="flex-1 relative">
            <input
              type="text"
              value={supplierInput}
              onChange={(e) => {
                setSupplierInput(e.target.value);
                setShowSupplierDropdown(true);
              }}
              onFocus={() => setShowSupplierDropdown(true)}
              placeholder="Search or enter supplier name..."
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-green-500 bg-white"
            />
            {showSupplierDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 max-h-48 overflow-y-auto">
                {suppliers.filter(s => s.name.toLowerCase().includes(supplierInput.toLowerCase())).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectSupplier(s)}
                    className="p-2 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                  >
                    <div className="font-medium text-gray-800">{s.name}</div>
                    <div className="text-[11px] text-gray-500">{s.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSupplierDropdown(!showSupplierDropdown)}
            className="p-1.5 border border-gray-300 rounded text-gray-600 bg-gray-50 hover:bg-gray-100"
          >
            <Search size={14} />
          </button>
          <button
            className="p-1.5 border border-green-600 rounded text-green-700 bg-green-50 hover:bg-green-100 font-bold text-sm leading-none"
            title="Add new supplier"
          >
            +
          </button>
          <button
            className="p-1.5 border border-gray-300 rounded text-gray-600 bg-gray-50 hover:bg-gray-100"
            title="Copy details"
          >
            <Copy size={14} />
          </button>
        </div>
      </div>

      {/* Customer Details & Document Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        
        {/* Customer Details Card */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex flex-col gap-4">
          <h2 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-gray-500">Customer Details</h2>
          
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <label className="w-28 text-gray-600 font-medium">Contact Person :</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-green-500 max-w-md"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600 font-medium">Source Address :</label>
              {!showAddressForm && !sourceAddress ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded font-medium text-xs hover:bg-green-100 w-fit"
                >
                  + Click here to add an address
                </button>
              ) : (
                <textarea
                  value={sourceAddress}
                  onChange={(e) => setSourceAddress(e.target.value)}
                  placeholder="Enter source address..."
                  className="w-full border border-gray-300 rounded p-2 text-xs h-20 resize-none focus:outline-none focus:border-green-500"
                />
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-gray-600 font-medium">Shipping Details :</label>
              <textarea
                value={shippingDetails}
                onChange={(e) => setShippingDetails(e.target.value)}
                placeholder="Enter shipping details..."
                className="w-full border border-gray-300 rounded p-2 text-xs h-20 resize-none focus:outline-none focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* Document Details Card */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex flex-col gap-3">
          <h2 className="font-semibold text-gray-800 text-xs uppercase tracking-wider text-gray-500">Document Details</h2>

          <div className="flex justify-between items-center gap-2">
            <label className="text-gray-600 font-medium">PO No. :</label>
            <input
              type="text"
              value={poNo}
              onChange={(e) => setPoNo(e.target.value)}
              className="w-48 border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-green-500 text-right"
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <label className="text-gray-600 font-medium">Reference :</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-48 border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <label className="text-gray-600 font-medium">PO Date :</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-48 border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-green-500"
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <label className="text-gray-600 font-medium">Due Date :</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-48 border border-gray-300 rounded px-3 py-1 text-xs focus:outline-none focus:border-green-500"
            />
          </div>
        </div>
      </div>

      {/* Item List Section */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-xs overflow-x-auto">
        <h2 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wider text-gray-500">Item List</h2>
        
        <table className="w-full text-xs text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-gray-200 text-gray-700 bg-gray-50">
              <th className="py-2 px-2 font-semibold w-10 text-center">No.</th>
              <th className="py-2 px-2 font-semibold">Item &amp; Description</th>
              <th className="py-2 px-2 font-semibold w-24">HSN/SAC</th>
              <th className="py-2 px-2 font-semibold w-20 text-center">Qty</th>
              <th className="py-2 px-2 font-semibold w-20">Unit</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Rate (₹)</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Discount (₹)</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Taxable (₹)</th>
              <th className="py-2 px-2 font-semibold w-20 text-right">CGST (₹)</th>
              <th className="py-2 px-2 font-semibold w-20 text-right">SGST (₹)</th>
              <th className="py-2 px-2 font-semibold w-24 text-right">Amt (₹)</th>
              <th className="py-2 px-2 font-semibold w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-6 text-center text-gray-400">
                  No items added yet.
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-2 px-2 text-center text-gray-500">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.item_description}
                      onChange={(e) => handleUpdateRow(idx, 'item_description', e.target.value)}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.hsn_sac || ''}
                      onChange={(e) => handleUpdateRow(idx, 'hsn_sac', e.target.value)}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-gray-600 focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleUpdateRow(idx, 'qty', e.target.value)}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-center focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      value={item.unit}
                      onChange={(e) => handleUpdateRow(idx, 'unit', e.target.value)}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleUpdateRow(idx, 'rate', e.target.value)}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <input
                      type="number"
                      value={item.discount}
                      onChange={(e) => handleUpdateRow(idx, 'discount', e.target.value)}
                      className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:border-green-600"
                    />
                  </td>
                  <td className="py-2 px-2 text-right font-medium">
                    ₹ {item.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-500">
                    ₹ {item.cgst_amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-500">
                    ₹ {item.sgst_amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-right font-semibold">
                    ₹ {item.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button onClick={() => handleRemoveRow(idx)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <button
          onClick={() => setShowSelectItemModal(true)}
          className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded font-medium text-xs hover:bg-green-100 mt-3"
        >
          <Plus size={13} /> Add Item
        </button>
      </div>

      {/* Terms, Notes & Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <div className="flex flex-col gap-4">
          
          {/* Terms & Conditions Card */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
            <h2 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wider text-gray-500">Terms &amp; Conditions</h2>
            <ul className="flex flex-col gap-1.5 mb-3 text-xs text-gray-700 list-disc pl-5">
              {termsConditions.map((term, index) => (
                <li key={index} className="flex items-center justify-between group">
                  <span>{term}</span>
                  <button
                    onClick={() => setTermsConditions((prev) => prev.filter((_, i) => i !== index))}
                    className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 ml-2"
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowTermModal(true)}
              className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded font-medium text-xs hover:bg-green-100 w-fit"
            >
              + Add Term / Condition
            </button>
          </div>

          {/* Notes Card */}
          <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
            <h2 className="font-semibold text-gray-800 mb-2 text-xs uppercase tracking-wider text-gray-500">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes visible on Purchase Order..."
              className="w-full border border-gray-300 rounded p-2 text-xs h-20 resize-none focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Right Summary Card */}
        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs flex flex-col gap-3 self-start">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Total :</span>
            <span className="font-semibold text-gray-900">
              ₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {extraCharge > 0 && (
            <div className="flex justify-between text-xs text-green-700">
              <span>Extra Charge :</span>
              <span className="font-medium">+ ₹ {extraCharge.toFixed(2)}</span>
            </div>
          )}

          {customDiscount > 0 && (
            <div className="flex justify-between text-xs text-red-600">
              <span>Discount :</span>
              <span className="font-medium">- ₹ {customDiscount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-gray-900">
            <span>Grand Total :</span>
            <span>₹ {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => { setTempAmount(extraCharge); setShowExtraModal(true); }}
              className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded font-medium text-xs hover:bg-green-100"
            >
              + Add Extra Charge
            </button>
            <button
              onClick={() => { setTempAmount(customDiscount); setShowDiscountModal(true); }}
              className="flex items-center gap-1 text-green-700 bg-green-50 border border-green-200 px-2.5 py-1.5 rounded font-medium text-xs hover:bg-green-100"
            >
              + Add Discount
            </button>
          </div>
        </div>
      </div>

      {/* Share Section */}
      <div className="bg-white border border-gray-200 rounded p-4 shadow-xs">
        <h2 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wider text-gray-500">Share</h2>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={shareEmail}
              onChange={(e) => setShareEmail(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            Email
          </label>
          <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={shareWhatsapp}
              onChange={(e) => setShareWhatsapp(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            Whatsapp
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

      {/* Bottom Save Action Bar */}
      <div className="flex gap-3 pb-8">
        <button
          onClick={() => handleSavePO(true)}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 bg-green-700 text-white rounded text-xs font-semibold hover:bg-green-800 disabled:opacity-60 shadow-xs"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          {isSaving ? 'Saving…' : '✓ Save'}
        </button>

        <button
          onClick={() => handleSavePO(false)}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-5 py-2 bg-green-700 text-white rounded text-xs font-semibold hover:bg-green-800 disabled:opacity-60 shadow-xs"
        >
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={15} />}
          ✓ Save &amp; Enter Another
        </button>
      </div>

      {/* Modals */}
      {showSelectItemModal && (
        <SelectItemModal
          onClose={() => setShowSelectItemModal(false)}
          onSelectItems={handleSelectCatalogItems}
        />
      )}

      {/* Terms Modal */}
      {showTermModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">Add Term / Condition</h3>
            <input
              type="text"
              value={newTermInput}
              onChange={(e) => setNewTermInput(e.target.value)}
              placeholder="Enter term..."
              className="w-full border border-gray-300 rounded p-2 text-xs focus:outline-none focus:border-green-500"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowTermModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newTermInput.trim()) {
                    setTermsConditions((prev) => [...prev, newTermInput.trim()]);
                    setNewTermInput('');
                    setShowTermModal(false);
                  }
                }}
                className="px-3 py-1.5 text-xs bg-green-700 text-white rounded font-medium hover:bg-green-800"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extra Charge Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-xs shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">Extra Charge</h3>
            <input
              type="number"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full border border-gray-300 rounded p-2 text-xs text-right font-semibold focus:outline-none focus:border-green-500"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowExtraModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
                Cancel
              </button>
              <button
                onClick={() => {
                  setExtraCharge(Number(tempAmount) || 0);
                  setShowExtraModal(false);
                }}
                className="px-3 py-1.5 text-xs bg-green-700 text-white rounded font-medium hover:bg-green-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg p-5 w-full max-w-xs shadow-xl flex flex-col gap-3">
            <h3 className="font-semibold text-gray-800">Discount</h3>
            <input
              type="number"
              value={tempAmount}
              onChange={(e) => setTempAmount(e.target.value ? parseFloat(e.target.value) : '')}
              className="w-full border border-gray-300 rounded p-2 text-xs text-right font-semibold focus:outline-none focus:border-green-500"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setShowDiscountModal(false)} className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded">
                Cancel
              </button>
              <button
                onClick={() => {
                  setCustomDiscount(Number(tempAmount) || 0);
                  setShowDiscountModal(false);
                }}
                className="px-3 py-1.5 text-xs bg-green-700 text-white rounded font-medium hover:bg-green-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
