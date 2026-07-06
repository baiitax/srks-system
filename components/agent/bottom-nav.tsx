"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, UserCircle2 } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Determine active state. If they are in the dashboard or an upload page, Missions is active.
  const isMissionsActive = pathname.includes("/agent/dashboard") || pathname.includes("/agent/upload");
  const isProfileActive = pathname.includes("/agent/profile");

  return (
    <nav className="absolute bottom-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 h-[84px] flex items-center justify-around z-20 pb-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <Link 
        href="/agent/dashboard" 
        className="flex flex-col items-center justify-center w-full h-full relative group"
      >
        <div className={`flex flex-col items-center justify-center transition-all duration-200 ${isMissionsActive ? "text-teal-700 -translate-y-1" : "text-slate-400 hover:text-slate-600"}`}>
          <Truck className={`w-6 h-6 mb-1 ${isMissionsActive ? "fill-teal-700/20" : ""}`} />
          <span className={`text-[10px] uppercase tracking-widest ${isMissionsActive ? "font-bold" : "font-medium"}`}>
            Missions
          </span>
        </div>
        {/* Active Indicator Dot */}
        {isMissionsActive && (
          <span className="absolute bottom-1 w-1 h-1 bg-teal-700 rounded-full" />
        )}
      </Link>

      <div className="flex flex-col items-center justify-center w-full h-full text-slate-300 cursor-not-allowed">
        <div className="flex flex-col items-center justify-center">
          <UserCircle2 className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Profile</span>
        </div>
      </div>
    </nav>
  );
}