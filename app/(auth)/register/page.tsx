"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { registerUserAction } from "./actions";

export default function Tier1RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await registerUserAction({ fullName, email, password, role });

    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || "An unexpected provisioning error occurred.");
    } else {
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans antialiased">
        <div className="sm:mx-auto w-full sm:max-w-[400px] text-center space-y-4">
          <div className="w-10 h-10 bg-slate-950 text-white rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Account Provisioned</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Your enterprise access token has been generated. If email confirmation parameters are enabled, verify your corporate mailbox before attempting system access.
          </p>
          <div className="pt-4">
            <Link href="/login" className="inline-flex justify-center w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm">
              Return to Authentication Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <div className="sm:mx-auto w-full sm:max-w-[400px]">
        
        {/* Brand Identity */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-6 h-6 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-xs tracking-tighter">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
            SRKS Global
          </span>
        </div>

        {/* Header Text */}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Provision operator credentials
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Create an institutional account linked to the secure tracking system.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-[400px]">
        
        {/* Error Alert Box */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleRegister}>
          
          {/* Full Name Input */}
          <div>
            <label htmlFor="fullName" className="block text-xs font-semibold text-slate-900 mb-2">
              Legal Identity Name
            </label>
            <input
              id="fullName"
              type="text"
              required
              disabled={isLoading}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full px-3.5 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
              placeholder="e.g. Aliko Dangote"
            />
          </div>

          {/* Corporate Email Input */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-900 mb-2">
              Corporate email address
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3.5 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
              placeholder="operator@company.com"
            />
          </div>

          {/* Role Choice Radio Buttons */}
          <div>
            <span className="block text-xs font-semibold text-slate-900 mb-2.5">
              Assigned system clearing role
            </span>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border rounded-md p-3 flex flex-col justify-between cursor-pointer transition-all ${role === "agent" ? "border-slate-950 bg-slate-50/50 ring-1 ring-slate-950" : "border-slate-200 hover:border-slate-300"}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="agent" 
                  checked={role === "agent"} 
                  onChange={() => setRole("agent")}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-slate-900">Logistics Agent</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1">Waybill & GRN uploads</span>
              </label>

              <label className={`border rounded-md p-3 flex flex-col justify-between cursor-pointer transition-all ${role === "admin" ? "border-slate-950 bg-slate-50/50 ring-1 ring-slate-950" : "border-slate-200 hover:border-slate-300"}`}>
                <input 
                  type="radio" 
                  name="role" 
                  value="admin" 
                  checked={role === "admin"} 
                  onChange={() => setRole("admin")}
                  className="sr-only"
                />
                <span className="text-xs font-bold text-slate-900">Finance Executive</span>
                <span className="text-[11px] text-slate-500 font-medium mt-1">Full ledger visibility</span>
              </label>
            </div>
          </div>

          {/* Password Input with Visibility Switch */}
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-900 mb-2">
              Security access password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
                placeholder="••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-950 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Operational Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition-all active:scale-[0.99] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Provisioning identities..." : "Initialize Operator Account"}
            </button>
          </div>
        </form>

        {/* Back Link routing options */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-xs font-medium text-center">
          <p className="text-slate-500">
            Already mapped to the directory?{" "}
            <Link href="/login" className="font-semibold text-slate-950 hover:underline">
              Sign in to platform
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
