import { createClient } from "@/lib/supabase/server";
import { Printer } from "lucide-react";
import Link from "next/link";

export default async function GeneratedGRNPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const poId = resolvedParams.id;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select(`
      po_number,
      customers (company_name, delivery_address_default),
      vendors (company_name),
      po_items (
        quantity,
        products (name, sku, uom)
      )
    `)
    .eq("id", poId)
    .single();

  if (!po) return <div className="p-10 text-red-600 font-bold">GRN data unavailable.</div>;

  // 🚨 FIXED: Type cast to 'any' to bypass strict Next.js Turbopack relational inference
  const vendorData: any = po.vendors;
  const customerData: any = po.customers;

  const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name;
  const customerName = Array.isArray(customerData) ? customerData[0]?.company_name : customerData?.company_name;
  const destination = Array.isArray(customerData) ? customerData[0]?.delivery_address_default : customerData?.delivery_address_default;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white p-4 md:p-8 font-sans text-slate-900">
      
      {/* ── NON-PRINTABLE UI CONTROLS ── */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/admin/po`} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
          &larr; Back to Dashboard
        </Link>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-md font-bold shadow-sm transition-colors">
          <Printer className="w-4 h-4" /> Print GRN Template
        </button>
      </div>

      {/* ── PRINTABLE A4 DOCUMENT ── */}
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 shadow-xl print:shadow-none print:p-0 border-t-8 border-slate-900">
        
        {/* Document Header */}
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-slate-900">Goods Received Note</h1>
            <p className="text-sm font-bold text-slate-500">Destination Acceptance Form</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PO Reference</p>
            <p className="text-xl font-black font-mono bg-slate-100 px-3 py-1 rounded text-slate-900">{po.po_number}</p>
          </div>
        </div>

        {/* Entities Box */}
        <div className="grid grid-cols-2 gap-8 mb-10 border border-slate-300 p-6 rounded-sm bg-slate-50/30">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Supplied By</p>
            <p className="text-base font-bold text-slate-900">{vendorName || "Unassigned Vendor"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Received By (Client)</p>
            <p className="text-base font-bold text-slate-900">{customerName || "Unassigned Client"}</p>
            <p className="text-xs text-slate-500 mt-1">{destination || "No destination registered"}</p>
          </div>
        </div>

        {/* Cargo Receiving Table */}
        <table className="w-full text-sm border-collapse mb-10 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-left">
              <th className="p-3 font-bold uppercase tracking-wider text-[10px] text-slate-700">Product / SKU</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] text-slate-700 border-l border-slate-300 w-32">Expected Qty</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] text-emerald-700 border-l border-slate-300 w-32">Actual Received</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] text-red-700 border-l border-slate-300 w-32">Shortage / Reject</th>
            </tr>
          </thead>
          <tbody>
            {po.po_items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200 h-16">
                <td className="p-3">
                  <div className="font-bold text-slate-900">{item.products?.name}</div>
                  <div className="font-mono text-[10px] text-slate-500 font-semibold mt-0.5">{item.products?.sku}</div>
                </td>
                <td className="p-3 text-right font-bold text-base border-l border-slate-300 bg-slate-50">
                  {item.quantity} <span className="text-[10px] font-normal text-slate-500 uppercase">{item.products?.uom.replace('_', ' ')}</span>
                </td>
                {/* Blank fields for the client to physically write in with a pen */}
                <td className="p-3 border-l border-slate-300"></td>
                <td className="p-3 border-l border-slate-300 bg-red-50/20"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Remarks Box */}
        <div className="border border-slate-300 p-4 mb-16 h-32 bg-slate-50/30">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks / Condition of Goods upon Arrival</p>
        </div>

        {/* Receiving Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Client Receiver Name & Sign</p>
            <div className="border-b border-slate-400 h-8"></div>
            <div className="flex justify-between mt-2">
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Signature</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Date & Time</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">SRKS Agent Confirmation</p>
            <div className="border-b border-slate-400 h-8"></div>
            <div className="flex justify-between mt-2">
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Signature</p>
              <p className="text-[9px] text-slate-400 font-semibold uppercase">Date & Time</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
