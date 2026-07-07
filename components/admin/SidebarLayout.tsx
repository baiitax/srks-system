"use client";

import { useState } from "react";
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  FileText, 
  DollarSign, 
  ShieldAlert, 
  LogOut,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Navigation Links array matching your built architecture
  const routes = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Purchase Orders", href: "/admin/po", icon: FileText },
    { name: "Financial Report", href: "/admin/reports/financial", icon: DollarSign },
    { name: "Access Control (IAM)", href: "/admin/access-control", icon: ShieldAlert },
  ];

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-950 selection:bg-slate-900 selection:text-white">
      
      {/* ── MOBILE HEADER (Visible only on screens below md: 768px) ── */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-100 px-4 flex items-center justify-between z-40 bg-opacity-95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-[10px] tracking-tighter">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
            PLUCK GLOBAL System
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="p-1.5 text-slate-500 hover:text-slate-950 transition-colors cursor-pointer rounded-md hover:bg-slate-50"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ── MOBILE OVERLAY DRAWERS (Drawer Backdrop Sheet) ── */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-white p-6 flex flex-col justify-between shadow-2xl border-r border-slate-100"
            onClick={(e) => e.stopPropagation()} // Stop overlay clicks from closing drawer directly
          >
            <div className="space-y-8">
              {/* Mobile Drawer Top Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-[10px] tracking-tighter">
                    S
                  </div>
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
                    SRKS System
                  </span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-950 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Menu Links */}
              <nav className="space-y-1">
                {routes.map((route) => {
                  const isActive = pathname === route.href;
                  return (
                    <Link
                      key={route.href}
                      href={route.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition-all group ${
                        isActive 
                          ? "bg-slate-950 text-white shadow-xs" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <route.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-950'}`} />
                        <span>{route.name}</span>
                      </div>
                      {!isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Mobile Drawer Logout */}
            <button className="flex items-center gap-3 px-3 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50/50 rounded-md transition-all cursor-pointer">
              <LogOut className="w-4 h-4" />
              <span>Log out session</span>
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP FIXED SIDEBAR (Visible only on md: screens and above) ── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 bg-white border-r border-slate-100 p-6 flex-col justify-between z-30 select-none">
        <div className="space-y-10">
          {/* System Branding Block */}
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-[10px] tracking-tighter">
              S
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
              SRKS Global
            </span>
          </div>

          {/* Nav Directory Table */}
          <nav className="space-y-1">
            {routes.map((route) => {
              const isActive = pathname === route.href;
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={`flex items-center justify-between px-3 py-2 border rounded-md text-xs font-semibold transition-all group ${
                    isActive 
                      ? "bg-slate-950 text-white border-transparent shadow-xs" 
                      : "text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <route.icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-950'}`} />
                    <span>{route.name}</span>
                  </div>
                  {!isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Corporate Sign-Out Footnote */}
        <button className="flex items-center gap-2.5 px-3 py-2 border border-transparent rounded-md text-xs font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50/30 transition-all cursor-pointer">
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit System</span>
        </button>
      </aside>

      {/* ── VIEWPORT CONTENT CONTAINER ── */}
      <div className="md:pl-60 pt-14 md:pt-0">
        <main className="min-h-screen">
          {children}
        </main>
      </div>

    </div>
  );
}
