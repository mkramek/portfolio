---
title: "ADR-003: Array-shaped fields as JSON columns"
tags:
  - arch
  - adr
---

# ADR-003: Array-shaped fields as JSON columns, not child tables

## Context

Several entities have array-shaped fields: `Role.bullets`, `Role.metrics`, `Role.stack`, `Project.stack`, `SkillGroup.items`. Each could be modeled as a normalized child table (e.g. a `RoleBullet` table with a foreign key back to `Role`) or as a single JSON column on the parent row.

## Decision

**JSON columns.** This was explicitly re-confirmed with the project owner after presenting the option to normalize (metrics, stack, bullets, skill items were all offered as candidates) — the answer was to keep the JSON-column shape as originally proposed.

## Why

Every one of these fields is always read and written as a complete unit scoped to its parent: the admin editor's `lines`/`pairs`/`tags` field types (see [[../06-admin-ui|admin UI]]) already edit them as one whole string that's split/joined, and nothing in the app ever queries "find all roles with stack item X" independently of loading the role itself. Normalizing would add join overhead and migration surface (a child table + FK + cascade rules per field) with no corresponding query or integrity benefit.

## Alternatives rejected

- **Normalized child tables for all four fields** — rejected: no current or anticipated query pattern benefits from it, and it multiplies the number of tables/migrations for content that's conceptually just "a list of strings/pairs attached to a row."

## Consequences

- If a future requirement needs to query across these arrays (e.g. "list all distinct stack tags used anywhere" for a tag-filter UI), that field would need to be revisited and normalized at that point — this decision is scoped to the current requirements, not a permanent constraint.
- The Zod schema for each entity (see [[../02-data-model|data model]]) validates the JSON column's shape (e.g. `z.array(z.object({value: z.string(), label: z.string()}))` for metrics) — the ORM's JSON column type doesn't enforce internal structure on its own.
