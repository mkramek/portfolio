---
title: Tech Stack
tags:
  - arch
  - stack
---

# Tech Stack

## Summary table

| Concern | Choice | Notes |
|---|---|---|
| Runtime / package manager / test runner | **Bun** | `bun install`, `bun run`, `bun test` for everything — no npm/yarn/pnpm, no Jest/Vitest |
| Framework | **Next.js (App Router)** | React Server Components for all data-reading routes; Route Handlers for `/api/**` |
| UI primitives | **Base UI** ([base-ui.com](https://base-ui.com)) | Headless — no visual opinion of its own, see [[06-admin-ui]] |
| Styling | **Tailwind CSS v4** | CSS-first `@theme` config maps the prototype's custom properties onto Tailwind tokens |
| Database | **Postgres** (Neon or Vercel Postgres) | Serverless-compatible; see [[../arch/adr/001-database-postgres|ADR-001]] |
| ORM | **Prisma** | Schema-first migrations, good Vercel/serverless connection pooling story (Prisma Accelerate or PgBouncer) |
| Auth | **Better Auth** | `magicLink`, `emailOTP`, `passkey` plugins; see [[../arch/adr/002-auth-library-better-auth\|ADR-002]] and [[03-auth]] |
| Email delivery | **Raw SMTP** | Nodemailer (or equivalent) sending pre-rendered HTML |
| Email templating | **MJML** | Compiled to HTML at build/send time, not hand-written HTML email markup |
| PDF generation | **playwright-core + @sparticuz/chromium** | Runs inside a Next.js Route Handler on Vercel; see [[../arch/adr/004-serverless-pdf-generation\|ADR-004]] and [[05-cv-generation]] |
| Validation | **Zod** | Schemas shared by admin forms, API route input validation, and the setup-completeness gate |
| Testing | **bun test** (unit/integration) + **Playwright** (e2e) | Playwright is already a dependency for PDF generation, reused for e2e; see [[09-testing-strategy]] |
| Lint/format | **Biome** | Replaces ESLint + Prettier entirely; see [[../arch/adr/008-biome-for-lint-format\|ADR-008]] |
| CI | **GitHub Actions** | Lint + build on every push/PR, image publish on `main`; see [[10-ci-cd]] and [[../arch/adr/009-cicd-ghcr-bun\|ADR-009]] |
| Container image | **Docker, multi-stage, `oven/bun:1-alpine`** | Published to GHCR, public; see [[10-ci-cd]] |
| Docs | **Quartz** | Static docs site generator, content-sourced from repo-root `docs/`, local-only (not deployed) |

## Why not alternatives (brief)

- **Drizzle instead of Prisma**: both fit; Prisma was chosen for its more mature migration tooling and because the team drafting this plan is more likely to find Prisma's schema DSL and generated client familiar. Either is compatible with the rest of this architecture — if a future agent has a strong reason to switch, the data model in [[02-data-model]] doesn't depend on which ORM implements it.
- **Auth.js instead of Better Auth**: rejected because it has no first-party email-OTP flow and only experimental passkey support. See [[../arch/adr/002-auth-library-better-auth|ADR-002]].
- **SQLite instead of Postgres**: rejected once Vercel was fixed as the deployment target — Vercel's serverless functions have no persistent local disk. See [[../arch/adr/001-database-postgres|ADR-001]].
- **Client-side `window.print()` instead of server PDF**: rejected — output depends on the visitor's browser/OS print stack, and the requirement is a reliable one-click "download PDF" button. See [[05-cv-generation]].
- **CSS Modules / vanilla-extract instead of Tailwind**: rejected mainly for ecosystem fit — Base UI's own examples and docs are built around Tailwind, minimizing friction when composing the two.
- **ESLint + Prettier instead of Biome**: rejected per explicit project direction; also slower and more config surface than needed for a single-developer project. See [[../arch/adr/008-biome-for-lint-format|ADR-008]].
- **Docker Hub instead of GHCR, or a non-Bun Docker build**: rejected — GHCR needs no separate account for a project already on GitHub, and a Bun-based build keeps the "Bun everywhere" story consistent through to the shipped artifact. See [[../arch/adr/009-cicd-ghcr-bun|ADR-009]].

## Versioning policy

Every choice in the table above names a **tool**, not a **version** of it. Deliberately: this project should be built on whatever each tool's current stable release is at the time an implementation phase actually runs, not on whatever happened to be current when these docs were written — starting from a stale version is tech debt incurred before a single feature exists.

- Scaffolding commands and `bun add` calls throughout `docs/impl/` are written without version pins (`@latest`, or no version at all) on purpose, so they resolve to current stable at run time. Where a doc names a specific line (e.g. "Tailwind CSS v4," "Next.js (App Router)"), that identifies which architecture/major line to use — still take the newest stable release within it.
- **Base UI** is the one named exception to "assume `@latest` is safe": it's pre-1.0 and may publish its newest work behind a canary/beta dist-tag. Check base-ui.com for what it currently calls stable before installing — see [[../impl/00-project-setup|impl: project setup]].
- Once resolved, versions are **pinned exactly** in `app/package.json` (no `^`/`~` ranges) via `app/bunfig.toml`'s `[install] exact = true`, with `app/bun.lock` committed as the reproducibility backstop underneath that. A range means the actually-installed version can silently drift on a future `bun install` elsewhere; an exact pin plus a committed lockfile means what's declared and what's installed always agree, and any upgrade is a deliberate, visible diff — enforced in CI by `bun install --frozen-lockfile` (see [[10-ci-cd]]), which fails if `package.json` and `bun.lock` ever disagree.
- This applies to `app/` specifically — the code this project is actually writing. `quartz/` is vendored third-party source with its own pre-existing dependency versions (see "Docs site — already set up" below); the root `package.json` has no dependencies to pin at all.

## Repository layout

Single repository, two independent projects — not a Bun workspaces monorepo. Nothing at build time links the Next.js app to the Quartz docs site; they don't share dependencies, config, or a build graph. This keeps the docs tooling from ever being a build dependency of the app (or vice versa).

```
/
├── package.json          # root: only docs:serve / docs:build scripts
├── app/                  # Next.js application (created in impl phase 00)
│   ├── app/              # App Router routes
│   ├── prisma/           # schema.prisma, migrations (no seed.ts — see docs/arch/02-data-model.md)
│   ├── biome.json        # lint + format config (see docs/impl/10-ci-cd.md)
│   ├── bunfig.toml       # [install] exact = true — pins dependency versions (see Versioning policy above)
│   ├── Dockerfile        # multi-stage, Bun-based (see docs/impl/10-ci-cd.md)
│   ├── .dockerignore
│   ├── package.json      # app's own bun-managed dependencies
│   └── ...
├── .github/
│   └── workflows/
│       └── ci.yml        # lint / build / docker-publish-to-GHCR (see docs/impl/10-ci-cd.md)
├── quartz/               # vendored Quartz project (already set up — see below)
│   ├── quartz.config.yaml   # local override of quartz.config.default.yaml
│   ├── package.json
│   └── content -> ../docs   (symlink, already created)
└── docs/
    ├── arch/
    └── impl/
```

The Next.js app owns its own `package.json`/`bun.lock` under `app/`, independent from the root and from `quartz/`. This means three separate `bun install`s exist in the repo (root — docs scripts only, no deps; `app/`; `quartz/`), each pinned to what it actually needs.

## Docs site — already set up

Unlike `app/` (which implementation agents build per [[../impl/00-project-setup|impl/00-project-setup]] onward), the Quartz docs site was set up as part of authoring this documentation, not left as a future step:

- `quartz/` is Quartz v5 vendored via `git clone` (its own nested `.git` was removed — it's plain vendored source in this repo, not an embedded repo).
- `quartz/content` is a symlink to `../docs`, so `docs/arch/` and `docs/impl/` are what Quartz treats as its content root — they appear as the two top-level sections in the generated site/graph.
- `quartz/quartz.config.yaml` is a local override of Quartz's `quartz.config.default.yaml` (page title, `baseUrl` set to `localhost:8080` as a placeholder since the site isn't deployed, analytics disabled).
- `bun run docs:serve` (from the repo root) builds and serves the site locally at `http://localhost:8080`; `bun run docs:build` builds it once without serving. Both are thin wrappers (`cd quartz && bun run quartz build [--serve]`) defined in the root `package.json`.
- `docs/index.md` is the site's home page (links into `arch/00-overview` and `impl/`); Quartz auto-generates folder-listing pages for `docs/arch/` and `docs/impl/` themselves, so no other index files are required as content grows.
