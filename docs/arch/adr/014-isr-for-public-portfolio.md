---
title: "ADR-014: ISR for the public portfolio, not force-dynamic"
tags:
  - arch
  - adr
  - i18n
  - performance
---

# ADR-014: ISR for the public portfolio, not force-dynamic

## Context

Every route in the app — public and admin alike — was `export const dynamic = "force-dynamic"` from the start (see [[../01-tech-stack]]), meaning the public `/` route re-ran every content query on every visitor request, including the fully-static "coming soon" placeholder. Adding i18n was a chance to revisit this for the public route specifically, since it's the one route real, repeat, uncached traffic actually hits. Three shapes were considered: (a) classic ISR — drop `force-dynamic`, set `export const revalidate = N` on `app/[lang]/layout.tsx`, call `revalidatePath` from every admin write so edits still show up immediately; (b) `"use cache"` / Cache Components (`cacheComponents: true`); (c) leave it `force-dynamic` and accept the per-request DB cost.

## Decision

**(a) — classic ISR**, `revalidate = 300` on the shared root layout, `revalidatePublicPortfolio()` (`lib/revalidate.ts`) called from every mutating admin route.

## Why

Admin routes keep `force-dynamic` on themselves; per Next.js's rule that a `force-dynamic` route segment forces the *entire* request dynamic regardless of ancestors, removing `force-dynamic` from the shared root layout only affects the routes that don't also declare it — i.e., exactly the public `/[lang]` page. No admin behavior changes.

Cache Components (`"use cache"`) was the more "current" option, but it's an all-or-nothing config flag (`cacheComponents: true`) that also *removes* the classic `revalidate`/`dynamicParams` route-segment config this app's admin routes lean on, and requires deciding a caching strategy for every server function in the render path, not just the top-level route. That's a real migration in its own right — bundling it into an i18n change would have made this change harder to review and revert independently. Classic ISR gets the actual goal (cached repeat requests, DB touched only once per `revalidate` window or on an explicit edit) with a two-line diff per route.

Leaving it `force-dynamic` was rejected outright — it was the status quo the user explicitly asked to improve ("lessening overall load on the page"), and the fully-static "coming soon" placeholder re-querying the database on every request was the clearest case that the blanket `force-dynamic` was never actually earned.

## Alternatives rejected

- **`cacheComponents: true` / `"use cache"`** — rejected as a separate, larger migration (see above); worth revisiting on its own once the codebase has settled on where per-component caching would actually help beyond the top-level route.
- **Leave `force-dynamic`** — rejected; it was the specific inefficiency this change exists to fix.

## Consequences

- `app/sitemap.ts` stays `force-dynamic` on purpose, not ISR — without it, `next build` would try to prerender the sitemap once at build time, which needs a reachable database. The Docker/CI build has no Postgres (see [[../08-deployment]]), so this route must render per-request instead. Crawler traffic is low-volume enough that this costs nothing that matters; `app/robots.ts` has no DB dependency at all and stays static.
- `app/[lang]/page.tsx` and `layout.tsx` deliberately have **no** `generateStaticParams` — adding one would make Next attempt to prerender `/en` and `/pl` at build time too, hitting the same DB-at-build-time problem. Both locales are instead rendered on-demand on first visit and cached from then on (`dynamicParams` defaults to `true`).
- Every admin write that could change public-facing output (content, sections, theme, locale enablement, a translation) must remember to call `revalidatePublicPortfolio()`. It's centralized in the generic route factory (`lib/admin/routes.ts`) for the five list entities and called explicitly in the handful of singleton/settings routes (`profile`, `theme`, `sections`, `locales`, `translations`, `data` import) — a new mutating route that forgets it will keep serving stale content for up to 5 minutes, not indefinitely, but it's a real thing to remember.
- `revalidatePath` throws when called outside a real Next.js request (e.g. `lib/admin/routes.test.ts`'s in-memory fake-delegate unit tests). `revalidatePublicPortfolio()` swallows that case deliberately — the mutation itself has already succeeded by the time it runs, so a revalidation failure degrading to "stays cached until the next natural window" is an acceptable, non-silent-in-practice tradeoff, not a correctness bug.
