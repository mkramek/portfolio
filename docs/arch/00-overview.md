---
title: Overview
tags:
  - arch
  - overview
---

# Overview

## What this is

A full-stack Next.js application that replaces a client-side HTML/JS prototype (three linked pages — `Portfolio.dc.html`, `CV.dc.html`, `Admin.dc.html` — sharing one `localStorage` record) with a real, single-owner web app:

- **Public portfolio** (`/[lang]`) — a personal portfolio site, server-rendered from a database, in whichever admin-enabled locale the visitor requests.
- **Admin panel** (`/[lang]/admin/**`) — auth-gated CRUD over every piece of content (profile, roles, projects, skills, testimonials, strengths, education, languages, section order/visibility, theme/layout, locale configuration, translations, raw data import/export).
- **CV builder + generator** (`/[lang]/admin/cv`) — auth-gated: tailor a CV (target role, summary override, section/role/project selection and order, target language) against the same content, and generate a real PDF on demand.

The prototype's visual design (monospace-led typography, OKLCH accent colors, light/dark mode, swappable layout variants per section) is the starting point for the UI, rebuilt on [Base UI](https://base-ui.com) + Tailwind CSS instead of the prototype's inline styles and custom `sc-for`/`sc-if` templating.

## Who this is for

Single-owner tool. There is exactly one admin identity (you), configured via an `ADMIN_EMAIL` environment variable. There is no multi-user account system, no public sign-up, no per-visitor state.

## Non-goals

- Multi-tenancy of any kind.
- A CMS for arbitrary content types — the schema is fixed to what a CV/portfolio needs (see [[02-data-model]]).
- Real-time collaborative editing — one admin, one browser tab at a time is the assumed usage pattern.
- Public CV download — CV generation is a private tool for tailoring a PDF per job application, not a public-facing feature (see [[05-cv-generation]]).
- Any database seeding — the app starts from a completely empty database and stays correct at every stage of being filled in; see [[04-setup-publish-gate]] and [[adr/007-no-seed-data|ADR-007]].

## System shape

```
Visitor ──HTTP──> proxy.ts (locale redirect + admin auth gate) ──> Next.js ──> Postgres
                       │
                       ├─ /[lang] (public)         reads SetupState; renders "coming soon" or full portfolio
                       │                            in the requested, admin-enabled locale
                       │
                       └─ /[lang]/admin/** (private) Better Auth session required (magic link / email OTP / passkey)
                             ├─ /admin/setup          guided first-run entry of required fields
                             ├─ /admin/{roles,projects,...}  CRUD tabs
                             ├─ /admin/theme          layout variants + accent/mode
                             ├─ /admin/locales        which locales are enabled for visitors
                             ├─ /admin/translations   fill in missing per-locale content
                             ├─ /admin/data           JSON export/import
                             └─ /admin/cv             CV builder → POST /api/cv/pdf (Playwright + Chromium) → PDF
```

`/` always 308-redirects to `/en` (the default locale) — see [[11-i18n|Internationalization]] and [[adr/012-locale-prefixed-routing|ADR-012]].

## How to read these docs

- **`docs/arch/`** (this folder) is the durable reference: what the system is and why it's built this way. Update it when a decision changes, not when a task is completed.
- **`docs/impl/`** is the phased build plan for implementation agents: concrete steps, files, and commands, each phase linking back to the arch doc(s) it implements. Read the linked arch doc *before* starting an impl phase — it has the reasoning the impl doc assumes you already know.
- **`docs/arch/adr/`** holds short Architecture Decision Records for the choices that had real alternatives, captured with their rejected options and why — read these when a later change makes you want to revisit a decision, to see whether the original reasoning still holds.

## Document index

| Doc | Covers |
|---|---|
| [[01-tech-stack]] | Full stack choice and rationale |
| [[02-data-model]] | Entities, schema shape, Zod validation |
| [[03-auth]] | Better Auth, magic link/OTP/passkey, bootstrap |
| [[04-setup-publish-gate]] | `/setup`, completeness gate, coming-soon behavior |
| [[05-cv-generation]] | CV builder + server-rendered PDF pipeline |
| [[06-admin-ui]] | Base UI component mapping, Tailwind token mapping |
| [[07-public-portfolio]] | Public rendering, RSC data flow |
| [[08-deployment]] | Vercel, Postgres provisioning, env vars, Chromium constraints |
| [[09-testing-strategy]] | bun test + Playwright e2e |
| [[10-ci-cd]] | GitHub Actions (lint/build/publish), Biome, Docker image, GHCR |
| [[11-i18n]] | Route-based i18n, translated content, dictionaries, locale-aware CV, caching |
