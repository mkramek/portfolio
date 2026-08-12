// Shared constants for the e2e suite. Runs in both the config process and test
// worker processes, so setting DATABASE_URL here also covers lib/db imports.
export const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? "postgresql://cv:cv@localhost:5432/cv_test";
export const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3110";
export const MAILPIT_URL = process.env.MAILPIT_URL ?? "http://localhost:8025";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@cv.dev";

process.env.DATABASE_URL ??= TEST_DB_URL;
