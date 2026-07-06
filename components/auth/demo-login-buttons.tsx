"use client";

import { Button } from "@/components/ui/button";

type DemoUser = {
  label: string;
  email: string;
  password: string;
};

const demoUsers: DemoUser[] = [
  {
    label: "Fill Admin Test User",
    email: "admin@company.com",
    password: "SecurePassword123!",
  },
  {
    label: "Fill Manager Test User",
    email: "manager@company.com",
    password: "SecurePassword123!",
  },
];

export function DemoLoginButtons() {
  function fillCredentials(user: DemoUser) {
    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const passwordInput = document.getElementById("password") as HTMLInputElement | null;

    if (!emailInput || !passwordInput) {
      return;
    }

    emailInput.value = user.email;
    passwordInput.value = user.password;

    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className="rounded-md border border-slate-200 bg-slate-100/70 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Quick Test Autofill</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {demoUsers.map((user) => (
          <Button
            key={user.email}
            type="button"
            variant="outline"
            className="h-9 flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => fillCredentials(user)}
          >
            {user.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
