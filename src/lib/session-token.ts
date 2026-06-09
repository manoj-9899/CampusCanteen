import { jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { getJwtSecretKey } from "./jwt-config";

export const AUTH_COOKIE = "canteen_session";

export interface SessionPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string | null;
}

/** Edge-safe JWT verification for middleware (no Prisma / Node-only APIs). */
export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as Role,
      studentId: (payload.studentId as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
