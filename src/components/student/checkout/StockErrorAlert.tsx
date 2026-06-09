import { AlertCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import type { StockValidationError } from "@/types";

export function StockErrorAlert({
  error,
  stockErrors,
}: {
  error?: string;
  stockErrors?: StockValidationError[];
}) {
  if (!error && (!stockErrors || stockErrors.length === 0)) return null;

  return (
    <Alert variant="error" className="mt-4 flex gap-2">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
      <div>
        {error && <p>{error}</p>}
        {stockErrors && stockErrors.length > 0 && (
          <ul className="mt-1 list-disc pl-4">
            {stockErrors.map((e) => (
              <li key={e.menuItemId}>{e.message}</li>
            ))}
          </ul>
        )}
      </div>
    </Alert>
  );
}
