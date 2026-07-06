import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Search, Filter, History, User, FileJson, AlertTriangle } from "lucide-react";

export default async function AuditLogPage() {
  const supabase = await createClient();

  // Fetch the latest 100 immutable audit logs.
  // We attempt to join with users_profiles to get the human-readable name of the actor.
  const { data: auditLogs } = await supabase
    .from("system_audit_log")
    .select(`
      id,
      created_at,
      user_id,
      action_type,
      target_entity_id,
      change_manifest,
      users_profiles (full_name, role)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER CONTEXT */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700 tracking-wider uppercase">Governance Level 1</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Immutable System Audit Log</h2>
          <p className="text-slate-500">Cryptographically secure, append-only record of critical system executions.</p>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <Button variant="outline" className="h-10 w-full md:w-auto border-slate-300 text-slate-700 bg-white">
            <Filter className="w-4 h-4 mr-2" /> Filter Logs
          </Button>
          <Button className="h-10 w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white">
            Export CSV
          </Button>
        </div>
      </div>

      {/* MASTER AUDIT TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg text-slate-800">Event Trail (Last 100 Records)</CardTitle>
              <CardDescription>Protected by PostgreSQL FOR EACH STATEMENT triggers.</CardDescription>
            </div>
            
            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Search entity UUID or Action..." 
                className="pl-9 h-10 bg-white border-slate-300 focus-visible:ring-emerald-600"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="py-4 pl-6 font-semibold text-slate-700 w-48">Timestamp (UTC)</TableHead>
                <TableHead className="font-semibold text-slate-700 w-48">System Actor</TableHead>
                <TableHead className="font-semibold text-slate-700 w-56">Action Triggered</TableHead>
                <TableHead className="font-semibold text-slate-700 w-48">Target Entity ID</TableHead>
                <TableHead className="font-semibold text-slate-700 pr-6">Change Manifest (JSON)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs?.map((log) => {
                // Determine styling based on the severity/type of the action
                const isAlertAction = log.action_type.includes("OVERRIDE") || log.action_type.includes("FORCE");
                const isStandardAction = log.action_type.includes("ACTIVATION") || log.action_type.includes("CREATE");
                
                // Safely extract user profile relations
                const actorData = Array.isArray(log.users_profiles) ? log.users_profiles[0] : log.users_profiles;

                return (
                  <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Timestamp */}
                    <TableCell className="pl-6 align-top pt-4">
                      <div className="font-mono text-xs text-slate-700 font-medium">
                        {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                      </div>
                    </TableCell>
                    
                    {/* Actor (User) */}
                    <TableCell className="align-top pt-4">
                      <div className="flex items-start">
                        <User className="w-3.5 h-3.5 mr-1.5 mt-0.5 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 text-sm">
                            {actorData?.full_name || "System Automated"}
                          </div>
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate w-32">
                            {log.user_id}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    
                    {/* Action Type */}
                    <TableCell className="align-top pt-4">
                      <Badge variant="outline" className={
                        isAlertAction ? 'bg-red-50 text-red-700 border-red-200 shadow-sm font-bold' :
                        isStandardAction ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm' :
                        'bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
                      }>
                        <span className="flex items-center uppercase tracking-wider text-[10px] font-bold">
                          {isAlertAction && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {log.action_type.replace(/_/g, ' ')}
                        </span>
                      </Badge>
                    </TableCell>

                    {/* Target Entity UUID */}
                    <TableCell className="align-top pt-4">
                      <div className="font-mono text-[11px] text-slate-600 bg-slate-100/50 px-2 py-1 rounded border border-slate-100">
                        {log.target_entity_id}
                      </div>
                    </TableCell>

                    {/* Change Manifest JSON */}
                    <TableCell className="pr-6 align-top pt-4 pb-4">
                      <div className="bg-slate-950 rounded-md p-3 border border-slate-800 shadow-inner overflow-x-auto max-w-sm xl:max-w-md">
                        <div className="flex items-center space-x-1.5 mb-2 text-slate-400 border-b border-slate-800 pb-1">
                          <FileJson className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">JSON Payload</span>
                        </div>
                        <pre className="text-[10px] font-mono text-emerald-400 whitespace-pre-wrap leading-relaxed">
                          {JSON.stringify(log.change_manifest, null, 2)}
                        </pre>
                      </div>
                    </TableCell>
                    
                  </TableRow>
                );
              })}
              
              {(!auditLogs || auditLogs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <History className="w-10 h-10 text-slate-300" />
                      <span>No audit logs recorded in the system yet.</span>
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