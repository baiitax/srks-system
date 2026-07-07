"use client";

import { useEffect, useState } from "react";

export default function EnterprisePreloader() {
  const [isMounted, setIsMounted] = useState(false);

  // Ensure this only runs on the client to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
    
    // Safety fallback: Force remove the preloader from the DOM after 3 seconds
    // to ensure users are never trapped if an animation hangs.
    const timer = setTimeout(() => {
      const loader = document.getElementById("enterprise-preloader");
      if (loader) loader.style.display = "none";
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      id="enterprise-preloader"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a] animate-boot-sequence pointer-events-none"
    >
      <div className="flex flex-col items-center sm:w-full sm:max-w-[320px] px-6">
        
        {/* Logo Mark */}
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-6 opacity-0 animate-[fade-in_0.4s_ease-out_forwards]">
          <span className="text-xl font-black text-[#0f172a] tracking-tighter">
            P
          </span>
        </div>

        {/* Brand Typography */}
        <div className="text-center mb-10">
          <h1 className="text-white text-sm font-bold uppercase text-transparent animate-text-focus opacity-0">
            Pluck Global
          </h1>
          <p className="text-[#64748b] text-[10px] font-mono mt-2 uppercase tracking-widest opacity-0 animate-[fade-in_0.6s_ease-out_0.6s_forwards]">
            Initializing Secure Node...
          </p>
        </div>

        {/* ── High-Tech Progress Track ── */}
        <div className="w-full relative h-[2px] bg-[#1e293b] rounded-full overflow-hidden opacity-0 animate-[fade-in_0.4s_ease-out_0.2s_forwards]">
          {/* Primary Swift Fill */}
          <div className="absolute top-0 left-0 h-full bg-white animate-progress-swift w-0 rounded-full" />
          
          {/* Superimposed Shimmer Effect */}
          <div 
            className="absolute top-0 left-0 h-full w-full opacity-50"
            style={{
              backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'pulse-shimmer 1.5s infinite linear'
            }}
          />
        </div>

      </div>
    </div>
  );
}