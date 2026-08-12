---
title: Testing Strategy
tags:
  - arch
  - testing
---

# Testing Strategy

## Two layers, no more

- **`bun test`** for unit/integration: Zod schema validation, Route Handler logic, Prisma query helpers, the setup-completeness computation, the sort-order swap logic. Anything expressible as "given this input, assert this output/DB state" without a browser.
- **Playwright** for e2e: full-browser flows that exercise the real UI and auth. Playwright is already a project dependency for CV PDF generation ([[05-cv-generation]]), so reusing it for e2e avoids introducing a second browser-automation tool.

No third framework (no Vitest, no Jest, no Cypress) — `bun test`'s built-in runner covers everything that doesn't need a real browser.

## e2e coverage (minimum set)

1. **Public portfolio, incomplete state** — fresh/empty DB → `/` shows "coming soon," not a broken page.
2. **Public portfolio, complete state** — a DB with content written directly (test fixtures, not a seed script — see [[adr/007-no-seed-data|ADR-007]]) → `/` renders all visible sections in the expected order.
3. **Admin auth** — magic link and email OTP flows (against a test SMTP sink, e.g. Mailpit/Ethereal in CI) reach an authenticated `/admin` session; an unauthenticated request to `/admin/roles` redirects to login.
4. **Admin CRUD round-trip** — create, edit, reorder, and delete a Role (or another entity) through the UI, and confirm the public portfolio reflects it.
5. **Setup gate transition** — starting from an incomplete DB, complete the required fields via `/setup`, confirm `/` flips from "coming soon" to the full portfolio; delete a required field back out, confirm it flips back (see [[04-setup-publish-gate]]).
6. **CV PDF generation** — from `/admin/cv`, trigger "Download PDF," confirm the response is a valid PDF (non-empty, correct content-type) — doesn't need to assert pixel-perfect content, just that the pipeline (builder settings → print route → Playwright → PDF bytes) works end to end.
7. **CV snapshot history** — downloading a PDF creates a `CvSnapshot` row visible in the history list; editing (or deleting) the source `Role`/`Project` content afterward does not change what that snapshot's "View" shows (see [[adr/011-cv-snapshot-history|ADR-011]]); downloading twice for the same company+position produces `v1`/`v2`, and deleting `v1` renumbers the remainder; "Redownload" from a snapshot succeeds without a database write beyond the redownload itself (no duplicate snapshot created).

## What's out of scope for automated tests

- Visual regression testing of the design system (layout variants, accent colors) — this is a personal portfolio; manual review during implementation is enough.
- Load/performance testing — traffic volume doesn't warrant it.
- Testing the Quartz docs site itself — it's a local dev tool, not shipped product.
