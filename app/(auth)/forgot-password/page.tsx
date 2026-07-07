"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requestPasswordResetAction } from "./actions";

export default function Tier1ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    const result = await requestPasswordResetAction(email);

    setIsLoading(false);
    if (!result.success) {
      setErrorMessage(result.error || "An unexpected system error occurred.");
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
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Recovery email dispatched</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            If the account <span className="font-semibold text-slate-950">{email}</span> is mapped within our enterprise directory, an authorization token link has been transmitted to reconfigure your credentials.
          </p>
          <div className="pt-4">
            <Link 
              href="/login" 
              className="inline-flex justify-center w-full py-2.5 px-4 rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 transition-all shadow-sm"
            >
              Return to login portal
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

        {/* Dynamic Context Header */}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
          Recover your credentials
        </h2>
        <p className="mt-2 text-sm text-slate-500 font-medium">
          Provide your verification endpoint to receive a secure bypass token.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full sm:max-w-[400px]">
        
        {/* Error Notification Block */}
        {errorMessage && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-start gap-2.5 text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleResetRequest}>
          
          {/* Email Address Form Parameter */}
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-900 mb-2">
              Corporate email identity
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

          {/* Action Trigger */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md text-sm font-semibold text-white bg-slate-950 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-950 transition-all active:scale-[0.99] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Validating email route..." : "Send Recovery Link"}
            </button>
          </div>
        </form>

        {/* Portal Breadcrumbs Navigation */}
        <div className="mt-6 pt-6 border-t border-slate-100 text-xs font-medium text-left">
          <Link 
            href="/login" 
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-950 hover:underline transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to authentication portal
          </Link>
        </div>

      </div>
    </div>
  );
}
