---
title: "ADR-002: Better Auth over Auth.js"
tags:
  - arch
  - adr
---

# ADR-002: Better Auth over Auth.js

## Context

The admin panel needs to authenticate exactly one person, via three methods: magic link, email OTP, and passkeys — all optional entry points into the same session, not a forced single method.

## Decision

**Better Auth**, using its `magicLink`, `emailOTP`, and `passkey` plugins.

## Why

Auth.js (NextAuth v5) — the more widely adopted option in the Next.js ecosystem — has a built-in Email provider that covers magic link, and an experimental WebAuthn provider that covers passkeys. It has **no built-in email-OTP flow**; that would need a hand-rolled Credentials provider plus custom code/verification storage. Better Auth ships all three (magic link, email OTP, passkey) as first-party plugins sharing one user/session model, which is a closer match to the requirement with less custom glue code to write and maintain.

## Alternatives rejected

- **Auth.js + custom OTP provider** — viable, but means writing and maintaining OTP generation, storage, and verification by hand, plus reconciling it with Auth.js's session model. More code, more surface for auth bugs, for a library that doesn't natively want to do this.
- **Fully custom auth (no library)** — rejected outright; rolling three separate credential-verification flows (magic link tokens, OTP codes, WebAuthn ceremonies) by hand is significant security-sensitive surface for no benefit over an actively maintained library built for exactly this.

## Consequences

- Introduces a less universally-known dependency than Auth.js — implementation agents should read Better Auth's plugin docs for `magicLink`/`emailOTP`/`passkey` directly rather than assuming Auth.js idioms transfer.
- Better Auth's Prisma adapter needs to match the schema in [[../02-data-model|data model]] — the user/session tables it generates are additive to, not a replacement for, the content tables.
