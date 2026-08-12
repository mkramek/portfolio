---
title: "Impl 03: Setup Flow & Publish Gate"
tags:
  - impl
  - setup
---

# Impl 03: Setup Flow & Publish Gate

**Read first:** [[../arch/04-setup-publish-gate|Setup Flow & Publish Gate]], [[../arch/adr/006-one-time-publish-gate|ADR-006]]

## Goal

`/setup` for guided first-run content entry, a `SetupState.isComplete` flag recomputed on the writes that matter, and the public `/` route respecting it.

## Steps

1. Write `requiredForSetupSchema` in `app/lib/schemas/` (per [[../arch/02-data-model|Data Model]]): validates `profile.name`, `profile.title`, `profile.email`, `profile.summary` are non-empty, and that at least one `Role` and one `SkillGroup` row exist.

2. Write a `recomputeSetupState()` server function that runs this schema against current DB state and `upsert`s the `SetupState` row (keyed on its constant id, per [[01-database-schema]]) with the result and `updatedAt`. Call it from every mutation path that touches Profile, Role, or SkillGroup (this will mostly be the admin API routes built in [[05-admin-panel]] — if this phase lands before that one, stub the call sites now and wire them as those routes are built).

3. Write the read side as `isSetupComplete()`: `findFirst` on `SetupState` and return `row?.isComplete ?? false` — there is no seed script (see [[../arch/adr/007-no-seed-data|ADR-007]]), so this must return a correct, safe answer (`false`) against a `SetupState` table that has never had a row written to it.

4. Build `/admin/setup` as an auth-gated page (covered by the middleware from [[02-auth]]) presenting the required fields as a short guided sequence — reuse the same form components/Zod schemas the full admin CRUD tabs will use ([[05-admin-panel]]), don't build a parallel one-off form implementation.

5. Update the public `/` route ([[04-public-portfolio]]) to call `isSetupComplete()` first, before querying anything else, and branch to the "coming soon" render when `false`. The "coming soon" render itself must not query any other table — no `Profile` lookup, nothing — it's static copy plus this one boolean.

6. Confirm the re-gating behavior: deleting the only `Role` (or clearing `profile.summary`, etc.) after setup was previously complete correctly flips `SetupState.isComplete` back to `false` on that write, per [[../arch/04-setup-publish-gate|Setup Flow & Publish Gate]].

## Done when

- Freshly migrated DB with **zero rows in every table** (no seed step exists — see [[01-database-schema]]) → `/` shows "coming soon" without erroring, and without any `SetupState` row existing yet.
- Completing `/setup` with valid required fields → `/` immediately shows the full portfolio on next request.
- Deleting the last `Role` afterward → `/` reverts to "coming soon" on next request.
