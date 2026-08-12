---
title: "Impl 02: Auth"
tags:
  - impl
  - auth
---

# Impl 02: Auth

**Read first:** [[../arch/03-auth|Auth]], [[../arch/adr/002-auth-library-better-auth|ADR-002]]

## Goal

A working login at `/admin/login` supporting magic link, email OTP, and passkey, gating everything under `/admin/**` and `/api/cv/**`, restricted to a single `ADMIN_EMAIL`.

## Steps

1. `bun add better-auth`, then follow Better Auth's Next.js + Prisma adapter setup to add its required tables to `app/prisma/schema.prisma` and run a migration (`bunx prisma migrate dev --name add_better_auth`).

2. Configure Better Auth (`app/lib/auth.ts` or equivalent) with the `magicLink`, `emailOTP`, and `passkey` plugins enabled. Wire mail sending (Nodemailer, per [[../arch/01-tech-stack|Tech Stack]]) into each plugin's email-sending hook via a single `app/lib/email.ts` send function, using MJML-compiled templates (author `.mjml` source files in `app/emails/`, compile to HTML at send time or as a build step — implementation's call). That function should support both SMTP and Gmail XOAUTH2 transports, selected by `MAIL_TRANSPORT` — see [[../arch/adr/015-gmail-xoauth2-transport|ADR-015]] and [[09-deployment|impl: deployment]] § Gmail XOAUTH2.

3. **Enforce the single-admin allow-list and lazy-provision on match** at the point each plugin accepts an email/identifier: before generating a magic link or OTP, compare the submitted email against `process.env.ADMIN_EMAIL`.
   - **Match**: if no Better Auth user exists yet for that email, create it inline, right here, before generating/sending the link or code — this is the *only* place the admin user record gets created; there is no seed script (see [[../arch/adr/007-no-seed-data|ADR-007]]). If the user already exists, proceed normally.
   - **No match**: return the same success-shaped response as a real attempt (no distinguishing signal, no account created) — see [[../arch/03-auth|Auth]] for why.
   - This is custom glue code around Better Auth's plugin hooks, not a built-in Better Auth feature. Passkey registration/assertion doesn't need this check — it only ever runs for a user who's already authenticated (step 7 below), so there's nothing to lazily provision there.

4. Write `app/middleware.ts`:
   ```
   matcher: ['/admin/:path*', '/api/cv/:path*']
   ```
   Check the Better Auth session (via its session-reading helper) on every matched request. No session → redirect to `/admin/login` for page routes, or `401 Response` for `/api/**` routes.

5. Build `/admin/login`: three entry points (email field + "send magic link" button, email field + "send code" button leading to a code-entry step, and a "sign in with a passkey" button using the browser's WebAuthn prompt). All three ultimately hit Better Auth's client methods for each plugin.

6. Confirm there is no separate account-creation step anywhere else — no seed script, no manual DB insert, no "first run" migration. The lazy-provision logic in step 3 is the entire bootstrap: the first magic-link/OTP request against `ADMIN_EMAIL` *is* account creation, on a database where the Better Auth user table starts empty.

7. Add a "register a passkey for this device" action inside `/admin/setup` (reachable once logged in; that page stays reachable indefinitely, not just during onboarding — see [[../arch/03-auth|Auth]]), calling Better Auth's passkey registration client method. No separate `/admin/settings` page — this is the only admin-level settings action so far.

## Done when

- Starting from a Better Auth user table with **zero rows**, with `ADMIN_EMAIL` set and a real SMTP sink (or a local dev catch-all like Mailpit), requesting a magic link/OTP for that address creates the user record and, on completing the link/code, produces an authenticated session that can reach `/admin` — no seed step, no manual setup, ran anywhere first.
- Requesting a magic link/OTP for any other address produces the same visible response but never yields a usable session, and creates no user record.
- An unauthenticated request to `/admin/roles` (or any `/admin/**` path) redirects to `/admin/login`.
- After registering a passkey once, a subsequent login can complete via passkey alone.
