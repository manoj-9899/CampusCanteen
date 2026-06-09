import { NextRequest } from "next/server";

export function apiUrl(path: string) {
  return `http://localhost:3000${path}`;
}

export function jsonRequest(
  path: string,
  init: RequestInit & { ip?: string } = {}
) {
  const { ip, headers: initHeaders, signal, ...rest } = init;
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", "application/json");
  if (ip) headers.set("x-forwarded-for", ip);

  return new NextRequest(apiUrl(path), {
    ...rest,
    headers,
    ...(signal != null ? { signal } : {}),
  });
}

export async function readJson<T = unknown>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function expectStatus(response: Response, status: number) {
  if (response.status !== status) {
    throw new Error(`Expected status ${status}, got ${response.status}`);
  }
}
