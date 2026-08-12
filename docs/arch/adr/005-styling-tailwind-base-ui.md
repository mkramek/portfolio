---
title: "ADR-005: Tailwind CSS v4 paired with Base UI"
tags:
  - arch
  - adr
---

# ADR-005: Tailwind CSS v4 paired with Base UI

## Context

Base UI (the chosen headless component library, a project requirement) ships no visual styling of its own — every component needs a styling layer to reproduce the prototype's mono/OKLCH design system ([[../06-admin-ui|admin UI]]).

## Decision

**Tailwind CSS v4**, with its `@theme` block mapping the prototype's CSS custom properties (`--bg`, `--panel`, `--fg`, `--dim`, `--line`, `--ac`, `--acSoft`, `--mono`, `--sans`) onto Tailwind theme tokens.

## Why

Base UI's own documentation and examples are built around Tailwind, so styling Base UI primitives with Tailwind is the path of least friction (copy-adaptable patterns, no impedance mismatch between "how Base UI expects to be styled" and "how this app styles things"). Tailwind v4's CSS-first configuration (no `tailwind.config.js` object, `@theme` written directly in CSS) maps cleanly onto custom properties that already need to exist for the runtime-toggleable mode/accent system — the two aren't competing approaches, Tailwind tokens are defined *in terms of* the custom properties, not instead of them.

## Alternatives rejected

- **Vanilla CSS Modules + custom properties** — closest to the prototype's own approach, and viable, but more verbose per component with no corresponding benefit once Tailwind was already a strong fit for Base UI specifically.
- **CSS-in-JS (vanilla-extract)** — type-safe and zero-runtime, but a less common pairing with Base UI than Tailwind, and adds a build-time compilation step for no requirement that demands it here.

## Consequences

- Runtime theme state (mode/accent, both DB-backed, see [[../02-data-model|data model]]) is still expressed as CSS custom properties set via `data-theme`/`data-accent` attributes on the root element — Tailwind's own `dark:` variant is **not** used, since it assumes a binary OS-preference-driven mode, not a 2-mode × 4-accent, DB-persisted, admin-controlled setting.
- Implementation agents should reach for Tailwind utilities first, and drop to custom CSS only for things utilities don't express well (e.g. the OKLCH accent derivation formula itself, which lives in the `@theme` block's custom-property definitions, not as a utility class).
