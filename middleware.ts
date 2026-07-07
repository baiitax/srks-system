import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize a lightweight Edge client for rapid token verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // 1. Extract the current execution path
  const path = req.nextUrl.pathname;

  // 2. Define protected institutional boundaries
  const isAdminRoute = path.startsWith("/admin");
  const isAgentRoute = path.startsWith("/agent");
  const isAuthRoute = path === "/login" || path === "/register";

  // If the route doesn't require protection, let it pass instantly
  if (!isAdminRoute && !isAgentRoute && !isAuthRoute) return res;

  // 3. Extract the Auth Session Token from the user's cookies
  // (Supabase stores the session under the 'sb-[project-ref]-auth-token' convention)
  const cookieName = Object.keys(req.cookies.getAll()).find(name => name.includes('-auth-token'));
  const sessionCookie = cookieName ? req.cookies.get(cookieName)?.value : null;

  // 4. Unauthenticated users trying to access protected portals get ejected to Login
  if (!sessionCookie && (isAdminRoute || isAgentRoute)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 5. If a session exists, we must verify their Clearance Level (Role)
  if (sessionCookie) {
    try {
      const parsedSession = JSON.parse(sessionCookie);
      const accessToken = parsedSession[0]; // The JWT Access Token

      // Get the user's identity from the Supabase Auth engine
      const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);

      if (!user || authError) throw new Error("Invalid token");

      // Cross-reference the user's ID with the profile ledger to get their role
      const { data: profile } = await supabase
        .from("users_profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const userRole = profile?.role || "agent"; // Default strictly to lowest privilege

      // 6. ENFORCE WORKSPACE BOUNDARIES
      
      // If Admin tries to access Agent portal, push them back to Admin dashboard
      if (userRole === "admin" && isAgentRoute) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }

      // If Agent tries to access Admin portal, push them back to Agent dashboard
      if (userRole === "agent" && isAdminRoute) {
        return NextResponse.redirect(new URL("/agent", req.url));
      }

      // If already logged in and trying to view the login page, bypass it
      if (isAuthRoute) {
        return NextResponse.redirect(new URL(userRole === "admin" ? "/admin" : "/agent", req.url));
      }

    } catch (err) {
      // If token parsing or validation fails, wipe their access and force re-login
      if (isAdminRoute || isAgentRoute) {
        return NextResponse.redirect(new URL("/login?error=session_expired", req.url));
      }
    }
  }

  return res;
}

// 7. Optimize Execution: Only run middleware on specific paths to save bandwidth
export const config = {
  matcher: ["/admin/:path*", "/agent/:path*", "/login", "/register"],
};