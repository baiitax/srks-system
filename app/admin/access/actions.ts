"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Initialize the privileged administrative superuser client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Fetches all operators registered in the profile registry
 */
export async function getOperatorsAction() {
  const { data, error } = await supabaseAdmin
    .from("users_profiles")
    .select("*")
    .order("full_name", { ascending: true });

  if (error) return { success: false, error: error.message, data: [] };
  return { success: true, data: data || [] };
}

/**
 * Administrative provisioning pipeline to create a user and set their profile role
 */
export async function provisionOperatorAction(formData: any) {
  const { fullName, email, password, role } = formData;

  if (!fullName || !email || !password || !role) {
    return { success: false, error: "All configuration variables are mandatory." };
  }

  // 1. Create the user inside the secure core auth engine (Bypasses manual email verification)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) return { success: false, error: authError.message };
  const userId = authData?.user?.id;

  // 2. Insert into custom public profile framework
  const { error: profileError } = await supabaseAdmin
    .from("users_profiles")
    .insert({
      id: userId,
      role,
      full_name: fullName,
    });

  if (profileError) {
    // Rollback auth user creation if profile construction mapping fails
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { success: false, error: `Profile structural alignment failed: ${profileError.message}` };
  }

  revalidatePath("/admin/access-control");
  return { success: true };
}

/**
 * Updates an operational role dynamically
 */
export async function updateOperatorRoleAction(userId: string, newRole: "admin" | "agent") {
  const { error } = await supabaseAdmin
    .from("users_profiles")
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { success: false, error: error.message };
  
  revalidatePath("/admin/access-control");
  return { success: true };
}

/**
 * Completely purges a user identity from the infrastructure ledger
 */
export async function revokeOperatorAction(userId: string) {
  // 1. Wipe from core system authentication (Cascades out profile table)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/access-control");
  return { success: true };
}
