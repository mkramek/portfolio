import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import { prisma } from "./helpers/db";
import { seedCompleteContent } from "./helpers/fixtures";
import { test } from "./helpers/test";
import { downloadPdf } from "./helpers/ui";

test.use({ storageState: AUTH_STATE_PATH });
test.setTimeout(120_000);

test("Download PDF produces a valid PDF and records a snapshot", async ({ page }) => {
  await seedCompleteContent();

  await page.goto("/en/admin/cv");
  const download = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "DOWNLOAD PDF" }).click();

  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);
  const path = await file.path();
  const bytes = await readFile(path);
  expect(bytes.subarray(0, 4).toString("latin1")).toBe("%PDF");
  expect(bytes.length).toBeGreaterThan(1_000);

  await expect(prisma.cvSnapshot.count()).resolves.toBe(1);
});

test("redownloading from a snapshot does not create an extra snapshot", async ({ page }) => {
  await seedCompleteContent();

  await page.goto("/en/admin/cv");
  await downloadPdf(page);
  await expect(prisma.cvSnapshot.count()).resolves.toBe(1);

  const download = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "REDOWNLOAD" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/\.pdf$/);

  await expect(prisma.cvSnapshot.count()).resolves.toBe(1);
});
