import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

execSync("node scripts/prepare-test-prisma.mjs", { cwd: root, stdio: "inherit" });

execSync("npx tsx prisma/seed.ts", {
  cwd: root,
  env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
  stdio: "inherit",
});

console.log("test.db seeded.");
