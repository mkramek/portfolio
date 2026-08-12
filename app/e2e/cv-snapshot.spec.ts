import { expect } from "@playwright/test";
import { AUTH_STATE_PATH } from "./helpers/auth";
import { prisma } from "./helpers/db";
import { createRole, markSetupComplete, seedSetupBase } from "./helpers/fixtures";
import { test } from "./helpers/test";
import { downloadPdf } from "./helpers/ui";

test.use({ storageState: AUTH_STATE_PATH });
test.setTimeout(120_000);

type FrozenRole = { roles: Array<{ bullets: string[] }> };

function frozenBullets(snapshot: { snapshot: unknown }): string[] {
  return (snapshot.snapshot as FrozenRole).roles[0].bullets;
}

test("source edits leave a frozen snapshot unchanged; v1/v2 then renumber on delete", async ({
  page,
}) => {
  await seedSetupBase();
  await createRole({
    company: "Frozen Co",
    title: "Engineer",
    depth: "simple",
    oneLiner: "Original bullet.",
  });
  await markSetupComplete();

  await page.goto("/en/admin/cv");
  await downloadPdf(page);

  const snapshots = await prisma.cvSnapshot.findMany({ orderBy: { createdAt: "asc" } });
  const snapshot1 = snapshots[0];
  expect(snapshot1).toBeTruthy();
  expect(frozenBullets(snapshot1)).toEqual(["Original bullet."]);

  const roles = await prisma.role.findMany();
  const role = roles[0];
  expect(role).toBeTruthy();
  await prisma.role.update({ where: { id: role.id }, data: { oneLiner: "Changed bullet." } });

  await page.goto(`/en/admin/cv/print?snapshot=${snapshot1.id}`);
  await expect(page.getByText("Original bullet.")).toBeVisible();
  await expect(page.getByText("Changed bullet.")).toHaveCount(0);

  await page.goto("/en/admin/cv");
  await downloadPdf(page);
  await expect(page.getByText("v1", { exact: true })).toBeVisible();
  await expect(page.getByText("v2", { exact: true })).toBeVisible();

  const v1Row = page.getByText("v1", { exact: true }).locator("xpath=..");
  await v1Row.getByTitle("Delete snapshot").click();
  await page.getByRole("button", { name: "YES, DELETE" }).click();

  await expect(page.getByText("v1", { exact: true })).toHaveCount(1);
  await expect(page.getByText("v2", { exact: true })).toHaveCount(0);

  await expect(prisma.cvSnapshot.count()).resolves.toBe(1);
  const remainingRows = await prisma.cvSnapshot.findMany();
  expect(frozenBullets(remainingRows[0])).toEqual(["Changed bullet."]);
});
