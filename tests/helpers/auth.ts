import { SignJWT } from "jose";
import type { Role } from "@prisma/client";
import { getJwtSecretKey } from "@/lib/jwt-config";
import { AUTH_COOKIE } from "@/lib/session-token";
import { setTestCookie } from "../setup/mocks/next-headers";
import { POST as authPost } from "@/app/api/auth/route";
import { DELETE as sessionDelete } from "@/app/api/auth/session/route";
import { jsonRequest, readJson } from "./request";

export async function signInViaApi(
  email: string,
  password: string,
  ip = "10.0.0.1"
) {
  const res = await authPost(
    jsonRequest("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "login", email, password }),
      ip,
    })
  );
  return res;
}

export async function registerViaApi(
  data: {
    name: string;
    email: string;
    password: string;
    studentId?: string;
  },
  ip = "10.0.0.2"
) {
  return authPost(
    jsonRequest("/api/auth", {
      method: "POST",
      body: JSON.stringify({ action: "register", ...data }),
      ip,
    })
  );
}

export async function signOutViaApi() {
  return sessionDelete();
}

export async function createSessionToken(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string | null;
}) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    studentId: user.studentId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

export async function setSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  studentId?: string | null;
}) {
  const token = await createSessionToken(user);
  setTestCookie(AUTH_COOKIE, token);
}

export function cookieHeader(token: string) {
  return { Cookie: `${AUTH_COOKIE}=${token}` };
}
