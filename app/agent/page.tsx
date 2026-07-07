"use client";

import { Package, FileText, UploadCloud } from "lucide-react";

export default function AgentPortalDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans antialiased text-slate-900">
      
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Logistics Field Portal</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Upload and manage active Waybills & GRNs.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-md text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Agent Active
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <button className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-950 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">Upload Waybill</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-950 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">Generate GRN</span>
          </button>

          <button className="flex flex-col items-center justify-center gap-3 p-8 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-950 hover:shadow-md transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center group-hover:bg-slate-950 group-hover:text-white transition-colors">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-slate-900">View Assigned POs</span>
          </button>

        </div>
      </div>
    </div>
  );
}