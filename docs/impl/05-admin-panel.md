---
title: "Impl 05: Admin Panel"
tags:
  - impl
  - admin
---

# Impl 05: Admin Panel

**Read first:** [[../arch/06-admin-ui|Admin UI & Design System]], [[../arch/02-data-model|Data Model]]

## Goal

Full CRUD over every content entity through `/admin/**`, matching the prototype's tab structure, built on Base UI + Tailwind, backed by validated API routes.

## Steps

1. Build the admin shell: `/admin` layout with the tab nav (`Setup` · `Experience` · `Projects` · `Skills` · `Strengths` · `References` · `Profile` · `Sections` · `Appearance` · `Data` · `CV`) using Base UI `Tabs`, per [[../arch/06-admin-ui|Admin UI & Design System]].

2. For each list-shaped entity (`Role`, `Project`, `SkillGroup`, `Testimonial`, `Strength`):
   - A `GET`/`POST`/`PATCH`/`DELETE` set of Route Handlers under `app/api/admin/{entity}/`, each validating input against the matching Zod schema from [[01-database-schema]] before touching the DB, and (for `Role`/`SkillGroup` mutations) calling `recomputeSetupState()` from [[03-setup-flow]].
   - A reorder endpoint (or a `PATCH` accepting a new `sortOrder`) implementing the up/down swap logic from the prototype (`move()` in `Admin.dc.html`: swap `sortOrder` with the adjacent row).
   - A table view (server-rendered list + client-side row actions: edit/delete/reorder/CV-toggle).
   - A schema-driven entry editor: derive form fields from the entity's field-type metadata (`text`/`area`/`lines`/`pairs`/`tags`/`select`/`bool` — same field-type vocabulary as the prototype's `schema()` function in `portfolio-store.js`), rendered as a Base UI `Dialog` (stacked) or inline panel (split), per `Theme.admin`. A field may declare `dependsOn: { key, values }` to render only when a sibling field currently holds one of those values — used on `Role` so `bullets`/`metrics`/`stack`/`caseStudy.*` only appear once `depth` is `extended`/`advanced`; hiding a field never discards its stored value, since the editor still seeds and saves every field regardless of visibility.
   - Destructive delete confirmation via Base UI `AlertDialog`.

3. `Profile` and `Education` tabs: single-record forms (no list/table), same field-type-driven rendering. There is no pre-existing row to `PATCH` (no seed — see [[../arch/adr/007-no-seed-data|ADR-007]]), so the save handler is an `upsert` keyed on the constant singleton id, same as `Theme`/`CvSettings`. The form reads via the equivalent `findFirst() ?? {}` (empty strings for every field, not a code default — there's no sensible fallback content for a name or email) so the form renders correctly (all fields blank) before the admin has ever saved.

4. `Sections` tab: reorder (swap `sortOrder`) + visibility toggle, operating over the **merged** list from `getSections()` (from [[01-database-schema]] — real `Section` rows overlaid on the `DEFAULT_SECTIONS` code constant), not a raw table query — this tab must render all 7 sections correctly even before any of them has a DB row. Toggling/reordering a section writes its row for the first time via `upsert`; no create/delete (the set of ids is closed).

5. `Appearance` (`Theme`) tab: a `Toggle Group` per themeable axis (`mode`, `accent`, `hero`, `timeline`, `project`, `admin`), each option list matching [[../arch/02-data-model|Data Model]]'s enums, reading via `getTheme()` (falls back to `APP_DEFAULTS.theme` — see [[01-database-schema]] — until first change) and writing via `setTheme()`'s `upsert` on click (no separate "save" step, matching the prototype).

6. `Data` tab: export button (serialize every content table's **effective** values — `getTheme()`/`getCvSettings()`/`getSections()`'s merged output, not raw possibly-absent rows, per [[../arch/02-data-model|Data Model]]'s JSON export shape — as a downloadable `.json`) and import (paste/upload JSON → validate against the combined Zod schema → transactional replace-all on success, surfaced errors on failure). Import always materializes real rows, even for tables that were only defaults before. `CvSnapshot[]` is included in export/import like any other real content table — no special-casing (see [[../arch/adr/011-cv-snapshot-history|ADR-011]]).

7. Wire `recomputeSetupState()` calls (from [[03-setup-flow]]) into every Profile/Role/SkillGroup write path added here, if not already done in that phase.

## Done when

- Every entity supports create/edit/delete/reorder through the UI, each persisting correctly and reflected on the public portfolio ([[04-public-portfolio]]) without a page reload elsewhere.
- Opening `Profile`, `Sections`, or `Appearance` against a **freshly migrated, zero-row database** renders correctly (blank form / all 7 sections at defaults / default theme selected) — none of them error or show "undefined" from an assumed-to-exist row.
- Theme changes apply immediately across `/`, `/admin/cv`, and `/admin` itself, and the underlying `Theme` row is created on that first change, not before.
- Export produces a JSON file that, re-imported, reproduces the same effective content (round-trip check) — including when exported before any `Theme`/`Section` row existed.
