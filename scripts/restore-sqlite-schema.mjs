/**
 * Restore local SQLite schema after Neon db push/seed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const schemaPath = resolve(root, "prisma/schema.prisma");
const content = readFileSync(schemaPath, "utf8");
const sqlite = content.replace(
  'provider = "postgresql"',
  'provider = "sqlite"'
);
writeFileSync(schemaPath, sqlite);
console.log("Restored SQLite schema for local development.");
