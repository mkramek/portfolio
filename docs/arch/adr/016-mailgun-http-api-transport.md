---
title: "ADR-016: Mailgun HTTP API as a third mail transport"
tags:
  - arch
  - adr
  - auth
  - deployment
---

# ADR-016: Mailgun HTTP API as a third mail transport

## Context

Following [[015-gmail-xoauth2-transport|ADR-015]], auth mail can go out over plain SMTP or Gmail XOAUTH2, selected by `MAIL_TRANSPORT`. Mailgun was added as a third option on top of that: a transactional-email provider, offering domain-level sending independent of any single mailbox account, deliverability tooling, and — unlike the two existing options — no per-account OAuth consent flow or app-password/mailbox-scope tradeoff to reason about.

Mailgun exposes two integration surfaces: an SMTP relay (`smtp.mailgun.org`, ordinary username/password) that would need zero new code — it already works today by pointing `SMTP_HOST`/`SMTP_USER`/`SMTP_PASS` at it under `MAIL_TRANSPORT=smtp` — and an HTTP REST API (`POST /v3/<domain>/messages`). The HTTP API was chosen deliberately over the zero-code SMTP-relay option, specifically to give it real parity with the Gmail integration (its own config validation, its own fail-loud checks, its own entry in `mail:test`) rather than landing as a documentation-only footnote under the existing `smtp` transport.

## Decision

A third `MAIL_TRANSPORT=mailgun` value, sending via Mailgun's HTTP API using the platform's native `fetch`/`FormData` — no new dependency, matching the zero-dependency approach `scripts/gmail-oauth.mjs` already took for token exchange. Configured via `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, `MAILGUN_FROM`, and an optional `MAILGUN_REGION` (`us` default, or `eu` — Mailgun's two regions are fully separate services with separate credentials and domains). `smtp` remains the overall default.

Because this transport doesn't speak SMTP at all, `lib/email.ts`'s internals were generalized: a `MailSender` interface (`send`/`verify`) is now implemented two ways — one wrapping a nodemailer transporter (used by both `smtp` and `gmail-oauth`), one calling Mailgun's HTTP API directly — and `sendAuthEmail`/`verifyMailTransport` dispatch through that interface rather than assuming a nodemailer transporter exists.

## Why

- Real parity with Gmail's integration effort was an explicit goal, which is why the SMTP-relay option — trivial but effectively invisible as a "Mailgun feature" — was rejected in favor of the HTTP API, even though it required more code.
- `fetch`/`FormData` are both natively available in this runtime (Bun), so this needed no new dependency, keeping the pattern set by ADR-015 (nodemailer's own XOAUTH2 support; raw `fetch` for the Google token exchange).
- Mailgun's HTTP API has no SMTP-style connection to open, so `verifyMailTransport()` for this transport does an authenticated `GET /v3/domains/<domain>` instead of an SMTP handshake — a check chosen specifically because it validates both the API key and the domain together, the same two things `buildMailgunConfig()` already requires as non-empty.
- `MAILGUN_FROM` is required rather than defaulted, unlike `GMAIL_USER` under `gmail-oauth`. Gmail authenticates as one specific mailbox, so that mailbox is an obvious From default; a Mailgun API key authorizes an entire domain with no single implied sender address, so there's nothing sensible to default to — an unset `MAILGUN_FROM` fails loudly instead of guessing.
- `MAILGUN_REGION` was kept as a validated `us`/`eu` enum rather than a raw base-URL override, consistent with this project's existing selector style (`MAIL_TRANSPORT` itself, [[015-gmail-xoauth2-transport|ADR-015]]'s `MAILGUN_REGION`-shaped precedent): a typo in an enum fails immediately with a clear message, where a typo'd URL would instead surface as an opaque connection error at send time.

## Alternatives rejected

- **Mailgun's SMTP relay under the existing `smtp` transport** — the simplest option and literally already works with zero code changes. Rejected as the primary path because it wouldn't read as a real "Mailgun integration" in the codebase, just SMTP credentials that happen to point at Mailgun; still valid as an undocumented fallback for anyone who prefers it.
- **A raw `MAILGUN_BASE_URL` override instead of `MAILGUN_REGION`** — considered because Mailgun's docs commonly present the regional endpoint as a literal URL. Rejected for the same reason `MAIL_TRANSPORT` and `gmail-oauth`'s fail-loud validation exist at all: a validated two-value enum can't silently point at a dead or wrong host the way a mistyped URL can.
- **The `mailgun.js` official SDK** — would have added a dependency (and its own transitive ones) for what is, in practice, one authenticated multipart POST and one authenticated GET, both trivially expressible with native `fetch`/`FormData`.

## Consequences

- `lib/email.ts` no longer assumes every transport is nodemailer-backed. Any future transport needs to implement the same `MailSender` shape (`send`, `verify`), not extend `buildTransportOptions()`'s `SMTPTransport.Options` return type — that function now explicitly throws if called under `mailgun`, to keep the two builder families (`buildTransportOptions` for the two SMTP-based kinds, `buildMailgunConfig` for Mailgun) from being silently cross-used.
- A domain new to Mailgun (unverified DNS, or Mailgun's free sandbox domain) has real deliverability caveats — a sandbox domain only delivers to addresses added as "Authorized Recipients" in the Mailgun dashboard, and a custom domain needs its SPF/DKIM DNS records verified before Mailgun will accept mail for it at all. Both are documented in the runbook ([[../../impl/09-deployment|impl: deployment]] § Mailgun HTTP API) as the Mailgun-specific equivalent of ADR-015's 7-day Testing-mode token trap.
- Like `gmail-oauth`, an incomplete `mailgun` config fails at send time (lazy transport construction), not at module import — `lib/auth.ts` still can't be taken down by a bad mail config.
