import type { NextRequest } from "next/server";

/**
 * In-memory sliding-window rate limiter.
 *
 * Strategy: per-process Map keyed by bucket + client identifier (IP or user id).
 * No Redis/Upstash — keeps Netlify deploy simple. Effective against brute-force
 * bursts; on serverless, limits apply per warm instance (still worthwhile for
 * campus-scale abuse).
 */

type WindowEntry = { count: number; resetAt: number };

const windows = new Map<string, WindowEntry>();

let opsSinceCleanup = 0;

function cleanupExpired(now: number) {
  for (const [key, entry] of windows) {
    if (now >= entry.resetAt) windows.delete(key);
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  opsSinceCleanup++;
  if (opsSinceCleanup >= 200) {
    opsSinceCleanup = 0;
    cleanupExpired(now);
  }

  const entry = windows.get(key);
  if (!entry || now >= entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count++;
  return { allowed: true };
}

/** Preset limits for protected routes. */
export const RATE_LIMITS = {
  authLogin: { limit: 10, windowMs: 15 * 60 * 1000 },
  authRegister: { limit: 5, windowMs: 60 * 60 * 1000 },
  ordersCreate: { limit: 30, windowMs: 15 * 60 * 1000 },
  paymentsCreate: { limit: 20, windowMs: 15 * 60 * 1000 },
  /** Staff QR/manual verify — allows busy lunch rush without brute-force risk. */
  ordersVerify: { limit: 40, windowMs: 15 * 60 * 1000 },
} as const;

export function rateLimitKey(
  bucket: string,
  identifier: string
): string {
  return `${bucket}:${identifier}`;
}

/** Clears in-memory windows — for automated tests only. */
export function resetRateLimitStore() {
  windows.clear();
  opsSinceCleanup = 0;
}
