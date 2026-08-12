---
title: "ADR-010: Role/Project ordering shared between portfolio and CV"
tags:
  - arch
  - adr
---

# ADR-010: Role/Project ordering shared between portfolio and CV

## Context

The CV builder ([[../05-cv-generation|CV Generation]]) lets the admin reorder which `Role`/`Project` entries appear in a tailored CV. `Role.sortOrder`/`Project.sortOrder` ([[../02-data-model|Data Model]]) already exist as the single ordering field the public portfolio's Experience/Projects sections render by. The question: should the CV builder write to that same field, or maintain an independent ordering (e.g. a separate `cvSortOrder`) so tailoring a CV for one job application doesn't change the live public portfolio's order?

## Decision

**Shared.** The CV builder's role/project reorder action writes the same `sortOrder` field the public portfolio reads. There is no separate CV-specific ordering field.

## Why

This matches the original prototype's behavior exactly (one JSON blob, one order, read by both the portfolio and the CV sidebar) — consistent with the "no reason to diverge from the prototype without a concrete need" reasoning already used elsewhere (see [[006-one-time-publish-gate|ADR-006]], [[007-no-seed-data|ADR-007]]). This is a single-owner app tailoring one CV at a time; reordering back after generating a PDF is a one-click action, and a second `cvSortOrder` field would be a second ordering concept to keep mentally in sync — for a single admin, that's more likely to cause confusion (which order is "real"?) than the shared-field surprise it's meant to avoid.

## Alternatives rejected

- **A separate `cvSortOrder` field per `Role`/`Project`** — would decouple CV tailoring from the public portfolio's order, at the cost of a second ordering concept per entity and UI complexity clarifying to the admin which order they're currently editing.

## Consequences

- Reordering roles/projects in the CV builder is visibly, immediately reflected on the public portfolio's Experience/Projects sections, and vice versa.
- [[011-cv-snapshot-history|ADR-011]]'s `CvSnapshot` exists partly *because of* this: since ordering is a live, mutable, shared value, the only way to preserve "what a specific CV actually looked like when sent" is a frozen content snapshot taken at generation time — not by reading `sortOrder` later, which may have since changed for the portfolio's own reasons.
