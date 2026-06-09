import { describe, expect, it, beforeEach } from "vitest";
import { POST as ordersPost } from "@/app/api/orders/route";
import { POST as cancelPost } from "@/app/api/orders/[id]/cancel/route";
import { POST as confirmHandoverPost } from "@/app/api/orders/[id]/confirm-handover/route";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest, readJson } from "../helpers/request";
import { seedTestDatabase } from "../setup/db";
import { createPaidOrder } from "../helpers/orders";
import { applyStaffStatusUpdate } from "@/lib/order-lifecycle";

describe("ordering API", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    seed = await seedTestDatabase();
  });

  it("creates a pending order for student", async () => {
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    const res = await ordersPost(
      jsonRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ menuItemId: seed.menuItems.samosa.id, quantity: 2 }],
        }),
        ip: "10.1.0.1",
      })
    );
    expect(res.status).toBe(201);
    const body = await readJson<{
      order: { status: string; paymentStatus: string; totalAmount: number };
    }>(res);
    expect(body.order.status).toBe("PENDING");
    expect(body.order.paymentStatus).toBe("PENDING");
    expect(body.order.totalAmount).toBe(40);
  });

  it("cancels a pending order", async () => {
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    const createRes = await ordersPost(
      jsonRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ menuItemId: seed.menuItems.tea.id, quantity: 1 }],
        }),
        ip: "10.1.0.2",
      })
    );
    const { order } = await readJson<{ order: { id: string } }>(createRes);

    const cancelRes = await cancelPost(
      jsonRequest(`/api/orders/${order.id}/cancel`, { method: "POST" }),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(cancelRes.status).toBe(200);
    const cancelled = await readJson<{ order: { status: string } }>(cancelRes);
    expect(cancelled.order.status).toBe("CANCELLED");
  });

  it("rejects confirm-handover from CONFIRMED", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await setSessionCookie({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
    const res = await confirmHandoverPost(
      jsonRequest(`/api/orders/${order.id}/confirm-handover`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(res.status).toBe(400);
    const body = await readJson<{ error: string }>(res);
    expect(body.error).toContain("ready for pickup");
  });

  it("completes order only after READY_FOR_PICKUP", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await applyStaffStatusUpdate(order.id, "READY_FOR_PICKUP");
    await setSessionCookie({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
    const res = await confirmHandoverPost(
      jsonRequest(`/api/orders/${order.id}/confirm-handover`, {
        method: "POST",
      }),
      { params: Promise.resolve({ id: order.id }) }
    );
    expect(res.status).toBe(200);
    const body = await readJson<{ order: { status: string } }>(res);
    expect(body.order.status).toBe("COMPLETED");
  });
});
