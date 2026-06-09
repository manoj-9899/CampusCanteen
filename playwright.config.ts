import { defineConfig, devices } from "@playwright/test";

const testDb = "file:./prisma/test.db";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL: testDb,
      JWT_SECRET: "test-jwt-secret-e2e",
      NODE_ENV: "development",
      TEST_PAYMENT_MODE: "success",
    },
  },
  globalSetup: "./tests/e2e/global-setup.ts",
});
