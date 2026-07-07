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
      customers (company_name, delivery_address_default),
      vendors (company_name),
      po_items (
        quantity,
        products (name, sku, uom)
      )
    `)
    .eq("id", poId)
    .single();

  if (!po) return <div className="p-10 text-red-600 font-bold">Waybill data unavailable.</div>;

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
        <Link href={`/agent/upload/${poId}`} className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
          &larr; Back to Mission
        </Link>
        <button className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-md font-bold shadow-sm transition-colors">
          <Printer className="w-4 h-4" /> Save / Print PDF
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
              <h1 className="text-2xl font-black tracking-tighter text-slate-900">SRKS LOGISTICS</h1>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Official Outbound Waybill</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <QrCode className="w-16 h-16 text-slate-900 mb-2" />
            <p className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider">
              AUTH-{poId.split('-')[0]}
            </p>
          </div>
        </div>

        {/* Reference Data */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">System Reference</p>
            <p className="text-xl font-black font-mono text-slate-900">{po.po_number}</p>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Issue Date: {new Date(po.created_at || new Date()).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        {/* Routing Box */}
        <div className="grid grid-cols-2 gap-8 mb-10 border border-slate-200 rounded-md p-6 bg-slate-50/50">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pickup Location (Vendor)</p>
            <p className="text-sm font-bold text-slate-900">{vendorName || "Unassigned Vendor"}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Delivery Destination (Client)</p>
            <p className="text-sm font-bold text-slate-900">{customerName || "Unassigned Client"}</p>
            <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">{destination || "No address provided."}</p>
          </div>
        </div>

        {/* Cargo Manifest */}
        <div className="mb-16">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cargo Manifest</p>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-800 text-left">
                <th className="py-3 font-bold uppercase tracking-wider text-[10px] text-slate-700">SKU</th>
                <th className="py-3 font-bold uppercase tracking-wider text-[10px] text-slate-700">Description</th>
                <th className="py-3 text-right font-bold uppercase tracking-wider text-[10px] text-slate-700">Volume / Qty</th>
              </tr>
            </thead>
            <tbody>
              {po.po_items?.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="py-4 font-mono text-xs text-slate-600 font-medium">{item.products?.sku}</td>
                  <td className="py-4 font-bold text-slate-900">{item.products?.name}</td>
                  <td className="py-4 text-right font-bold text-base text-slate-900">
                    {item.quantity} <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{item.products?.uom.replace('_', ' ')}</span>
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
