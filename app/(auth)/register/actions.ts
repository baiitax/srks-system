"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server Action to provision a new enterprise operator account
 */
export async function registerUserAction(formData: any) {
  const { fullName, email, password, role } = formData;

  // 1. Structural Input Validation
  if (!fullName || !email || !password || !role) {
    return { success: false, error: "All operational fields are mandatory." };
  }

  if (password.length < 8) {
    return { success: false, error: "Password configuration must be at least 8 characters." };
  }

  if (role !== "agent" && role !== "admin") {
    return { success: false, error: "Invalid systemic role authorization assigned." };
  }

  // 2. Initialize the standard client to handle user registration
  // (Uses your existing environment variables baked into Vercel)
  const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 3. Register user with the primary Supabase Auth engine
  const { data: authData, error: authError } = await supabasePublic.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  const userId = authData?.user?.id;

  if (!userId) {
    return { success: false, error: "Systemic authentication identity generation failed." };
  }

  // 4. Initialize a Service Role superuser client to safely bypass RLS 
  // during user provisioning. 
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Ensure this secret key is added to your Vercel settings
  );

  // 5. Inject the profile record into your public.users_profiles table
  const { error: profileError } = await supabaseAdmin
    .from("users_profiles")
    .insert({
      id: userId,
      role: role,
      full_name: fullName,
    });

  if (profileError) {
    return { success: false, error: `Profile mapping error: ${profileError.message}` };
  }

  return { success: true };
}
