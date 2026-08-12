---
title: "Impl 04: Public Portfolio"
tags:
  - impl
  - portfolio
---

# Impl 04: Public Portfolio

**Read first:** [[../arch/07-public-portfolio|Public Portfolio]], [[../arch/06-admin-ui|Admin UI & Design System]]

## Goal

The `/` route rendering the full portfolio (once setup is complete — see [[03-setup-flow]]) with all section layout variants, matching the prototype's visual design.

## Steps

1. Build the "coming soon" render path first (needed by [[03-setup-flow]] regardless of whether this phase's full-portfolio work is done yet) — **fully static markup**, no database read beyond the `isSetupComplete()` check that routed here. No `Profile.name`, no personalization — there's no seed data (see [[../arch/adr/007-no-seed-data|ADR-007]]), so nothing else is guaranteed to exist yet. Style with the base Tailwind tokens from [[00-project-setup]].

2. Build the section-rendering shell: call `getSections()` (from [[01-database-schema]] — merges any real `Section` rows with the `DEFAULT_SECTIONS` code constant, so this works correctly even with zero `Section` rows in the DB), filter `visible`, render each by `id` (`hero`, `strengths`, `experience`, `projects`, `skills`, `testimonials`, `contact`) via a `switch`/lookup to the corresponding section component.

3. Build each section component, each reading the relevant `Theme` field to pick its layout variant (all layouts described in [[../arch/07-public-portfolio|Public Portfolio]] and demonstrated in the original prototype's markup):
   - **Hero**: `monolith` / `terminal` / `ledger`, reading `Profile` + a small hero-stats derivation.
   - **Strengths**: card grid over `Strength[]`.
   - **Experience**: `rail` / `ledger` / `cards`, over `Role[]` ordered by `sortOrder`, each role's inline detail driven by its own `depth`.
   - **Projects**: `index` / `window` / `plain`, over `Project[]`.
   - **Skills**: grouped rows over `SkillGroup[]`.
   - **Testimonials**: card grid over `Testimonial[]`.
   - **Contact**: `Profile` contact fields — no CV export link (see [[../arch/05-cv-generation|CV Generation]] for why).

4. Wire `getTheme()`'s `mode`/`accent` (falls back to `APP_DEFAULTS.theme` until the admin sets one — see [[01-database-schema]]) to `data-theme`/`data-accent` attributes on the root layout element, server-read (no client toggle — see [[../arch/07-public-portfolio|Public Portfolio]]).

5. Any interactive bits within a server-rendered section (e.g. the "advanced" role case-study expand/collapse) become small client components handling just that local open/closed state — not a page-wide client store.

## Done when

- Against a database with zero `Section`/`Theme` rows, `getSections()`/`getTheme()` still produce a complete, correctly-ordered render (via their code defaults) — full-portfolio rendering doesn't secretly depend on rows that only a seed script would have created.
- With content entered via `/setup` (or manually via admin), every section renders correctly for each of its layout variants (spot-check by toggling `Theme` fields via psql/Prisma Studio if the admin panel isn't built yet).
- Visual output matches the prototype's design intent for each variant (side-by-side comparison against the original `.dc.html` files is the practical check here).
