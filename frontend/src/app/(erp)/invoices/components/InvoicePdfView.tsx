'use client';

import React from 'react';
import type { Invoice, InvoiceItem } from '@/interfaces/crm';

interface InvoicePdfProps {
  invoice: Partial<Invoice> & {
    items?: InvoiceItem[];
    customer_name?: string;
    billing_address?: string;
    shipping_details?: string;
    invoice_no?: string;
    invoice_date?: string;
    due_date?: string;
    bank_details?: string;
    total_taxable?: number;
    total_cgst?: number;
    total_sgst?: number;
    total_igst?: number;
    grand_total?: number;
  };
}

// Convert numbers to Indian Rupees Words
function numberToWords(num: number): string {
  const a = [
    '', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ',
    'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '
  ];
  const b = ['', '', 'twenty ', 'thirty ', 'forty ', 'fifty ', 'sixty ', 'seventy ', 'eighty ', 'ninety '];

  if ((num = num.toString() as any).length > 9) return 'overflow';
  const n: any = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  
  return str.trim() ? str.trim() + ' only' : 'zero only';
}

export default function InvoicePdfView({ invoice }: InvoicePdfProps) {
  const items = invoice.items || [];
  const grandTotal = Number(invoice.grand_total) || 0;
  const grandTotalWords = numberToWords(Math.round(grandTotal));

  // Determine if IGST applies based on total_igst or item structure
  const isIgst = (Number(invoice.total_igst) || 0) > 0 || items.some(i => (i.igst_amt || 0) > 0);

  // Group HSN/SAC totals for summary table at bottom
  const hsnMap: Record<string, { taxable: number; cgst_p: number; cgst_a: number; sgst_p: number; sgst_a: number; igst_p: number; igst_a: number }> = {};
  
  items.forEach(item => {
    const code = item.hsn_sac || 'N/A';
    if (!hsnMap[code]) {
      hsnMap[code] = {
        taxable: 0,
        cgst_p: item.cgst_percent || 0,
        cgst_a: 0,
        sgst_p: item.sgst_percent || 0,
        sgst_a: 0,
        igst_p: item.igst_percent || ((item.cgst_percent || 0) + (item.sgst_percent || 0)),
        igst_a: 0,
      };
    }
    hsnMap[code].taxable += Number(item.taxable) || 0;
    hsnMap[code].cgst_a += Number(item.cgst_amt) || 0;
    hsnMap[code].sgst_a += Number(item.sgst_amt) || 0;
    hsnMap[code].igst_a += Number(item.igst_amt) || 0;
  });

  return (
    <div className="bg-white text-black p-6 font-sans text-xs max-w-[1000px] mx-auto border border-gray-300 print:border-none print:p-0">
      {/* Header Section */}
      <div className="flex justify-between items-start border-b border-black pb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Greenedge Infratech Pvt. Ltd.</h1>
          <p className="text-[11px] text-gray-700">8/140, Raguvir Puri GT Road Aligarh, 202001</p>
          <div className="flex items-center gap-4 text-[10px] text-gray-700 mt-1">
            <span>📞 9837067681</span>
            <span>✉️ greenedgeinfratech@gmail.com</span>
            <span>🌐 https://greenedgeinfratech.com/</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          {/* Company Logo Badge / Seal */}
          <div className="w-20 h-20 border-2 border-green-700 rounded-full flex flex-col items-center justify-center p-1 text-center text-[8px] font-bold text-green-800 leading-tight">
            <span className="text-green-600 font-extrabold text-[10px]">Greenedge</span>
            <span>INFRATECH</span>
            <span className="text-[6px] text-gray-500 font-normal">NATURE PROTECTS</span>
          </div>
        </div>
      </div>

      {/* Invoice Title */}
      <div className="text-center my-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-black">INVOICE</h2>
      </div>

      {/* Meta Bar */}
      <div className="flex justify-between text-[11px] font-medium border-t border-b border-gray-300 py-1.5 px-1 mb-2">
        <div>
          <span>GSTIN : </span>
          <span className="font-bold">09AAGCG2802H1ZS</span>
        </div>
        <div className="flex gap-6">
          <div>
            <span>Invoice No. : </span>
            <span className="font-bold">{invoice.invoice_no || 'N/A'}</span>
          </div>
          <div>
            <span>Date : </span>
            <span className="font-bold">{invoice.invoice_date || new Date().toLocaleDateString('en-GB')}</span>
          </div>
        </div>
      </div>

      {/* Address Grid */}
      <div className="grid grid-cols-2 border border-black mb-3">
        <div className="p-2 border-r border-black">
          <div className="font-bold underline mb-1 text-[11px]">Billing Address</div>
          <div className="font-semibold text-gray-900">{invoice.customer_name || 'N/A'}</div>
          <div className="whitespace-pre-line text-gray-700">{invoice.billing_address || 'N/A'}</div>
        </div>
        <div className="p-2">
          <div className="font-bold underline mb-1 text-[11px]">Shipping Address</div>
          <div className="font-semibold text-gray-900">{invoice.customer_name || 'N/A'}</div>
          <div className="whitespace-pre-line text-gray-700">{invoice.shipping_details || invoice.billing_address || 'N/A'}</div>
        </div>
      </div>

      {/* Item List Table */}
      <table className="w-full border-collapse border border-black text-[10px] mb-3">
        <thead>
          <tr className="bg-gray-100 border-b border-black text-center font-bold">
            <th className="border-r border-black p-1 w-8">No.</th>
            <th className="border-r border-black p-1 text-left">Item & Description</th>
            <th className="border-r border-black p-1 w-28">Item Code</th>
            <th className="border-r border-black p-1 w-16">HSN / SAC</th>
            <th className="border-r border-black p-1 w-10">Qty</th>
            <th className="border-r border-black p-1 w-12">Unit</th>
            <th className="border-r border-black p-1 w-16 text-right">Rate (₹)</th>
            <th className="border-r border-black p-1 w-16 text-right">Taxable (₹)</th>
            {isIgst ? (
              <th className="border-r border-black p-1 w-24 text-center">IGST</th>
            ) : (
              <>
                <th className="border-r border-black p-1 w-16 text-center">CGST</th>
                <th className="border-r border-black p-1 w-16 text-center">SGST</th>
              </>
            )}
            <th className="p-1 w-20 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-300 text-center">
              <td className="border-r border-black p-1.5">{idx + 1}</td>
              <td className="border-r border-black p-1.5 text-left font-medium">{item.item_description}</td>
              <td className="border-r border-black p-1.5 text-left text-gray-600">{item.item_description}</td>
              <td className="border-r border-black p-1.5 font-mono">{item.hsn_sac || '-'}</td>
              <td className="border-r border-black p-1.5 font-bold">{item.qty}</td>
              <td className="border-r border-black p-1.5">{item.unit || 'nos'}</td>
              <td className="border-r border-black p-1.5 text-right">{(Number(item.rate) || 0).toFixed(2)}</td>
              <td className="border-r border-black p-1.5 text-right">{(Number(item.taxable) || 0).toFixed(2)}</td>
              {isIgst ? (
                <td className="border-r border-black p-1.5 text-right">
                  {(Number(item.igst_amt) || 0).toFixed(2)} <span className="text-[8px] text-gray-500">({item.igst_percent}%)</span>
                </td>
              ) : (
                <>
                  <td className="border-r border-black p-1.5 text-right">
                    {(Number(item.cgst_amt) || 0).toFixed(2)} <span className="text-[8px] text-gray-500">({item.cgst_percent}%)</span>
                  </td>
                  <td className="border-r border-black p-1.5 text-right">
                    {(Number(item.sgst_amt) || 0).toFixed(2)} <span className="text-[8px] text-gray-500">({item.sgst_percent}%)</span>
                  </td>
                </>
              )}
              <td className="p-1.5 text-right font-bold">{(Number(item.amt) || 0).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Grid & Bank Details */}
      <div className="grid grid-cols-12 border border-black mb-3">
        {/* Left: Bank Details */}
        <div className="col-span-5 border-r border-black p-2 text-[10px]">
          <div className="font-bold underline mb-1">Bank Details :</div>
          <div className="whitespace-pre-line text-gray-800 leading-relaxed">
            {invoice.bank_details || 'State Bank of India\nA/C No: 43279551326\nIFSC: SBIN0001234\nBranch: Aligarh Main'}
          </div>
        </div>

        {/* Middle: Amount in Words */}
        <div className="col-span-3 border-r border-black p-2 text-[10px]">
          <div className="font-bold underline mb-1">Total Invoice Amount in Words :</div>
          <div className="font-semibold text-gray-900 capitalize leading-relaxed">
            Rupees {grandTotalWords}
          </div>
        </div>

        {/* Right: Totals Table */}
        <div className="col-span-4 text-[10px]">
          <div className="flex justify-between border-b border-black p-1">
            <span>Total Amount before Tax (₹)</span>
            <span className="font-semibold">{(Number(invoice.total_taxable) || 0).toFixed(2)}</span>
          </div>
          {isIgst ? (
            <div className="flex justify-between border-b border-black p-1">
              <span>Add IGST (₹)</span>
              <span className="font-semibold">{(Number(invoice.total_igst) || 0).toFixed(2)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between border-b border-black p-1">
                <span>Add CGST (₹)</span>
                <span className="font-semibold">{(Number(invoice.total_cgst) || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-black p-1">
                <span>Add SGST (₹)</span>
                <span className="font-semibold">{(Number(invoice.total_sgst) || 0).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between p-1 font-bold bg-gray-100 text-xs">
            <span>Grand Total (₹)</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Disclaimers */}
      <div className="flex justify-between items-end border-b border-black pb-4 mb-3">
        <div className="text-[9px] text-gray-600 flex flex-col gap-1">
          <p>This is a computer generated Invoice.</p>
          <p>Amount of text subject to reverse charge. E. & O. E.</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-bold mb-6">For, Greenedge Infratech Pvt. Ltd.</p>
          <div className="border-t border-black pt-1 text-[10px] font-semibold w-44 mx-auto">
            Authorised Signatory
          </div>
        </div>
      </div>

      {/* Bottom HSN / SAC Breakup Table */}
      <div>
        <table className="w-full border-collapse border border-black text-[9px]">
          <thead>
            <tr className="bg-gray-100 border-b border-black text-center font-bold">
              <th className="border-r border-black p-1">HSN/SAC Code</th>
              <th className="border-r border-black p-1">Taxable (₹)</th>
              {isIgst ? (
                <>
                  <th className="border-r border-black p-1">IGST %</th>
                  <th className="border-r border-black p-1">IGST (₹)</th>
                </>
              ) : (
                <>
                  <th className="border-r border-black p-1">CGST %</th>
                  <th className="border-r border-black p-1">CGST (₹)</th>
                  <th className="border-r border-black p-1">SGST %</th>
                  <th className="border-r border-black p-1">SGST (₹)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {Object.entries(hsnMap).map(([code, data], i) => (
              <tr key={i} className="border-b border-gray-300 text-center">
                <td className="border-r border-black p-1 font-mono">{code}</td>
                <td className="border-r border-black p-1">{data.taxable.toFixed(2)}</td>
                {isIgst ? (
                  <>
                    <td className="border-r border-black p-1">{data.igst_p}%</td>
                    <td className="border-r border-black p-1">{data.igst_a.toFixed(2)}</td>
                  </>
                ) : (
                  <>
                    <td className="border-r border-black p-1">{data.cgst_p}%</td>
                    <td className="border-r border-black p-1">{data.cgst_a.toFixed(2)}</td>
                    <td className="border-r border-black p-1">{data.sgst_p}%</td>
                    <td className="border-r border-black p-1">{data.sgst_a.toFixed(2)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
