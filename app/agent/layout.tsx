import { logout } from "@/lib/actions/auth";
import { Truck, LogOut } from "lucide-react";
import { BottomNav } from "@/components/agent/bottom-nav";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex justify-center selection:bg-teal-500/30">
      
      {/* Mobile-Constrained App Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-screen shadow-2xl relative flex flex-col overflow-hidden sm:border-x sm:border-slate-800">
        
        {/* App Header */}
        <header className="h-[72px] bg-white flex items-center justify-between px-6 shrink-0 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-inner shadow-teal-900/20 mr-3">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="font-bold text-slate-900 tracking-widest text-lg leading-none">
              SRKS<span className="text-teal-600 font-light">OPS</span>
            </div>
          </div>
          
          <form action={logout}>
            <button 
              type="submit" 
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all active:scale-95"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </form>
        </header>

        {/* Scrollable Workspace (Padded heavily at bottom so content isn't hidden by nav) */}
        <main className="flex-1 overflow-y-auto p-4 pb-28 custom-scrollbar">
          {children}
        </main>

        {/* Client-Side Interactive Bottom Navigation */}
        <BottomNav />
        
      </div>
    </div>
  );
}