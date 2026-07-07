"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server Action to dispatch a secure password reset token link
 */
export async function requestPasswordResetAction(email: string) {
  // 1. Structural Validation
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid corporate email address." };
  }

  // 2. Initialize Standard Supabase Public Client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 3. Dispatch the reset request to Supabase Auth engine
  // This will send an email containing a recovery link targeting your /auth/callback route
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
