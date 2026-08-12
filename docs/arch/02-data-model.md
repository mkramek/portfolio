---
title: Data Model
tags:
  - arch
  - data
---

# Data Model

Single-tenant: every table below is implicitly scoped to the one admin/owner. There is no `userId`/`ownerId` foreign key sprinkled through content tables — Better Auth's own user table is the only place a "user" concept exists (see [[03-auth]]).

Array-shaped fields (bullets, stack tags, metric pairs, skill items) are stored as **JSON columns**, not normalized child tables. They're always read and written as a whole unit scoped to their parent row, never queried or filtered independently of it — normalizing them would add join complexity and migration overhead for no query benefit. See [[adr/003-array-fields-as-json|ADR-003]].

## No seed data

The database starts completely empty. There is no seed script anywhere in the project — no `prisma/seed.ts`, no `prisma db seed` step in setup or deployment. Every row in every table is created by an explicit action: an admin edit, the `/setup` flow, or — for the one case where something must exist before any admin action is even possible — lazy provisioning tied directly to that action (the admin user record, created on first login attempt; see [[03-auth]]). See [[adr/007-no-seed-data|ADR-007]] for the full reasoning.

This makes three read-time patterns apply, depending on the table:

- **Content the admin must actually provide** (`Profile`, `Education`) has no meaningful default — absence just means "not entered yet." Nothing renders it directly from an unguarded read: the public route always goes through the `SetupState.isComplete` gate first (see [[04-setup-publish-gate]]), which itself defaults to `false` when its own row doesn't exist yet, and the "coming soon" page is a fully static placeholder that queries none of this content.
- **Settings with a sensible out-of-the-box value** (`Theme`, `CvSettings`) are read as `dbRow ?? APP_DEFAULTS.theme` — an in-code constant, not a database row — until the admin changes one, at which point that single row is created via `upsert`. `APP_DEFAULTS` mirrors the original prototype's defaults (light/teal/monolith/rail/index/split for `Theme`). These are application constants, not personal content, so keeping them in code carries none of the seed-data/PII concerns that ruled out pre-populating `Profile`/`Role` — see [[adr/007-no-seed-data|ADR-007]].
- **The fixed structural list** (`Section`) works the same way, per row: an in-code `DEFAULT_SECTIONS` constant (the 7 known section ids with their default label/order/visibility, matching the prototype) is merged with whatever `Section` rows actually exist — a section the admin has never touched renders from the code default; one they've reordered or hidden reads from its DB row, created via `upsert` on that first change.

None of this is a write-on-read side effect for `Theme`/`CvSettings`/`Section` — reads merge with code defaults without persisting anything; a row is only ever written when the admin explicitly changes that setting/section.

## Entities

### Profile (zero-or-one row — see "No seed data" above)
| Field | Type | Notes |
|---|---|---|
| name | string | required for setup-complete |
| handle | string | used in e.g. terminal-style hero variant (`~/handle`) |
| title | string | required for setup-complete |
| tagline | text | short, shown in hero |
| summary | text | required for setup-complete; also the CV summary fallback |
| email | string | required for setup-complete |
| phone | string | optional |
| location | string | optional |
| linkedin | string | optional |
| github | string | optional |
| availability | string | optional, shown in hero/contact |
| heroStats | JSON `{value, label}[]` | optional; the monolith hero's stat strip. No code default — it's personal content, see [[adr/007-no-seed-data|ADR-007]]; when absent the hero renders with derived/empty cells (see [[04-public-portfolio]]) |
| ledgerRows | JSON `{label, value}[]` | optional; the ledger hero's key/value spec table. Same no-default rule as `heroStats`; when absent the ledger hero renders from other profile fields |

### Role (experience entries)
| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | |
| company | string | |
| title | string | |
| start | string | free text, e.g. "Oct 2024" — not a real date type, matches prototype and avoids timezone/partial-date handling for a field that's always display-only |
| end | string | free text, e.g. "Present" |
| kind | string | e.g. "Contract · Remote" |
| location | string | |
| depth | enum: `simple` \| `extended` \| `advanced` | controls how much detail renders — simple = one-liner only, extended = + metrics/bullets/stack, advanced = + case study |
| oneLiner | text | |
| bullets | JSON string[] | |
| metrics | JSON `{value, label}[]` | |
| stack | JSON string[] | |
| caseStudy | JSON `{context, approach, impact}` | only meaningful when `depth = advanced` |
| includeInCv | boolean | default true |
| sortOrder | int | drives both portfolio and CV ordering — deliberately shared, not independent; reorder = swap two `sortOrder` values. See [[adr/010-shared-role-project-ordering|ADR-010]]. |

At least one Role is required for setup-complete.

### Project
| Field | Type | Notes |
|---|---|---|
| id, name, role, year, blurb | string/text | |
| stack | JSON string[] | |
| link | string | optional |
| includeInCv | boolean | default true |
| sortOrder | int | |

### SkillGroup
| Field | Type | Notes |
|---|---|---|
| id, group | string | e.g. "Frontend" |
| items | JSON string[] | |
| sortOrder | int | |

At least one SkillGroup is required for setup-complete.

### Testimonial
| Field | Type | Notes |
|---|---|---|
| id, quote, author, role | string/text | |
| includeInCv | boolean | default false |
| sortOrder | int | |

### Strength
| Field | Type | Notes |
|---|---|---|
| id, tag, title, body | string/text | the "three cards under the intro" |
| sortOrder | int | |

### Education (zero-or-one row)
| Field | Type |
|---|---|
| degree | string |
| detail | text |

### Language
| Field | Type |
|---|---|
| id, name, level | string |

### Section (fixed set of 7 ids — rows created lazily, see "No seed data" above)
| Field | Type | Notes |
|---|---|---|
| id | enum | one of: `hero`, `strengths`, `experience`, `projects`, `skills`, `testimonials`, `contact` — fixed, closed set, not user-creatable |
| label | string | |
| visible | boolean | |
| sortOrder | int | |

A `Section` row exists in the DB only once the admin reorders or toggles visibility for that specific id; until then, `DEFAULT_SECTIONS` (an in-code constant) supplies its label/order/visibility.

### Theme (zero-or-one row — falls back to `APP_DEFAULTS.theme` until first admin change)
| Field | Type | Options |
|---|---|---|
| mode | enum | `light` \| `dark` |
| accent | enum | `teal` \| `amber` \| `lime` \| `violet` |
| hero | enum | `monolith` \| `terminal` \| `ledger` |
| timeline | enum | `rail` \| `ledger` \| `cards` |
| project | enum | `index` \| `window` \| `plain` |
| admin | enum | `split` \| `stacked` |

### CvSettings (zero-or-one row — falls back to `APP_DEFAULTS.cv` until first admin change)
The **current draft only** — tailoring for a new application overwrites this row in place. Past tailorings are preserved separately as `CvSnapshot` rows (below), not here. See [[adr/011-cv-snapshot-history|ADR-011]].

| Field | Type | Notes |
|---|---|---|
| company | string | e.g. "Acme" — split from a single `target` field specifically so `CvSnapshot` can copy both cleanly; see [[adr/011-cv-snapshot-history|ADR-011]] |
| position | string | e.g. "Senior Platform Engineer" |
| summary | text | override; falls back to `Profile.summary` when empty |
| includeSkills | boolean | |
| includeProjects | boolean | |
| includeTestimonials | boolean | |
| includeEducation | boolean | |
| includeLanguages | boolean | |
| locale | string | the CV document's own content language — e.g. `"en"`, `"pl"` — independent of whichever locale the admin is browsing the builder in. Defaults to `"en"`. See [[11-i18n]]. |

### CvSnapshot (multi-row, append-only, immutable — created only, never updated)
A frozen record of one generated CV PDF. See [[adr/011-cv-snapshot-history|ADR-011]] for the full reasoning — in short: `Role`/`Project` content and ordering are live, mutable, and shared with the public portfolio ([[adr/010-shared-role-project-ordering|ADR-010]]), so the only way to know what a specific tailored CV actually contained when it was sent is to freeze its fully-resolved content at generation time, independent of later edits.

| Field | Type | Notes |
|---|---|---|
| id | string (cuid) | |
| createdAt | timestamp | |
| company | string | copied from `CvSettings.company` at generation time |
| position | string | copied from `CvSettings.position` at generation time |
| snapshot | JSON | the fully-resolved CV content at generation time — summary, and every included role/project/testimonial/skill/education/language entry's actual field values, in their generation-time order. Not a reference to live rows. |
| locale | string | the content language the snapshot was resolved and frozen in — copied from `CvSettings.locale` at generation time, so redownloading an old snapshot stays faithful even if the draft's target language has since changed. |

One row is created automatically on every "Download PDF" click ([[05-cv-generation]]) — there is no separate explicit "save" action. Delete is supported, same as any other list entity. A snapshot's **version** (`v1`, `v2`, …) is its ordinal position among all `CvSnapshot` rows sharing the exact same `company` + `position`, ordered by `createdAt` — this is *computed at read time*, never a stored column, so deleting an earlier snapshot in a group renumbers the rest with no gap.

### SetupState (zero-or-one row, derived + cached)
| Field | Type | Notes |
|---|---|---|
| isComplete | boolean | recomputed (and the row upserted) on every write to Profile/Role/SkillGroup; read by the public `/[lang]` route — see [[04-setup-publish-gate]]. **No row at all reads as `isComplete: false`** — a fresh, never-written-to database must gate to "coming soon" without needing anything pre-created. |
| updatedAt | timestamp | |

### Locale (rows created lazily, one per non-default enabled/disabled toggle — see [[11-i18n]])
| Field | Type | Notes |
|---|---|---|
| code | string (PK) | e.g. `"pl"` — must be in the in-code `LOCALE_CATALOGUE` |
| enabled | boolean | whether visitors can reach this locale publicly |
| sortOrder | int | |

Merge-on-read against `LOCALE_CATALOGUE`, same pattern as `Theme`/`Section` (ADR-007): `"en"` is always enabled and never gets a row; every other catalogue entry defaults to `enabled: false` until the admin's Locales tab first toggles it.

### Translation (multi-row sidecar — see [[11-i18n]] and [[adr/013-sidecar-translation-table|ADR-013]])
| Field | Type | Notes |
|---|---|---|
| entity | enum | `profile` \| `role` \| `project` \| `skillGroup` \| `strength` \| `testimonial` \| `education` \| `language` \| `section` \| `cvSettings` |
| entityId | string | the translated row's own id — a cuid, `"singleton"` for zero-or-one tables, or a `SectionId` value |
| locale | string | |
| values | JSON | a **partial** object of translated field values, nested to mirror the base entity's own shape (e.g. `{ caseStudy: { context: "…" } }`) — not every translatable field needs to be present |
| updatedAt | timestamp | |

Primary key `(entity, entityId, locale)`. No DB-level foreign key to the tables it translates — deleting a role/project/etc. must explicitly delete its `Translation` rows (`lib/admin/routes.ts`'s generic route factory does this on every `DELETE`). Which fields of each entity are translatable at all (proper nouns like company/product/people names and specific skill tags are excluded) is declared once in code, `lib/i18n/translatable.ts`, not in this schema.

## Validation

Every entity above has a matching Zod schema in the app (e.g. `roleSchema`, `profileSchema`). These schemas are the single source of truth for three consumers:

1. **Admin form validation** — client + server-side, before a write is accepted.
2. **API route input validation** — every mutating Route Handler parses its body through the relevant schema before touching the database.
3. **Setup-completeness check** — a dedicated `requiredForSetupSchema` (a subset: `profile.name`, `profile.title`, `profile.email`, `profile.summary`, `roles.length >= 1`, `skillGroups.length >= 1`) is run whenever Profile/Role/SkillGroup change, and its pass/fail result is cached on `SetupState.isComplete`.

## JSON export/import shape

The admin "Data" tab's export produces one JSON document containing every table above (Profile, Role[], Project[], SkillGroup[], Testimonial[], Strength[], Education, Language[], Section[], Theme, CvSettings, CvSnapshot[], Translation[], Locale[] — `SetupState` excluded, since it's derived, not owned data). `CvSnapshot` is included like any other real content table — it's owned application history, not a derived value, and a restore-from-backup that silently dropped it would be a real loss; see [[adr/011-cv-snapshot-history|ADR-011]]. For the zero-or-one/fallback tables (`Theme`, `CvSettings`, `Section`) and — as of [[11-i18n]] — `Locale`, export serializes the **effective** (merged-with-defaults) values, not the possibly-absent raw row — so an export taken before the admin has ever touched Appearance still exports a complete, valid `Theme` object, and one taken before any locale has been toggled still exports a complete `Locale[]` (English enabled, every other catalogue entry disabled). `Translation[]` is exported unfiltered, in full. Both `translations` and `locales` are `.default([])` in the export schema, so a backup taken before i18n shipped still imports unchanged. Import re-validates the whole payload against the combined Zod schema before writing anything, and writes are transactional (all tables replaced together, or none) — importing always materializes real rows for every table, even ones that were only defaults before.
