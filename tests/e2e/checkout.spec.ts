import { test, expect } from "@playwright/test";
import QRCode from "qrcode";
import fs from "fs";
import os from "os";
import path from "path";

async function writeQrPng(payload: string): Promise<string> {
  const file = path.join(os.tmpdir(), `campus-qr-${Date.now()}.png`);
  await QRCode.toFile(file, payload, { width: 280, margin: 2 });
  return file;
}

async function loginStudent(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("student@college.edu");
  await page.getByLabel(/password/i).fill("student123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
}

async function loginStaff(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("staff@canteen.edu");
  await page.getByLabel(/password/i).fill("staff123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/staff");
}

test.describe("checkout business flow", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("student pays and receives QR; staff verifies and completes handover", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const studentContext = await browser.newContext();
    const studentPage = await studentContext.newPage();

    await loginStudent(studentPage);

    const dismiss = studentPage.getByRole("button", { name: "Dismiss" });
    if (await dismiss.isVisible().catch(() => false)) {
      await dismiss.click();
    }

    await studentPage
      .locator("div.rounded-2xl.border")
      .filter({
        has: studentPage.getByRole("heading", { name: "Samosa", exact: true }),
      })
      .getByRole("button", { name: "Add to cart" })
      .click({ timeout: 15_000 });
    await studentPage.getByRole("button", { name: "Review order" }).click();
    await studentPage.getByRole("button", { name: "Confirm order" }).click();

    const paymentResponse = studentPage.waitForResponse(
      (r) =>
        r.url().includes("/api/payments") && r.request().method() === "POST"
    );
    await studentPage.getByRole("button", { name: /Pay ₹20/ }).click();
    const paymentRes = await paymentResponse;
    expect(paymentRes.ok()).toBeTruthy();

    const paymentBody = (await paymentRes.json()) as {
      order: { id: string; tokenNumber: string; orderCode: string };
    };
    const { id: orderId, tokenNumber, orderCode } = paymentBody.order;

    await expect(studentPage.getByText("Order confirmed")).toBeVisible({
      timeout: 15_000,
    });
    await expect(studentPage.getByText(tokenNumber)).toBeVisible();
    await expect(studentPage.getByText(orderCode)).toBeVisible();

    const qrData = await studentPage.evaluate(async (id: string) => {
      for (let attempt = 0; attempt < 24; attempt++) {
        const r = await fetch(`/api/orders/${id}/qr`);
        if (r.ok) {
          return r.json() as Promise<{ payload: string; qrDataUrl: string }>;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      throw new Error("QR endpoint did not become available");
    }, orderId);
    expect(qrData.qrDataUrl).toMatch(/^data:image/);

    await expect(
      studentPage.getByRole("img", { name: `QR for ${tokenNumber}` })
    ).toBeVisible({ timeout: 15_000 });

    const qrFile = await writeQrPng(qrData.payload);

    const staffContext = await browser.newContext();
    const staffPage = await staffContext.newPage();
    await loginStaff(staffPage);

    await staffPage.getByRole("tab", { name: "Pickup queue" }).click();
    await expect(
      staffPage.getByRole("paragraph").filter({ hasText: tokenNumber })
    ).toBeVisible({ timeout: 15_000 });

    await staffPage.getByRole("tab", { name: "Verify token" }).click();
    await staffPage.getByRole("button", { name: "Verify with QR" }).click();
    await staffPage.locator('input[type="file"][accept="image/*"]').setInputFiles(
      qrFile
    );

    await expect(staffPage.getByText(/order verified/i)).toBeVisible({
      timeout: 20_000,
    });
    await staffPage
      .getByRole("button", { name: /Confirm pickup/i })
      .click();

    await expect(
      staffPage.getByText(/handed over|pickup complete/i)
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      studentPage.getByText(/Pickup confirmed|Order collected/i).first()
    ).toBeVisible({ timeout: 30_000 });

    fs.unlink(qrFile, () => {});
    await studentContext.close();
    await staffContext.close();
  });
});
