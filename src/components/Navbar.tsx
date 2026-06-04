"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, UtensilsCrossed } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { getHomePath, triggerHomeReset } from "@/lib/home-nav";

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
    <header className="sticky top-0 z-50 border-b border-orange-100 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link
          href={homePath}
          onClick={goHome}
          className="flex items-center gap-2 rounded-lg transition hover:opacity-80"
          aria-label="Go to home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">CampusCanteen</p>
            {!slimNav && (
              <p className="text-xs text-slate-500">Pre-order & Pickup</p>
            )}
          </div>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500 capitalize">{user.role.toLowerCase()}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="touch-target-sm inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
