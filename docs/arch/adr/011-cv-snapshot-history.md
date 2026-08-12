---
title: "ADR-011: CV snapshot history over a single mutable draft"
tags:
  - arch
  - adr
---

# ADR-011: CV snapshot history over a single mutable draft

## Context

The original design had `CvSettings` as a single zero-or-one row holding "the current CV tailoring" — target role/company, summary override, section toggles — overwritten in place every time the admin tailors for a new job application ([[../02-data-model|Data Model]]). Tailoring for a new application destroyed any record of the previous one; the downloaded PDF file was the only surviving artifact. The question: is that acceptable, or does the app need to remember past tailored CVs?

## Decision

**Add `CvSnapshot`**, an append-only history table. Every "Download PDF" click ([[../05-cv-generation|CV Generation]]) creates one new `CvSnapshot` row containing:

- `company`, `position` — copied from `CvSettings` at that moment (`CvSettings.target` is split into these two fields specifically to populate this cleanly, with no string parsing).
- `createdAt`.
- `snapshot` — the fully **resolved** CV content (summary, and every included role/project/testimonial/skill/education/language entry's actual field values, in their generation-time order) — not just the `CvSettings` row. Frozen at generation time, independent of later edits to `Role`/`Project`/`Profile`/etc.

`CvSettings` itself remains a single mutable row — "the current draft" — unchanged in shape apart from the `target` → `company`/`position` split.

## Why

The app already reuses the same mutable `sortOrder`/content tables for both the portfolio and the CV ([[010-shared-role-project-ordering|ADR-010]]), so nothing about "what CV did I actually send to Acme in March" survives being read later once bullets are rewritten, roles are deleted, or the next application overwrites `CvSettings`. A history feature that only stored *settings* (which role IDs were included, in what order) would still break the moment underlying content changed or a referenced row was deleted — it wouldn't actually answer "what did they receive." Freezing the fully-resolved content at generation time is the only shape that answers that question reliably, indefinitely.

Auto-creating a snapshot on every download (rather than a separate explicit "save to history" action) avoids a forgettable manual step — the exact failure mode this feature exists to prevent in the first place, just moved one layer up. Iterating on wording and downloading several times before settling on final copy produces several history rows for one application; this is treated as acceptable (even useful, as a look-back on how a pitch evolved) rather than as noise to prevent, and ordinary delete (matching every other list tab's pattern) is how surplus entries get pruned.

Snapshot ordering/versioning (`v1`, `v2`, … per exact `company`+`position` match) is computed at read time, never stored — nothing outside the app ever references a version number as a stable identifier, so there's no cost to it shifting when an earlier snapshot in the group is deleted, and computing it avoids a renumbering write path entirely.

The version badge is visible only in the admin's on-screen view of a snapshot (via a print-hidden style on `/admin/cv/print`'s frozen-snapshot render mode), never in generated PDF output — it's an admin bookkeeping aid, not part of the document itself.

Redownloading a PDF directly from a `CvSnapshot` (re-running the PDF pipeline against the frozen content instead of live `CvSettings` state) was added because the frozen-content design otherwise only supports on-screen lookback — it doesn't recover a lost file, which is a real and likely failure mode (a downloaded PDF is just as loseable as any other file) that costs little extra to close, since the print route already needs a "render this frozen snapshot" mode for the on-screen preview.

`CvSnapshot` is included in the Data tab's JSON export/import ([[../02-data-model|Data Model]]) like every other real content table — it's genuinely owned data, not a derived value like `SetupState`, and excluding it would mean a restore-from-backup silently loses application history.

## Alternatives rejected

- **Settings-only history** (store `company`/`position`/`summary`/toggles/included-role-and-project-*ids*, re-resolve content live at view time) — rejected: breaks the moment referenced content is edited or deleted, defeating the point of a historical record.
- **Explicit "Save to history" action, separate from "Download PDF"** — rejected: adds a forgettable manual step; the whole point of this feature is not losing information because a manual step wasn't taken.
- **Stored, persisted version number per snapshot** — rejected: requires a renumbering write on every delete to stay gapless, for a number nothing outside the app ever references; computing it at read time gets the identical result with no extra column or write path.
- **Excluding `CvSnapshot` from export/import** (treating it as disposable/regenerable) — rejected: it isn't regenerable (source content changes over time), and it's real data the admin would reasonably expect a backup to include.

## Consequences

- `CvSettings.target` is replaced by two fields, `company` and `position` — the print CV's headline becomes `${position} @ ${company}` (same visual output as before), and the builder form gains a second input.
- `/admin/cv/print` needs two render modes: live (current `CvSettings` + current `Role`/`Project`/etc. state) and frozen (a specific `CvSnapshot`'s stored content) — the frozen mode additionally renders the print-hidden version badge.
- `/api/cv/pdf` needs to accept an optional snapshot reference to redownload from, in addition to its existing live-generation path.
- The admin `CV` tab gains a history list (view/redownload/delete per entry) — no new top-level admin tab.
- `CvSnapshot` rows are never updated, only created and deleted — there is no edit path, matching "frozen" being load-bearing, not incidental.
