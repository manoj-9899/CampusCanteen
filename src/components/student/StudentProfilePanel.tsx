"use client";

import { LogOut } from "lucide-react";
import { HowItWorksPanel } from "../HowItWorksPanel";
import { NotificationPermissionBanner } from "../NotificationPermissionBanner";
import { PwaInstallPanel } from "../PwaInstallPanel";
import type { SessionUser } from "@/types";

export function StudentProfilePanel({
  user,
  onLogout,
}: {
  user: SessionUser;
  onLogout: () => void;
}) {
  return (
    <div className="space-y-3 lg:hidden">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Signed in as
        </p>
        <p className="mt-1 text-lg font-bold text-slate-900">{user.name}</p>
        {user.studentId && (
          <p className="text-sm text-slate-600">ID: {user.studentId}</p>
        )}
        <p className="mt-0.5 text-sm text-slate-500">{user.email}</p>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium text-slate-700"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
      <PwaInstallPanel variant="card" />
      <NotificationPermissionBanner />
      <HowItWorksPanel />
    </div>
  );
}
