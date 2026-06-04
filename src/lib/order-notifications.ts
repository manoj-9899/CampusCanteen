export type OrderNotifyKind = "ready" | "collected";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<
  NotificationPermission | "unsupported"
> {
  if (!isNotificationSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export function showOrderNotification(
  kind: OrderNotifyKind,
  tokenNumber: string,
  orderId: string
): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;

  const isReady = kind === "ready";
  const title = isReady ? "Your order is ready!" : "Pickup confirmed";
  const body = isReady
    ? `Token ${tokenNumber} — come to the counter with your QR.`
    : `Order ${tokenNumber} has been collected. Enjoy your meal!`;

  try {
    const notification = new Notification(title, {
      body,
      tag: `campus-canteen-${orderId}-${kind}`,
      icon: "/icons/icon-192.svg",
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // ignore unsupported environments
  }
}

export function notifyOrderReady(tokenNumber: string, orderId: string): void {
  showOrderNotification("ready", tokenNumber, orderId);
}

export function notifyOrderCollected(tokenNumber: string, orderId: string): void {
  showOrderNotification("collected", tokenNumber, orderId);
}
