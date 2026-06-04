"use client";

const VARIANT_STYLES = {
  available: "bg-green-100 text-green-800 ring-green-200",
  low: "bg-amber-100 text-amber-900 ring-amber-200",
  out: "bg-red-100 text-red-800 ring-red-200",
  special: "bg-orange-100 text-orange-800 ring-orange-200",
  info: "bg-blue-100 text-blue-800 ring-blue-200",
  success: "bg-green-100 text-green-800 ring-green-200",
  warning: "bg-amber-100 text-amber-900 ring-amber-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

export type StatusChipVariant = keyof typeof VARIANT_STYLES;

export function StatusChip({
  label,
  variant = "neutral",
  className = "",
}: {
  label: string;
  variant?: StatusChipVariant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-inset sm:text-[11px] ${VARIANT_STYLES[variant]} ${className}`}
    >
      {label}
    </span>
  );
}

export function stockChipVariant(
  stockStatus: "available" | "low" | "out"
): StatusChipVariant {
  if (stockStatus === "out") return "out";
  if (stockStatus === "low") return "low";
  return "available";
}

export function orderStatusChipVariant(status: string): StatusChipVariant {
  if (status === "READY_FOR_PICKUP") return "success";
  if (status === "COMPLETED") return "info";
  if (status === "CONFIRMED") return "warning";
  if (status === "CANCELLED") return "out";
  return "neutral";
}

export function orderStatusChipLabel(status: string): string {
  if (status === "COMPLETED") return "Collected";
  if (status === "READY_FOR_PICKUP") return "Ready";
  if (status === "CONFIRMED") return "Preparing";
  return status.replace(/_/g, " ");
}
