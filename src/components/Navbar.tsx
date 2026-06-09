"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getHomePath, triggerHomeReset } from "@/lib/home-nav";
import { Button } from "@/components/ui/Button";

export function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const pathname = usePathname();

  if (pathname === "/login" || pathname === "/register") return null;

  const homePath = getHomePath(user?.role);
  const slimStudentNav = pathname === "/" && user?.role === "STUDENT";
  const slimStaffNav = pathname === "/staff" && user?.role === "STAFF";
  const slimNav = slimStudentNav || slimStaffNav;

  const goHome = (e: React.MouseEvent) => {
    if (pathname === homePath) {
      e.preventDefault();
      triggerHomeReset();
    } else {
      router.push(homePath);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={homePath}
          onClick={goHome}
          className="flex items-center gap-2 rounded-lg transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Go to home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">CampusCanteen</p>
            {!slimNav && (
              <p className="text-xs text-muted">Pre-order &amp; pickup</p>
            )}
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs capitalize text-muted">
                {user.role.toLowerCase()}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Logout</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
