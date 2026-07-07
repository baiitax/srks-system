"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export default function Tier1LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Execute authentication routines here
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <div className="sm:mx-auto w-full sm:max-w-[400px]">
        
        {/* Minimalist Monochrome Brand Identity */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-6 h-6 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-xs tracking-tighter">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
            Pluck Global
          </span>
        </div>

        {/* Action Header */}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Sign in to your system
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Enter your corporate credentials to access the enterprise ledger.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-[400px]">
        <form className="space-y-6" onSubmit={handleLogin}>
          
          {/* Corporate Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-900 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3.5 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
              placeholder="you@company.com"
            />
          </div>

          {/* Secure Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-900">
                Password
              </label>
              <Link 
                href="/reset-password" 
                className="text-xs font-medium text-slate-500 hover:text-slate-950 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
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

          {/* Core Action Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition-all active:scale-[0.99] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Authenticating session..." : "Continue"}
            </button>
          </div>
        </form>

        {/* Secondary SSO / Registration Actions */}
        <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-3 text-xs font-medium">
          <p className="text-slate-500">
            New operator?{" "}
            <Link href="/register" className="font-semibold text-slate-950 hover:underline">
              Create account
            </Link>
          </p>
          <Link 
            href="/sso-login" 
            className="text-slate-500 hover:text-slate-950 hover:underline transition-colors text-left"
          >
            Sign in with Enterprise SSO &rarr;
          </Link>
        </div>

      </div>
    </div>
  );
}
