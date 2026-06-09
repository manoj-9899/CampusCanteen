import { execSync } from "child_process";
import path from "path";

export default async function globalSetup() {
  const root = path.resolve(__dirname, "../..");
  execSync("node scripts/prepare-test-prisma.mjs", {
    cwd: root,
    stdio: "inherit",
  });
  execSync("npx tsx prisma/seed.ts", {
    cwd: root,
    env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
    stdio: "inherit",
  });
}
