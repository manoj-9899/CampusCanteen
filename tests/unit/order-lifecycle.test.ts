import { describe, expect, it } from "vitest";
import {
  applyStaffStatusUpdate,
  canStudentCancelOrder,
  confirmStaffHandover,
  isValidStaffStatusTransition,
} from "@/lib/order-lifecycle";
import { beforeEach } from "vitest";
import { seedTestDatabase } from "../setup/db";
import { createPaidOrder, createPendingOrder } from "../helpers/orders";
import { getPrisma } from "../setup/db";

describe("order lifecycle rules", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  it("allows CONFIRMED → READY_FOR_PICKUP", () => {
    expect(isValidStaffStatusTransition("CONFIRMED", "READY_FOR_PICKUP")).toBe(
      true
    );
  });

  it("allows READY_FOR_PICKUP → COMPLETED", () => {
    expect(isValidStaffStatusTransition("READY_FOR_PICKUP", "COMPLETED")).toBe(
      true
    );
  });

  it("rejects CONFIRMED → COMPLETED", () => {
    expect(isValidStaffStatusTransition("CONFIRMED", "COMPLETED")).toBe(false);
  });

  it("rejects READY_FOR_PICKUP → CANCELLED", () => {
    expect(isValidStaffStatusTransition("READY_FOR_PICKUP", "CANCELLED")).toBe(
      false
    );
  });

  it("rejects invalid transitions from COMPLETED", () => {
    expect(isValidStaffStatusTransition("COMPLETED", "CONFIRMED")).toBe(false);
  });

  it("student can cancel PENDING and CONFIRMED only", () => {
    expect(canStudentCancelOrder("PENDING")).toBe(true);
    expect(canStudentCancelOrder("CONFIRMED")).toBe(true);
    expect(canStudentCancelOrder("READY_FOR_PICKUP")).toBe(false);
  });
});

describe("order lifecycle integration", () => {
  let studentId: string;
  let samosaId: string;

  beforeEach(async () => {
    const seed = await seedTestDatabase();
    studentId = seed.student.id;
    samosaId = seed.menuItems.samosa.id;
  });

  it("CONFIRMED → READY_FOR_PICKUP via applyStaffStatusUpdate", async () => {
    const order = await createPaidOrder(studentId, [
      { menuItemId: samosaId, quantity: 1, unitPrice: 20 },
    ]);
    const updated = await applyStaffStatusUpdate(order.id, "READY_FOR_PICKUP");
    expect(updated.status).toBe("READY_FOR_PICKUP");
  });

  it("READY_FOR_PICKUP → COMPLETED via confirmStaffHandover", async () => {
    const order = await createPaidOrder(
      studentId,
      [{ menuItemId: samosaId, quantity: 1, unitPrice: 20 }],
      "READY_FOR_PICKUP"
    );
    const updated = await confirmStaffHandover(order.id);
    expect(updated.status).toBe("COMPLETED");
    expect(updated.collectedAt).not.toBeNull();

    const prisma = await getPrisma();
    const row = await prisma.order.findUnique({ where: { id: order.id } });
    expect(row?.pickupSecret).toBeNull();
    await prisma.$disconnect();
  });

  it("rejects CONFIRMED → COMPLETED direct transition", async () => {
    const order = await createPaidOrder(studentId, [
      { menuItemId: samosaId, quantity: 1, unitPrice: 20 },
    ]);
    await expect(applyStaffStatusUpdate(order.id, "COMPLETED")).rejects.toThrow(
      "INVALID_TRANSITION"
    );
  });

  it("rejects READY_FOR_PICKUP → CANCELLED", async () => {
    const order = await createPaidOrder(
      studentId,
      [{ menuItemId: samosaId, quantity: 1, unitPrice: 20 }],
      "READY_FOR_PICKUP"
    );
    await expect(
      applyStaffStatusUpdate(order.id, "CANCELLED")
    ).rejects.toThrow("INVALID_TRANSITION");
  });

  it("restores stock on paid CONFIRMED cancel", async () => {
    const prisma = await getPrisma();
    const before = await prisma.menuItem.findUnique({
      where: { id: samosaId },
    });
    const order = await createPaidOrder(studentId, [
      { menuItemId: samosaId, quantity: 2, unitPrice: 20 },
    ]);
    await prisma.menuItem.update({
      where: { id: samosaId },
      data: { stockQuantity: { decrement: 2 } },
    });

    const { cancelOrderByStudent } = await import("@/lib/order-lifecycle");
    await cancelOrderByStudent(order.id, studentId);

    const after = await prisma.menuItem.findUnique({
      where: { id: samosaId },
    });
    expect(after!.stockQuantity).toBe(before!.stockQuantity);
    await prisma.$disconnect();
  });
});
