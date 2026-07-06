import { register } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function mapRegisterError(error: string | undefined) {
  if (!error) return null;

  if (error === "invalid_input") return "Please provide valid registration details.";
  if (error === "server_config") return "Server configuration is incomplete. Contact IT support.";
  if (error === "server_error") return "Unable to process registration now. Please try again.";
  if (error === "user_create_failed") return "Could not create user account. It may already exist.";
  if (error === "user_update_failed") return "Could not update existing user account.";
  if (error === "profile_sync_failed") return "Account created, but profile role sync failed.";

  return "Registration failed. Please contact IT support.";
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/login");
  }

  const params = await searchParams;
  const errorMessage = mapRegisterError(params.error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Register Account</h1>
          <p className="text-sm text-slate-500">
            Create an Admin or Manager account for SRKS access.
          </p>
        </div>

        <form action={register} className="space-y-4">
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" type="text" required placeholder="e.g. Jane Okafor" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" name="email" type="email" required placeholder="name@company.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={8} />
            <p className="text-xs text-slate-500">Minimum 8 chars with uppercase, lowercase, and number.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Account Role</Label>
            <select
              id="role"
              name="role"
              defaultValue="manager"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              required
            >
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">
            Create Account
          </Button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a href="/login" className="font-medium text-emerald-700 hover:text-emerald-800">
              Go to Login
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
