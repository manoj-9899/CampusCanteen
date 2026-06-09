import { describe, expect, it, beforeEach } from "vitest";
import { GET as sessionGet } from "@/app/api/auth/session/route";
import {
  registerViaApi,
  signInViaApi,
  signOutViaApi,
} from "../helpers/auth";
import { getAuthCookieValue } from "../setup/mocks/next-headers";
import { readJson } from "../helpers/request";
import { seedTestDatabase } from "../setup/db";
import { middleware } from "@/middleware";
import { NextRequest } from "next/server";
import { cookieHeader, createSessionToken } from "../helpers/auth";

describe("authentication API", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  it("registers a new student", async () => {
    const res = await registerViaApi({
      name: "Test Student",
      email: "newstudent@test.edu",
      password: "password123",
      studentId: "CS2099001",
    });
    expect(res.status).toBe(200);
    const body = await readJson<{ user: { email: string; role: string } }>(res);
    expect(body.user.email).toBe("newstudent@test.edu");
    expect(body.user.role).toBe("STUDENT");
    expect(getAuthCookieValue()).toBeTruthy();
  });

  it("logs in seeded student", async () => {
    const res = await signInViaApi("student@college.edu", "student123");
    expect(res.status).toBe(200);
    const body = await readJson<{ user: { email: string } }>(res);
    expect(body.user.email).toBe("student@college.edu");
  });

  it("rejects invalid login", async () => {
    const res = await signInViaApi("student@college.edu", "wrongpass");
    expect(res.status).toBe(401);
  });

  it("logs out and clears session", async () => {
    await signInViaApi("student@college.edu", "student123");
    const del = await signOutViaApi();
    expect(del.status).toBe(200);
    const session = await sessionGet();
    const body = await readJson<{ user: null }>(session);
    expect(body.user).toBeNull();
  });
});

describe("staff route protection middleware", () => {
  beforeEach(async () => {
    await seedTestDatabase();
  });

  it("redirects unauthenticated users to login", async () => {
    const req = new NextRequest("http://localhost:3000/staff");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects students away from /staff", async () => {
    const seed = await seedTestDatabase();
    const token = await createSessionToken({
      id: seed.student.id,
      email: seed.student.email,
      name: "Rahul",
      role: "STUDENT",
      studentId: "CS2024001",
    });
    const req = new NextRequest("http://localhost:3000/staff", {
      headers: cookieHeader(token),
    });
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("allows staff through to /staff", async () => {
    const seed = await seedTestDatabase();
    const token = await createSessionToken({
      id: seed.staff.id,
      email: seed.staff.email,
      name: "Priya",
      role: "STAFF",
    });
    const req = new NextRequest("http://localhost:3000/staff", {
      headers: cookieHeader(token),
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });
});
