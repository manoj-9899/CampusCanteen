/**
 * Prepares an isolated SQLite test database for Vitest / Playwright.
 * Works even when schema.prisma is temporarily set to PostgreSQL (Neon deploy).
 */
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TEST_DB_URL = "file:./prisma/test.db";
const testSchemaPath = path.join(root, "prisma", ".test-schema.prisma");
const postgresSchemaPath = path.join(root, "prisma", "schema.postgresql.prisma");

const source = readFileSync(postgresSchemaPath, "utf8");
const sqliteSchema = source.replace(
  'provider = "postgresql"',
  'provider = "sqlite"'
);
writeFileSync(testSchemaPath, sqliteSchema);

const env = { ...process.env, DATABASE_URL: TEST_DB_URL };

execSync(`npx prisma db push --schema "${testSchemaPath}" --skip-generate`, {
  cwd: root,
  env,
  stdio: "inherit",
});

execSync(`npx prisma generate --schema "${testSchemaPath}"`, {
  cwd: root,
  env,
  stdio: "inherit",
});

console.log("Test Prisma ready (SQLite @ prisma/test.db).");
