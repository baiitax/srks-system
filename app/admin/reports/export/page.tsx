import { createClient } from "@/lib/supabase/server";
import { Printer, Building2 } from "lucide-react";
import Link from "next/link";

export default async function FinancialReportPrintPage() {
  const supabase = await createClient();

  const { data: allPOs } = await supabase
    .from("purchase_orders")
    .select(`
      po_number,
      status,
      created_at,
      vendors (company_name),
      po_items (total_amount)
    `)
    .in("status", ["reconciled", "variance_hold", "pending_finance_review"])
    .order("created_at", { ascending: false });

  let totalReconciled = 0;
  let totalFrozen = 0;

  const tableRows = allPOs?.map(po => {
    const value = po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
    
    // 🚨 ADDED: Type cast to 'any' to bypass strict relational inference
    const vendorData: any = po.vendors;
    const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name;
    
    const isReconciled = po.status === 'reconciled';
    
    if (isReconciled) totalReconciled += value;
    else totalFrozen += value;

    return { ...po, value, vendorName, isReconciled };
  });

  return (
    <div className="min-h-screen bg-slate-200 print:bg-white p-4 md:p-8 font-sans text-slate-900">
      
      {/* ── NON-PRINTABLE UI CONTROLS ── */}
      <div className="max-w-5xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Link href={`/admin/reports`} className="text-sm font-bold text-slate-500 hover:text-slate-800">
          &larr; Back to Analytics
        </Link>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-md font-bold shadow-sm">
          <Printer className="w-4 h-4" /> Print Financial Summary
        </button>
      </div>

      {/* ── PRINTABLE A4 DOCUMENT ── */}
      <div className="max-w-5xl mx-auto bg-white p-10 md:p-12 shadow-xl print:shadow-none print:p-0">
        
        <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Corporate Ledger Summary</h1>
            <p className="text-xs font-bold text-slate-500 mt-1">Generated: {new Date().toLocaleString('en-GB')}</p>
          </div>
          <div className="text-right">
            <Building2 className="w-8 h-8 text-slate-900 mb-1 ml-auto" />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SRKS Financial Control</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="border border-slate-300 p-4 rounded bg-slate-50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cleared Capital (Reconciled)</p>
            <p className="text-2xl font-black text-slate-900">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalReconciled)}
            </p>
          </div>
          <div className="border border-slate-300 p-4 rounded bg-slate-50">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Frozen Capital (Variances)</p>
            <p className="text-2xl font-black text-red-700">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalFrozen)}
            </p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white text-left">
              <th className="p-2 font-bold uppercase tracking-wider text-[10px]">Date</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[10px]">Reference</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[10px]">Vendor Entity</th>
              <th className="p-2 font-bold uppercase tracking-wider text-[10px] text-center">Status</th>
              <th className="p-2 text-right font-bold uppercase tracking-wider text-[10px]">Net Value (NGN)</th>
            </tr>
          </thead>
          <tbody>
            {tableRows?.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-200">
                <td className="p-2 text-slate-600 font-mono text-[10px]">
                  {new Date(row.created_at).toLocaleDateString('en-GB')}
                </td>
                <td className="p-2 font-bold font-mono">{row.po_number}</td>
                <td className="p-2 font-medium truncate max-w-[200px]">{row.vendorName}</td>
                <td className="p-2 text-center">
                  <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${row.isReconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {row.isReconciled ? 'CLEARED' : 'FROZEN'}
                  </span>
                </td>
                <td className={`p-2 text-right font-bold font-mono ${row.isReconciled ? 'text-slate-900' : 'text-red-700'}`}>
                  {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 pt-6 border-t border-slate-300 text-center text-[10px] text-slate-400 font-mono">
          END OF REPORT • CONFIDENTIAL FINANCIAL DATA
        </div>

      </div>
    </div>
  );
}