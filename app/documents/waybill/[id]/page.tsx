import { createClient } from "@/lib/supabase/server";
import { QrCode, Printer, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default async function GeneratedWaybillPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const poId = resolvedParams.id;
  const supabase = await createClient();

  const { data: po } = await supabase
    .from("purchase_orders")
    .select(`
      po_number,
      created_at,
      customers (company_name, delivery_address_default, contact_phone),
      vendors (company_name, contact_phone),
      po_items (products (name, sku, uom), quantity)
    `)
    .eq("id", poId)
    .single();

  if (!po) return <div className="p-10 text-red-600 font-bold">Waybill data unavailable.</div>;

  const vendorName = Array.isArray(po.vendors) ? po.vendors[0]?.company_name : po.vendors?.company_name;
  const customerName = Array.isArray(po.customers) ? po.customers[0]?.company_name : po.customers?.company_name;
  const destination = Array.isArray(po.customers) ? po.customers[0]?.delivery_address_default : po.customers?.delivery_address_default;

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white p-4 md:p-8 font-sans text-slate-900">
      
      {/* ── NON-PRINTABLE UI CONTROLS ── */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/agent/upload/${poId}`} className="text-sm font-bold text-slate-500 hover:text-slate-800">
          &larr; Back to Mission
        </Link>
        <button 
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-md font-bold shadow-sm"
        >
          <Printer className="w-4 h-4" /> Save / Print PDF
          {/* Note: In a client component wrapper, this button would call window.print() */}
        </button>
      </div>

      {/* ── PRINTABLE A4 DOCUMENT ── */}
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-16 shadow-xl print:shadow-none print:p-0">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-slate-900 flex items-center justify-center rounded-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter">SRKS LOGISTICS</h1>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Official Outbound Waybill</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <QrCode className="w-16 h-16 text-slate-900 mb-2" />
            <p className="text-[10px] font-mono text-slate-500">AUTH-{poId.split('-')[0]}</p>
          </div>
        </div>

        {/* Reference Data */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Reference</p>
            <p className="text-xl font-black font-mono">{po.po_number}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Date: {new Date().toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Routing Box */}
        <div className="grid grid-cols-2 gap-8 mb-10 border border-slate-200 rounded-md p-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pickup Location (Vendor)</p>
            <p className="text-sm font-bold text-slate-900">{vendorName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivery Destination (Client)</p>
            <p className="text-sm font-bold text-slate-900">{customerName}</p>
            <p className="text-xs text-slate-600 mt-1">{destination}</p>
          </div>
        </div>

        {/* Cargo Manifest */}
        <div className="mb-16">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cargo Manifest</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-left">
                <th className="py-2 font-bold uppercase tracking-wider text-xs">SKU</th>
                <th className="py-2 font-bold uppercase tracking-wider text-xs">Description</th>
                <th className="py-2 text-right font-bold uppercase tracking-wider text-xs">Volume / Qty</th>
              </tr>
            </thead>
            <tbody>
              {po.po_items?.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-3 font-mono text-xs">{item.products?.sku}</td>
                  <td className="py-3 font-medium">{item.products?.name}</td>
                  <td className="py-3 text-right font-bold text-base">
                    {item.quantity} <span className="text-xs font-normal text-slate-500">{item.products?.uom.replace('_', ' ').toUpperCase()}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 mt-20 pt-8 border-t border-slate-200">
          <div className="text-center">
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Dispatch Officer</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Driver / Agent</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gate Security</p>
          </div>
        </div>

      </div>
    </div>
  );
}