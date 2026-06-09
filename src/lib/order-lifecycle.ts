import type { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { restoreStock, type CartLine } from "./inventory";
import {
  PENDING_ORDER_EXPIRED_MESSAGE,
  PENDING_ORDER_TTL_MS,
  isPendingOrderExpired,
} from "./pending-order";

export {
  PENDING_ORDER_EXPIRED_MESSAGE,
  PENDING_ORDER_TTL_MS,
  isPendingOrderExpired,
};

const orderInclude = {
  items: { include: { menuItem: true } },
  user: { select: { name: true, studentId: true } },
} satisfies Prisma.OrderInclude;

export type LifecycleErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CANNOT_CANCEL"
  | "INVALID_TRANSITION"
  | "EXPIRED";

/**
 * Allowed order-status transitions (OrderStatus + PaymentStatus are separate).
 *
 * | From              | To                 | Actor   | Stock        | Payment      |
 * |-------------------|--------------------|---------|--------------|--------------|
 * | (create)          | PENDING            | Student | —            | PENDING      |
 * | PENDING           | CONFIRMED          | Payment | deduct       | PAID         |
 * | PENDING           | CANCELLED          | Student / expiry | —     | PENDING      |
 * | CONFIRMED         | READY_FOR_PICKUP   | Staff   | —            | PAID         |
 * | CONFIRMED         | CANCELLED          | Student | restore      | REFUNDED     |
 * | READY_FOR_PICKUP  | COMPLETED          | Staff   | —            | PAID         |
 * | READY_FOR_PICKUP  | CANCELLED          | —       | (blocked)    | —            |
 * | COMPLETED         | —                  | final   | —            | PAID         |
 * | CANCELLED         | —                  | final   | —            | varies       |
 *
 * PaymentStatus FAILED / REFUNDED: REFUNDED set on paid student cancel only.
 */
export const STAFF_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [],
  CONFIRMED: ["READY_FOR_PICKUP", "CANCELLED"],
  READY_FOR_PICKUP: ["COLLECTED", "COMPLETED"],
  COLLECTED: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canStudentCancelOrder(status: OrderStatus): boolean {
  return status === "PENDING" || status === "CONFIRMED";
}

export function isValidStaffStatusTransition(
  from: OrderStatus,
  to: OrderStatus
): boolean {
  return STAFF_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Cancel unpaid PENDING orders older than 15 minutes (no stock was deducted). */
export async function expireStalePendingOrders(
  userId?: string
): Promise<number> {
  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MS);
  const result = await prisma.order.updateMany({
    where: {
      status: "PENDING",
      paymentStatus: "PENDING",
      createdAt: { lt: cutoff },
      ...(userId ? { userId } : {}),
    },
    data: { status: "CANCELLED" },
  });
  return result.count;
}

function toCartLines(
  items: { menuItemId: string; quantity: number }[]
): CartLine[] {
  return items.map((i) => ({
    menuItemId: i.menuItemId,
    quantity: i.quantity,
  }));
}

type CancelResult = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export async function cancelOrderByStudent(
  orderId: string,
  userId: string
): Promise<CancelResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("NOT_FOUND");
    }
    if (order.userId !== userId) {
      throw new Error("FORBIDDEN");
    }
    if (!canStudentCancelOrder(order.status)) {
      throw new Error("CANNOT_CANCEL");
    }

    if (order.status === "PENDING" && order.paymentStatus === "PENDING") {
      return tx.order.update({
        where: { id: orderId },
        data: { status: "CANCELLED" },
        include: orderInclude,
      });
    }

    if (order.status === "CONFIRMED" && order.paymentStatus === "PAID") {
      await restoreStock(toCartLines(order.items), tx);
      return tx.order.update({
        where: { id: orderId },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
        },
        include: orderInclude,
      });
    }

    throw new Error("CANNOT_CANCEL");
  });
}

export async function applyStaffStatusUpdate(
  orderId: string,
  nextStatus: OrderStatus
): Promise<CancelResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new Error("NOT_FOUND");
    }
    if (!isValidStaffStatusTransition(order.status, nextStatus)) {
      throw new Error("INVALID_TRANSITION");
    }

    const data: {
      status: OrderStatus;
      collectedAt?: Date;
      paymentStatus?: PaymentStatus;
      pickupSecret?: null;
    } = { status: nextStatus };

    if (nextStatus === "COLLECTED" || nextStatus === "COMPLETED") {
      data.collectedAt = new Date();
    }

    if (nextStatus === "COMPLETED") {
      data.pickupSecret = null;
    }

    if (
      nextStatus === "CANCELLED" &&
      order.paymentStatus === "PAID" &&
      (order.status === "CONFIRMED" || order.status === "READY_FOR_PICKUP")
    ) {
      await restoreStock(toCartLines(order.items), tx);
      data.paymentStatus = "REFUNDED";
    }

    return tx.order.update({
      where: { id: orderId },
      data,
      include: orderInclude,
    });
  });
}

/** Staff confirms physical handover — only from READY_FOR_PICKUP → COMPLETED. */
export async function confirmStaffHandover(
  orderId: string
): Promise<CancelResult> {
  return applyStaffStatusUpdate(orderId, "COMPLETED");
}

export function lifecycleErrorMessage(code: LifecycleErrorCode): string {
  switch (code) {
    case "NOT_FOUND":
      return "Order not found.";
    case "FORBIDDEN":
      return "You do not have permission to modify this order.";
    case "CANNOT_CANCEL":
      return "This order can no longer be cancelled.";
    case "INVALID_TRANSITION":
      return "That status change is not allowed.";
    case "EXPIRED":
      return "This order expired. Please place a new order.";
    default:
      return "Order could not be updated.";
  }
}
