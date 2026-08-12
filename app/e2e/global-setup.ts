import { chromium } from "@playwright/test";
import { AUTH_STATE_PATH, requestOtpAndSubmit } from "./helpers/auth";
import { ADMIN_EMAIL, BASE_URL } from "./helpers/env";

export default async function globalSetup(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/en/admin/login`);
      if (response.ok) break;
    } catch {
      // web server not up yet
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(`${BASE_URL}/en/admin/login`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await requestOtpAndSubmit(page, ADMIN_EMAIL);
    await page.waitForLoadState("networkidle");
    await expectAdminShell(page);
    await page.context().storageState({ path: AUTH_STATE_PATH });
  } finally {
    await browser.close();
  }
}

async function expectAdminShell(page: import("@playwright/test").Page): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const cookies = await page.context().cookies();
    if (cookies.some((cookie) => cookie.name.includes("session"))) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("No session cookie set after sign-in");
}
