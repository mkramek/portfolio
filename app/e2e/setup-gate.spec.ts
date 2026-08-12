import { expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import { test } from "./helpers/test";
import { tableRow } from "./helpers/ui";

test.use({ storageState: AUTH_STATE_PATH });

test("completing the setup wizard flips / from coming-soon to live; deleting a required field flips it back", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();

  await page.goto("/en/admin/setup");

  await page.fill("#profile-name", "Milosz Kramek");
  await page.fill("#profile-title", "Software Engineer");
  await page.fill("#profile-email", "milosz@cv.dev");
  await page.fill("#profile-summary", "Full-stack engineer focused on reliability.");
  await page.getByRole("button", { name: "Save profile" }).click();

  await page.fill("#role-company", "Acme Inc.");
  await page.fill("#role-title", "Staff Engineer");
  await page.fill("#role-start", "Oct 2024");
  await page.fill("#role-end", "Present");
  await page.fill("#role-oneliner", "Led the platform migration.");
  await page.getByRole("button", { name: "Save role" }).click();

  await page.fill("#skill-group", "Languages");
  await page.fill("#skill-items", "TypeScript, Go");
  await page.getByRole("button", { name: "Save skills" }).click();

  await expect(page.getByRole("heading", { name: "Setup complete" })).toBeVisible();
  await expect(page.getByText("Your site is live.")).toBeVisible();

  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toHaveCount(0);
  await expect(page.getByText("Milosz Kramek").first()).toBeVisible();
  await expect(page.locator("#experience").getByText("Acme Inc.")).toBeVisible();

  await page.goto("/en/admin/experience");
  await tableRow(page, "Acme Inc.").getByTitle("Delete").click();
  await page.getByRole("button", { name: "YES, DELETE" }).click();
  await expect(page.getByText("Acme Inc.")).toHaveCount(0);

  await page.goto("/en");
  await expect(page.getByRole("heading", { name: "Coming soon" })).toBeVisible();
});
