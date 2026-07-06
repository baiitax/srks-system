import { createClient } from "@/lib/supabase/server";
import { Printer, ClipboardSignature } from "lucide-react";
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
      po_items (products (name, sku, uom), quantity)
    `)
    .eq("id", poId)
    .single();

  if (!po) return <div className="p-10 text-red-600">GRN data unavailable.</div>;

  const vendorName = Array.isArray(po.vendors) ? po.vendors[0]?.company_name : po.vendors?.company_name;
  const customerName = Array.isArray(po.customers) ? po.customers[0]?.company_name : po.customers?.company_name;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white p-4 md:p-8 font-sans text-slate-900">
      
      {/* ── NON-PRINTABLE UI CONTROLS ── */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/admin/po`} className="text-sm font-bold text-slate-500 hover:text-slate-800">
          &larr; Back to PO Factory
        </Link>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-md font-bold shadow-sm">
          <Printer className="w-4 h-4" /> Print GRN Template
        </button>
      </div>

      {/* ── PRINTABLE A4 DOCUMENT ── */}
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 shadow-xl print:shadow-none print:p-0 border-t-8 border-slate-900">
        
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Goods Received Note</h1>
            <p className="text-sm font-bold text-slate-500">Destination Acceptance Form</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PO Reference</p>
            <p className="text-xl font-black font-mono bg-slate-100 px-3 py-1 rounded">{po.po_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-10 border border-slate-300 p-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Supplied By</p>
            <p className="text-base font-bold text-slate-900">{vendorName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Received By (Client)</p>
            <p className="text-base font-bold text-slate-900">{customerName}</p>
          </div>
        </div>

        <table className="w-full text-sm border-collapse mb-10 border border-slate-300">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-left">
              <th className="p-3 font-bold uppercase tracking-wider text-[10px]">Product / SKU</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] border-l border-slate-300">Expected Qty</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] border-l border-slate-300 text-emerald-700">Actual Received</th>
              <th className="p-3 text-right font-bold uppercase tracking-wider text-[10px] border-l border-slate-300 text-red-700">Shortage / Reject</th>
            </tr>
          </thead>
          <tbody>
            {po.po_items?.map((item: any, idx: number) => (
              <tr key={idx} className="border-b border-slate-200 h-16">
                <td className="p-3">
                  <div className="font-bold">{item.products?.name}</div>
                  <div className="font-mono text-[10px] text-slate-500">{item.products?.sku}</div>
                </td>
                <td className="p-3 text-right font-bold text-base border-l border-slate-300 bg-slate-50">
                  {item.quantity} <span className="text-[10px] font-normal">{item.products?.uom}</span>
                </td>
                {/* Blank fields for the client to physically write in with a pen */}
                <td className="p-3 border-l border-slate-300"></td>
                <td className="p-3 border-l border-slate-300 bg-red-50/20"></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border border-slate-300 p-4 mb-16 h-32">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remarks / Condition of Goods</p>
        </div>

        {/* Receiving Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Client Receiver Name & Sign</p>
            <div className="border-b border-slate-400 h-8"></div>
            <div className="flex justify-between mt-2">
              <p className="text-[9px] text-slate-400">Signature</p>
              <p className="text-[9px] text-slate-400">Date & Time</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-8">Pluck Global Agent Confirmation</p>
            <div className="border-b border-slate-400 h-8"></div>
            <div className="flex justify-between mt-2">
              <p className="text-[9px] text-slate-400">Signature</p>
              <p className="text-[9px] text-slate-400">Date & Time</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}