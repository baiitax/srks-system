import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubmitButton } from "@/components/shared/submit-button";
import { Building2, MapPin, Mail, Phone, Users, PlusCircle, Network, Search } from "lucide-react";

export default async function CustomersPage() {
  const supabase = await createClient();

  // 1. Fetch the live customer directory
  const { data: customers } = await supabase
    .from("customers")
    .select("*")
    .order("created_at", { ascending: false });

  // 2. Inline Server Action for Registering Customers
  async function registerCustomer(formData: FormData) {
    "use server";
    const supabaseServer = await createClient();
    
    const company_name = formData.get("company_name") as string;
    const delivery_address_default = formData.get("delivery_address_default") as string;
    const contact_email = formData.get("contact_email") as string;
    const contact_phone = formData.get("contact_phone") as string;

    const { error } = await supabaseServer.from("customers").insert([{
      company_name,
      delivery_address_default,
      contact_email,
      contact_phone
    }]);

    if (error) {
      console.error("Failed to register customer:", error.message);
    }

    revalidatePath("/admin/customers");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Client & Facility Directory</h2>
        <p className="text-slate-500">Manage registered corporate clients and their primary logistics destinations.</p>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Registered Clients</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{customers?.length || 0}</div>
            <p className="text-xs text-slate-500 mt-1">Active delivery destinations</p>
          </CardContent>
        </Card>
      </div>

      {/* ADD NEW CUSTOMER FORM */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 rounded-lg shadow-sm border border-emerald-200">
              <Building2 className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Register New Facility</CardTitle>
              <CardDescription>Add a new corporate client and their default routing address to the system.</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <form action={registerCustomer}>
          <CardContent className="pt-6 bg-white grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* GROUP A: Corporate Identity */}
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                <Users className="w-4 h-4 mr-2 text-emerald-600" /> Client Identity
              </h3>
              
              <div className="space-y-3">
                <Label htmlFor="company_name" className="text-slate-700 font-medium">Registered Company Name</Label>
                <Input 
                  id="company_name" 
                  name="company_name" 
                  required 
                  placeholder="e.g. Dangote Cement Plc" 
                  className="h-11 bg-white border-slate-200 focus-visible:ring-emerald-600 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label htmlFor="contact_email" className="text-slate-700 font-medium">Contact Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="contact_email" 
                      name="contact_email" 
                      type="email" 
                      placeholder="procurement@client.com" 
                      className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-emerald-600 shadow-sm"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="contact_phone" className="text-slate-700 font-medium">Contact Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input 
                      id="contact_phone" 
                      name="contact_phone" 
                      placeholder="+234 800 000 0000" 
                      className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-emerald-600 shadow-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* GROUP B: Logistics Routing */}
            <div className="space-y-5 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center uppercase tracking-wider">
                <MapPin className="w-4 h-4 mr-2 text-emerald-600" /> Default Logistics Routing
              </h3>
              
              <div className="space-y-3">
                <Label htmlFor="delivery_address_default" className="text-slate-700 font-medium">Primary Delivery Facility / Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input 
                    id="delivery_address_default" 
                    name="delivery_address_default" 
                    required 
                    placeholder="e.g. Obajana Plant, Kogi State" 
                    className="pl-9 h-11 bg-white border-slate-200 focus-visible:ring-emerald-600 shadow-sm"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">This address will be automatically populated on Outbound Waybills generated for this client.</p>
              </div>
            </div>

          </CardContent>
          <CardFooter className="bg-slate-50 border-t border-slate-100 py-4 flex justify-end">
            <SubmitButton className="h-11 px-8 bg-slate-900 hover:bg-slate-800 text-white shadow-sm" icon={<PlusCircle className="w-4 h-4" />}>
              Register Facility
            </SubmitButton>
          </CardFooter>
        </form>
      </Card>

      {/* CUSTOMER DIRECTORY TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-slate-800">Master Client Directory</CardTitle>
              <CardDescription>All authorized destinations for procurement pipelines.</CardDescription>
            </div>
            {/* Table Toolbar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input placeholder="Search client or location..." className="pl-9 h-10 bg-slate-50 border-slate-200" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">Client Entity</TableHead>
                <TableHead className="font-semibold text-slate-700">Contact Point</TableHead>
                <TableHead className="font-semibold text-slate-700">Default Logistics Destination</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Registered On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers?.map((customer) => (
                <TableRow key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Entity */}
                  <TableCell className="pl-6">
                    <div className="flex items-center font-medium text-slate-900">
                      <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                      {customer.company_name}
                    </div>
                  </TableCell>
                  
                  {/* Contact */}
                  <TableCell>
                    {customer.contact_email ? (
                      <div className="text-sm text-slate-600 flex items-center">
                        <Mail className="w-3 h-3 mr-1.5 text-slate-400" /> {customer.contact_email}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">No email provided</span>
                    )}
                    {customer.contact_phone && (
                      <div className="text-xs text-slate-500 mt-1 flex items-center">
                        <Phone className="w-3 h-3 mr-1.5 text-slate-400" /> {customer.contact_phone}
                      </div>
                    )}
                  </TableCell>
                  
                  {/* Location */}
                  <TableCell>
                    <div className="text-sm text-slate-700 flex items-start max-w-sm">
                      <MapPin className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-emerald-600 shrink-0" /> 
                      {customer.delivery_address_default}
                    </div>
                  </TableCell>
                  
                  {/* Date */}
                  <TableCell className="text-right pr-6">
                    <div className="text-sm font-medium text-slate-600">
                      {new Date(customer.created_at).toLocaleDateString('en-GB')}
                    </div>
                  </TableCell>

                </TableRow>
              ))}

              {(!customers || customers.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-40 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="p-3 bg-slate-100 rounded-full">
                        <Network className="w-8 h-8 text-slate-400" />
                      </div>
                      <span>No facilities registered. Add your first client destination above.</span>
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