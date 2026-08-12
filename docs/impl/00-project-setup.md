---
title: "Impl 00: Project Setup"
tags:
  - impl
  - setup
---

# Impl 00: Project Setup

**Read first:** [[../arch/01-tech-stack|Tech Stack]], [[../arch/00-overview|Overview]], [[../arch/adr/008-biome-for-lint-format|ADR-008]]

## Goal

A running (empty) Next.js app under `app/`, using Bun for everything, with Tailwind v4 and Base UI wired in, ready for the schema/auth/feature work in later phases.

## Target current stable versions, not whatever's implied by version numbers in this doc

None of the commands below name a version — that's deliberate. Every dependency this project takes on, starting with this phase, should be **whatever is currently the stable release at the moment you actually run these steps**, not an old pin copied from an example. This doc (and every later `impl/` phase that adds a dependency — Prisma, Better Auth, Playwright, `@sparticuz/chromium`, etc.) is specifying *which tool*, not *which version of it*; resolving "which version" to "current stable" at run time is how this project avoids starting with tech debt already baked in. See [[../arch/01-tech-stack|Tech Stack]]'s Versioning policy section for the full reasoning.

One exception worth naming: **Base UI** is still pre-1.0 and may publish its newest work behind a canary/beta dist-tag rather than `latest` — check base-ui.com directly for what it currently calls its stable release before installing, rather than assuming `@latest` is safe here the way it is for more mature packages.

## Steps

1. Scaffold Next.js inside `app/`, declining ESLint when prompted (Biome replaces it entirely — see [[../arch/adr/008-biome-for-lint-format|ADR-008]]):
   ```
   cd app
   bun create next-app@latest . --typescript --app --tailwind --src-dir=false --import-alias "@/*"
   ```
   Check `create-next-app`'s current flags at implementation time for a non-interactive way to skip ESLint (its flag surface has changed across versions — don't assume `--eslint`/`--no-eslint` syntax without checking); otherwise just answer "No" to the ESLint prompt interactively. Confirm the generated `package.json` uses Bun conventions (or adjust `packageManager` field) — the scaffolder may assume npm; strip any npm/yarn lockfile it creates and run `bun install` to produce `bun.lock`. Then set up Biome per [[10-ci-cd]] (`biome.json`, `lint`/`lint:fix`/`format` scripts) rather than deferring it to the CI phase — having it from the start keeps every subsequent phase's code consistently formatted instead of needing a single large reformat later.

2. Create `app/bunfig.toml` to pin dependency versions exactly, per [[../arch/01-tech-stack|Tech Stack]]'s Versioning policy:
   ```toml
   [install]
   exact = true
   ```
   This makes every `bun add` from this point on write the resolved exact version into `package.json` (`"19.2.0"`) instead of a caret range (`"^19.2.0"`) — so the version installed today can't silently drift to a different one on a future `bun install` elsewhere; any upgrade becomes a deliberate, visible diff. `bunfig.toml`'s `exact` setting only affects future adds, not files the scaffolder already wrote — go back into the `package.json` `create-next-app` just generated and strip the `^`/`~` prefixes from its dependencies too (matching whatever `bun.lock` already resolved), so the very first batch of dependencies follows the same policy as everything added afterward, with no exception. Commit `bun.lock` — it's the reproducibility backstop underneath the exact pins, and is what CI's `bun install --frozen-lockfile` ([[10-ci-cd]]) actually enforces.

3. Confirm Tailwind v4 (CSS-first `@theme`, no `tailwind.config.js` object) — if the scaffolder installed v3, upgrade per Tailwind's v4 migration guide.

4. Install Base UI:
   ```
   bun add @base-ui-components/react
   ```
   (Confirm current package name against base-ui.com at implementation time — Base UI has moved package names during its pre-1.0 releases; see the stable-vs-canary note above.)

5. Set up the Tailwind `@theme` block per [[../arch/06-admin-ui|Admin UI & Design System]] and [[../arch/adr/005-styling-tailwind-base-ui|ADR-005]]: define `--bg`, `--panel`, `--panel2`, `--fg`, `--dim`, `--line`, `--mono`, `--sans` as CSS custom properties (light values at `:root`, dark overrides under `[data-theme="dark"]`), and the OKLCH accent formula (`--acL`/`--acC`/`--acH` per `[data-accent="..."]`, `--ac`/`--acFg`/`--acSoft` derived from them) — port these values directly from the prototype's `<style>` block (see the extracted prototype files if not already in context).

6. Add root layout scaffolding: `<html>` with `data-theme`/`data-accent` attributes driven by a server-read `Theme` row (stubbed/hardcoded until [[01-database-schema]] lands), Google Fonts `<link>` tags for JetBrains Mono + IBM Plex Sans (or self-host — implementation's call).

7. Root `package.json` (already created at repo root by the brainstorming session) only holds `docs:serve`/`docs:build` — do not add app dependencies there. All app dependencies live in `app/package.json`. (Root has no `bunfig.toml` and needs none — it has no dependencies to pin. `quartz/` similarly keeps its own vendored dependency versions as-is; this pinning policy applies to `app/`, the code this project is actually writing.)

8. Verify `bun run dev` (from `app/`) serves a blank Next.js page with the fonts and CSS variables loading correctly (inspect computed styles in devtools).

## Done when

- `bun run dev` in `app/` serves a page.
- Tailwind utility classes resolve against the ported custom-property tokens (spot-check: a `bg-bg text-fg` div picks up the right colors, and flips correctly if you manually toggle `data-theme` in devtools).
- A trivial Base UI component (e.g. a `Tabs` or `Checkbox`) renders and is interactive.
- `bun run lint` (Biome) runs clean against the freshly scaffolded app, with no ESLint config or dependency present anywhere in `app/`.
- Every entry in `app/package.json`'s `dependencies`/`devDependencies` is an exact version (no `^`/`~`/`*`/`latest`), `app/bunfig.toml` sets `exact = true`, and `app/bun.lock` is committed.
