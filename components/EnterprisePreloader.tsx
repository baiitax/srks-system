"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function EnterprisePreloader() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Safety fallback: Unmounts loader safely after 2.5 seconds
    const timer = setTimeout(() => {
      const loader = document.getElementById("enterprise-preloader");
      if (loader) loader.style.display = "none";
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      id="enterprise-preloader"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-md animate-boot-light pointer-events-none"
    >
      <div className="flex flex-col items-center sm:w-full sm:max-w-[320px] px-6">
        
        {/* Graphical Floating Brand Mark */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Ambient Glow */}
          <div className="absolute inset-0 bg-slate-900 rounded-2xl animate-glow blur-md" />
          
          {/* Core Identity Box */}
          <div className="relative w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-xl animate-float border border-slate-800">
            <span className="text-3xl font-black text-white tracking-tighter">
              P
            </span>
          </div>
        </div>

        {/* Brand Typography */}
        <div className="text-center mb-6 opacity-0 animate-reveal">
          <h1 className="text-slate-900 text-lg font-bold tracking-tight">
            Pluck Global Supply
          </h1>
          <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-widest mt-1">
            System Initialization
          </p>
        </div>

        {/* Sleek Graphical Spinner */}
        <div className="flex items-center gap-2 text-slate-400 opacity-0 animate-reveal" style={{ animationDelay: '0.4s' }}>
          <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
          <span className="text-[10px] font-mono font-medium uppercase tracking-wider">Syncing node...</span>
        </div>

      </div>
    </div>
  );
}