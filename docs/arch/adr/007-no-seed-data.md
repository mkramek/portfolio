---
title: "ADR-007: No seed data — lazy provisioning and code-default merging"
tags:
  - arch
  - adr
---

# ADR-007: No seed data — lazy provisioning and code-default merging

## Context

A freshly deployed instance needs *something* to exist before it's usable: an admin account to log in with, and — for the public route to render sensibly — some notion of default section order/visibility and theme. The question is whether any of that comes from a seed script (`prisma db seed`) run once at setup/deploy time, or whether the database is allowed to start, and stay, completely empty until an explicit action creates a row.

Three shapes were considered: (a) seed the real content directly (name, email, work history — see [[../04-setup-publish-gate|Setup Flow & Publish Gate]] for how this was first raised and rejected), (b) seed structurally-valid placeholder rows (a "coming soon" gate keyed off required-field validation, with `Section`/`Theme`/`SetupState` pre-populated by a seed script so the app has *something* to read from day one), (c) no seed at all, ever — not even placeholders — with every row created lazily by the action that first needs it.

## Decision

**(c) — no seed script anywhere in the project.** Concretely:

- **Identity** (the Better Auth admin user): provisioned inline on the first magic-link/OTP request whose email matches `ADMIN_EMAIL` — see [[../03-auth|Auth]]. This is a write triggered by an explicit action (requesting to log in), not an incidental read.
- **Content the admin must supply** (`Profile`, `Education`, `Role`, `Project`, `SkillGroup`, etc.): no default exists, meaningfully or otherwise. Absence just means "not entered yet," and the public route never renders it unguarded — it goes through `SetupState.isComplete`, which itself defaults to `false` when its own row doesn't exist (see [[../04-setup-publish-gate|Setup Flow & Publish Gate]]).
- **Settings with a sensible default** (`Theme`, `CvSettings`) and **the fixed structural list** (`Section`): no row exists until the admin changes that specific setting/section. Reads merge the (possibly absent) DB row with an in-code default constant (`APP_DEFAULTS`, `DEFAULT_SECTIONS`); a write only happens when the admin actually changes something, via `upsert`. See [[../02-data-model|Data Model]].
- **The "coming soon" page**: a fully static placeholder, reading nothing from the content tables at all — not even `Profile.name` optionally. It only depends on the `SetupState` check that routed it there in the first place.

## Why

Option (b) — seeding structural placeholders — was the initial plan and isn't unreasonable on its own (`Section`/`Theme` rows aren't personal content, so they don't carry the PII concern that ruled out option (a)). It was rejected anyway once examined closely: it introduces a seed script as a required deploy step for something that doesn't need one. Every value a seed script would have inserted for `Theme`/`CvSettings`/`Section` is already a fixed, known-in-advance constant — the only reason to put it in the database ahead of time is convenience of not writing a merge-with-defaults read path. That read path turns out to be small and is needed anyway the moment the admin partially customizes settings (e.g., changes accent but not mode) unless every field is denormalized into its own row-or-default check regardless. Doing the merge-with-defaults consistently, for every zero-or-one table, removes the seed step entirely and removes an entire deployment failure mode ("did the seed run?").

## Alternatives rejected

- **Seed real content** — rejected earlier; see [[../04-setup-publish-gate|Setup Flow & Publish Gate]] and the PII concern raised when seed data was first discussed.
- **Seed structural placeholders only** (`Section`/`Theme`/`SetupState` pre-populated, content tables left empty) — the design's original shape, superseded by this ADR once it became clear the same merge-with-defaults logic needed for partial customization already eliminates the need for pre-populated rows at all.

## Consequences

- `prisma/seed.ts` does not exist in this project. There is no `bunx prisma db seed` step in [[../../impl/01-database-schema|impl: database schema]] or [[../../impl/09-deployment|impl: deployment]] — implementation and deployment docs should not reintroduce one.
- Every zero-or-one table (`Profile`, `Education`, `Theme`, `CvSettings`, `SetupState`) and the fixed-set table (`Section`) needs its reads written as "DB row if present, else a defined fallback" from the start — this isn't an edge case to handle later, it's the normal state of a table that hasn't been touched yet.
- A fresh clone-and-deploy has zero manual bootstrap steps beyond setting environment variables and running migrations: the first `/admin/login` attempt against `ADMIN_EMAIL` creates the account, and the first `/setup` submission creates the first real content rows.
