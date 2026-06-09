/**
 * Regenerates Prisma Client from schema.prisma after test runs.
 * Restores PostgreSQL/SQLite client to match your local dev schema.
 */
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("npx prisma generate", { cwd: root, stdio: "inherit" });
console.log("Restored Prisma Client from schema.prisma.");
