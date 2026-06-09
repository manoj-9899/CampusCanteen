import { describe, expect, it, beforeEach } from "vitest";
import { GET as menuGet, POST as menuPost } from "@/app/api/menu/route";
import { setSessionCookie } from "../helpers/auth";
import { jsonRequest, readJson } from "../helpers/request";
import { seedTestDatabase } from "../setup/db";

describe("menu API", () => {
  let seed: Awaited<ReturnType<typeof seedTestDatabase>>;

  beforeEach(async () => {
    seed = await seedTestDatabase();
  });

  it("fetches menu without authentication", async () => {
    const res = await menuGet();
    expect(res.status).toBe(200);
    const body = await readJson<{
      items: { name: string; canOrder: boolean }[];
    }>(res);
    expect(body.items.length).toBe(3);
    expect(body.items.find((i) => i.name === "Samosa")).toBeTruthy();
  });

  it("marks sold-out coffee as not orderable", async () => {
    const res = await menuGet();
    const body = await readJson<{
      items: { name: string; canOrder: boolean; availabilityLabel: string }[];
    }>(res);
    const coffee = body.items.find((i) => i.name === "Coffee");
    expect(coffee?.canOrder).toBe(false);
    expect(coffee?.availabilityLabel).toBe("Sold out");
  });

  it("rejects menu create for students", async () => {
    await setSessionCookie({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    const res = await menuPost(
      jsonRequest("/api/menu", {
        method: "POST",
        body: JSON.stringify({
          name: "Test Item",
          description: "Test",
          price: 10,
          category: "Snacks",
          imageEmoji: "🍽️",
          isAvailable: true,
          stockQuantity: 5,
        }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("allows staff to create menu items", async () => {
    await setSessionCookie({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
    const res = await menuPost(
      jsonRequest("/api/menu", {
        method: "POST",
        body: JSON.stringify({
          name: "Dosa",
          description: "Crispy dosa",
          price: 45,
          category: "Breakfast",
          imageEmoji: "🥞",
          isAvailable: true,
          stockQuantity: 10,
        }),
      })
    );
    expect(res.status).toBe(201);
    const body = await readJson<{ item: { name: string } }>(res);
    expect(body.item.name).toBe("Dosa");
  });
});
