---
title: "Impl 08: Testing"
tags:
  - impl
  - testing
---

# Impl 08: Testing

**Read first:** [[../arch/09-testing-strategy|Testing Strategy]]

## Goal

`bun test` covering unit/integration logic, Playwright covering the e2e flows listed in [[../arch/09-testing-strategy|Testing Strategy]].

## Steps

1. Set up `bun test` against `app/`: co-locate `*.test.ts` files with the code they test (Zod schemas, the `recomputeSetupState()` logic from [[03-setup-flow]], the sort-order swap helper from [[05-admin-panel]], any Prisma query helpers worth testing in isolation against a test database or Prisma's mock client).

2. Set up Playwright (`bun add -D @playwright/test`, `bunx playwright install chromium` for local/dev — this is separate from the `@sparticuz/chromium` production PDF path in [[06-cv-builder-and-pdf]], which needs no local browser install). Point it at a locally-running dev server + a disposable test database, populated per test by writing fixture rows directly (there is no seed script anywhere in this project, including for tests — see [[../arch/adr/007-no-seed-data|ADR-007]] — so "give this test a Role to work with" means an ordinary DB write in test setup, not a seed file).

3. For the auth e2e tests, stand up a local SMTP sink (e.g. Mailpit) in the test environment so magic-link/OTP emails can be intercepted and their content read by the test, rather than mocking Better Auth's internals.

4. Implement the six e2e flows from [[../arch/09-testing-strategy|Testing Strategy]]:
   1. Public portfolio, incomplete state → coming soon.
   2. Public portfolio, complete state → full render.
   3. Admin auth (magic link + OTP) reaches an authenticated session; unauthenticated access redirects.
   4. Admin CRUD round-trip reflected on the public portfolio.
   5. Setup gate transition (complete → live, delete required field → coming soon again).
   6. CV PDF generation produces a valid PDF response.
   7. CV snapshot history: download creates a `CvSnapshot`; editing/deleting the source content afterward doesn't change the snapshot's frozen view; two downloads for the same company+position produce `v1`/`v2`; deleting `v1` renumbers the rest; redownload doesn't create an extra snapshot.

5. The `bun test` half of this suite **is** wired into the GitHub Actions pipeline built in [[10-ci-cd]], as its own `test` job — no services needed, since `tests/preload.ts` supplies a dummy `DATABASE_URL` and the DB-backed cases self-skip without one. The Playwright e2e half is **not** wired in: it needs Postgres, Mailpit, and a dev-mode server running concurrently, and costs roughly 10–20 minutes of wall clock per run versus well under a minute for `bun test` — a poor fit for a check that blocks every merge. Running it locally (or via a future separate, non-blocking scheduled workflow) is how this half gets exercised for now; see [[../arch/10-ci-cd|CI/CD]] for the reasoning.

## Done when

- `bun test` passes locally against a test database.
- The Playwright suite passes locally against a test database populated only via direct fixture writes (no seed script) and a running dev server.
