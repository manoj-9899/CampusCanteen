import { describe, expect, it, beforeEach } from "vitest";
import { POST as authPost } from "@/app/api/auth/route";
import { POST as ordersPost } from "@/app/api/orders/route";
import { POST as verifyPost } from "@/app/api/orders/verify/route";
import { RATE_LIMITS, resetRateLimitStore } from "@/lib/rate-limit";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest } from "../helpers/request";
import { seedTestDatabase } from "../setup/db";
import { createPaidOrder } from "../helpers/orders";

describe("API rate limits", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    resetRateLimitStore();
    seed = await seedTestDatabase();
  });

  it("limits login attempts per IP", async () => {
    const ip = "192.168.1.100";
    let lastStatus = 0;
    for (let i = 0; i < RATE_LIMITS.authLogin.limit + 1; i++) {
      const res = await authPost(
        jsonRequest("/api/auth", {
          method: "POST",
          body: JSON.stringify({
            action: "login",
            email: "student@college.edu",
            password: "wrong",
          }),
          ip,
        })
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("limits order creation per student", async () => {
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    let lastStatus = 0;
    for (let i = 0; i < RATE_LIMITS.ordersCreate.limit + 1; i++) {
      const res = await ordersPost(
        jsonRequest("/api/orders", {
          method: "POST",
          body: JSON.stringify({
            items: [{ menuItemId: seed.menuItems.tea.id, quantity: 1 }],
          }),
          ip: `10.3.0.${i}`,
        })
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });

  it("limits verify endpoint per staff user", async () => {
    const order = await createPaidOrder(seed.student.id, [
      { menuItemId: seed.menuItems.samosa.id, quantity: 1, unitPrice: 20 },
    ]);
    await setSessionCookie({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
    let lastStatus = 0;
    for (let i = 0; i < RATE_LIMITS.ordersVerify.limit + 1; i++) {
      const res = await verifyPost(
        jsonRequest("/api/orders/verify", {
          method: "POST",
          body: JSON.stringify({
            orderId: order.id,
            pickupSecret: order.pickupSecret,
          }),
          ip: "10.4.0.1",
        })
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});
