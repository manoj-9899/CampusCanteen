"use client";

import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

const VARIANTS = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover disabled:bg-slate-300",
  secondary:
    "bg-surface-muted text-foreground border border-border hover:bg-slate-100 active:bg-slate-200",
  outline:
    "border border-border bg-surface text-foreground hover:bg-surface-muted active:bg-slate-100",
  ghost: "text-muted hover:bg-surface-muted hover:text-foreground active:bg-slate-100",
  success: "bg-success text-white hover:bg-success-hover active:bg-success-hover",
  danger: "bg-danger text-white hover:bg-red-700 active:bg-red-800",
} as const;

const SIZES = {
  sm: "min-h-9 px-3 py-1.5 text-sm rounded-lg gap-1.5",
  md: "min-h-11 px-4 py-2.5 text-sm rounded-xl gap-2",
  lg: "min-h-12 px-5 py-3 text-base rounded-xl gap-2",
  icon: "min-h-11 min-w-11 p-0 rounded-xl",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    fullWidth?: boolean;
  }
>(function Button(
  {
    className,
    variant = "primary",
    size = "md",
    loading = false,
    fullWidth = false,
    disabled,
    children,
    type = "button",
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "touch-target inline-flex items-center justify-center font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
