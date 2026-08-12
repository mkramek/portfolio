---
title: "ADR-006: Completeness gate over a draft/publish workflow"
tags:
  - arch
  - adr
---

# ADR-006: Completeness gate over a draft/publish workflow

## Context

A freshly deployed instance has no content, and the public site shouldn't show a broken-looking empty portfolio. Two shapes were considered: (a) a computed completeness flag that gates the public route between "coming soon" and "live," with all edits taking effect immediately once live (matching the prototype's always-live behavior); (b) a persistent draft-vs-published content model, where every edit sits in a draft state until an explicit "Publish" action promotes it.

## Decision

**(a) — completeness gate, no persistent draft/publish workflow.** See [[../04-setup-publish-gate|setup & publish gate]] for the mechanism.

## Why

This is a single-owner app where the owner editing their own content has no reason to stage changes before seeing them live — that's exactly the prototype's existing behavior (every `mutate()` call saves and is immediately reflected). A full draft/publish model requires content versioning (a draft snapshot and a live snapshot per entity, indefinitely, not just during initial setup) for a workflow benefit — reviewing changes before visitors see them — that doesn't apply when there's no one to review changes *for* other than the person making them.

The completeness gate solves the actual problem (don't show a broken empty site) without that ongoing versioning cost: it's a single derived boolean, recomputed on writes to the handful of fields that matter, checked once per public-route request.

## Alternatives rejected

- **Persistent draft/publish workflow** — rejected as solving a collaboration/review problem this single-owner app doesn't have, at the cost of doubling the write path (draft table + publish-promotion logic) for every content entity indefinitely.
- **No gate at all** (just ship with placeholder seed data) — rejected because it reintroduces the PII-in-seed-data question this design deliberately avoided, and still risks an empty/half-filled public page if the admin defers filling in content after deploy. This project goes further still and seeds nothing at all, not even placeholders — see [[007-no-seed-data|ADR-007]].

## Consequences

- The gate is re-evaluated on every relevant write, not just once at initial setup — so it can flip back to "coming soon" if content is later deleted below the required threshold. This was a deliberate secondary decision (see [[../04-setup-publish-gate|setup & publish gate]]) to avoid a broken-looking public page persisting silently.
- If a real collaborative-review need ever emerges (e.g. a second content contributor), this decision should be revisited — the current model has no mechanism to stage a change for review before it's visible.
