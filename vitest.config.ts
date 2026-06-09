import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup/env.ts", "./tests/setup/vitest.setup.ts"],
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    testTimeout: 30_000,
    pool: "forks",
    maxWorkers: 1,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      JWT_SECRET: "test-jwt-secret-vitest",
      NODE_ENV: "test",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/lib/**", "src/app/api/**"],
      exclude: ["**/*.d.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
