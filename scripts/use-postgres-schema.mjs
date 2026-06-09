/**
 * One-off local command: swap to PostgreSQL schema before db push/seed against Neon.
 * Does not modify schema.postgresql.prisma — copies it over schema.prisma.
 */
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
copyFileSync(
  resolve(root, "prisma/schema.postgresql.prisma"),
  resolve(root, "prisma/schema.prisma")
);
console.log("Using PostgreSQL schema — run npm run db:setup locally to restore SQLite after.");
