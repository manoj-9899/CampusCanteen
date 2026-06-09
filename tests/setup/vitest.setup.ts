import "./env";
import "./mocks/next-headers";
import { afterEach, beforeAll } from "vitest";
import { clearTestCookies } from "./mocks/next-headers";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { ensureTestDatabase } from "./db";

beforeAll(async () => {
  await ensureTestDatabase();
}, 60_000);

afterEach(() => {
  clearTestCookies();
  resetRateLimitStore();
});
