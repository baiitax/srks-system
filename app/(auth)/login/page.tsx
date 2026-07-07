"use client";

import { useState, useEffect, Suspense } from "react";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { loginUserAction } from "./actions";

function LoginEngine() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── SPEED OPTIMIZATION: PREFETCH TARGET ROUTES ──
  // This forces Next.js to download the dashboards in the background
  // completely eliminating the "hanging" delay upon submission.
  useEffect(() => {
    router.prefetch("/admin");
    router.prefetch("/agent");
    router.prefetch("/admin/po");
  }, [router]);

  useEffect(() => {
    const errorType = searchParams.get("error");
    if (errorType === "profile_not_found") {
      setErrorMessage("Identity profile missing from ledger. Contact a system administrator to provision your access clearance.");
    } else if (errorType === "session_expired") {
      setErrorMessage("Secure session expired. Please re-authenticate your node.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginUserAction({ email, password });

    if (!result.success) {
      setErrorMessage(result.error || "Access denied. Verification routine failed.");
      setIsLoading(false);
    } else {
      // The push will now be instant due to background prefetching
      if (result.role === "admin") {
        router.push("/admin");
      } else if (result.role === "agent") {
        router.push("/agent"); 
      } else {
        setErrorMessage("Clearance role undefined. Contact IT.");
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-[440px]">
      <div className="bg-white px-8 py-10 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border border-slate-200/80 rounded-2xl">
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center font-black text-white text-lg shadow-sm mb-4">
            P
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pluck Global Supply
          </h2>
          <p className="mt-1.5 text-[13px] text-slate-500 font-medium">
            Secure Operations & Logistics Ledger
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-100 text-red-800 rounded-lg flex items-start gap-2.5 text-[13px] font-medium animate-in slide-in-from-top-2 duration-200">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-slate-900 mb-1.5">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-[14px] bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:bg-white focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
              placeholder="operator@pluckglobal.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="text-[13px] font-semibold text-slate-900">
                Password
              </label>
              <Link 
                href="/forgot-password" 
                className="text-[12px] font-medium text-slate-500 hover:text-slate-950 transition-colors"
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
                className="block w-full pl-3.5 pr-10 py-2.5 border border-slate-200 rounded-lg text-[14px] bg-slate-50/50 text-slate-900 placeholder:text-slate-400 font-medium disabled:opacity-50 transition-all focus:bg-white focus:outline-none focus:border-slate-950 focus:ring-1 focus:ring-slate-950 shadow-sm"
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

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-transparent rounded-lg text-[14px] font-semibold text-white bg-slate-950 hover:bg-slate-900 disabled:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 transition-all active:scale-[0.99] shadow-sm disabled:opacity-70 cursor-pointer h-11"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying Identity...</span>
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4 ml-1 opacity-70" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[12px] uppercase tracking-wider font-bold">
              <span className="px-3 bg-white text-slate-400">Or continue with</span>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href="/sso-login"
              className="w-full flex items-center justify-center px-4 py-2.5 border border-slate-200 rounded-lg text-[13px] font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-1 transition-all shadow-sm"
            >
              Enterprise SAML SSO
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-[13px] font-medium text-slate-500">
        Unregistered operator node?{" "}
        <Link href="/register" className="font-semibold text-slate-900 hover:underline">
          Request provisioning
        </Link>
      </div>
    </div>
  );
}

export default function EnterpriseLoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 selection:bg-slate-900 selection:text-white overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20h20v20H20V20zM0 20h20v20H0V20z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
      </div>
      
      <Suspense fallback={<div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>}>
        <LoginEngine />
      </Suspense>
    </div>
  );
}