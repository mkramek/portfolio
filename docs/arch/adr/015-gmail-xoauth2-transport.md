---
title: "ADR-015: Gmail XOAUTH2 as an opt-in second mail transport"
tags:
  - arch
  - adr
  - auth
  - deployment
---

# ADR-015: Gmail XOAUTH2 as an opt-in second mail transport

## Context

Magic-link and OTP sign-in mail (see [[../03-auth|Auth]]) is sent over raw SMTP, with credentials supplied via `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` — see [[../01-tech-stack|Tech Stack]]. That's a fine default for local dev (Mailpit) but means production deployment requires an SMTP relay the owner controls, or a provider password. The owner has a Gmail account and wants to send through it directly, without minting a static app password sitting in `.env` with full-mailbox rights indefinitely.

Nodemailer (already the mail library — see [[../01-tech-stack|Tech Stack]]) implements XOAUTH2 end to end, including access-token refresh and auth retry, entirely inside the package already installed. So this is a configuration change to `app/lib/email.ts`, not a new dependency or a new send path.

## Decision

A second nodemailer transport, selected by an explicit `MAIL_TRANSPORT` env var (`smtp`, the default, or `gmail-oauth`). `MAIL_TRANSPORT=gmail-oauth` sends via `smtp.gmail.com:465` using XOAUTH2, authenticated with `GMAIL_USER` / `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET` / `GMAIL_REFRESH_TOKEN`, all read from the environment like every other secret in this project — no database table, no admin UI, no secret-at-rest encryption. An incomplete `gmail-oauth` config throws at send time rather than silently falling back to `smtp`. A one-off script (`scripts/gmail-oauth.mjs`) walks the owner through Google's OAuth consent flow to mint the refresh token; a second script (`scripts/send-test-email.mjs`) sends one real email through whichever transport is configured, for manual verification.

## Why

- Nodemailer already does the hard part — token refresh and SMTP `AUTH XOAUTH2` retry live in the package's `xoauth2`/`smtp-connection` modules — so this needed zero new dependencies and a rewrite of one 170-line module.
- `smtp` stays the default and untouched in behavior, so Mailpit, local dev, and the Playwright e2e suite (whose `global-setup` seeds shared auth state via a live Mailpit OTP round-trip) keep working exactly as before. `playwright.config.ts`'s `webServer.env` now pins `MAIL_TRANSPORT: "smtp"` explicitly, so the suite can't be broken by a developer's local `.env` switching to Gmail.
- A refresh token in an env var, scoped to one Google account and revocable from that account's own permissions page, is a smaller standing liability than a static SMTP password with the same reach — and unlike a password, nodemailer only ever holds a short-lived access token in memory, minted on demand.
- Fail-loud over silent fallback: a `gmail-oauth` config missing one variable is very likely a typo or an incomplete deploy, not an intentional choice to use `smtp` — silently reverting to Mailpit-shaped defaults in production would send auth mail nowhere without ever surfacing an error until someone noticed they couldn't sign in.

## Alternatives rejected

- **Gmail app password over plain SMTP AUTH** — the simplest alternative by far: `SMTP_USER`/`SMTP_PASS` already work today, zero code change. Rejected specifically for credential hygiene — an app password is a long-lived, unscoped, full-mailbox-access static secret, and Google has been steadily narrowing where app passwords are even available. This remains the documented one-variable fallback (`MAIL_TRANSPORT=smtp` + `SMTP_USER`/`SMTP_PASS` pointed at Gmail with an app password) if OAuth token maintenance ever proves more trouble than it's worth for a single-owner app.
- **A transactional-email API (Resend, Postmark, SES, …)** — better deliverability tooling and no Google-specific token-expiry quirks, but a new third-party account, a new SDK dependency, and a domain to verify, for what amounts to a handful of sign-in emails a month to one recipient. Contradicts the standing "no third-party transactional-email API" position (see [[../03-auth|Auth]]) without a need that justifies reversing it.
- **`googleapis` + Gmail API `users.messages.send`** — would replace nodemailer's send path rather than configure it: a new dependency, manual MIME assembly, and a second, divergent way of building the email that the MJML-rendered HTML would need to flow through.
- **Auto-detecting the transport from whether `GMAIL_*` vars are present** — rejected as the selection mechanism; it makes a typo'd variable name look like a working SMTP config instead of failing loudly.
- **Storing credentials in Postgres with an admin settings page** — rejected as out of scope. These are deployment configuration, like every other secret in this project (`BETTER_AUTH_SECRET`, `SMTP_*`), and belong with them; adding a DB-backed settings surface would also be the project's first case of a secret at rest, which has no existing encryption story to build on.

## Consequences

- XOAUTH2 over SMTP requires the **`https://mail.google.com/`** scope specifically — the narrower `gmail.send` scope authorizes the Gmail REST API, not SMTP submission, and produces a `535` at the `AUTH XOAUTH2` step. This is the single most common setup mistake and is called out explicitly in the runbook ([[../../impl/09-deployment|impl: deployment]] § Gmail XOAUTH2).
- If the Google Cloud OAuth client is an External app left in "Testing" publishing status, refresh tokens for this scope expire after 7 days — the app must be **published** (an unverified published app still works for personal use, just behind a click-through warning) before minting the token, or sign-in mail will silently stop working a week after setup with `invalid_grant`.
- Gmail rewrites or rejects a `From` address it doesn't own. `resolveFromAddress()` makes that visible instead of silent: under `gmail-oauth`, the address is forced to `GMAIL_USER` (keeping `SMTP_FROM`'s display name), with a one-time warning logged when `SMTP_FROM` named a different address.
- The transport is now built lazily on first send rather than at module import — `lib/email.ts` is imported transitively by the Better Auth route handler, so a `gmail-oauth` misconfiguration must fail at the send call, not take down `/api/auth/**` at module-init time.
