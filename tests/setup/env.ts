/** Must run before any Prisma or app module imports. */
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.JWT_SECRET = "test-jwt-secret-vitest";
process.env.NODE_ENV = "test";

delete (globalThis as { prisma?: unknown }).prisma;
