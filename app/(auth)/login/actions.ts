"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Enterprise Authentication Server Action
 * Validates credentials and returns systemic routing parameters
 */
export async function loginUserAction(formData: any) {
  const { email, password } = formData;

  // 1. Edge Ingress Validation
  if (!email || !password) {
    return { success: false, error: "Authentication inputs cannot be left blank." };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate Core Session via Supabase Auth Engine
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return { success: false, error: authError.message };
    }

    const userId = authData?.user?.id;
    if (!userId) {
      return { success: false, error: "Systemic authentication identity token generation failed." };
    }

    // 3. Resolve Custom Clearance Role for Dynamic Inbound Routing
    const { data: profile, error: profileError } = await supabase
      .from("users_profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      // If the profile entry is missing, default to agent clearance path for system safety
      return { success: true, role: "agent" };
    }

    return { success: true, role: profile.role };

  } catch (err: any) {
    return { 
      success: false, 
      error: err?.message || "An unhandled transport layer exception occurred." 
    };
  }
}
