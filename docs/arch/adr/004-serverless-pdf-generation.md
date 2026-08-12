---
title: "ADR-004: Serverless PDF generation via @sparticuz/chromium"
tags:
  - arch
  - adr
---

# ADR-004: Serverless PDF generation via `@sparticuz/chromium`

## Context

CV generation ([[../05-cv-generation|CV generation]]) needs to produce a real PDF server-side. Headless-browser PDF generation (Playwright/Puppeteer driving Chromium) is the most direct way to render the exact same HTML/CSS as the print-formatted CV route. The complication: Vercel serverless functions have deployment-size and filesystem constraints that a full desktop Chromium install doesn't fit within.

## Decision

**`playwright-core` + `@sparticuz/chromium`** — a Chromium build packaged specifically to run inside AWS Lambda-style serverless environments (which Vercel's Node.js functions are built on), used from a Node.js-runtime Route Handler.

## Why

This is the standard, actively-maintained solution for "run headless Chromium inside a Vercel/Lambda function" — it solves the exact constraint (function size limits, `/tmp`-only writable filesystem) without requiring a separate always-on browser service. It keeps PDF generation in-process with the rest of the app (one deployment, one codebase) rather than introducing a new external system.

## Alternatives rejected

- **Full Playwright (with its bundled browsers) in the serverless function** — rejected: bundled browser binaries are far too large for typical serverless deployment size limits.
- **An external HTML-to-PDF API** (e.g. Browserless, PDFShift) — viable and simpler in one sense (no Chromium packaging concerns at all), but adds a third-party service dependency, a recurring cost, and a network hop for something that can run in-process. Considered and set aside in favor of keeping the PDF pipeline self-contained; revisit if `@sparticuz/chromium`'s cold-start latency or maintenance burden becomes a real problem.
- **Self-hosting instead of Vercel** (would remove the constraint entirely, since a full Chromium install is trivial on a normal server) — rejected at the deployment-target decision point, before this ADR; see [[001-database-postgres|ADR-001]] for the same fork applied to storage.

## Consequences

- The `/api/cv/pdf` Route Handler **must** run on the Node.js runtime, not Edge — headless Chromium cannot execute there.
- Cold-start latency (browser launch time) is a few seconds; acceptable because this is an admin-only, on-demand, low-frequency action, not a hot path.
- `@sparticuz/chromium` version must stay compatible with the `playwright-core` version in use — check both when upgrading either.
