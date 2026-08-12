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

2. Set production environment variables on Vercel per the table in [[../arch/08-deployment|Deployment]]: `DATABASE_URL`, `DIRECT_DATABASE_URL` (if needed), `ADMIN_EMAIL`, `BETTER_AUTH_SECRET`, and one mail transport's variables — `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS`/`SMTP_FROM` (default), or `MAIL_TRANSPORT=gmail-oauth` plus `GMAIL_USER`/`GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`GMAIL_REFRESH_TOKEN` (see § Gmail XOAUTH2 below), or `MAIL_TRANSPORT=mailgun` plus `MAILGUN_API_KEY`/`MAILGUN_DOMAIN`/`MAILGUN_FROM`/`MAILGUN_REGION` (see § Mailgun HTTP API below).

3. Confirm `app/app/api/cv/pdf/route.ts` ([[06-cv-builder-and-pdf]]) is explicitly configured for the Node.js runtime (`export const runtime = 'nodejs'`) — Edge cannot run headless Chromium.

4. There is no seed step — do not add one. Immediately after `prisma migrate deploy`, production has zero rows in every table, and that's the correct starting state (see [[../arch/adr/007-no-seed-data|ADR-007]]): `/` should already show "coming soon" correctly, the admin account is created by the first login attempt, and real content is entered entirely through `/setup` and the admin panel post-deploy.

5. Smoke-test in production against that empty database: `/` shows "coming soon" (fully static, no errors from missing rows); `/admin/login` sends a real magic-link/OTP email via the configured mail transport and, on completion, creates the admin user record and an authenticated session (`bun run mail:test` — see § Gmail XOAUTH2 below — is a faster way to check the transport itself before testing the full login flow); completing `/setup` flips the public site live; `/admin/cv`'s "Download PDF" produces a real file (this is the step most likely to surface Vercel-specific issues — function timeout or deployment size — per [[../arch/adr/004-serverless-pdf-generation|ADR-004]]; adjust the function's max duration setting if generation times out).

## Gmail XOAUTH2

**Read first:** [[../arch/adr/015-gmail-xoauth2-transport|ADR-015]]

Alternative to plain SMTP for outbound auth mail: send as a Gmail account via `smtp.gmail.com:465` using OAuth2 (XOAUTH2), so no SMTP password is ever stored. Set `MAIL_TRANSPORT=gmail-oauth`. This is entirely optional — the default `smtp` transport (Mailpit locally, any relay in production) needs none of this.

### One-time Google Cloud setup

1. Create a project at [console.cloud.google.com](https://console.cloud.google.com).
2. **APIs & Services → Library** — enable the **Gmail API**. XOAUTH2 over SMTP doesn't call this API directly, but enabling it is what makes the consent screen's scope picker offer the scope needed in step 5.
3. **Google Auth Platform** (the current name for what used to be called the OAuth consent screen) — fill in branding (app name, support email, developer contact).
   - Choose **Internal** if the sending account is a Google Workspace account in your own org — no test-user list, no verification, and no refresh-token expiry.
   - Otherwise choose **External** (a plain `@gmail.com` account). Then:
     - **Audience → Test users** — add the exact Gmail address you'll send from (required while the app is in "Testing", or consent fails with `access_denied`).
     - **Audience → Publish app**, status → "In production", **before minting a token**. While an External app stays in "Testing", refresh tokens for this scope expire after **7 days** — sign-in mail would work for a week, then start failing with `invalid_grant`. An unverified production app still works for personal use, behind a "Google hasn't verified this app" click-through (*Advanced → Go to \<app\> (unsafe)*) and capped at 100 users; full verification is only needed to remove that warning.
4. **Data access → Scopes** — add **`https://mail.google.com/`** and nothing else. This is the only scope `smtp.gmail.com` accepts over XOAUTH2 — the narrower `gmail.send` scope authorizes the Gmail REST API, not SMTP, and fails at the `AUTH XOAUTH2` step with a `535`.
5. **Clients → Create client → Application type: Desktop app.** A Desktop client accepts any `http://127.0.0.1:<port>` loopback redirect without pre-registering it, which is what the helper script below relies on; a Web application client would need a fixed, pre-registered redirect URI instead.
6. Copy the generated Client ID and Client secret into `app/.env` as `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`.

Not required: 2-Step Verification (that's for app passwords, a different approach), "less secure app access" (retired by Google), enabling IMAP in Gmail's own settings (that gates IMAP reads, not SMTP submission).

### Minting the refresh token

```
bun scripts/gmail-oauth.mjs
```

Opens a consent URL to paste into a browser signed in as the sending account, spins up a temporary local server to catch the OAuth redirect, and prints a `GMAIL_REFRESH_TOKEN` to add to `.env` alongside `MAIL_TRANSPORT=gmail-oauth` and `GMAIL_USER`.

### Verifying

```
bun run mail:test [recipient@example.com]
```

Sends one real email through whichever transport `MAIL_TRANSPORT` currently selects — SMTP, Gmail, or Mailgun — and prints the resolved server/endpoint, From address, and success/failure. Defaults the recipient to `ADMIN_EMAIL`. Run it after any mail-config change, in any environment, before relying on the real login flow to surface a problem.

Gmail rewrites or rejects a `From` address it doesn't own — the send layer forces the From address to `GMAIL_USER` under `gmail-oauth` (keeping `SMTP_FROM`'s display name if one was set) and logs a warning when it had to override it; `mail:test` prints the resolved From so this is visible before it matters.

## Mailgun HTTP API

**Read first:** [[../arch/adr/016-mailgun-http-api-transport|ADR-016]]

Alternative to SMTP/Gmail for outbound auth mail: send via Mailgun's REST API rather than SMTP. Set `MAIL_TRANSPORT=mailgun`. Also entirely optional.

### One-time Mailgun setup

1. Create a Mailgun account at [mailgun.com](https://www.mailgun.com) and pick a **region** — US or EU. The two are separate services with separate credentials and domains; whichever you pick determines `MAILGUN_REGION`.
2. **Sending → Domains → Add New Domain**, using a domain (or subdomain, e.g. `mg.yourdomain.com`) you control. Add the SPF and DKIM DNS records Mailgun shows you, then wait for the domain to show **Verified** — mail sent from an unverified domain is rejected outright, and this is the step most likely to trip people up on a first setup (DNS propagation can take a few minutes to a few hours).
   - Skipping domain verification and using Mailgun's free **sandbox domain** instead works for quick testing, but a sandbox domain only delivers to addresses added under **Sending → Domain settings → Authorized Recipients** — everything else silently fails. Fine for a first smoke test, not for real use.
3. **Settings → API Keys** — copy the **Private API key** into `app/.env` as `MAILGUN_API_KEY`.
4. Set `MAILGUN_DOMAIN` to the verified domain from step 2, and `MAILGUN_FROM` to an address at that domain (e.g. `CV Admin <admin@mg.yourdomain.com>`) — unlike Gmail, there's no account identity to default this to, so it's required.

### Verifying

```
bun run mail:test [recipient@example.com]
```

Same script as the other transports — with `MAIL_TRANSPORT=mailgun` set, it calls Mailgun's API directly (an authenticated domain lookup to verify credentials, then a real send) and prints the resolved endpoint and From address. A `401` here means a bad API key; a rejected send on a verified custom domain almost always means the DNS records from step 2 haven't propagated or weren't added correctly — check **Sending → Domains → \<domain\> → DNS records** in the Mailgun dashboard for their live verification status.

## Done when

- The production URL shows "coming soon" immediately after first deploy, against a database that has never had anything written to it — no seed step ran, none is needed.
- A real magic-link login completes end to end using production SMTP, creating the admin account on that first attempt.
- After entering required content via `/setup`, the production site shows the full portfolio.
- A CV PDF downloads successfully from production `/admin/cv`.
