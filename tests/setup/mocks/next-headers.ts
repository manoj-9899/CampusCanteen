import { vi } from "vitest";
import { AUTH_COOKIE } from "@/lib/session-token";

type CookieEntry = { name: string; value: string };

const jar = new Map<string, string>();

export function setTestCookie(name: string, value: string) {
  if (!value) jar.delete(name);
  else jar.set(name, value);
}

export function getTestCookie(name: string) {
  return jar.get(name);
}

export function clearTestCookies() {
  jar.clear();
}

export function getAuthCookieValue() {
  return jar.get(AUTH_COOKIE);
}

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string): CookieEntry | undefined => {
      const value = jar.get(name);
      return value ? { name, value } : undefined;
    },
    set: (
      name: string,
      value: string,
      _options?: { maxAge?: number }
    ) => {
      if (!value || _options?.maxAge === 0) jar.delete(name);
      else jar.set(name, value);
    },
  })),
}));
