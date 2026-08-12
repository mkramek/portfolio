---
title: Deployment
tags:
  - arch
  - deployment
---

# Deployment

## Target

**Vercel**, running the Next.js app from `app/`. This choice drives several other decisions documented elsewhere — it's why storage is Postgres rather than SQLite ([[adr/001-database-postgres|ADR-001]]) and why PDF generation uses `@sparticuz/chromium` rather than a locally-installed full Chromium ([[adr/004-serverless-pdf-generation|ADR-004]]).

## Database

Managed Postgres — **Neon** or **Vercel Postgres** (either is compatible with this architecture; pick whichever has the better Vercel integration/pricing at implementation time). Requirements:

- Connection pooling suitable for serverless (many short-lived function invocations opening connections) — Neon's pooled connection string, or Prisma Accelerate, or PgBouncer, depending on which provider is chosen.
- Migrations run via `prisma migrate deploy` as part of the deployment pipeline, not applied ad hoc against production.

## Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (pooled) |
| `DIRECT_DATABASE_URL` | Direct (non-pooled) connection string, if the provider requires a separate one for migrations |
| `ADMIN_EMAIL` | The one email address allowed to authenticate — see [[03-auth]] |
| `BETTER_AUTH_SECRET` | Session signing secret |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Outbound mail for magic link / OTP emails |
| `SMTP_FROM` | From address for auth emails |

Exact naming may shift slightly once Better Auth and the chosen Postgres provider's own conventions are wired up in implementation — treat this table as the intent, not a literal contract.

## PDF generation on Vercel

`@sparticuz/chromium` provides a Chromium binary sized and packaged to fit within Vercel serverless function limits (deployment size, `/tmp` usage). The `/api/cv/pdf` route handler must:

- Be configured for the Node.js runtime, not the Edge runtime (headless Chromium cannot run on Edge).
- Account for cold-start latency — launching Chromium inside a serverless function is slower than a warm long-running process. This is acceptable for an admin-only, on-demand action (a few seconds of wait for a PDF download), not something that needs to be fast for every request.
- Watch the function's max execution duration setting on Vercel; increase it if the default proves too short for browser launch + navigate + PDF generation.

## What's explicitly not needed

- No persistent disk / volume (Postgres replaces the prototype's `localStorage`, and there's no other on-disk state).
- No background job runner / queue — CV PDF generation is synchronous, request-response, triggered by an admin click.
- No CDN/edge-caching concerns beyond what Vercel does by default for the public `/` route — traffic volume for a personal portfolio doesn't warrant bespoke caching design.
