import { expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import { prisma } from "./helpers/db";
import { createRole, markSetupComplete, seedSetupBase } from "./helpers/fixtures";
import { test } from "./helpers/test";
import { tableRow, yOf } from "./helpers/ui";

test.use({ storageState: AUTH_STATE_PATH });

test("create a role through the UI and see it on the portfolio", async ({ page }) => {
  await seedSetupBase();

  await page.goto("/en/admin/experience");
  await page.getByRole("button", { name: "+ NEW ENTRY" }).click();
  await page.fill("#field-company", "CrudCo");
  await page.fill("#field-title", "Platform Engineer");
  await page.fill("#field-start", "Jan 2020");
  await page.fill("#field-end", "Present");
  await page.getByRole("button", { name: "SAVE ENTRY" }).click();

  await expect(page.getByText("CrudCo")).toBeVisible();

  await page.goto("/en");
  await expect(page.locator("#experience").getByText("CrudCo")).toBeVisible();
  await expect(page.locator("#experience").getByText("Platform Engineer")).toBeVisible();
});

test("edit a role through the UI and see the change on the portfolio", async ({ page }) => {
  await seedSetupBase();
  await createRole({ company: "OldCo", title: "Engineer" });
  await markSetupComplete();

  await page.goto("/en/admin/experience");
  await tableRow(page, "OldCo").getByRole("button", { name: "EDIT" }).click();
  await page.fill("#field-company", "NewCo");
  await page.getByRole("button", { name: "SAVE ENTRY" }).click();

  await expect(page.getByText("NewCo")).toBeVisible();

  await page.goto("/en");
  await expect(page.locator("#experience").getByText("NewCo")).toBeVisible();
  await expect(page.getByText("OldCo")).toHaveCount(0);
});

test("reorder roles through the UI and see the new order on the portfolio", async ({ page }) => {
  await seedSetupBase();
  await createRole({ company: "Alpha Co", title: "Engineer" });
  await createRole({ company: "Bravo Co", title: "Engineer" });
  await markSetupComplete();

  await page.goto("/en");
  await expectOrder(page, "Alpha Co", "Bravo Co");

  await page.goto("/en/admin/experience");
  await tableRow(page, "Bravo Co").getByTitle("Move up").click();

  await expect
    .poll(() => prisma.role.findMany({ orderBy: { sortOrder: "asc" } }))
    .toEqual([
      expect.objectContaining({ company: "Bravo Co" }),
      expect.objectContaining({ company: "Alpha Co" }),
    ]);

  await page.goto("/en");
  await expectOrder(page, "Bravo Co", "Alpha Co");
});

test("delete a role through the UI and see it gone from the portfolio", async ({ page }) => {
  await seedSetupBase();
  await createRole({ company: "Doomed Co", title: "Engineer" });
  await markSetupComplete();

  await page.goto("/en/admin/experience");
  await tableRow(page, "Doomed Co").getByTitle("Delete").click();
  await page.getByRole("button", { name: "YES, DELETE" }).click();

  await expect(page.getByText("Doomed Co")).toHaveCount(0);

  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
});

async function expectOrder(page: import("@playwright/test").Page, first: string, second: string) {
  await expect(page.locator("#experience").getByText(first)).toBeVisible();
  const firstY = await yOf(page.locator("#experience").getByText(first));
  const secondY = await yOf(page.locator("#experience").getByText(second));
  expect(firstY).toBeLessThan(secondY);
}
