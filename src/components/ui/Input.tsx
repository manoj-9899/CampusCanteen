"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    invalid?: boolean;
  }
>(function Input({ className, invalid = false, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border bg-surface px-3 py-3 text-base text-foreground",
        "placeholder:text-muted",
        "transition-colors",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
        invalid
          ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
          : "border-border",
        "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70",
        className
      )}
      {...props}
    />
  );
});
