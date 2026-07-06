import { logout } from "@/lib/actions/auth";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { Server, LogOut, Bell, Settings, ShieldCheck, ChevronRight } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("users_profiles")
    .select("full_name, role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const displayName = profile?.full_name || user?.email || "Administrator";
  const roleLabel   = (profile?.role || "admin").toUpperCase();
  const initials    = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">

      {/* ── SIDEBAR: Strict bg-slate-950 ── */}
      <aside className="w-64 bg-slate-950 flex flex-col fixed inset-y-0 left-0 z-30 border-r border-slate-900 shadow-xl">
        
        {/* Brand block */}
        <div className="flex items-center gap-3 h-16 px-5 bg-slate-950 border-b border-slate-900 shrink-0">
          <div className="w-8 h-8 bg-emerald-700 rounded-md flex items-center justify-center shrink-0 shadow-sm border border-emerald-600">
            <Server className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-none tracking-tight">SRKS</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-widest mt-1">Enterprise</p>
          </div>
        </div>

        {/* Navigation */}
        <SidebarNav />

        {/* Sidebar footer */}
        <div className="shrink-0 bg-slate-950 border-t border-slate-900 p-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300 text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-200 truncate tracking-tight">{displayName}</p>
              <p className="text-[10px] text-emerald-600 mt-0.5 uppercase tracking-wider font-semibold">{roleLabel}</p>
            </div>
          </div>
          
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-md bg-slate-900 border border-slate-800 text-xs font-bold tracking-wider uppercase text-slate-400 hover:text-red-600 hover:bg-red-950/30 hover:border-red-900/50 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Secure Logout
            </button>
          </form>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-h-screen ml-64">

        {/* Top Command Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 sticky top-0 z-20">
          <div className="flex items-center text-sm font-medium">
            <span className="text-slate-500 flex items-center tracking-tight">
              SRKS Enterprise
              <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            </span>
            <span className="text-slate-900 font-bold tracking-tight">Command Center</span>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-md hover:bg-slate-50 text-slate-500 transition-colors border border-transparent hover:border-slate-200">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600 border-2 border-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-md font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              {roleLabel}
            </div>
          </div>
        </header>

        {/* Workspace Canvas */}
        <main className="flex-1 p-8 xl:p-10 overflow-auto bg-slate-50">
          {children}
        </main>
        
      </div>
    </div>
  );
}