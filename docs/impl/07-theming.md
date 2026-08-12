---
title: "Impl 07: Theming"
tags:
  - impl
  - design-system
---

# Impl 07: Theming

**Read first:** [[../arch/06-admin-ui|Admin UI & Design System]], [[../arch/adr/005-styling-tailwind-base-ui|ADR-005]]

## Goal

The full token system and every layout variant working consistently across `/`, `/admin`, and `/admin/cv`, matching the prototype's design intent.

Much of this phase's work is threaded through [[00-project-setup]] (base tokens), [[04-public-portfolio]] (section layout variants), and [[05-admin-panel]] (admin editor split/stacked variant) rather than being a separate isolated build step — this doc collects the cross-cutting theming concerns those phases share, and is the place to return to when a layout variant looks inconsistent between screens.

## Steps

1. Confirm the `@theme` token block (from [[00-project-setup]]) is defined **once**, imported by every route — not duplicated per-page. `Theme.mode`/`Theme.accent` are read server-side in the root layout and set as `data-theme`/`data-accent` on `<html>` or a top-level wrapper, so all three screens (`/`, `/admin`, `/admin/cv`) share one source of truth (the singleton `Theme` row).

2. Verify each layout-variant axis end to end:
   - `hero`: monolith / terminal / ledger — [[04-public-portfolio]].
   - `timeline`: rail / ledger / cards — [[04-public-portfolio]].
   - `project`: index / window / plain — [[04-public-portfolio]].
   - `admin`: split / stacked — [[05-admin-panel]]'s entry editor.

3. Confirm the OKLCH accent formula produces visually correct results for all four accents (teal/amber/lime/violet) in both light and dark mode — this is a straightforward but easy-to-typo port from the prototype's `--acH` values (teal is the unmarked default hue `196`; amber `68`; lime `138`; violet `298` — see the original prototype source if these need re-deriving).

4. Confirm changing `Theme` from the `Appearance` admin tab reflects immediately on `/` and `/admin/cv` without requiring a rebuild or redeploy — it's a DB write read on next request, not a compile-time setting.

## Done when

- Switching any theme axis in `/admin`'s Appearance tab visibly changes the corresponding screens on next navigation/reload.
- All layout variant combinations render without visual breakage (spot-check each variant, not full combinatorial coverage).
