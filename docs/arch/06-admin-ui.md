---
title: Admin UI & Design System
tags:
  - arch
  - ui
  - design-system
---

# Admin UI & Design System

## Source design

The prototype (`Portfolio.dc.html`, `CV.dc.html`, `Admin.dc.html`) defines the visual language this app inherits:

- **Typography**: `JetBrains Mono` for nearly everything (UI chrome, headings, labels), `IBM Plex Sans` for longer-form prose (body copy, blurbs, bullets).
- **Color**: OKLCH-based accent color, computed from `--acL` (lightness), `--acC` (chroma), `--acH` (hue) custom properties — hue swaps per accent choice (teal/amber/lime/violet), lightness/chroma swap per light/dark mode.
- **Surfaces**: `--bg` (page background), `--panel`/`--panel2` (card/raised surfaces), `--fg` (text), `--dim` (secondary text), `--line` (hairline borders) — all redefined under `[data-theme="dark"]`.
- **Layout variants**: several sections of the portfolio (hero, experience timeline, project cards) and the admin editor panel each have 2-3 interchangeable layouts, selected via `Theme` fields (see [[02-data-model]]) rather than being hard-coded.

## Tailwind mapping

These custom properties are kept as **real CSS custom properties**, not reimplemented as Tailwind's built-in `dark:` variant — the app needs *runtime-toggleable* mode (persisted in the DB, not the OS preference) plus 4 accent choices, which is a wider axis than Tailwind's binary light/dark handles natively. Tailwind v4's `@theme` block references these custom properties as token values (e.g. `--color-bg: var(--bg)`), so utility classes like `bg-bg`, `text-fg`, `border-line` resolve against whatever the current `data-theme`/`data-accent` attributes set on the root element — same mechanism as the prototype, just authored as Tailwind tokens instead of inline `style=` strings.

The OKLCH accent formula (`oklch(var(--acL) var(--acC) var(--acH))` and its soft/foreground derivatives) is ported as-is.

## Base UI component mapping

Base UI is headless — it supplies behavior/accessibility, not appearance. Each prototype interaction pattern maps to a Base UI primitive, styled with the Tailwind tokens above:

| Prototype pattern | Base UI primitive | Notes |
|---|---|---|
| Segmented tab nav (`PORTFOLIO / CV / ADMIN`, admin's content tabs) | `Tabs` | |
| Entry editor (slide-in panel, split or stacked) | `Dialog` (stacked variant) or an inline panel region (split variant) | Which one renders is still a `Theme.admin` choice, same as the prototype |
| Destructive confirm ("Delete this entry?", "Reset everything?") | `AlertDialog` | Two-button (confirm/cancel), matches prototype's confirm modal |
| Depth / layout-variant pill selectors | `Toggle Group` | Matches the prototype's `[data-seg]` pill-button look |
| CV section toggles, section visibility, "include in CV" checkboxes | `Checkbox` | |
| Mode/accent switch | `Toggle Group` | |
| Save/export "toast" (e.g. "saved", "exported") | `Toast` | |
| Free-text inputs/textareas | native `input`/`textarea` | No primitive needed; Tailwind-styled to match |
| Table rows (roles/projects/skills/etc. list view) | plain markup | No primitive needed; row actions (edit/delete/reorder) are ordinary buttons |

## Admin structure

Same tabs as the prototype, plus a new one:

`Setup` (new — see [[04-setup-publish-gate]]; also where passkey registration lives, see [[03-auth]]) · `Experience` (Role) · `Projects` · `Skills` (SkillGroup) · `Strengths` · `References` (Testimonial) · `Profile` · `Sections` · `Appearance` (Theme) · `Locales` (which catalogue locales are enabled for visitors — see [[11-i18n]]) · `Translations` (fill in missing per-locale content, filterable to just what's missing) · `Data` (JSON export/import) · `CV` (builder + print preview + `CvSnapshot` history — see [[05-cv-generation]])

All admin routes live under `/[lang]/admin/**` — the admin panel itself is dictionary-driven per the browsing locale, independent of which locales are enabled for public visitors (see [[11-i18n]]).

Each list tab (Experience/Projects/Skills/Strengths/References) follows the same shape: a table with reorder (↑/↓, writing `sortOrder`), edit (opens the schema-driven form), delete (through `AlertDialog`), and — where applicable — an "include in CV" toggle. Form fields are generated from the same per-entity field schema the prototype used (`text` / `area` / `lines` / `pairs` / `tags` / `select` / `bool` field types), now backed by the Zod schemas in [[02-data-model]] instead of ad hoc raw-string parsing.

## Data tab

JSON export/import is kept even with a real database — it remains useful as a manual backup/restore mechanism. Export serializes every content table (see [[02-data-model]]) as one JSON document; import re-validates the whole payload against the combined Zod schema before writing anything (all-or-nothing, transactional).

## Server vs. client components

The public portfolio ([[07-public-portfolio]]) and the CV print route ([[05-cv-generation]]) are React Server Components reading straight from the database — no client-side store, no hydration-time template language. Admin screens are a mix: list/table views can be server-rendered with client-side islands for the interactive bits (reorder, toggle, open editor); the entry editor form and CV builder sidebar are client components (they hold in-progress edit state before save).
