"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, FileSignature, Package, 
  Users, Warehouse, ScrollText, KeyRound, Building2, 
  Scale, FileWarning, BarChart3
} from "lucide-react";

const NAV_GROUPS = [
  {
    heading: "Analytics & Finance",
    items: [
      { href: "/admin",               label: "Executive Dashboard",   icon: LayoutDashboard },
      { href: "/admin/reports",       label: "Enterprise Reporting",  icon: BarChart3 },
      { href: "/admin/ledgers",       label: "Financial Ledgers",     icon: BookOpen },
      { href: "/admin/match-station", label: "Finance Match Station", icon: Scale },
      { href: "/admin/variances",     label: "Variance Resolution",   icon: FileWarning },
    ],
  },
  {
    heading: "Operations",
    items: [
      { href: "/admin/po",        label: "PO Factory",       icon: FileSignature },
      { href: "/admin/products",  label: "Product Vault",    icon: Package },
      { href: "/admin/vendors",   label: "Vendor Directory", icon: Users },
      { href: "/admin/customers", label: "Client Directory", icon: Building2 },
      { href: "/admin/inventory", label: "Warehouse Stock",  icon: Warehouse },
    ],
  },
  {
    heading: "Governance",
    items: [
      { href: "/admin/audit",  label: "System Audit Log", icon: ScrollText },
      { href: "/admin/access", label: "Access Control",   icon: KeyRound },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-8 custom-scrollbar">
      {NAV_GROUPS.map((group) => (
        <div key={group.heading}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-4 mb-3">
            {group.heading}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm group transition-colors border-l-[3px] rounded-r-md ${
                    isActive 
                      ? "bg-emerald-900/30 border-emerald-600 text-emerald-50 font-semibold" 
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium"
                  }`}
                >
                  <item.icon className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-emerald-500" : "text-slate-500 group-hover:text-emerald-500"
                  }`} />
                  <span className="truncate text-[13px] tracking-wide">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}