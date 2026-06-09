"use client";

import { CheckCircle2, PackageCheck, QrCode, Search } from "lucide-react";
import { QrScanner } from "@/components/QrScanner";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { StaffVerifyMobile } from "./StaffVerifyMobile";
import type { Order } from "@/types";

export type VerifyResultState = {
  ok: boolean;
  message: string;
  order?: Order;
  needsHandoverConfirm?: boolean;
  handoverComplete?: boolean;
};

function VerifyResultCard({
  result,
  busy,
  onConfirmHandover,
}: {
  result: VerifyResultState;
  busy: boolean;
  onConfirmHandover: (orderId: string) => void;
}) {
  const variant = result.ok
    ? result.handoverComplete
      ? "info"
      : "success"
    : "error";

  return (
    <Alert variant={variant} className="mt-4 p-4">
      <div className="flex gap-2">
        {result.ok && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />}
        <div className="flex-1">
          <p>{result.message}</p>
          {result.order && (
            <>
              <p className="mt-1 font-mono font-bold">
                {result.order.tokenNumber} · {result.order.orderCode}
              </p>
              <p className="text-xs">
                {result.order.user?.name}
                {result.order.user?.studentId &&
                  ` · ${result.order.user.studentId}`}
              </p>
            </>
          )}
        </div>
      </div>
      {result.order && (
        <ul className="mt-2 space-y-1 border-t border-current/10 pt-2">
          {result.order.items.map((i) => (
            <li key={i.id}>
              {i.menuItem.imageEmoji} {i.menuItem.name} ×{i.quantity}
            </li>
          ))}
        </ul>
      )}
      {result.ok &&
        result.needsHandoverConfirm &&
        result.order &&
        !result.handoverComplete && (
          <Button
            variant="success"
            size="lg"
            fullWidth
            loading={busy}
            onClick={() => onConfirmHandover(result.order!.id)}
            className="mt-4"
          >
            <PackageCheck className="h-5 w-5" />
            Confirm pickup — food handed over
          </Button>
        )}
    </Alert>
  );
}

export function StaffVerifyPanel({
  pendingCount,
  scanning,
  tokenInput,
  verifyResult,
  busy,
  onToggleScanning,
  onTokenChange,
  onVerify,
  onQrScan,
  onCloseScanner,
  onConfirmHandover,
}: {
  pendingCount: number;
  scanning: boolean;
  tokenInput: string;
  verifyResult: VerifyResultState | null;
  busy: boolean;
  onToggleScanning: () => void;
  onTokenChange: (value: string) => void;
  onVerify: () => void;
  onQrScan: (raw: string) => void;
  onCloseScanner: () => void;
  onConfirmHandover: (orderId: string) => void;
}) {
  return (
    <Card className="max-w-lg">
      <CardContent className="p-4 sm:p-6">
        <StaffVerifyMobile pendingCount={pendingCount} />
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" aria-hidden />
          Verify pickup
        </CardTitle>
        <CardDescription>
          Scan the student&apos;s QR code or enter token / order ID manually
        </CardDescription>

        <Button
          fullWidth
          variant={scanning ? "secondary" : "primary"}
          onClick={onToggleScanning}
          className="mt-4"
        >
          {scanning ? "Hide scanner" : "Verify with QR"}
        </Button>

        {scanning ? (
          <QrScanner onScan={onQrScan} onClose={onCloseScanner} />
        ) : (
          <div className="mt-4 flex flex-col items-center rounded-2xl border-2 border-dashed border-border bg-surface-muted px-4 py-10 text-center">
            <QrCode className="mb-2 h-10 w-10 text-muted" aria-hidden />
            <p className="text-sm text-foreground">
              Tap <strong>Verify with QR</strong> above
            </p>
            <p className="mt-1 text-xs text-muted">
              Camera or photo scan for student receipt
            </p>
          </div>
        )}

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted">or enter manually</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={tokenInput}
            onChange={(e) => onTokenChange(e.target.value.toUpperCase())}
            placeholder="Token A154 or ORD-2026-54"
            className="min-h-11 flex-1 font-mono uppercase"
            aria-label="Pickup token or order code"
          />
          <Button
            variant="success"
            onClick={onVerify}
            loading={busy}
            className="min-w-[5.5rem]"
          >
            <Search className="h-4 w-4" />
            Verify
          </Button>
        </div>

        {verifyResult && (
          <VerifyResultCard
            result={verifyResult}
            busy={busy}
            onConfirmHandover={onConfirmHandover}
          />
        )}
      </CardContent>
    </Card>
  );
}
