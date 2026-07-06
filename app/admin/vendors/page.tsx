import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Briefcase, FileText, CreditCard, PlusCircle, Network } from "lucide-react";

export default async function VendorsPage() {
  const supabase = await createClient();

  // 1. Fetch the live vendor directory
  const { data: vendors } = await supabase
    .from("vendors")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Inline Server Action for Registering Vendors
  async function registerVendor(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    
    const company_name = formData.get("company_name") as string;
    const rc_number = formData.get("rc_number") as string;
    const nigerian_tin = formData.get("nigerian_tin") as string;
    const payment_terms_default = formData.get("payment_terms_default") as string;

    const { error } = await supabaseServer.from("vendors").insert([{
      company_name,
      rc_number,
      nigerian_tin,
      payment_terms_default
    }]);

    if (error) {
      console.error("Failed to register vendor:", error.message);
      // In a production environment, you would return this error to a useActionState hook to show a toast.
    }

    revalidatePath("/admin/vendors");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Vendor Management</h2>
        <p className="text-slate-500">Register corporate suppliers and manage compliance identities.</p>
      </div>

      {/* ADD NEW VENDOR FORM */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 rounded-md">
              <Briefcase className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Register Corporate Vendor</CardTitle>
              <CardDescription>Enter verified CAC and FIRS details for procurement compliance.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <form action={registerVendor} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            {/* Company Name */}
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="company_name" className="text-slate-700 font-semibold flex items-center">
                <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                Registered Company Name
              </Label>
              <Input 
                id="company_name" 
                name="company_name" 
                required 
                placeholder="e.g. Indorama Petrochemicals Ltd" 
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600"
              />
            </div>

            {/* RC Number */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="rc_number" className="text-slate-700 font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                CAC RC Number
              </Label>
              <Input 
                id="rc_number" 
                name="rc_number" 
                placeholder="e.g. RC-123456" 
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600 uppercase"
              />
            </div>

            {/* FIRS TIN */}
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="nigerian_tin" className="text-slate-700 font-semibold flex items-center">
                <FileText className="w-4 h-4 mr-2 text-slate-400" />
                FIRS Tax ID (TIN)
              </Label>
              <Input 
                id="nigerian_tin" 
                name="nigerian_tin" 
                placeholder="e.g. TIN-00000000-0001" 
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600 uppercase"
              />
            </div>

            {/* Payment Terms */}
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="payment_terms_default" className="text-slate-700 font-semibold flex items-center">
                <CreditCard className="w-4 h-4 mr-2 text-slate-400" />
                Default Payment Terms
              </Label>
              <Select name="payment_terms_default" defaultValue="Net 30">
                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-emerald-600">
                  <SelectValue placeholder="Select terms..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Payment on Delivery">Payment on Delivery (PoD)</SelectItem>
                  <SelectItem value="Advance Payment">Advance Payment (100%)</SelectItem>
                  <SelectItem value="Net 15">Net 15 Days</SelectItem>
                  <SelectItem value="Net 30">Net 30 Days</SelectItem>
                  <SelectItem value="Net 60">Net 60 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-12 flex justify-end pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full md:w-auto h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
                <PlusCircle className="w-4 h-4 mr-2" />
                Save Vendor Profile
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* VENDOR DIRECTORY TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800">Master Vendor Directory</CardTitle>
          <CardDescription>All registered corporate entities approved for supply chain operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">Entity Name</TableHead>
                <TableHead className="font-semibold text-slate-700">CAC RC Number</TableHead>
                <TableHead className="font-semibold text-slate-700">FIRS TIN</TableHead>
                <TableHead className="font-semibold text-slate-700">Financial Terms</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Registered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors?.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-slate-900 flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    {vendor.company_name}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">
                    {vendor.rc_number || <span className="text-slate-400 italic">Pending</span>}
                  </TableCell>
                  <TableCell className="text-slate-600 font-mono text-sm">
                    {vendor.nigerian_tin || <span className="text-slate-400 italic">Pending</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 shadow-sm font-medium">
                      {vendor.payment_terms_default}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6 text-sm text-slate-500">
                    {new Date(vendor.created_at).toLocaleDateString('en-GB')}
                  </TableCell>
                </TableRow>
              ))}
              {(!vendors || vendors.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Network className="w-8 h-8 text-slate-300" />
                      <span>No vendors registered. Add your first supplier above.</span>
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