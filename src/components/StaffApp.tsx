"use client";

import { RefreshCw } from "lucide-react";
import { PwaInstallPanel } from "./PwaInstallPanel";
import { StaffInventoryPanel } from "./staff/StaffInventoryPanel";
import { StaffLowStockBanner } from "./staff/StaffLowStockBanner";
import { StaffMenuPanel } from "./staff/StaffMenuPanel";
import { StaffMobileHeader } from "./staff/StaffMobileHeader";
import { StaffTabBar } from "./staff/StaffTabBar";
import { StaffVerifyPanel } from "./staff/StaffVerifyPanel";
import { StaffDashboardPanel } from "./staff/panels/StaffDashboardPanel";
import { StaffForecastPanel } from "./staff/panels/StaffForecastPanel";
import { StaffQueuePanel } from "./staff/panels/StaffQueuePanel";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/Spinner";
import { useStaffApp } from "@/hooks/useStaffApp";

export function StaffApp() {
  const app = useStaffApp();

  if (app.loading || !app.user) {
    return <PageLoader label="Loading staff dashboard" />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-4 pb-8 sm:py-6">
      <StaffMobileHeader />

      <div className="mb-4 hidden items-center justify-between gap-3 sm:mb-6 lg:flex">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Canteen counter</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Pickup queue · token verification · inventory
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={app.loadAll}
          disabled={app.refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${app.refreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="mb-4 flex items-center justify-end gap-3 lg:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={app.loadAll}
          disabled={app.refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${app.refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      <PwaInstallPanel variant="compact" className="mb-3 lg:hidden" />
      <PwaInstallPanel variant="card" className="mb-4 hidden lg:block" />

      <StaffTabBar active={app.tab} onChange={app.setTab} />

      {app.tab !== "inventory" && app.lowStockAlerts.length > 0 && (
        <StaffLowStockBanner
          alerts={app.lowStockAlerts}
          onGoToInventory={() => app.setTab("inventory")}
        />
      )}

      {app.tab === "queue" && (
        <StaffQueuePanel
          queue={app.queue}
          busy={app.busy}
          onMarkReady={(orderId) => void app.markReady(orderId)}
        />
      )}

      {app.tab === "verify" && (
        <StaffVerifyPanel
          pendingCount={app.readyForPickupCount}
          scanning={app.scanning}
          tokenInput={app.tokenInput}
          verifyResult={app.verifyResult}
          busy={app.busy}
          onToggleScanning={() => {
            app.setScanning((s) => !s);
            app.setVerifyResult(null);
          }}
          onTokenChange={app.setTokenInput}
          onVerify={() => void app.verifyToken()}
          onQrScan={app.handleQrScan}
          onCloseScanner={() => app.setScanning(false)}
          onConfirmHandover={(orderId) => void app.confirmHandover(orderId)}
        />
      )}

      {app.tab === "menu" && (
        <div id="staff-panel-menu" role="tabpanel" aria-labelledby="staff-tab-menu">
          <StaffMenuPanel
            items={app.inventory}
            busy={app.busy}
            onCreate={app.createMenuItem}
            onUpdate={app.updateMenuItem}
            onDelete={app.deleteMenuItem}
          />
        </div>
      )}

      {app.tab === "inventory" && (
        <StaffInventoryPanel
          inventory={app.inventory}
          busy={app.busy}
          onToggleAvailability={app.setAvailability}
          onAddStock={(menuItemId, qty) =>
            app.updateStock(menuItemId, { addStock: qty })
          }
          onSetStock={(menuItemId, qty) =>
            app.updateStock(menuItemId, { stockQuantity: qty })
          }
          onSetLowStockThreshold={(menuItemId, threshold) =>
            app.updateStock(menuItemId, { lowStockThreshold: threshold })
          }
        />
      )}

      {app.tab === "sales" && (
        <StaffDashboardPanel analytics={app.dailyAnalytics} />
      )}

      {app.tab === "forecast" && (
        <StaffForecastPanel
          forecast={app.forecast}
          chartReady={app.forecastChartReady}
        />
      )}
    </div>
  );
}
