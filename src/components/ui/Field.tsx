"use client";

import { cn } from "@/lib/cn";
import { Input } from "./Input";

export function Field({
  label,
  hint,
  error,
  className,
  inputClassName,
  id,
  required,
  ...inputProps
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
  id?: string;
  required?: boolean;
} & React.ComponentProps<typeof Input>) {
  const fieldId = id ?? inputProps.name;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={fieldId}
        className="block text-sm font-medium text-foreground"
      >
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <Input
        id={fieldId}
        required={required}
        invalid={!!error}
        className={inputClassName}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        {...inputProps}
      />
      {hint && !error && (
        <p id={`${fieldId}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${fieldId}-error`} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
