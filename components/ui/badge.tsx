import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: "default" | "outline";
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "outline" ? "border-slate-200 text-slate-700" : "border-transparent bg-slate-900 text-slate-50",
        className
      )}
      {...props}
    />
  );
}

export { Badge };
