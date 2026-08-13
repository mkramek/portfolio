import { defineConfig } from "@playwright/test";
import { AUTH_STATE_PATH } from "./e2e/helpers/auth";
import { ADMIN_EMAIL, BASE_URL, TEST_DB_URL } from "./e2e/helpers/env";

export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.spec.ts",
  globalSetup: "./e2e/global-setup.ts",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    storageState: AUTH_STATE_PATH,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "bun run dev -- --port 3110",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: TEST_DB_URL,
      ADMIN_EMAIL,
      BETTER_AUTH_URL: BASE_URL,
      AUTH_ORIGIN: BASE_URL,
      AUTH_RPID: "localhost",
      // Pinned so the suite always goes through Mailpit, regardless of what
      // app/.env sets for the developer's own runs.
      MAIL_TRANSPORT: "smtp",
      SMTP_HOST: "127.0.0.1",
      SMTP_PORT: "1025",
      SMTP_FROM: "CV Admin <admin@cv.dev>",
    },
  },
});
