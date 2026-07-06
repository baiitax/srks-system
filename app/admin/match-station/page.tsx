import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SubmitButton } from "@/components/shared/submit-button";
import { ShieldCheck, AlertTriangle, FileText, ExternalLink, Scale, Clock, Wallet } from "lucide-react";

export default async function MatchStationPage() {
  const supabase = await createClient();

  // 1. Fetch only POs waiting for Finance Review
  const { data: pendingReviews } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      po_number,
      created_at,
      vendors (company_name),
      po_items (total_amount),
      documents (type, storage_url)
    `)
    .eq("status", "pending_finance_review")
    .order("created_at", { ascending: false });

  // 2. The Secure Maker-Checker Server Action
  async function processFinanceReview(formData: FormData) {
    "use server";
    const poId = formData.get("poId") as string;
    const decision = formData.get("decision") as string;
    const supabaseServer = await createClient();

    if (decision === "approve") {
      const { data: items } = await supabaseServer.from("po_items").select("total_amount").eq("po_id", poId);
      const totalProductCost = items?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0;

      const { error: rpcError } = await supabaseServer.rpc("initialize_po_ledgers", {
        target_po_id: poId, po_cost: totalProductCost, freight_cost: 0 
      });

      await supabaseServer.from("purchase_orders")
        .update({ status: rpcError ? "variance_hold" : "reconciled" })
        .eq("id", poId);
    } else if (decision === "reject") {
      await supabaseServer.from("purchase_orders")
        .update({ status: "variance_hold" })
        .eq("id", poId);
    }

    revalidatePath("/admin/match-station");
  }

  // 3. Aggregate Queue Metrics for the Finance Admin
  let totalPendingValue = 0;
  pendingReviews?.forEach((po) => {
    totalPendingValue += po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Finance Match Station</h2>
        <p className="text-slate-500">Visually verify field documents before authorizing ledger reconciliation.</p>
      </div>

      {/* QUEUE KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Capital Clearance</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalPendingValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Total expected value in queue</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Review Backlog</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingReviews?.length || 0} Records</div>
            <p className="text-xs text-slate-500 mt-1">Transactions awaiting manual audit</p>
          </CardContent>
        </Card>
      </div>

      {/* 3-WAY MATCH TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800 flex items-center">
            <Scale className="w-5 h-5 mr-2 text-emerald-600" />
            Active 3-Way Match Queue
          </CardTitle>
          <CardDescription>Compare system PO values against uploaded physical receipts.</CardDescription>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">Reference & Entity</TableHead>
                <TableHead className="font-semibold text-slate-700">Expected Ledger Impact</TableHead>
                <TableHead className="font-semibold text-slate-700">Agent Evidence (PDFs)</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Compliance Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingReviews?.map((po) => {
                // Safely calculate expected value
                const expectedValue = po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
                
                // 🚨 TYPE FIX: Cast to any to prevent Next.js build crash on nested array relations
                const vendorData: any = po.vendors;
                const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name;

                return (
                  <TableRow key={po.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Reference & Entity Context */}
                    <TableCell className="pl-6 align-top pt-4">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800 mb-1.5">
                        {po.po_number}
                      </div>
                      <div className="font-medium text-slate-900 text-sm">{vendorName || "Unassigned Vendor"}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Initiated: {new Date(po.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </TableCell>
                    
                    {/* Expected Value */}
                    <TableCell className="align-top pt-4">
                      <div className="font-mono font-bold text-slate-900 text-base">
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(expectedValue)}
                      </div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">
                        Unverified Amount
                      </div>
                    </TableCell>
                    
                    {/* Document Links */}
                    <TableCell className="align-top pt-4">
                      <div className="flex flex-col gap-2 max-w-[200px]">
                        {po.documents?.map((doc: any) => (
                          <a 
                            key={doc.type} 
                            href={doc.storage_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-between bg-white border border-slate-200 text-slate-700 px-3 py-2 rounded-md text-[10px] uppercase tracking-wider font-bold hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-all shadow-sm"
                          >
                            <span className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              {doc.type.replace('_', ' ')}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 opacity-40" />
                          </a>
                        ))}
                      </div>
                    </TableCell>
                    
                    {/* Action Buttons */}
                    <TableCell className="text-right pr-6 align-top pt-4">
                      <form action={processFinanceReview} className="flex flex-col items-end gap-2">
                        <input type="hidden" name="poId" value={po.id} />
                        
                        <SubmitButton 
                          name="decision" 
                          value="approve" 
                          className="w-40 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm" 
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Match & Clear
                        </SubmitButton>

                        <SubmitButton 
                          name="decision" 
                          value="reject" 
                          variant="outline" 
                          className="w-40 border-red-200 text-red-700 hover:bg-red-50" 
                          icon={<AlertTriangle className="w-4 h-4" />}
                        >
                          Flag Variance
                        </SubmitButton>
                      </form>
                    </TableCell>
                    
                  </TableRow>
                );
              })}

              {(!pendingReviews || pendingReviews.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-4 bg-emerald-50 rounded-full border border-emerald-100">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-700">Queue is Clear</h3>
                      <p className="text-sm">No pending transactions await financial reconciliation.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}