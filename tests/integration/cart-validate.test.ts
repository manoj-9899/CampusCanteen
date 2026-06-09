import { describe, expect, it, beforeEach } from "vitest";
import { POST as validatePost } from "@/app/api/cart/validate/route";
import { POST as ordersPost } from "@/app/api/orders/route";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest, readJson } from "../helpers/request";
import { seedTestDatabase, getPrisma } from "../setup/db";

describe("POST /api/cart/validate", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    seed = await seedTestDatabase();
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
  });

  async function validate(
    items: { menuItemId: string; quantity: number; price?: number }[],
    ip = "10.4.0.1"
  ) {
    return validatePost(
      jsonRequest("/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({ items }),
        ip,
      })
    );
  }

  it("accepts a valid cart", async () => {
    const res = await validate([
      { menuItemId: seed.menuItems.samosa.id, quantity: 2 },
      { menuItemId: seed.menuItems.tea.id, quantity: 1 },
    ]);
    expect(res.status).toBe(200);
    const body = await readJson<{ valid: boolean; errors: unknown[] }>(res);
    expect(body.valid).toBe(true);
    expect(body.errors).toHaveLength(0);
  });

  it("rejects out-of-stock items", async () => {
    const res = await validate([
      { menuItemId: seed.menuItems.coffee.id, quantity: 1 },
    ]);
    expect(res.status).toBe(200);
    const body = await readJson<{
      valid: boolean;
      errors: { menuItemId: string; message: string }[];
    }>(res);
    expect(body.valid).toBe(false);
    expect(body.errors[0]?.menuItemId).toBe(seed.menuItems.coffee.id);
    expect(body.errors[0]?.message).toMatch(/sold out|unavailable/i);
  });

  it("rejects quantity above available stock", async () => {
    const prisma = await getPrisma();
    await prisma.menuItem.update({
      where: { id: seed.menuItems.samosa.id },
      data: { stockQuantity: 3 },
    });
    await prisma.$disconnect();

    const res = await validate([
      { menuItemId: seed.menuItems.samosa.id, quantity: 5 },
    ]);
    expect(res.status).toBe(200);
    const body = await readJson<{
      valid: boolean;
      errors: { requested: number; available: number }[];
    }>(res);
    expect(body.valid).toBe(false);
    expect(body.errors[0]?.requested).toBe(5);
    expect(body.errors[0]?.available).toBe(3);
  });

  it("rejects deleted or unknown menu items", async () => {
    const res = await validate([
      { menuItemId: "deleted-item-id", quantity: 1 },
    ]);
    expect(res.status).toBe(200);
    const body = await readJson<{
      valid: boolean;
      errors: { name: string; message: string }[];
    }>(res);
    expect(body.valid).toBe(false);
    expect(body.errors[0]?.name).toBe("Unknown item");
    expect(body.errors[0]?.message).toMatch(/no longer on the menu/i);
  });

  it("rejects quantity overflow (schema max 20)", async () => {
    const res = await validate([
      { menuItemId: seed.menuItems.tea.id, quantity: 21 },
    ]);
    expect(res.status).toBe(400);
    const body = await readJson<{ error: string }>(res);
    expect(body.error).toBeTruthy();
  });

  it("ignores client price — server uses DB price at order create", async () => {
    const validateRes = await validate([
      {
        menuItemId: seed.menuItems.samosa.id,
        quantity: 1,
        price: 1,
      },
    ]);
    expect(validateRes.status).toBe(200);
    const validated = await readJson<{ valid: boolean }>(validateRes);
    expect(validated.valid).toBe(true);

    const orderRes = await ordersPost(
      jsonRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify({
          items: [{ menuItemId: seed.menuItems.samosa.id, quantity: 1 }],
        }),
        ip: "10.4.0.2",
      })
    );
    expect(orderRes.status).toBe(201);
    const orderBody = await readJson<{
      order: { totalAmount: number; items: { unitPrice: number }[] };
    }>(orderRes);
    expect(orderBody.order.totalAmount).toBe(20);
    expect(orderBody.order.items[0]?.unitPrice).toBe(20);
  });

  it("rejects empty cart payload", async () => {
    const res = await validatePost(
      jsonRequest("/api/cart/validate", {
        method: "POST",
        body: JSON.stringify({ items: [] }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("requires student session", async () => {
    const { clearTestCookies } = await import("../setup/mocks/next-headers");
    clearTestCookies();

    const res = await validate([
      { menuItemId: seed.menuItems.tea.id, quantity: 1 },
    ]);
    expect(res.status).toBe(401);
  });

  it("detects stock depletion between validate and order", async () => {
    const prisma = await getPrisma();
    await prisma.menuItem.update({
      where: { id: seed.menuItems.samosa.id },
      data: { stockQuantity: 0, isAvailable: false },
    });
    await prisma.$disconnect();

    const res = await validate([
      { menuItemId: seed.menuItems.samosa.id, quantity: 1 },
    ]);
    const body = await readJson<{ valid: boolean }>(res);
    expect(body.valid).toBe(false);
  });
});
