---
title: CV Generation
tags:
  - arch
  - cv
  - pdf
---

# CV Generation

## Scope

CV tailoring and PDF generation are **admin-only**, end to end. There is no public CV download link, no public route that renders CV markup. This was an explicit choice (see [[00-overview]] non-goals) — the CV builder is a private tool for preparing a tailored PDF per job application, not a public portfolio feature. The prototype's public "Export my experience to a CV" link is dropped entirely.

## `/admin/cv` — the builder

Functionally the same as the prototype's CV sidebar, backed by the DB instead of `localStorage`. `CvSettings` holds only the **current draft** — starting a new tailoring overwrites it in place; past tailorings live on separately as `CvSnapshot` history (see "History" below and [[adr/011-cv-snapshot-history|ADR-011]]):

- **Target company/position** — two free-text fields, `CvSettings.company` and `CvSettings.position`, shown in the generated CV's headline line as `${position} @ ${company}`. Split into two fields specifically so history entries can copy them without parsing a combined string — see [[adr/011-cv-snapshot-history|ADR-011]].
- **Tailored summary** — free text (`CvSettings.summary`); empty falls back to `Profile.summary`.
- **Target language** — `CvSettings.locale`, a dropdown over the admin-enabled locales (hidden entirely when only one locale is enabled). This is the CV **document's own content language** — independent of whichever locale the admin happens to be browsing the builder itself in. See [[11-i18n]].
- **Section toggles** — `CvSettings.includeSkills/Projects/Testimonials/Education/Languages`.
- **Roles: include & reorder** — `Role.includeInCv` + `Role.sortOrder` (shared with the portfolio's ordering — a deliberate choice, see [[adr/010-shared-role-project-ordering|ADR-010]]).
- **Projects in CV** — `Project.includeInCv`.

All of these are ordinary DB writes through the same validated API routes the rest of admin uses — nothing CV-specific about the persistence layer, only about which fields exist.

## Render path

A server-only route, `/admin/cv/print`, renders the CV as print-formatted HTML — recreating the prototype's two-page `doc-page` layout (IBM Plex Sans, print-pt sizing, page-break-aware sections) as ordinary React/Tailwind (print media query styles) instead of the prototype's custom element. This route is auth-gated like everything else under `/admin/**`; it is never linked from the public site and has no public-facing purpose beyond being the input to PDF generation.

Its resolved content — including the section headings themselves ("Work Experience", "Technical Skills", …) — renders in `CvSettings.locale` (live mode) or the frozen `CvSnapshot.locale` (redownload mode), not whatever `[lang]` happens to be in the URL the admin is browsing under. See [[11-i18n]].

It has two render modes:

- **Live** (default) — renders `CvSettings` against current `Role`/`Project`/`Profile`/etc. state, same as always.
- **Frozen** — given a `CvSnapshot` id, renders that snapshot's stored `snapshot` JSON instead of live state, plus a version badge (`v1`/`v2`/… — computed per [[02-data-model|Data Model]], never stored) styled to be hidden under print media so it never appears in generated PDF output. See "History" below.

The internal request from PDF generation (below) authenticates by forwarding the caller's own session cookie — this route never needs a separate internal-token scheme, since the Chromium-driven request and the admin's own browser session are conceptually the same actor.

## PDF generation

`POST /api/cv/pdf` (auth-gated):

1. Launches `playwright-core` with `@sparticuz/chromium` (a Chromium binary built to fit Vercel's serverless function size/runtime constraints — see [[adr/004-serverless-pdf-generation|ADR-004]]).
2. Navigates the headless browser to `/admin/cv/print` (live mode, or frozen mode when redownloading from history — see below), server-to-server, within the same deployment (no public network hop — it's an internal request to the app's own render path, forwarding the caller's session cookie so it authenticates the same way the API route itself did).
3. Calls `page.pdf()` with print-appropriate margins/format matching the `doc-page` design intent.
4. Streams the resulting PDF back as the response body (`Content-Type: application/pdf`, `Content-Disposition: attachment`).
5. **Live generations only** (not redownloads from an existing snapshot): creates a new `CvSnapshot` row afterward, capturing the fully-resolved content that was just rendered. See "History" below.

The "Download PDF" button in `/admin/cv` simply triggers this endpoint and lets the browser handle the download.

## History

Every live PDF generation automatically creates a `CvSnapshot` — there is no separate "save to history" action; see [[adr/011-cv-snapshot-history|ADR-011]] for why. The `/admin/cv` tab shows a history list (view, redownload, delete) alongside the builder, not as a separate top-level admin tab:

- **View** opens `/admin/cv/print` in frozen mode for that snapshot, badge visible on screen.
- **Redownload** calls `/api/cv/pdf` pointed at that snapshot's frozen content instead of live state — recovers a lost file without needing the underlying `Role`/`Project`/etc. rows to still say what they said at generation time.
- **Delete** removes the row, same as any other list entity; version numbers for the remaining snapshots in that company+position group renumber accordingly (they were never stored).

Iterating on a CV and downloading several times before settling on final wording produces several history rows for one application — this is expected, not something the design tries to prevent (see [[adr/011-cv-snapshot-history|ADR-011]]); surplus entries are pruned with ordinary delete.

## Why no client-side print fallback

The prototype used `window.print()`, whose output quality depends entirely on the visitor's browser and OS print-to-PDF implementation — inconsistent margins, font substitution, and page-break behavior across Chrome/Firefox/Safari. Since the actual requirement is "click a button, get a reliable PDF," server-rendered PDF is the only path implemented; there's no reason to maintain two CV-rendering code paths (client print CSS + server Playwright) when the server path alone satisfies the requirement. If an on-screen preview before downloading is ever wanted, `/admin/cv/print` is already a normal page — open it in a new tab.
