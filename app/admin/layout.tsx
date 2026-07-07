"use client";

import { useState } from "react";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  TrendingUp, 
  ShieldCheck, 
  LogOut,
  ChevronRight,
  Building2,
  SlidersHorizontal,
  User
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EnhancedAdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Categorized Navigation Mapping
  const navigationGroups = [
    {
      title: "Core Operations",
      routes: [
        { name: "Overview", href: "/admin", icon: LayoutDashboard, shortcut: "⌥1" },
        { name: "Purchase Orders", href: "/admin/po", icon: FileText, shortcut: "⌥2" },
      ]
    },
    {
      title: "Intelligence & Ledger",
      routes: [
        { name: "Financial Report", href: "/admin/reports/financial", icon: TrendingUp, shortcut: "⌥3" },
      ]
    },
    {
      title: "System Parameters",
      routes: [
        { name: "Access Control (IAM)", href: "/admin/access-control", icon: ShieldCheck, shortcut: "⌥4" },
      ]
    }
  ];

  const NavigationMenu = ({ closeMobile }: { closeMobile?: () => void }) => (
    <div className="space-y-6">
      {navigationGroups.map((group, gIdx) => (
        <div key={gIdx} className="space-y-1.5">
          <h3 className="px-3 text-[10px] font-bold tracking-wider uppercase text-slate-400">
            {group.title}
          </h3>
          <nav className="space-y-0.5">
            {group.routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  onClick={() => closeMobile?.()}
                  className={`flex items-center justify-between px-3 py-2 border rounded-md text-xs font-semibold transition-all group ${
                    isActive 
                      ? "bg-slate-950 border-transparent text-white shadow-xs" 
                      : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <route.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-950'}`} />
                    <span>{route.name}</span>
                  </div>
                  
                  {/* Subtle Action/Shortcut Indicator */}
                  {isActive ? (
                    <div className="w-1 h-1 bg-white rounded-full" />
                  ) : (
                    <span className="text-[9px] font-mono font-medium text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:inline">
                      {route.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans antialiased text-slate-950 selection:bg-slate-900 selection:text-white">
      
      {/* ── MOBILE SYSTEM BAR ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-40 bg-opacity-95 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-slate-950 rounded flex items-center justify-center font-black text-white text-[11px]">P</div>
          <div className="text-left">
            <div className="text-xs font-bold tracking-tight text-slate-950">Pluck Global Supply</div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Live Node</div>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)} 
          className="p-2 text-slate-500 hover:text-slate-950 transition-colors cursor-pointer rounded-md hover:bg-slate-50"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── MOBILE MODAL DRAWER ── */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-68 bg-white p-6 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Navigation Deck</span>
                <button onClick={() => setIsMobileOpen(false)} className="text-slate-400 hover:text-slate-950 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavigationMenu closeMobile={() => setIsMobileOpen(false)} />
            </div>

            {/* Mobile Footer Identity */}
            <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600"><User className="w-4 h-4" /></div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Finance Exec</div>
                  <div className="text-[10px] text-slate-400 font-medium font-mono">Role: Admin</div>
                </div>
              </div>
              <button className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"><LogOut className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── DESKTOP PERSISTENT CORE SIDEBAR ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200/60 p-5 flex-col justify-between z-30 select-none">
        <div className="space-y-8">
          
          {/* Section 1: Institutional Workspace Selector */}
          <div className="flex items-center justify-between p-2 rounded-lg border border-slate-200/80 bg-slate-50/50 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-6 h-6 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-xs shrink-0">
                P
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-slate-950 truncate">Pluck Global Supply</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 mt-0.5">Production Node</p>
              </div>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
          </div>

          {/* Section 2: Structured Navigation */}
          <NavigationMenu />
        </div>

        {/* Section 3: Professional Identity Profile Card */}
        <div className="border-t border-slate-100 pt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-950 font-black text-[11px] text-white flex items-center justify-center shrink-0 shadow-xs">
              FE
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs font-bold text-slate-950 truncate">Finance Executive</p>
              <p className="text-[10px] font-medium text-slate-400 truncate font-mono">a6b74e9a...adc0</p>
            </div>
          </div>
          <button 
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50/50 rounded transition-all cursor-pointer shrink-0"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ── WORKING VIEWPORT PLATFORM ── */}
      <div className="md:pl-64 pt-14 md:pt-0">
        <main className="p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>

    </div>
  );
}
