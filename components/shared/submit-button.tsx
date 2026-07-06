"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import React from "react";

// 🚨 Bulletproof interface: Extends standard HTML buttons AND explicitly types Shadcn props
interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null;
  size?: "default" | "sm" | "lg" | "icon" | null;
}

export function SubmitButton({ 
  children, 
  icon, 
  className, 
  variant, 
  size, 
  ...props 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending || props.disabled} 
      className={className} 
      variant={variant}
      size={size}
      {...props}
    >
      {pending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        icon && <span className="mr-2">{icon}</span>
      )}
      {pending ? "Processing..." : children}
    </Button>
  );
}