import { test as base } from "@playwright/test";
import { resetContentDb } from "./db";

export const test = base.extend<{ resetDb: undefined }>({
  resetDb: [
    // biome-ignore lint/correctness/noEmptyPattern: Playwright requires a fixture destructuring pattern.
    async ({}, use) => {
      await resetContentDb();
      await use(undefined);
    },
    { auto: true },
  ],
});
