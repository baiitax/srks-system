import { createClient } from "@/lib/supabase/server";
import { createShellPO, activatePO } from "@/lib/actions/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button"; // <-- Added back!
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/shared/submit-button";
import { Building2, PackageSearch, Scale, ShieldCheck, Lock, FileSignature, Search, Filter, CalendarDays, Factory } from "lucide-react";
import { revalidatePath } from "next/cache";

function relationCompanyName(
  relation: { company_name?: string } | { company_name?: string }[] | null | undefined
) {
  if (Array.isArray(relation)) {
    return relation[0]?.company_name || "N/A";
  }
  return relation?.company_name || "N/A";
}

export default async function POFactoryPage() {
  const supabase = await createClient();
  
  // 1. Fetch necessary relations
  const { data: customers } = await supabase.from("customers").select("*");
  const { data: products } = await supabase.from("products").select("*");
  const { data: vendors } = await supabase.from("vendors").select("*");
  
  // 2. Fetch existing POs
  const { data: purchaseOrders } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      customers (company_name),
      vendors (company_name)
    `)
    .order("created_at", { ascending: false });

  // 3. Inline action for Activating PO (to pass the selected vendor)
  async function handleActivatePO(formData: FormData) {
    "use server";
    const poId = formData.get("poId") as string;
    const vendorId = formData.get("vendorId") as string;
    
    if (poId && vendorId) {
      await activatePO(poId, vendorId, 'vendor');
      revalidatePath("/admin/po");
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Purchase Order Factory</h2>
        <p className="text-slate-500">Initialize requisitions and manage active supply chain pipelines.</p>
      </div>

      {/* STAGE 1: CREATE SHELL PO (Redesigned with logical grouping) */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg shadow-sm border border-emerald-200">
              <FileSignature className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Stage 1: Initialize Shell Requisition</CardTitle>
              <CardDescription>Draft a new unpriced volume requisition for pipeline entry.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <form action={async (formData) => {
          "use server";
          const customerId = formData.get("customer_id") as string;
          const productId = formData.get("product_id") as string;
          const quantity = Number(formData.get("quantity"));
          await createShellPO(customerId, [{ productId, quantity }]);
        }}>
          <CardContent className="pt-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GROUP A: Destination */}
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                <Building2 className="w-4 h-4 mr-2 text-emerald-600" /> Destination Details
              </h3>
              <div className="space-y-3">
                <Label htmlFor="customer_id" className="text-slate-700 font-medium">Target Facility / Client</Label>
                <Select name="customer_id" required>
                  <SelectTrigger className="bg-white border-slate-200 h-11 focus:ring-emerald-600 shadow-sm">
                    <SelectValue placeholder="Select destination client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* GROUP B: Cargo */}
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                <PackageSearch className="w-4 h-4 mr-2 text-emerald-600" /> Cargo Specifications
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-3 lg:col-span-2">
                  <Label htmlFor="product_id" className="text-slate-700 font-medium">Required Product</Label>
                  <Select name="product_id" required>
                    <SelectTrigger className="bg-white border-slate-200 h-11 focus:ring-emerald-600 shadow-sm">
                      <SelectValue placeholder="Select product..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 lg:col-span-1">
                  <Label htmlFor="quantity" className="text-slate-700 font-medium">Volume</Label>
                  <div className="relative">
                    <Scale className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="quantity" name="quantity" type="number" step="0.01" required 
                      placeholder="e.g. 500" 
                      className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-emerald-600 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-end">
            <SubmitButton className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm" icon={<Factory className="w-4 h-4" />}>
              Generate Shell PO
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>

      {/* STAGE 2 / PIPELINE: MASTER PO QUEUE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-slate-800">Master Pipeline Control</CardTitle>
              <CardDescription>Track active orders and activate pending shells.</CardDescription>
            </div>
            {/* Enterprise Table Toolbar */}
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search PO Reference..." className="pl-9 h-10 bg-slate-50 border-slate-200" />
              </div>
              <Button variant="outline" className="h-10 border-slate-300 text-slate-700">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">Reference No.</TableHead>
                <TableHead className="font-semibold text-slate-700">Creation Date</TableHead>
                <TableHead className="font-semibold text-slate-700">Destination</TableHead>
                <TableHead className="font-semibold text-slate-700">Governance Status</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Stage 2 Activation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders?.map((po) => {
                const vendorName = relationCompanyName(po.vendors);
                const isShell = po.status === 'shell';
                
                return (
                  <TableRow key={po.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* ID */}
                    <TableCell className="pl-6">
                      <div className="inline-flex items-center px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                        {po.po_number}
                      </div>
                    </TableCell>
                    
                    {/* Date */}
                    <TableCell>
                      <div className="flex items-center text-sm text-slate-600">
                        <CalendarDays className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {new Date(po.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </TableCell>
                    
                    {/* Customer */}
                    <TableCell>
                      <div className="font-medium text-slate-800">{relationCompanyName(po.customers)}</div>
                      {vendorName !== "N/A" ? (
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                           Supplier: <span className="font-semibold text-slate-700 ml-1">{vendorName}</span>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-600 mt-0.5 flex items-center">
                          <Lock className="w-3 h-3 mr-1" /> Awaiting Supplier Assignment
                        </div>
                      )}
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      <Badge variant="outline" className={
                        po.status === 'shell' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm' :
                        po.status === 'issued' ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' :
                        po.status === 'in_transit' ? 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm' :
                        po.status === 'variance_hold' ? 'bg-red-50 text-red-700 border-red-200 shadow-sm font-bold' :
                        'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                      }>
                        <span className="flex items-center uppercase tracking-wider text-[10px] font-bold">
                          {po.status === 'shell' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse" />}
                          {po.status.replace('_', ' ')}
                        </span>
                      </Badge>
                    </TableCell>
                    
                    {/* Action */}
                    <TableCell className="text-right pr-6">
                      {isShell ? (
                        <form action={handleActivatePO} className="flex items-center justify-end space-x-2">
                          <input type="hidden" name="poId" value={po.id} />
                          {/* In a real app, this Select would be its own component to hold state, but we mock it via hidden input or standard select for Server Actions */}
                          <select name="vendorId" required className="h-9 w-36 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-emerald-500">
                            <option value="" disabled selected>Assign Vendor...</option>
                            {vendors?.map(v => <option key={v.id} value={v.id}>{v.company_name}</option>)}
                          </select>
                          <SubmitButton size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                            Activate
                          </SubmitButton>
                        </form>
                      ) : (
                        <Button size="sm" variant="ghost" className="text-slate-400 cursor-not-allowed" disabled>
                          <Lock className="w-4 h-4 mr-2" /> Locked
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

              {purchaseOrders?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <PackageSearch className="w-8 h-8 text-slate-400" />
                      </div>
                      <span>No pipeline records found. Initialize a Shell PO above to begin.</span>
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