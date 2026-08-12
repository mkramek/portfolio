---
title: "ADR-008: Biome for lint/format, in place of ESLint + Prettier"
tags:
  - arch
  - adr
---

# ADR-008: Biome for lint/format, in place of ESLint + Prettier

## Context

A default `create-next-app` scaffold brings ESLint (with `next/core-web-vitals`, which includes React-Hooks-rules and a handful of Next-specific checks like flagging `<img>` instead of `next/image`) and typically Prettier alongside it for formatting. The project owner asked explicitly for **Biome** to handle lint and format instead.

## Decision

**Biome**, for both linting and formatting of the Next.js app's TypeScript/JavaScript/JSON — replacing ESLint and Prettier entirely, not supplementing them. `create-next-app` is scaffolded **without** `--eslint` (see [[../../impl/00-project-setup|impl: project setup]]).

## Why

Biome is a single Rust binary doing both jobs Next's default setup splits across two Node-based tools and their plugin ecosystems (ESLint's config/plugin resolution, Prettier's separate formatting pass). That's a meaningfully faster feedback loop in CI and in-editor, a single config file instead of two, and no plugin-version-compatibility matrix to maintain — a good fit alongside this project's general preference for fast, single-binary tooling (Bun over Node+npm, for the same reason).

## The trade-off, named explicitly

Dropping `next/core-web-vitals` means losing Next-specific lint rules: rules-of-hooks enforcement, the `no-img-element` check, and similar Next-authored linting that Biome's `recommended` ruleset doesn't replicate one-for-one (Biome has been adding React-domain rules, including some hooks-correctness checks, but it is not a drop-in replacement for the Next plugin specifically). Two things offset this:

- `next build`'s own TypeScript type-checking still runs as part of the build (in both the CI build job and the Dockerfile's build stage — see [[../10-ci-cd|CI/CD]]) and catches a meaningful chunk of what a linter would otherwise flag.
- This is a single-developer project without a team style-guide-enforcement need driving the ESLint/Prettier choice in the first place — the main value Biome needs to deliver is "catches obvious mistakes, keeps formatting consistent," which it does.

If a specific Next-authored rule is missed in practice and turns out to matter, the fix is targeted (add the specific check some other way), not reverting this decision wholesale.

## Alternatives rejected

- **ESLint + Prettier** (the scaffold default) — rejected per explicit direction; also slower and more config surface for a single-developer project.
- **ESLint alone** (using its formatting-adjacent rules, no Prettier) — not seriously considered; Biome covers both needs in one tool, which is strictly less setup than a partial ESLint-only approach.

## Consequences

- `app/biome.json` is the single source of lint + format configuration (see [[../../impl/10-ci-cd|impl: CI/CD]] for its initial contents).
- CI's lint job (see [[../10-ci-cd|CI/CD]]) runs `biome ci` — Biome's non-mutating check mode — rather than a separate lint step and format-check step.
- Editor setup (VS Code, etc.) should use the Biome extension instead of ESLint/Prettier extensions for in-editor feedback and format-on-save, to avoid the two tools disagreeing.
