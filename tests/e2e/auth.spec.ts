import { test, expect } from "@playwright/test";

test.describe("student authentication", () => {
  test("logs in and sees menu", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("student@college.edu");
    await page.getByLabel(/password/i).fill("student123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/pre-order|menu|samosa/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("logs out from navbar", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("student@college.edu");
    await page.getByLabel(/password/i).fill("student123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await page.getByRole("button", { name: /log out|logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
