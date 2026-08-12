---
title: Setup Flow & Publish Gate
tags:
  - arch
  - setup
---

# Setup Flow & Publish Gate

## Problem this solves

A freshly deployed instance has an empty database. Without a gate, the public `/` route would render a broken-looking portfolio (empty hero, no roles, no skills) until the admin manually fills everything in. The setup flow and publish gate exist so the public site never shows a half-built page.

## `/setup`

An admin-gated route (same Better Auth session check as the rest of `/admin/**` — it is not a separate unauthenticated onboarding page) that walks through entering the fields required for setup-completeness: profile essentials, at least one Role, at least one SkillGroup. It's the same underlying forms as the regular admin CRUD tabs (see [[06-admin-ui]]), just surfaced as a single guided sequence for first-run convenience.

`/setup` stays reachable after completion too — it doesn't disappear or 404 — it just stops being where unauthenticated-to-incomplete admins get funneled.

## Completeness check

A dedicated Zod schema (`requiredForSetupSchema`, see [[02-data-model]]) defines "complete":

- `profile.name` non-empty
- `profile.title` non-empty
- `profile.email` non-empty
- `profile.summary` non-empty
- at least 1 `Role`
- at least 1 `SkillGroup`

This schema runs server-side after every write to Profile, Role, or SkillGroup, and its result is cached via an `upsert` on `SetupState.isComplete` (a single boolean + timestamp) so the public route's read is a cheap lookup, not a full re-validation on every visitor request.

There is no seed script (see [[02-data-model|Data Model]] and [[adr/007-no-seed-data|ADR-007]]), so on a freshly deployed instance the `SetupState` row doesn't exist at all yet — reading it returns nothing, and that absence is treated identically to `isComplete: false`. The gate works correctly from the very first request, before any `upsert` has ever run.

## Gate behavior

The public `/` route reads `SetupState.isComplete` server-side (React Server Component), defaulting to `false` when no row exists:

- **`false`** → renders a minimal "coming soon" page. This page is a **fully static placeholder** — fixed copy, no personalization, no database read of any kind beyond the `SetupState` check that got it here. It does not read `Profile.name` or anything else: nothing in the content tables is guaranteed to exist yet (there's no seed data — see [[02-data-model|Data Model]]), so the one page that must always render correctly is the one that depends on nothing.
- **`true`** → renders the full portfolio (see [[07-public-portfolio]]).

## One-way vs. re-gating

The gate is **not** a one-time switch that's forgotten about — it's recomputed on every relevant write for as long as the app runs, including *after* first going live. Concretely: if you later delete your only Role, or clear `profile.summary`, `SetupState.isComplete` flips back to `false` on that write, and the public site reverts to "coming soon" until the requirement is met again.

This was a deliberate choice over a true one-time gate: re-computing costs nothing extra (the same check already has to run on every write for the initial gate), and it prevents an accidental delete from quietly leaving a broken-looking public page live. There is no draft/publish workflow beyond this — once complete, ordinary edits still take effect immediately (see below); the gate only ever concerns whether the *minimum* content bar is met, not a review/approval step on every change.

## Not a draft/publish workflow

Explicitly rejected: a persistent draft-vs-live content distinction where edits sit unpublished until a manual "Publish" action. That model requires versioning every content table (draft snapshot + live snapshot, indefinitely) for a benefit that doesn't apply here — a single admin editing their own portfolio doesn't need to stage changes before visitors see them. All admin edits, once past initial setup, go live the moment they're saved — matching the original prototype's behavior. See [[adr/006-one-time-publish-gate|ADR-006]].
