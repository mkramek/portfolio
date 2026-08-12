import { expect } from "@playwright/test";
import { requestMagicLinkAndSubmit, requestOtpAndSubmit } from "./helpers/auth";
import { test } from "./helpers/test";

test.use({ storageState: { cookies: [], origins: [] } });

test("unauthenticated admin access redirects to login with a next param", async ({ page }) => {
  await page.goto("/en/admin/roles");
  await expect(page).toHaveURL(/\/en\/admin\/login\?next=%2Fen%2Fadmin%2Froles/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("magic link signs in to the admin", async ({ page }) => {
  await page.goto("/en/admin/login");
  await requestMagicLinkAndSubmit(page);
  await page.waitForURL(/\/admin\//, { timeout: 30_000 });
  await expect(page.getByText("/ content admin")).toBeVisible();
});

test("email OTP signs in to the admin", async ({ page }) => {
  await page.goto("/en/admin/login");
  await requestOtpAndSubmit(page);
  await page.waitForURL(/\/admin\//, { timeout: 30_000 });
  await expect(page.getByText("/ content admin")).toBeVisible();
});
