import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Truck, MapPin, ChevronRight, FileCheck, PackageSearch, Clock, ShieldCheck, FileArchive, AlertCircle } from "lucide-react";

// Helper to safely extract company name from Supabase relational joins
const getCompanyName = (relation: any) => {
  if (Array.isArray(relation)) return relation[0]?.company_name || 'Unassigned';
  return relation?.company_name || 'Unassigned';
};

export default async function AgentAppDashboard() {
  const supabase = await createClient();

  // 1. Fetch current user context
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users_profiles").select("full_name").eq("id", user?.id ?? "").single();
  const firstName = profile?.full_name?.split(' ')[0] || "Agent";

  // 2. Fetch Active Missions (POs)
  const { data: activePOs } = await supabase
    .from("purchase_orders")
    .select(`
      id,
      po_number,
      status,
      created_at,
      customers (company_name, delivery_address_default),
      vendors (company_name),
      documents (type)
    `)
    .neq("status", "shell")
    .order("created_at", { ascending: false });

  // 3. Helper to calculate document progress (Invoice, Waybill, GRN)
  const calculateProgress = (docs: { type: string }[] | undefined | null) => {
    if (!docs) return 0;
    let count = 0;
    if (docs.some(d => d.type === 'invoice')) count++;
    if (docs.some(d => d.type === 'vendor_waybill')) count++;
    if (docs.some(d => d.type === 'grn')) count++;
    return Math.round((count / 3) * 100);
  };

  // 4. Split data for the tabs
  const pendingMissions = activePOs?.filter(po => po.status !== 'reconciled') || [];
  const completedMissions = activePOs?.filter(po => po.status === 'reconciled') || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* APP HEADER */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-950 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-600 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-teal-950/80 to-transparent"></div>
        <div className="relative z-10">
          <p className="text-teal-300 text-xs font-bold uppercase tracking-widest mb-1">SRKS Operations</p>
          <h1 className="text-3xl font-bold tracking-tight">Good shift, {firstName}.</h1>
          <p className="text-teal-100/80 text-sm mt-1">You have {pendingMissions.length} active missions in your queue.</p>
        </div>
      </div>

      {/* MISSION CONTROL TABS */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-200/70 p-1.5 rounded-2xl h-14 shadow-inner">
          <TabsTrigger 
            value="active" 
            className="rounded-xl text-[13px] font-bold tracking-wide data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm transition-all"
          >
            Active Queue ({pendingMissions.length})
          </TabsTrigger>
          <TabsTrigger 
            value="completed" 
            className="rounded-xl text-[13px] font-bold tracking-wide data-[state=active]:bg-white data-[state=active]:text-teal-900 data-[state=active]:shadow-sm transition-all"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        {/* --- ACTIVE MISSIONS TAB --- */}
        <TabsContent value="active" className="mt-6 space-y-5">
          {pendingMissions.map((po) => {
            const progress = calculateProgress(po.documents);
            
            // Dynamic Status Logic
            const isHold = po.status === 'variance_hold';
            const isReview = po.status === 'pending_finance_review';
            const isActionable = !isHold && !isReview && progress < 100;

            return (
              <Link href={`/agent/upload/${po.id}`} key={po.id} className="block group">
                <Card className={`rounded-3xl border-0 shadow-sm transition-all duration-200 active:scale-[0.98] ${
                  isHold ? 'bg-red-50/80 shadow-red-900/5 border border-red-100' : 
                  isReview ? 'bg-blue-50/80 shadow-blue-900/5 border border-blue-100' : 
                  'bg-white hover:shadow-md border border-slate-100'
                }`}>
                  <CardContent className="p-6">
                    
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <Badge variant="outline" className={`mb-2 font-bold tracking-widest text-[9px] uppercase px-2 py-0.5 ${
                          isHold ? 'bg-red-100 text-red-800 border-red-200' :
                          isReview ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-teal-50 text-teal-700 border-teal-200'
                        }`}>
                          {isHold ? 'HQ: FINANCE HOLD' : 
                           isReview ? 'HQ: IN REVIEW' : 
                           'ACTION REQUIRED'}
                        </Badge>
                        <h2 className="font-extrabold text-xl text-slate-900 leading-none tracking-tight">{po.po_number}</h2>
                      </div>
                      <div className={`p-2.5 rounded-full transition-colors ${isActionable ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-100' : 'bg-slate-50 text-slate-400'}`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Logistics Journey Diagram */}
                    <div className="relative pl-3 mb-6">
                      {/* Vertical Dashed Route Line */}
                      <div className="absolute left-[19px] top-5 bottom-4 w-px border-l-2 border-dashed border-slate-200"></div>
                      
                      <div className="space-y-5">
                        {/* Pickup */}
                        <div className="relative flex items-start">
                          <div className="bg-white p-1 absolute -left-[7px] z-10">
                            <Truck className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="ml-7">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pickup Origin</p>
                            <p className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{getCompanyName(po.vendors)}</p>
                          </div>
                        </div>
                        
                        {/* Dropoff */}
                        <div className="relative flex items-start">
                          <div className="bg-white p-1 absolute -left-[7px] z-10">
                            <MapPin className="w-4 h-4 text-teal-600" />
                          </div>
                          <div className="ml-7">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dropoff Destination</p>
                            <p className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{getCompanyName(po.customers)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Area */}
                    <div className="pt-5 border-t border-slate-100/60">
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center">
                          {isHold ? <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-red-500" /> : 
                           isReview ? <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-500" /> : 
                           <FileCheck className="w-3.5 h-3.5 mr-1.5 text-teal-600" />}
                          {isHold ? 'Resolution Required' : isReview ? 'Awaiting HQ Approval' : 'Document Progress'}
                        </span>
                        <span className={`text-xs font-black ${isHold ? 'text-red-700' : isReview ? 'text-blue-700' : 'text-teal-700'}`}>
                          {progress}%
                        </span>
                      </div>
                      <Progress 
                        value={progress} 
                        className={`h-2.5 rounded-full ${isHold ? 'bg-red-200' : isReview ? 'bg-blue-100' : 'bg-slate-100'}`} 
                        indicatorColor={isHold ? 'bg-red-500' : isReview ? 'bg-blue-500' : 'bg-teal-500'} 
                      />
                    </div>

                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {pendingMissions.length === 0 && (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <PackageSearch className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Queue is Clear</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">You have no active logistics missions assigned to you.</p>
            </div>
          )}
        </TabsContent>

        {/* --- COMPLETED TAB --- */}
        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedMissions.map((po) => (
             <Card key={po.id} className="rounded-2xl border border-slate-100 shadow-none bg-slate-50/50">
               <CardContent className="p-5 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                   <div className="p-3 bg-emerald-100 rounded-xl">
                     <ShieldCheck className="w-5 h-5 text-emerald-600" />
                   </div>
                   <div>
                     <h2 className="font-bold text-slate-800 text-base">{po.po_number}</h2>
                     <p className="text-xs text-slate-500 mt-0.5 font-medium truncate max-w-[150px] sm:max-w-xs">
                       {getCompanyName(po.customers)}
                     </p>
                   </div>
                 </div>
                 <div className="text-right">
                   <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold hover:bg-emerald-100 text-[10px] uppercase tracking-widest px-2 py-1">
                     Cleared
                   </Badge>
                   <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                     {new Date(po.created_at).toLocaleDateString('en-GB')}
                   </p>
                 </div>
               </CardContent>
             </Card>
          ))}
          {completedMissions.length === 0 && (
            <div className="text-center py-16 text-slate-400 flex flex-col items-center">
              <FileArchive className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No archived missions in this cycle.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}