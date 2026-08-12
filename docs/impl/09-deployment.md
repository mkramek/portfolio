---
title: "Impl 09: Deployment"
tags:
  - impl
  - deployment
---

# Impl 09: Deployment

**Read first:** [[../arch/08-deployment|Deployment]], [[../arch/adr/007-no-seed-data|ADR-007]]

## Goal

The app live on Vercel, backed by a provisioned Postgres instance, with auth email delivery and PDF generation working in production.

## Steps

1. Provision production Postgres (Neon or Vercel Postgres — see [[../arch/08-deployment|Deployment]] and [[../arch/adr/001-database-postgres|ADR-001]]). Run `bunx prisma migrate deploy` against it (not `migrate dev`) as part of the deploy pipeline.

2. Set production environment variables on Vercel per the table in [[../arch/08-deployment|Deployment]]: `DATABASE_URL`, `DIRECT_DATABASE_URL` (if needed), `ADMIN_EMAIL`, `BETTER_AUTH_SECRET`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`.

3. Confirm `app/app/api/cv/pdf/route.ts` ([[06-cv-builder-and-pdf]]) is explicitly configured for the Node.js runtime (`export const runtime = 'nodejs'`) — Edge cannot run headless Chromium.

4. There is no seed step — do not add one. Immediately after `prisma migrate deploy`, production has zero rows in every table, and that's the correct starting state (see [[../arch/adr/007-no-seed-data|ADR-007]]): `/` should already show "coming soon" correctly, the admin account is created by the first login attempt, and real content is entered entirely through `/setup` and the admin panel post-deploy.

5. Smoke-test in production against that empty database: `/` shows "coming soon" (fully static, no errors from missing rows); `/admin/login` sends a real magic-link/OTP email via the configured SMTP and, on completion, creates the admin user record and an authenticated session; completing `/setup` flips the public site live; `/admin/cv`'s "Download PDF" produces a real file (this is the step most likely to surface Vercel-specific issues — function timeout or deployment size — per [[../arch/adr/004-serverless-pdf-generation|ADR-004]]; adjust the function's max duration setting if generation times out).

## Done when

- The production URL shows "coming soon" immediately after first deploy, against a database that has never had anything written to it — no seed step ran, none is needed.
- A real magic-link login completes end to end using production SMTP, creating the admin account on that first attempt.
- After entering required content via `/setup`, the production site shows the full portfolio.
- A CV PDF downloads successfully from production `/admin/cv`.
