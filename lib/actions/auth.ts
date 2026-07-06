"use server";

import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must include an uppercase character")
    .regex(/[a-z]/, "Password must include a lowercase character")
    .regex(/[0-9]/, "Password must include a number"),
  role: z.enum(["admin", "manager"]),
});

function normalizeRole(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.toLowerCase();
  return normalized === "admin" || normalized === "agent" || normalized === "manager"
    ? normalized
    : null;
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect("/login?error=invalid_input");
  }

  const { email, password } = parsed.data;
  const supabase = await createServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid_credentials");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=invalid_credentials");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users_profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const profileRole = normalizeRole(profile?.role);
  const metadataRole = normalizeRole(user.user_metadata?.role) ?? normalizeRole(user.app_metadata?.role);
  const role = metadataRole ?? profileRole;

  if (!profileRole && metadataRole) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createServiceClient(supabaseUrl, serviceRoleKey);
      await adminClient.from("users_profiles").upsert(
        [
          {
            id: user.id,
            role: metadataRole === "manager" ? "admin" : metadataRole,
            full_name:
              (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
              (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
              "SRKS User",
            updated_at: new Date().toISOString(),
          },
        ],
        { onConflict: "id" }
      );
    }
  }

  if (profileError || !role) {
    await supabase.auth.signOut();
    redirect("/login?error=profile_not_found");
  }

  if (role !== "admin" && role !== "agent" && role !== "manager") {
    await supabase.auth.signOut();
    redirect("/login?error=invalid_role");
  }

  // Clear cache and route directly to role dashboard.
  revalidatePath("/", "layout");
  redirect(role === "agent" ? "/agent/dashboard" : "/admin/po");
}

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect("/register?error=invalid_input");
  }

  const { fullName, email, password, role } = parsed.data;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    redirect("/register?error=server_config");
  }

  const adminClient = createServiceClient(supabaseUrl, serviceRoleKey);

  const listRes = await adminClient.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (listRes.error) {
    redirect("/register?error=server_error");
  }

  const existingUser = (listRes.data.users || []).find(
    (user) => (user.email || "").toLowerCase() === email.toLowerCase()
  );

  let userId = existingUser?.id;

  if (existingUser) {
    const updateRes = await adminClient.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
      app_metadata: {
        role,
      },
    });

    if (updateRes.error) {
      redirect("/register?error=user_update_failed");
    }

    userId = updateRes.data.user?.id || existingUser.id;
  } else {
    const createRes = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
      app_metadata: {
        role,
      },
    });

    if (createRes.error || !createRes.data.user) {
      redirect("/register?error=user_create_failed");
    }

    userId = createRes.data.user.id;
  }

  const profileRoleForDb = role === "manager" ? "admin" : role;

  const profileUpsert = await adminClient.from("users_profiles").upsert(
    [
      {
        id: userId,
        role: profileRoleForDb,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      },
    ],
    { onConflict: "id" }
  );

  if (profileUpsert.error) {
    redirect("/register?error=profile_sync_failed");
  }

  redirect("/login?registered=1");
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}