---
title: Auth
tags:
  - arch
  - auth
---

# Auth

## Library

**Better Auth**, with three plugins enabled: `magicLink`, `emailOTP`, `passkey`. All three write to the same Better Auth user/session model, so a session established via any of them is indistinguishable to the rest of the app. See [[adr/002-auth-library-better-auth|ADR-002]] for why Better Auth over Auth.js.

## Single admin identity

There is exactly one real user. `ADMIN_EMAIL` (an environment variable) is the only email address the system will ever authenticate:

- No public sign-up route exists anywhere in the app.
- Every auth entry point (request magic link, request OTP, register/use a passkey) checks the submitted email against `ADMIN_EMAIL` server-side.
- On mismatch, the route returns the **same generic response** as a valid attempt ("check your email") — no account-enumeration signal distinguishing "not the admin" from "check your inbox."

## Bootstrap sequence

There is no seed script anywhere in this project (see [[02-data-model|Data Model]] and [[adr/007-no-seed-data|ADR-007]]) — the admin user record is not pre-created. Instead:

1. The **first** magic-link or email-OTP request whose submitted email matches `ADMIN_EMAIL` provisions the Better Auth user record inline, as part of handling that request, before the link/code is generated and sent. This is safe specifically because the trigger is a match against a trusted environment variable, not arbitrary user input choosing to become an account — anyone requesting a link for a non-matching email hits the same generic "check your email" response with no account ever created (see above).
2. First login must be **magic link** or **email OTP** — a passkey has nothing to authenticate against until one is registered.
3. Once logged in, `/admin/setup` (which stays reachable indefinitely, not just during first-run onboarding — see [[04-setup-publish-gate]]) offers "register a passkey for this device." No separate `/admin/settings` surface exists — passkey registration is the only admin-level settings action identified so far, so it lives in the one admin-gated page that already persists past setup rather than justifying a new top-level tab. From then on, passkey is available as a login option alongside magic link/OTP for that device.
4. There's no recovery-code flow beyond this: losing access means simply requesting a new magic link/OTP against `ADMIN_EMAIL` — they remain available regardless of how many passkeys are registered; passkey is additive, not a replacement that locks out the other two methods.
5. On a freshly deployed instance, this means literally nothing needs to run before first use — no seed command, no manual DB insert. Requesting the very first magic link/OTP against `ADMIN_EMAIL` is simultaneously "create the admin account" and "log in."

## Route protection

Next.js middleware checks the Better Auth session cookie on every request under `/admin/**` (this includes `/admin/setup`, `/admin/cv`, and `/api/cv/pdf`). Unauthenticated requests redirect to `/admin/login`. The only route with zero auth involvement is the public `/` root route.

```
middleware.ts
  matcher: ['/admin/:path*', '/api/cv/:path*']
  → no session? redirect /admin/login (or 401 for /api/**)
  → session valid? next()
```

## Email delivery for magic link / OTP

Both magic-link and OTP emails are sent via Nodemailer, using HTML compiled from MJML templates at send time (or build time, if templates are static enough to precompile — implementation's call). No third-party transactional-email API is used. `MAIL_TRANSPORT` selects between two nodemailer transports, both configured via environment variables (see [[08-deployment]]): plain SMTP (the default — `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM`), or Gmail over XOAUTH2 (`GMAIL_USER`/`GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN`) — see [[adr/015-gmail-xoauth2-transport|ADR-015]].

## Why this is safe enough for a single-owner app

This is not a multi-tenant auth system and doesn't need to defend against account takeover of *other* users — there are none. The two things that matter are: (1) nobody but the real owner can ever get a session, which the `ADMIN_EMAIL` allow-list plus generic responses handle, and (2) the owner has more than one way in, so losing a device/passkey doesn't lock them out, which magic link + OTP as always-available fallbacks handle.
