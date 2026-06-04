export class ApiError extends Error {
  status?: number;
  offline?: boolean;
  data?: Record<string, unknown>;

  constructor(
    message: string,
    status?: number,
    offline?: boolean,
    data?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.offline = offline;
    this.data = data;
  }
}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  if (isOffline()) {
    throw new ApiError(
      "You appear to be offline. Check your connection and try again.",
      undefined,
      true
    );
  }

  const { timeoutMs = 20_000, ...fetchInit } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, {
      ...fetchInit,
      signal: controller.signal,
    });

    let data: Record<string, unknown> = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = {};
      }
    }

    if (!res.ok) {
      const message =
        (typeof data.error === "string" && data.error) ||
        (Array.isArray(data.errors) &&
          typeof (data.errors as { message?: string }[])[0]?.message ===
            "string" &&
          (data.errors as { message: string }[])[0].message) ||
        `Request failed (${res.status})`;
      throw new ApiError(message, res.status, false, data);
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError(
        "Request timed out. Your connection may be slow — please try again."
      );
    }
    throw new ApiError(
      "Network error. Check your connection and try again.",
      undefined,
      true
    );
  } finally {
    clearTimeout(timer);
  }
}
