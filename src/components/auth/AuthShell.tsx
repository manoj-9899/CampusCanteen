import Link from "next/link";
import { UtensilsCrossed } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-sm">
          <UtensilsCrossed className="h-6 w-6" aria-hidden />
        </span>
        <p className="mt-3 text-lg font-bold text-foreground">CampusCanteen</p>
        <p className="text-sm text-muted">Pre-order &amp; pickup</p>
      </div>

      <Card className="shadow-md">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">{description}</p>
          <div className="mt-6">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-muted">
        <Link href="/login" className="hover:text-foreground">
          Secure sign-in
        </Link>
        {" · "}
        Inventory-aware ordering
      </p>
    </div>
  );
}
