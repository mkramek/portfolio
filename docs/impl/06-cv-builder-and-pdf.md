---
title: "Impl 06: CV Builder & PDF"
tags:
  - impl
  - cv
  - pdf
---

# Impl 06: CV Builder & PDF

**Read first:** [[../arch/05-cv-generation|CV Generation]], [[../arch/adr/004-serverless-pdf-generation|ADR-004]], [[../arch/adr/010-shared-role-project-ordering|ADR-010]], [[../arch/adr/011-cv-snapshot-history|ADR-011]]

## Goal

`/admin/cv` for tailoring a CV against existing content, a working "Download PDF" producing a real file via server-rendered Chromium, and a `CvSnapshot` history list (view/redownload/delete) of every CV actually generated.

## Steps

1. Build `/admin/cv`'s builder sidebar: `company` + `position` inputs, tailored-summary textarea (with a "reset to profile summary" action), section-include toggles (`CvSettings.includeSkills/Projects/Testimonials/Education/Languages`), role include+reorder rows, project include rows — all writing straight to `CvSettings`/`Role.includeInCv`/`Role.sortOrder`/`Project.includeInCv` through the same API routes as [[05-admin-panel]] (no CV-specific persistence layer). Reordering roles/projects here is the same `sortOrder` the public portfolio reads — deliberate, see [[../arch/adr/010-shared-role-project-ordering|ADR-010]] — so no separate "CV order" state to build.

2. Build `/admin/cv/print` (auth-gated, server component): the two-page print-formatted CV layout — port the prototype's `doc-page` structure (header block, professional summary, technical skills, work experience, selected projects, references, education, languages — each gated by its `CvSettings.include*` flag) as ordinary React + Tailwind print-media styles (`@media print` rules, `break-inside: avoid` on entries that shouldn't split across pages). Headline line renders as `${position} @ ${company}`.

   Give this route two modes, both behind the same auth gate:
   - **Live** (default, no query param): resolves against current `CvSettings` + `Role`/`Project`/etc. state, as above.
   - **Frozen** (e.g. `?snapshot=<id>`): loads that `CvSnapshot`'s stored `snapshot` JSON and renders from it directly instead of querying `Role`/`Project`/etc. — content is already fully resolved, so this path does no additional DB reads beyond fetching the snapshot row itself. Render a small version badge (`v1`/`v2`/… — computed per step 6 below) with a `print:hidden` Tailwind class (or equivalent `@media print { display: none }` rule) so it's visible on screen but never appears in `page.pdf()` output.

3. `bun add playwright-core @sparticuz/chromium`.

4. Write `app/app/api/cv/pdf/route.ts` (Node.js runtime, **not** Edge):
   - Accept an optional `snapshotId` in the request (redownload path) alongside the default (live) path.
   - Launch Chromium via `@sparticuz/chromium` + `playwright-core`.
   - Navigate to `/admin/cv/print` (with `?snapshot=<id>` if redownloading), server-to-server, within the same deployment — forward the caller's session cookie onto the internal navigation (e.g. `context.addCookies()`) so the internal request authenticates as the same admin session; no separate internal-token scheme, see [[../arch/adr/011-cv-snapshot-history|ADR-011]]'s consequences and [[../arch/05-cv-generation|CV Generation]].
   - Call `page.pdf()` with margins/format matching the print route's design.
   - Return the PDF bytes with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="..."`.
   - **Live generations only**: after a successful `page.pdf()`, create a `CvSnapshot` row — `company`/`position` copied from `CvSettings`, `snapshot` populated by resolving the same content the print route just rendered (summary + every included role/project/testimonial/skill/education/language entry's current field values, in their current order). Redownloads (snapshot-mode generations) do **not** create a new snapshot — they replay an existing one.

5. Wire the "Download PDF" button in `/admin/cv` to call this route (live mode) and let the browser handle the resulting download.

6. Build the history list in `/admin/cv` (below/beside the builder, not a separate top-level tab — see [[../arch/06-admin-ui|Admin UI & Design System]]): `GET` all `CvSnapshot` rows ordered by `createdAt` descending. For each, compute its version by grouping in-memory (or via a query) on exact `company`+`position` match and finding its 1-indexed position within that group ordered by `createdAt` ascending — this is **never** a stored column. Per row: "View" (opens `/admin/cv/print?snapshot=<id>` in a new tab/window), "Redownload" (calls `/api/cv/pdf?snapshotId=<id>`), "Delete" (`DELETE` the row — no cascading concerns, `CvSnapshot` has no dependents).

7. Confirm `CvSnapshot` is included in the Data tab's export/import ([[05-admin-panel]]) alongside every other real content table.

## Done when

- Changing builder settings and reopening `/admin/cv/print` reflects them immediately (company/position line, summary, included sections, role/project selection and order).
- "Download PDF" produces a valid, openable PDF matching what `/admin/cv/print` shows on screen, **and** appends a new `CvSnapshot` row capturing that exact content.
- Editing a `Role`'s bullets (or deleting it) after generating a snapshot does not change what that snapshot's "View"/"Redownload" show — it still reflects the frozen content from generation time.
- Downloading the same company+position combination twice produces two `CvSnapshot` rows, shown as `v1`/`v2` in the history list; deleting `v1` renumbers the remaining one to `v1`.
- The version badge appears in the on-screen "View" of a frozen snapshot but is absent from that same snapshot's downloaded PDF.
- The PDF route and print route (both modes) are unreachable without an authenticated admin session.
