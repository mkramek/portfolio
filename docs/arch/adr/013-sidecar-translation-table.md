---
title: "ADR-013: Translations as a sidecar table, not per-table columns"
tags:
  - arch
  - adr
  - i18n
---

# ADR-013: Translations as a sidecar table, not per-table columns

## Context

Once content (roles, projects, the profile, section labels, …) needed to render in more than one language, the question was where the translated text lives. Two shapes were considered: (a) one `Translation` table, keyed by `(entity, entityId, locale)`, holding a partial JSON blob of translated field values per row; (b) a `translations Json?` column added directly to each translatable table (`Role.translations`, `Project.translations`, …), keyed internally by locale.

## Decision

**(a) — a single sidecar `Translation` table.** See [[../11-i18n|i18n]] for the read/write mechanics.

## Why

A sidecar is one migration instead of eight, and reading a locale for the whole public portfolio costs exactly one extra query (`Translation.findMany({ where: { locale } })`) merged in memory against the base rows already being fetched — see `lib/i18n/content.ts`. Per-table JSON columns would need no extra query per page (the data rides along with the row already being read), which is a real point in their favor, but two things tipped it the other way:

1. **`Section` labels need to be translatable before a `Section` row exists.** Section labels default from the in-code `DEFAULT_SECTIONS` constant until the admin first touches one (see [[../02-data-model|Data Model]], `ADR-007`'s no-seed-data reasoning) — a per-row JSON column can't hold a translation for a row that isn't there. A sidecar keyed by `(entity, entityId)` has no such requirement; `entityId` can be a `SectionId` enum value with no matching `Section` row at all.
2. **"What's missing" is a single query, not a table scan.** The Translations tab's completeness view (`lib/i18n/report.ts`) and the Locales tab's per-language completeness badge both need to answer "how much of entity X is translated into locale Y" across every content table at once. Against a sidecar, that's one `Translation.findMany({ where: { locale } })` plus the existing per-entity getters. Against per-table columns, it's a bespoke query per table, unpacking each JSON column's keys, unioned together.

This is a deliberate extension of the same JSON-column instinct behind [[003-array-fields-as-json|ADR-003]] — array-shaped data that's always read/written as a whole unit doesn't need normalizing — applied one level up: translations are also always read/written as a whole unit (a full `Translation.values` blob per entity+locale), just not naturally co-located with the row they translate.

## Alternatives rejected

- **Per-table `translations Json?` column** — rejected primarily for the `Section`-before-its-row problem above, secondarily for turning "what's translated" into a per-table query instead of one.
- **Fully normalized per-field translation rows** (`entity`, `entityId`, `locale`, `field`, `value`) — rejected as the same over-normalization [[003-array-fields-as-json|ADR-003]] already rejected for array fields; nothing ever queries a single translated field independently of its whole entity.

## Consequences

- Deleting a role/project/etc. must explicitly delete its `Translation` rows too — there's no DB-level foreign key enforcing that cascade (the sidecar has no relation to the tables it translates). `lib/admin/routes.ts`'s generic `itemRoutes` factory does this via an injected `deleteTranslations` callback on every `DELETE`.
- `Translation.values` is an untyped JSON blob whose expected shape (which fields exist, string vs. array vs. pairs) lives in code (`lib/i18n/translatable.ts`), not the schema — validated at the API boundary (`lib/i18n/translation-validation.ts`), not by Postgres.
- A translation for a deleted-then-recreated entity with the same id would silently reattach — not a real risk here since ids are cuids, never reused.
