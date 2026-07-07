import { createClient } from "@/lib/supabase/server";
import { FileText, DollarSign, Truck, FileCheck, Building2, Printer } from "lucide-react";
import Link from "next/link";

export default async function FinancialMasterReportPage() {
  const supabase = await createClient();

  // Fetch the entire master ledger with all nested relations
  const { data: allPOs } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      po_number,
      status,
      created_at,
      logistics_type,
      vendors (company_name),
      customers (company_name),
      po_items (
        quantity, 
        unit_price, 
        total_amount,
        products (name, sku)
      ),
      documents (type, storage_url)
    `)
    .order('created_at', { ascending: false });

  if (!allPOs) return <div className="p-10 text-red-600 font-bold">Failed to load financial data.</div>;

  // ── DATA AGGREGATION & METRICS ──
  let totalFinancialValue = 0;
  let totalGRNs = 0;
  let totalWaybills = 0;

  // Map to store total supply value per vendor
  const vendorBreakdown: Record<string, number> = {};

  const reportRows = allPOs.map((po: any) => {
    // 1. Calculate PO Value
    const poValue = po.po_items?.reduce((sum: number, item: any) => sum + Number(item.total_amount || 0), 0) || 0;
    totalFinancialValue += poValue;

    // 2. Extract Relational Data Safely
    const vendorData: any = po.vendors;
    const customerData: any = po.customers;
    const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name || "Unassigned";
    const customerName = Array.isArray(customerData) ? customerData[0]?.company_name : customerData?.company_name || "Unassigned";

    // 3. Aggregate Vendor Totals
    if (!vendorBreakdown[vendorName]) vendorBreakdown[vendorName] = 0;
    vendorBreakdown[vendorName] += poValue;

    // 4. Check Document Statuses
    const docs: any[] = po.documents || [];
    const hasGRN = docs.some(d => d.type === 'grn');
    const hasWaybill = docs.some(d => d.type === 'company_waybill' || d.type === 'vendor_waybill');
    
    if (hasGRN) totalGRNs++;
    if (hasWaybill) totalWaybills++;

    return {
      id: po.id,
      po_number: po.po_number,
      date: new Date(po.created_at).toLocaleDateString('en-GB'),
      status: po.status,
      vendor: vendorName,
      customer: customerName,
      value: poValue,
      hasGRN,
      hasWaybill
    };
  });

  // Convert Vendor Breakdown object into an array for rendering, sorted by highest value
  const topVendors = Object.entries(vendorBreakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      
      {/* ── HEADER ── */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-900">Financial & Logistics Report</h1>
          <p className="text-sm font-semibold text-slate-500 mt-1">Master Ledger & Supply Chain Reconciliation</p>
        </div>
        <button className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-md font-bold shadow-sm transition-colors">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      {/* ── EXECUTIVE SUMMARY CARDS ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><DollarSign className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total Transaction Value</p>
          </div>
          <p className="text-2xl font-black text-slate-900">₦ {totalFinancialValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><FileText className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Orders</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{allPOs.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg"><FileCheck className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Verified GRNs</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalGRNs} <span className="text-sm font-medium text-slate-500">/ {allPOs.length}</span></p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-lg"><Truck className="w-5 h-5" /></div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Waybills Secured</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalWaybills} <span className="text-sm font-medium text-slate-500">/ {allPOs.length}</span></p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── MAIN PO TABLE (Takes up 2/3 width) ── */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-black text-slate-900">Purchase Order Master List</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">PO Reference</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px]">Vendor & Client</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px] text-right">Value (₦)</th>
                  <th className="px-6 py-4 font-bold text-slate-600 uppercase tracking-wider text-[10px] text-center">Docs (GRN / WB)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <Link href={`/admin/po/${row.id}`} className="font-mono font-bold text-blue-700 hover:underline">
                        {row.po_number}
                      </Link>
                      <div className="text-[11px] font-semibold text-slate-400 uppercase mt-1">{row.status.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{row.vendor}</div>
                      <div className="text-[11px] font-semibold text-slate-500 uppercase mt-1">&rarr; {row.customer}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.hasGRN ? 'bg-emerald-100 text-emerald-800' : 'bg-red-50 text-red-600'}`}>
                          {row.hasGRN ? 'GRN' : 'NO GRN'}
                        </span>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${row.hasWaybill ? 'bg-blue-100 text-blue-800' : 'bg-red-50 text-red-600'}`}>
                          {row.hasWaybill ? 'WB' : 'NO WB'}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── VENDOR BREAKDOWN (Takes up 1/3 width) ── */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="p-6 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-black text-slate-900">Supply Breakdown</h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="space-y-6">
              {topVendors.map((vendor, idx) => {
                // Calculate percentage of total supply for progress bar
                const percentage = totalFinancialValue > 0 ? (vendor.value / totalFinancialValue) * 100 : 0;
                
                return (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-900 truncate pr-4">{vendor.name}</span>
                      <span className="text-sm font-bold text-slate-600">
                        ₦ {vendor.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-slate-900 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-[10px] font-bold text-slate-400">{percentage.toFixed(1)}% of Total</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
