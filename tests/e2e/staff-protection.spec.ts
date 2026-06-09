import { test, expect } from "@playwright/test";

test.describe("staff route protection", () => {
  test("redirects anonymous user from /staff to login", async ({ page }) => {
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/login/);
  });

  test("redirects student away from /staff", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("student@college.edu");
    await page.getByLabel(/password/i).fill("student123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
    await page.goto("/staff");
    await expect(page).toHaveURL("/");
  });

  test("allows staff to open dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("staff@canteen.edu");
    await page.getByLabel(/password/i).fill("staff123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.goto("/staff");
    await expect(
      page.getByRole("tab", { name: "Pickup queue" })
    ).toBeVisible({ timeout: 15_000 });
  });
});
