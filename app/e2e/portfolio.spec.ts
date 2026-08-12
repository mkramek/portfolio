import { expect } from "@playwright/test";
import { prisma } from "./helpers/db";
import { seedCompleteContent } from "./helpers/fixtures";
import { test } from "./helpers/test";
import { yOf } from "./helpers/ui";

test("incomplete state renders a coming-soon page, not a broken page", async ({ page }) => {
  await page.goto("/en");
  // The pre-publish placeholder must stay content-free — no Profile.name in the title
  // (see docs/arch/04-setup-publish-gate.md and generateMetadata in app/[lang]/layout.tsx).
  await expect(page).toHaveTitle("Coming soon");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
  await expect(page.getByText("The site is being put together.")).toBeVisible();
  await expect(page.locator("#hero")).toHaveCount(0);
  await expect(page.getByText("Milosz Kramek")).toHaveCount(0);
});

test("complete state renders every visible section in the expected order", async ({ page }) => {
  await seedCompleteContent();
  await page.goto("/en");

  await expect(page.getByText("Milosz Kramek").first()).toBeVisible();
  await expect(page.getByText("Software Engineer").first()).toBeVisible();
  await expect(page.getByText("I build resilient systems.")).toBeVisible();
  await expect(page.getByText("YEARS IN TECH")).toBeVisible();

  await expect(page.locator("#experience").getByText("Acme Inc.")).toBeVisible();
  await expect(page.locator("#experience").getByText("Staff Engineer")).toBeVisible();

  await expect(page.locator("#projects").getByText("Traffic Dashboard")).toBeVisible();
  await expect(page.locator("#skills").getByText("Languages")).toBeVisible();
  await expect(page.locator("#skills").getByText("TypeScript")).toBeVisible();
  await expect(page.locator("#contact").getByText("milosz@cv.dev")).toBeVisible();

  const sections = ["hero", "strengths", "experience", "projects", "skills", "contact"];
  const ys: Array<[string, number]> = [];
  for (const id of sections) {
    await expect(page.locator(`#${id}`)).toBeAttached();
    ys.push([id, await yOf(page.locator(`#${id}`))]);
  }
  for (let i = 1; i < ys.length; i++) {
    expect(ys[i][1]).toBeGreaterThan(ys[i - 1][1]);
  }

  await expect(prisma.role.count()).resolves.toBe(1);
});
