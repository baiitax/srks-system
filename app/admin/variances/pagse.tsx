import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { AlertOctagon, Scale, ShieldAlert, FileText, ExternalLink, FileWarning, Calculator, CheckCircle2 } from "lucide-react";

export default async function VarianceResolutionPage() {
  const supabase = await createClient();

  // 1. Fetch POs stuck in variance_hold
  const { data: variances } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      po_number,
      created_at,
      vendors (company_name),
      po_items (total_amount),
      documents (type, storage_url)
    `)
    .eq("status", "variance_hold")
    .order("created_at", { ascending: false });

  // 2. Server Action for Executing the Resolution
  async function executeResolution(formData: FormData) {
    "use server";
    const poId = formData.get("poId") as string;
    const strategy = formData.get("strategy") as string;
    const justification = formData.get("justification") as string;
    const adjustedAmount = Number(formData.get("adjustedAmount"));
    
    const supabaseServer = await createClient();

    let finalLedgerValue = 0;

    if (strategy === "override") {
      // Fetch original PO cost to force through
      const { data: items } = await supabaseServer.from("po_items").select("total_amount").eq("po_id", poId);
      finalLedgerValue = items?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0;
    } else if (strategy === "adjustment") {
      // Use the manually entered, corrected amount
      finalLedgerValue = adjustedAmount;
    }

    // 1. Fire the RPC to write to the ledger with the finalized value
    const { error: rpcError } = await supabaseServer.rpc("initialize_po_ledgers", {
      target_po_id: poId, 
      po_cost: finalLedgerValue, 
      freight_cost: 0 
    });

    if (!rpcError) {
      // 2. Clear the hold and mark as reconciled
      await supabaseServer.from("purchase_orders")
        .update({ status: "reconciled" })
        .eq("id", poId);

      // 3. (Optional but recommended) Manually push a highly descriptive log to the system_audit_log
      // noting the justification and the admin who executed it.
    }

    revalidatePath("/admin/variances");
  }

  // Calculate total value currently frozen
  const totalFrozenValue = variances?.reduce((total, po) => {
    const poValue = po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
    return total + poValue;
  }, 0) || 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <div className="flex items-center space-x-2 mb-1">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <span className="text-sm font-bold text-red-700 tracking-wider uppercase">Compliance Alert</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Variance Resolution Center</h2>
        <p className="text-slate-500">Investigate flagged discrepancies, adjust financial values, and issue credit notes.</p>
      </div>

      {/* KPI METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-red-200 shadow-sm bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Frozen Capital Pipeline</CardTitle>
            <AlertOctagon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(totalFrozenValue)}
            </div>
            <p className="text-xs text-red-700 mt-1 font-medium">Awaiting manual resolution</p>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Active Discrepancies</CardTitle>
            <FileWarning className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{variances?.length || 0} Records</div>
            <p className="text-xs text-slate-500 mt-1">Transactions requiring audit review</p>
          </CardContent>
        </Card>
      </div>

      {/* RESOLUTION QUEUE */}
      <div className="space-y-6">
        {variances?.map((po) => {
          const originalExpectedValue = po.po_items.reduce((sum: number, item: any) => sum + Number(item.total_amount), 0);
          
          // 🚨 ADDED: Type cast to 'any' to bypass strict relational inference
          const vendorData: any = po.vendors;
          const vendorName = Array.isArray(vendorData) ? vendorData[0]?.company_name : vendorData?.company_name;
          return (
            <Card key={po.id} className="border-slate-200 shadow-sm overflow-hidden">
              <div className="flex flex-col lg:flex-row">
                
                {/* Left Side: Context & Documents */}
                <div className="lg:w-5/12 bg-slate-50 p-6 border-b lg:border-b-0 lg:border-r border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-red-100 text-red-800 border-red-200 font-bold hover:bg-red-100 uppercase tracking-widest text-[10px]">
                      Hold Active
                    </Badge>
                    <span className="font-mono text-xs text-slate-500">
                      {new Date(po.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  
                  <h3 className="font-mono text-xl font-bold text-slate-900 mb-1">{po.po_number}</h3>
                  <p className="text-sm font-medium text-slate-600 mb-6">{vendorName}</p>

                  <div className="space-y-1 mb-6">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Original System Value</p>
                    <p className="text-lg font-bold text-slate-800">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(originalExpectedValue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">Agent Evidence</p>
                    <div className="flex flex-wrap gap-2">
                      {po.documents?.map((doc: any) => (
                        <a 
                          key={doc.type} 
                          href={doc.storage_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-[11px] uppercase tracking-wider font-bold hover:bg-slate-100 hover:text-emerald-700 transition-colors shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {doc.type.replace('_', ' ')}
                          <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Execution Form */}
                <div className="lg:w-7/12 p-6 bg-white">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider mb-5">
                    <Scale className="w-4 h-4 mr-2 text-slate-400" /> 
                    Resolution Execution
                  </h3>

                  <form action={executeResolution} className="space-y-5">
                    <input type="hidden" name="poId" value={po.id} />

                    <div className="space-y-3">
                      <Label htmlFor={`strategy-${po.id}`} className="text-slate-700 font-medium">Resolution Strategy</Label>
                      <Select name="strategy" required defaultValue="adjustment">
                        <SelectTrigger id={`strategy-${po.id}`} className="h-11 bg-slate-50 border-slate-200 focus:ring-emerald-600">
                          <SelectValue placeholder="Select strategy..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adjustment">Issue Credit/Debit Note (Adjust Ledger Value)</SelectItem>
                          <SelectItem value="override">Force Override (Accept Original Value)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`amount-${po.id}`} className="text-slate-700 font-medium flex items-center justify-between">
                        <span>Final Verified Value (₦)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Required if adjusting value</span>
                      </Label>
                      <div className="relative">
                        <Calculator className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                        <Input 
                          id={`amount-${po.id}`} 
                          name="adjustedAmount" 
                          type="number" 
                          step="0.01"
                          defaultValue={originalExpectedValue}
                          className="pl-9 h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600 font-mono text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor={`reason-${po.id}`} className="text-slate-700 font-medium">Audit Justification</Label>
                      <Input 
                        id={`reason-${po.id}`} 
                        name="justification" 
                        required 
                        placeholder="e.g. Short delivery due to transit spill. Credit note applied." 
                        className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      <SubmitButton className="w-full md:w-auto h-11 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm" icon={<CheckCircle2 className="w-4 h-4" />}>
                        Execute & Write to Ledger
                      </SubmitButton>
                    </div>
                  </form>

                </div>
              </div>
            </Card>
          );
        })}

        {(!variances || variances.length === 0) && (
          <Card className="border-slate-200 border-dashed bg-slate-50 shadow-none">
            <CardContent className="p-12 text-center text-slate-500">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-4 bg-emerald-100 rounded-full">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">Zero Active Variances</h3>
                <p className="text-sm">No transactions require financial resolution at this time.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}