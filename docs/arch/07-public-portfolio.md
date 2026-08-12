---
title: Public Portfolio
tags:
  - arch
  - portfolio
---

# Public Portfolio

## Route

`/[lang]` is the only public route in the app — `/` itself always 308-redirects to `/${DEFAULT_LOCALE}` (`/en`). It requires no auth and touches no client-side state store — it's a React Server Component that reads directly from the database. Unlike most of the rest of the app, it is **not** `force-dynamic`: it's served with ISR (`revalidate = 300` on the shared root layout), with admin writes explicitly busting that cache via `revalidatePath` so edits still show up immediately. See [[11-i18n]] and [[adr/014-isr-for-public-portfolio|ADR-014]] for the full reasoning, including why this route deliberately has no `generateStaticParams`.

Which locale renders is `[lang]` — validated against the in-code locale catalogue by the shared root layout (garbage segments 404), and additionally checked against the *admin-enabled* locale set by this page itself (a cataloged-but-disabled locale 404s here specifically, not in the layout, so it stays reachable under `/admin/**`).

## Gate check first

Every request to `/[lang]` first reads `SetupState.isComplete` (see [[04-setup-publish-gate]]), defaulting to `false` when that row doesn't exist yet (there is no seed data — see [[02-data-model|Data Model]] and [[adr/007-no-seed-data|ADR-007]]):

- `false` → render the minimal "coming soon" page: **fixed static copy only**, no `Profile.name` interpolation, no database read beyond the `SetupState` check itself. It must render correctly against a completely empty, never-written-to database.
- `true` → proceed to the full render below.

## Full portfolio render

Section order/visibility comes from merging the in-code `DEFAULT_SECTIONS` constant with whatever `Section` rows actually exist (see [[02-data-model|Data Model]]) — a section the admin has never reordered/hidden still appears, at its default position, without needing a pre-existing row. Sections render in that merged order, skipping any with `visible = false`:

- **hero** — one of three layouts chosen by `Theme.hero` (`monolith` / `terminal` / `ledger`), reading `Profile` fields and a small set of derived hero stats.
- **strengths** — `Strength[]` as a card grid.
- **experience** — `Role[]` (ordered by `sortOrder`), rendered in one of three layouts chosen by `Theme.timeline` (`rail` / `ledger` / `cards`). Each role's rendered detail depends on its own `depth` field (`simple` = one-liner only, `extended` = + metrics/bullets/stack, `advanced` = + expandable case study), independent of the timeline layout choice.
- **projects** — `Project[]`, in one of three layouts chosen by `Theme.project` (`index` / `window` / `plain`).
- **skills** — `SkillGroup[]`, grouped rows.
- **testimonials** — `Testimonial[]` (this section defaults to `visible: false` in `DEFAULT_SECTIONS`, same as the prototype — references are opt-in to show).
- **contact** — `Profile` contact fields. The prototype's "Export my experience to a CV" link is **not** carried over here — CV generation is admin-only (see [[05-cv-generation]]).

`Theme.mode` and `Theme.accent` (falling back to `APP_DEFAULTS.theme` — light/teal — until the admin has changed Appearance at least once, per [[02-data-model|Data Model]]) set `data-theme`/`data-accent` on the root element, driving the CSS custom properties described in [[06-admin-ui]]. Unlike the prototype (which toggled these client-side via a button that wrote to `localStorage`), there is no public-facing mode/accent toggle — mode and accent are admin-controlled site-wide settings, not a per-visitor preference. (If a visitor-facing light/dark toggle is wanted later, it would need to be layered on top of, not instead of, the admin-set default — out of scope for this design.)

## No client store

The prototype's entire `Portfolio.dc.html` logic exists only because it was a static-file prototype simulating a backend with `localStorage` + a custom `sc-for`/`sc-if` templating layer. In the real app, that entire layer is replaced by ordinary JSX (`.map()`, conditional rendering) over data fetched server-side — there is nothing analogous to `PortfolioStore` on the client for the public page.

## Translated content

Every field above renders in whichever locale `[lang]` resolves to: `lib/i18n/content.ts`'s `getLocalizedContent(locale)` reads the same content this page always read, merged field-by-field against that locale's `Translation` rows — an untranslated field falls back to its English text rather than rendering blank. See [[11-i18n]] and [[adr/013-sidecar-translation-table|ADR-013]]. `Section.label` participates the same way: the admin edits the English base label from `/admin/sections`, and its translation (like any other content) comes from `/admin/translations` — the Sections tab itself always shows and writes the English base, never a localized label, since editing there writes directly to the base row.

## SEO

`generateMetadata` on the shared root layout sets a localized `title`/`description` (from the same localized `Profile` this page reads), `alternates.canonical`/`languages` (one entry per admin-enabled locale, plus `x-default`), and Open Graph/Twitter tags. `app/sitemap.ts` lists one entry per enabled locale with hreflang alternates, empty while the publish gate is closed; `app/robots.ts` disallows every locale's `/admin` tree and `/api/`. A `Person` JSON-LD graph (`lib/seo.ts`) renders once setup is complete, built from data already on the page — no extra query. None of this appears on the pre-publish "coming soon" state beyond fixed, locale-appropriate copy and a `noindex` — see [[04-setup-publish-gate]]'s no-personalization rule.
