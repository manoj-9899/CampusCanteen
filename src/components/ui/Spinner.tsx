import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn("flex items-center justify-center", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner label={label} />
    </div>
  );
}
