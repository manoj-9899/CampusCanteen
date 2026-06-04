export const ORDER_TRACKING_STEPS = [
  { label: "Order placed", shortLabel: "Placed" },
  { label: "Being packed", shortLabel: "Packing" },
  { label: "Ready for pickup", shortLabel: "Ready" },
  { label: "Collected", shortLabel: "Done" },
] as const;

/** 1–4: current active step index */
export function getActiveStepIndex(status: string): number {
  switch (status) {
    case "CONFIRMED":
      return 2;
    case "READY_FOR_PICKUP":
      return 3;
    case "COMPLETED":
      return 4;
    default:
      return 1;
  }
}

export type PickupAlertType = "ready" | "collected";

export interface PickupAlert {
  type: PickupAlertType;
  tokenNumber: string;
  orderCode: string;
}

export function pickupAlertMessage(alert: PickupAlert): { title: string; body: string } {
  if (alert.type === "ready") {
    return {
      title: "Your order is ready!",
      body: `Order ${alert.tokenNumber} (${alert.orderCode}) — head to the pickup counter and show your QR or token.`,
    };
  }
  return {
    title: "Pickup confirmed!",
    body: `Order ${alert.tokenNumber} (${alert.orderCode}) — staff has handed over your food. Enjoy your meal!`,
  };
}
