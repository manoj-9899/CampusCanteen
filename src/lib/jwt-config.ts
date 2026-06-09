const DEV_FALLBACK_SECRET = "fallback-dev-secret";

/**
 * Resolves the JWT signing key. In production, missing JWT_SECRET throws immediately
 * so deployments cannot run with an insecure default.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return new TextEncoder().encode(secret);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production. Set a long random secret in your deployment environment."
    );
  }

  return new TextEncoder().encode(DEV_FALLBACK_SECRET);
}
