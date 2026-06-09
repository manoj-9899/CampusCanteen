"use client";

import { LogOut } from "lucide-react";
import { HowItWorksPanel } from "../HowItWorksPanel";
import { NotificationPermissionBanner } from "../NotificationPermissionBanner";
import { PwaInstallPanel } from "../PwaInstallPanel";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
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
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Signed in as
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{user.name}</p>
          {user.studentId && (
            <p className="text-sm text-muted">ID: {user.studentId}</p>
          )}
          <p className="mt-0.5 text-sm text-muted">{user.email}</p>
          <Button
            variant="outline"
            fullWidth
            onClick={onLogout}
            className="mt-4"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </Button>
        </CardContent>
      </Card>
      <PwaInstallPanel variant="card" />
      <NotificationPermissionBanner />
      <HowItWorksPanel />
    </div>
  );
}
