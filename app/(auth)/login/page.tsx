import { login } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShieldCheck, Lock, Mail, Server } from "lucide-react";
import { DemoLoginButtons } from "@/components/auth/demo-login-buttons";

function normalizeRole(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  return normalized === "admin" || normalized === "agent" || normalized === "manager"
    ? normalized
    : null;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const params = await searchParams;
  
  let authenticatedNotice: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("users_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const profileRole = normalizeRole(profile?.role);
    const metadataRole = normalizeRole(user.user_metadata?.role) ?? normalizeRole(user.app_metadata?.role);
    const role = metadataRole ?? profileRole;

    if (role === "admin") {
      authenticatedNotice = "You are already signed in as Admin. Open /admin/po to continue.";
    }

    if (role === "agent") {
      authenticatedNotice = "You are already signed in as Agent. Open /agent/dashboard to continue.";
    }

    if (role === "manager") {
      authenticatedNotice = "You are already signed in as Manager. Open /admin/po to continue.";
    }

    if (!authenticatedNotice && params.error !== "profile_not_found") {
      redirect("/login?error=profile_not_found");
    }
  }

  const errorMessage =
    params.error === "invalid_credentials"
      ? "Invalid login credentials. Please verify your email and password."
      : params.error === "invalid_input"
        ? "Please enter a valid email and password."
        : params.error === "profile_not_found"
          ? "Your account is authenticated but not linked to a system role. Contact IT to map your user profile."
          : params.error === "invalid_role"
            ? "Your account role is not permitted for this portal. Contact IT support."
        : null;

  const registeredMessage = params.registered === "1" ? "Registration completed. You can sign in now." : null;

  return (
    <div className="flex min-h-screen bg-white">
      
      {/* LEFT PANEL: Corporate Branding & System Context (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-950 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background abstract element */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-600 blur-3xl"></div>
          <div className="absolute bottom-12 right-12 w-72 h-72 rounded-full bg-teal-600 blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-emerald-500 mb-12">
            <Server className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-widest text-white">SRKS</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight mb-6 leading-tight">
            Enterprise Procurement <br />
            <span className="text-emerald-400">& Supply Record-Keeping</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Secure, immutable, and automated supply chain tracking. Authenticate to access real-time ledgers, 3-way matching, and operational pipelines.
          </p>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
          &copy; {new Date().getFullYear()} SRKS System / Corporate Operations. All rights reserved.
        </div>
      </div>

      {/* RIGHT PANEL: The Authentication Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-slate-50 lg:bg-white">
        <div className="w-full max-w-md space-y-8">
          
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
            <p className="text-sm text-slate-500 mt-2">
              Enter your corporate credentials to access the secure portal.
            </p>
          </div>

          <form action={login} className="space-y-6 mt-8">
            {authenticatedNotice && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {authenticatedNotice}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            )}
            {registeredMessage && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {registeredMessage}
              </div>
            )}

            <DemoLoginButtons />

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Work Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder="name@company.com" 
                  required 
                  className="pl-10 h-11 border-slate-300 focus-visible:ring-emerald-600 transition-all bg-slate-50 lg:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 font-medium">
                  Password
                </Label>
                <a href="#" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Contact IT Support
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  className="pl-10 h-11 border-slate-300 focus-visible:ring-emerald-600 transition-all bg-slate-50 lg:bg-white"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-base shadow-sm transition-all">
              Secure Sign In
            </Button>

            <p className="text-center text-sm text-slate-500">
              Need a new account?{" "}
              <a href="/register" className="font-medium text-emerald-700 hover:text-emerald-800">
                Register as Admin/Manager
              </a>
            </p>
          </form>

          {/* Security Trust Indicator */}
          <div className="flex items-center justify-center space-x-2 mt-8 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Protected by SRKS Edge Authentication & Role-Based Access</span>
          </div>

        </div>
      </div>
      
    </div>
  );
}