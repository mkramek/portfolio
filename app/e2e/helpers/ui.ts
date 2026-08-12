import type { Locator, Page } from "@playwright/test";

export function tableRow(page: Page, text: string) {
  return page.locator('div[style*="grid-template-columns"]').filter({ hasText: text }).last();
}

export async function downloadPdf(page: Page): Promise<void> {
  const download = page.waitForEvent("download", { timeout: 90_000 });
  await page.getByRole("button", { name: "DOWNLOAD PDF" }).click();
  await download;
}

export async function yOf(locator: Locator): Promise<number> {
  const box = await locator.boundingBox();
  if (box === null) throw new Error("Element has no bounding box");
  return box.y;
}
