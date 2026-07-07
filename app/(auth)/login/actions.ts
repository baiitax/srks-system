"use server";

import { createClient } from "@/lib/supabase/server";
import { logSystemEvent } from "@/lib/audit-logger";

interface LoginCredentials {
  email?: string;
  password?: string;
}

export async function loginUserAction(credentials: LoginCredentials) {
  const { email, password } = credentials;

  if (!email || !password) {
    return { success: false, error: "Authentication inputs cannot be left blank." };
  }

  const sanitizedEmail = email.trim().toLowerCase();

  try {
    const supabase = await createClient();

    // Authenticate Core Session
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });

    // ── AUDIT INJECTION: FAILED LOGIN ──
    if (authError) {
      await logSystemEvent({
        actionType: "AUTH_LOGIN_FAILED",
        changeManifest: { 
          attempted_email: sanitizedEmail, 
          reason: "invalid_credentials" 
        }
      });
      return { success: false, error: "Invalid corporate credentials provided." };
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: "Systemic authentication identity token generation failed." };
    }

    // Strict RBAC Clearance Validation
    const { data: profile, error: profileError } = await supabase
      .from("users_profiles")
      .select("role")
      .eq("id", userId)
      .single();

    // ── AUDIT INJECTION: ORPHANED ACCOUNT REJECTION ──
    if (profileError || !profile) {
      await supabase.auth.signOut(); 
      await logSystemEvent({
        actionType: "AUTH_LOGIN_FAILED",
        userId: userId,
        changeManifest: { 
          attempted_email: sanitizedEmail, 
          reason: "missing_rbac_profile_ledger" 
        }
      });
      return { 
        success: false, 
        error: "Identity profile missing from ledger. Contact IT administration to provision your clearance." 
      };
    }

    // ── AUDIT INJECTION: SUCCESSFUL LOGIN ──
    await logSystemEvent({
      actionType: "AUTH_LOGIN_SUCCESS",
      userId: userId,
      changeManifest: { 
        email: sanitizedEmail, 
        role_assigned: profile.role 
      }
    });

    // Successful Execution
    return { success: true, role: profile.role };

  } catch (err: any) {
    return { 
      success: false, 
      error: "A secure transport exception occurred. Please check network connectivity and try again." 
    };
  }
}