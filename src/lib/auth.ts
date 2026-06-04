import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "fallback-dev-secret"
);

export const AUTH_COOKIE = "canteen_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string | null;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.studentId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
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

export async function requireSession(roles?: Role[]) {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, email: true, name: true, role: true, studentId: true },
  });
  if (!user) {
    throw new Error("SESSION_STALE");
  }

  if (roles && !roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.studentId,
  };
}

export async function getUserFromDb(id: string) {
  return prisma.user.findUnique({ where: { id } });
}
