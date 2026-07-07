"use client";

import { useState } from "react";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUserAction } from "./actions";

export default function Tier1LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Defensive Execution States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Dispatch payload directly to the secure Server Action
    const result = await loginUserAction({ email, password });

    if (!result.success) {
      // CRITICAL: Terminate loading loop and output error configuration safely
      setErrorMessage(result.error || "Access denied. Verification routine failed.");
      setIsLoading(false);
    } else {
      // Route user dynamically based on verified database role parameters
      if (result.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/admin/po"); // Fallback routing structure for agents
      }
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-6 lg:px-8 font-sans antialiased selection:bg-slate-900 selection:text-white">
      <div className="sm:mx-auto w-full sm:max-w-[380px]">
        
        {/* Minimalist Monochrome Brand Mark */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-6 h-6 bg-slate-950 rounded-sm flex items-center justify-center font-black text-white text-xs tracking-tighter">
            S
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-950">
            SRKS Global
          </span>
        </div>

        {/* Header Text Block */}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Sign in to your system
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Enter your institutional parameters to authenticate access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-[380px]">
        
        {/* Anti-Hanging Error Announcement Panel */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-800 rounded-md flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          
          {/* Corporate Email Address */}
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
              className="block w-full px-3.5 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-40 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-xs"
              placeholder="operator@company.com"
            />
          </div>

          {/* Secure Password Field */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-900">
                Password
              </label>
              <Link 
                href="/forgot-password" 
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
                className="block w-full pl-3.5 pr-10 py-2 border border-slate-200 rounded-md text-sm bg-white text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-40 transition-all focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-xs"
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

          {/* Primary Submit Configuration */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-900 disabled:bg-slate-800 focus:outline-none transition-all active:scale-[0.99] shadow-xs disabled:opacity-60 cursor-pointer h-10"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Node Session...</span>
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </form>

        {/* Directory Breadcrumbs Footer */}
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
