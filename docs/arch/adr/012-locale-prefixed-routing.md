---
title: "ADR-012: Every locale gets a URL prefix, including the default"
tags:
  - arch
  - adr
  - i18n
---

# ADR-012: Every locale gets a URL prefix, including the default

## Context

Adding route-based i18n means every URL needs to declare its locale. Two shapes were considered: (a) prefix every locale, including the default — `/en`, `/pl`, `/en/admin/cv` — with `/` 308-redirecting to `/en`; (b) leave the default locale unprefixed at the bare path (`/`, `/admin/cv`) and only prefix non-default locales (`/pl`, `/pl/admin/cv`), rewriting `/` to the `en` route internally.

## Decision

**(a) — prefix everything.** `/` always redirects to `/en`; there is no unprefixed public or admin route.

## Why

Every route in the app — including the entire `/admin/**` tree — needed to move under a `[lang]` root segment regardless of which option won, since root parameters (`next/root-params`) and the proxy's locale handling both depend on `[lang]` being a real segment above everything. Given that's unavoidable, prefixing the default locale too keeps the system uniform: one canonical URL per page, trivial `hreflang`/canonical generation (`alternates.canonical = /${lang}`, one loop over enabled locales for `alternates.languages`), and a proxy (`app/proxy.ts`) that only ever needs to (1) redirect a missing-prefix path to `/${DEFAULT_LOCALE}${path}` and (2) strip a known-good prefix before the existing `/admin/**` auth check. Both are a few lines with no special-casing.

The unprefixed-default alternative would have needed the proxy to *rewrite* `/` to the `[en]` route internally (so the URL bar stays clean) while separately 308-redirecting `/en/*` back to `/*` to prevent duplicate content between `/` and `/en` — two proxy behaviors instead of one, plus every internal link (`components/admin/admin-nav.tsx`, `cv-builder.tsx`, etc.) needing to know whether to omit the prefix for `en` specifically. Given the whole app already had to move under `[lang]` either way, that asymmetry bought nothing.

## Alternatives rejected

- **Default locale unprefixed** — rejected for the added proxy/link complexity above, for one redirect hop saved on the bare domain that most visitors won't take twice (browsers cache the 308).

## Consequences

- `/` is never a real page — it always 308s to `/${DEFAULT_LOCALE}`. Any external link to the bare domain costs one redirect hop.
- `next/root-params`' `lang()` getter is available to every Server Component and server-side utility in the app, including the entire admin tree — see [[../11-i18n|i18n]].
- `app/proxy.ts`'s matcher had to widen from `["/admin/:path*", "/api/admin/:path*", "/api/cv/:path*"]` to effectively "everything except static assets," since the locale-redirect branch now needs to run on every route, not just admin ones.
