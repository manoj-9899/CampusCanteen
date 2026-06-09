import { cn } from "@/lib/cn";

const VARIANTS = {
  error: "border-red-200 bg-danger-light text-red-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
} as const;

export function Alert({
  variant = "error",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof VARIANTS;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm",
        VARIANTS[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
