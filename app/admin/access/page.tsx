import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, UserPlus, Key, Mail, Building, Trash2, CheckCircle2 } from "lucide-react";

export default async function AccessControlPage() {
  const supabase = await createClient();

  // 1. Fetch the active corporate directory
  const { data: profiles } = await supabase
    .from("users_profiles")
    .select("*")
    .order("role", { ascending: true });

  // 2. Calculate IAM KPIs
  const totalUsers = profiles?.length || 0;
  const adminCount = profiles?.filter(p => p.role === 'admin').length || 0;
  const agentCount = profiles?.filter(p => p.role === 'agent').length || 0;

  // 3. Inline Server Action for Provisioning (UI Mocked for Demo)
  // In a real app, this would use the Supabase Admin Auth client to send an email invite.
  async function provisionIdentity(formData: FormData) {
    "use server";
    // const email = formData.get("email") as string;
    // const fullName = formData.get("full_name") as string;
    // const role = formData.get("role") as string;
    
    // Auth provisioning logic goes here...
    
    revalidatePath("/admin/access");
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Identity & Access Management</h2>
        <p className="text-slate-500">Provision corporate accounts, enforce RBAC policies, and manage active sessions.</p>
      </div>

      {/* KPI METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Provisioned Accounts</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
            <p className="text-xs text-slate-500 mt-1">Active across all departments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Management (Global Admins)</CardTitle>
            <Shield className="h-4 w-4 text-slate-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{adminCount}</div>
            <p className="text-xs text-slate-500 mt-1">Full system read/write authority</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Operational Field Agents</CardTitle>
            <Building className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{agentCount}</div>
            <p className="text-xs text-slate-500 mt-1">Restricted to pipeline tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* PROVISION NEW IDENTITY FORM */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-100 rounded-md">
              <Key className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-800">Provision Corporate Identity</CardTitle>
              <CardDescription>Generate a secure access token and assign a system role to a new employee.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-white">
          <form action={provisionIdentity} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            
            {/* Full Name */}
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="full_name" className="text-slate-700 font-semibold">
                Employee Full Name
              </Label>
              <Input 
                id="full_name" 
                name="full_name" 
                required 
                placeholder="e.g. Amina Mohammed" 
                className="h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600"
              />
            </div>

            {/* Email Address */}
            <div className="space-y-2 md:col-span-4">
              <Label htmlFor="email" className="text-slate-700 font-semibold flex items-center">
                Corporate Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  required 
                  placeholder="name@company.com" 
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus-visible:ring-emerald-600"
                />
              </div>
            </div>

            {/* RBAC Role */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role" className="text-slate-700 font-semibold">
                System Role (RBAC)
              </Label>
              <Select name="role" defaultValue="agent">
                <SelectTrigger className="bg-slate-50 border-slate-200 h-11 focus:ring-emerald-600">
                  <SelectValue placeholder="Assign Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Global Admin</SelectItem>
                  <SelectItem value="agent">Field Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="md:col-span-2">
              <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all">
                <UserPlus className="w-4 h-4 mr-2" />
                Dispatch Invite
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ACTIVE DIRECTORY TABLE */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800">Live Active Directory</CardTitle>
          <CardDescription>Manage current sessions and revoke access if necessary.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700">System Identity</TableHead>
                <TableHead className="font-semibold text-slate-700">Assigned Role</TableHead>
                <TableHead className="font-semibold text-slate-700">Account Status</TableHead>
                <TableHead className="text-right pr-6 font-semibold text-slate-700">Security Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles?.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-slate-50/50 transition-colors">
                  
                  {/* Identity */}
                  <TableCell className="pl-6">
                    <div className="font-medium text-slate-900">{profile.full_name}</div>
                    <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate w-48">
                      ID: {profile.id}
                    </div>
                  </TableCell>
                  
                  {/* Role Badge */}
                  <TableCell>
                    <Badge variant="outline" className={
                      profile.role === 'admin' 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm' 
                        : 'bg-teal-50 text-teal-700 border-teal-200 shadow-sm'
                    }>
                      <span className="flex items-center uppercase tracking-wider text-[10px] font-bold">
                        {profile.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <Building className="w-3 h-3 mr-1" />}
                        {profile.role === 'admin' ? 'GLOBAL ADMIN' : 'FIELD AGENT'}
                      </span>
                    </Badge>
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell>
                    <span className="flex items-center text-sm font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-max border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Active
                    </span>
                  </TableCell>
                  
                  {/* Revoke Action */}
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4 mr-2" /> Revoke Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {(!profiles || profiles.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Users className="w-8 h-8 text-slate-300" />
                      <span>No active users found in the directory.</span>
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