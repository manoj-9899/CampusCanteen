/**
 * Netlify build prep: use PostgreSQL schema (Neon) while local dev keeps SQLite.
 */
import { copyFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
copyFileSync(
  resolve(root, "prisma/schema.postgresql.prisma"),
  resolve(root, "prisma/schema.prisma")
);
console.log("Netlify build: using PostgreSQL Prisma schema");
