---
title: "Impl 01: Database Schema"
tags:
  - impl
  - data
---

# Impl 01: Database Schema

**Read first:** [[../arch/02-data-model|Data Model]], [[../arch/adr/001-database-postgres|ADR-001]], [[../arch/adr/003-array-fields-as-json|ADR-003]], [[../arch/adr/007-no-seed-data|ADR-007]], [[../arch/adr/010-shared-role-project-ordering|ADR-010]], [[../arch/adr/011-cv-snapshot-history|ADR-011]]

## Goal

A Prisma schema implementing every entity in [[../arch/02-data-model|Data Model]], migrated against a real Postgres instance, with matching Zod schemas — and **no seed script**. Every table starts with zero rows; see [[../arch/adr/007-no-seed-data|ADR-007]] for why, and don't reintroduce `prisma/seed.ts` or a `db seed` step anywhere in this project.

## Steps

1. Provision a Postgres instance (Neon or Vercel Postgres — see [[../arch/08-deployment|Deployment]]) for local development. Set `DATABASE_URL` (and `DIRECT_DATABASE_URL` if the provider needs a separate direct connection for migrations) in `app/.env`.

2. `bun add -D prisma && bun add @prisma/client`, then `bunx prisma init`.

3. Write `app/prisma/schema.prisma` covering every entity table in [[../arch/02-data-model|Data Model]]:
   - `Profile`, `Education`, `Theme`, `CvSettings`, `SetupState` as zero-or-one-row tables (enforced via application logic — always `findFirst`/`upsert` on a known constant id, e.g. `id: "singleton"` — not via a seeded row).
   - `Role`, `Project`, `SkillGroup`, `Testimonial`, `Strength`, `Language` as normal multi-row tables with `sortOrder Int` and `id String @id @default(cuid())`.
   - `CvSnapshot` as a normal multi-row, append-only table (`id`, `createdAt`, `company`, `position`, `snapshot Json`) — no `sortOrder` (ordered by `createdAt`), and application code should only ever `create`/`delete` it, never `update` — see [[../arch/adr/011-cv-snapshot-history|ADR-011]].
   - `Section` as a normal multi-row table keyed by its fixed `id` enum (below) — rows are created on demand, not pre-populated.
   - JSON columns (`Json` type in Prisma) for `Role.bullets`, `Role.metrics`, `Role.stack`, `Role.caseStudy`, `Project.stack`, `SkillGroup.items` — see [[../arch/adr/003-array-fields-as-json|ADR-003]] for why these are not normalized.
   - `Role.depth` and `Theme`'s enum fields (`mode`, `accent`, `hero`, `timeline`, `project`, `admin`) as Prisma `enum` types, matching the option lists in [[../arch/02-data-model|Data Model]].
   - `Section.id` as a Prisma `enum` (fixed set: `hero`, `strengths`, `experience`, `projects`, `skills`, `testimonials`, `contact`) rather than a free-text string, since the set is closed.

4. Run `bunx prisma migrate dev --name init` to create and apply the first migration. Do **not** follow this with a seed command — there isn't one.

5. Write Zod schemas in `app/lib/schemas/` — one per entity, mirroring the Prisma model shapes exactly (including JSON-column internal structure, e.g. `metrics: z.array(z.object({ value: z.string(), label: z.string() }))`). These are imported by API routes, admin forms, and the setup-completeness check ([[03-setup-flow]]) — write them once here, don't duplicate validation logic per consumer.

6. Write `app/lib/defaults.ts`: two in-code constants, `APP_DEFAULTS` (the fallback values for `Theme` and `CvSettings` — port these directly from the original prototype's `portfolio-store.js` `defaults()`, e.g. `theme: { mode: 'light', accent: 'teal', hero: 'monolith', timeline: 'rail', project: 'index', admin: 'split' }`) and `DEFAULT_SECTIONS` (the 7 fixed section ids with their default `label`/`sortOrder`/`visible`, also ported from the prototype — `testimonials` defaults to `visible: false`). These are plain TypeScript, not database rows — see [[../arch/adr/007-no-seed-data|ADR-007]] for why this distinction matters (structural constants in code are fine; personal content or placeholder DB rows are not).

7. Write the merge-on-read helpers that every consumer of `Theme`, `CvSettings`, and `Section` will use (e.g. `getTheme()`, `getCvSettings()`, `getSections()` in `app/lib/content.ts`):
   - `getTheme()` / `getCvSettings()`: `findFirst` (or `findUnique` on the constant id) and return `dbRow ?? APP_DEFAULTS.theme` / `APP_DEFAULTS.cv` — never write on this read.
   - `getSections()`: `findMany()` over `Section`, then for each id in `DEFAULT_SECTIONS` not present in the result, splice in its default — return one complete, ordered list regardless of how many rows actually exist.
   - Corresponding write helpers (`setTheme()`, etc.) do a plain `upsert` keyed on the constant id / section id — this is the only place these tables are ever written, and only ever in response to an explicit admin action.

8. Confirm Better Auth's own tables (added in [[02-auth]]) coexist in the same schema/migration set without conflicting names.

## Done when

- `bunx prisma migrate dev` runs clean against the provisioned Postgres instance, and the database has **zero rows** in every table immediately afterward — there is no seed step to run.
- `getTheme()`/`getCvSettings()`/`getSections()` against that empty database return complete, valid default values without writing anything (verify with a query — the tables should still be empty after calling them).
- Every Zod schema round-trips: a value that satisfies the schema is accepted by Prisma's generated types, and vice versa (spot-check a couple of entities, don't need exhaustive proof).
