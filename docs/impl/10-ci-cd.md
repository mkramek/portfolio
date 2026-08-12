---
title: "Impl 10: CI/CD"
tags:
  - impl
  - ci-cd
---

# Impl 10: CI/CD

**Read first:** [[../arch/10-ci-cd|CI/CD]], [[../arch/adr/008-biome-for-lint-format|ADR-008]], [[../arch/adr/009-cicd-ghcr-bun|ADR-009]]

## Goal

`.github/workflows/ci.yml` running lint (Biome), tests (`bun test`), and build (Bun) on every push/PR, plus an automatic semver version bump on `main` driven by the merged branch's name prefix. `.github/workflows/build.yml`, dispatched by the version bump, publishes a Bun-built multi-stage Docker image to GHCR.

## Steps

### 1. Biome

`bun add -D --cwd app @biomejs/biome`, then `bunx --cwd app biome init` (or hand-write) `app/biome.json`. The version actually in use is 2.5.7, whose schema differs from earlier `1.x` snippets that may circulate (`recommended: true` at the rule root, for instance, is now `preset: "recommended"`, and there's a separate top-level `assist` block for import organization) — always generate against the installed version rather than copying an older example:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.7/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false, "includes": ["**", "!lib/emails.ts"] },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "correctness": { "useExhaustiveDependencies": "warn" }
    }
  },
  "css": { "parser": { "tailwindDirectives": true } },
  "javascript": { "formatter": { "quoteStyle": "double" } },
  "assist": {
    "enabled": true,
    "actions": { "source": { "organizeImports": "on" } }
  }
}
```

Treat this as a starting point, not a final answer — adjust rule severities as real findings come in during [[04-public-portfolio|impl 04]] onward. Per [[../arch/adr/008-biome-for-lint-format|ADR-008]], this fully replaces ESLint/Prettier — `create-next-app` was scaffolded without `--eslint` in [[00-project-setup]].

Add scripts to `app/package.json`:
```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write ."
  }
}
```

### 2. Dockerfile

`app/Dockerfile` — multi-stage, Bun-based build and (first-attempt) Bun-based runtime, per [[../arch/adr/009-cicd-ghcr-bun|ADR-009]]. Requires `output: 'standalone'` in `app/next.config.ts`. All three stages are pinned to `oven/bun:canary-alpine`, not the usual `1-alpine`: `app/bun.lock` is `lockfileVersion 2`, a format the current stable release (Bun 1.3.x, what the `1`/`1-alpine` tags resolve to) cannot parse — confirmed empirically, `bun install --frozen-lockfile` against `oven/bun:1-alpine` fails with `UnknownLockfileVersion`. No stable 1.4.x tag exists yet on Docker Hub as of writing; `canary-alpine` is the only currently published image that reads this lockfile, and it matches the Bun channel this project is actually developed against locally. Revisit once Bun 1.4 ships stable and a pinned numeric tag becomes available — don't stay on a floating `canary` tag longer than necessary, since it isn't reproducible over time the way a numbered tag is.

```dockerfile
# syntax=docker/dockerfile:1

# ---- deps ----
FROM oven/bun:canary-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --ignore-scripts is required: package.json's "postinstall" is `prisma generate`,
# which needs prisma/schema.prisma and prisma.config.ts — not present in this
# deps-only layer. The client is generated in the builder stage instead.
RUN bun install --frozen-lockfile --ignore-scripts

# ---- builder ----
FROM oven/bun:canary-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx prisma generate
# public/ is empty and therefore untracked by git — a clean checkout has no such
# directory, and the runner stage's COPY below would fail without this.
RUN mkdir -p public
RUN bun run build

# ---- runner ----
FROM oven/bun:canary-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Next's standalone server.js binds to process.env.HOSTNAME. Docker sets HOSTNAME to
# the container id, which is not a bindable address, so the server would otherwise
# listen on nothing.
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["bun", "server.js"]
```

**Verify this actually runs** — the `runner` stage's `bun server.js` is the one part of this project genuinely uncertain to work as-is (Next's standalone `server.js` is written for and normally run under Node). Build and run the image locally (`docker build -t cv-app app && docker run -p 3000:3000 cv-app`) and confirm it serves correctly before wiring it into CI. If it doesn't work, per [[../arch/adr/009-cicd-ghcr-bun|ADR-009]], change only the `runner` stage's base image to `node:22-alpine` (keep `deps`/`builder` on `oven/bun:canary-alpine` — the build itself is what needs to prove out Bun, and did, by getting this far) and note the change with a short comment in the Dockerfile explaining why.

The CI workflow's `oven-sh/setup-bun@v2` step needs the matching pin: `bun-version: canary` (the action documents `canary` as a valid channel alongside `latest` and exact semver), for the same lockfile-format reason.

Also add `app/.dockerignore` (`node_modules`, `.next`, `.git`, `.env*`, `generated`, plus doc/report clutter) so the build context stays small. Critically, `.env*` must be excluded: Next copies `.env` into `.next/standalone/` as part of the build, and `app/.env` holds real secrets — leaving it in would bake them into a public image layer. Do **not** exclude `e2e/`, `tests/`, or `playwright.config.ts`: `tsconfig.json`'s `include` covers them, so `next build` type-checks them as part of the builder stage's `RUN bun run build`, and `playwright.config.ts` itself imports from `./e2e/helpers`.

### 3. Workflows

Two files, not one: `.github/workflows/ci.yml` (lint, test, build, and — on `main` only — a version bump) and `.github/workflows/build.yml` (the Docker/GHCR publish, `workflow_dispatch`-only, dispatched by the version bump). Splitting them out is what lets the image build target the exact bumped commit via an explicit `sha` input, rather than racing whatever `main` happens to point at.

`biome ci` is Biome's non-mutating mode for CI (fails on anything that would need `--write`, doesn't modify files) — do not substitute `biome check --write` here.

#### `ci.yml`: `lint`, `test`, `build`

Three independent jobs on every push and pull request — `lint` (`bunx biome ci .`), `test` (`bun test`, no services needed — see [[../impl/08-testing.md|impl 08]]), and `build` (`bun run build`, which also performs the project's only type-checking, per "Why no separate type-check job" below).

#### `ci.yml`: `version` (main only)

A fourth job, `needs: [lint, test, build]`, gated to `push` events on `main` and guarded against `[skip ci]` commits. It resolves which branch was merged (via `gh api repos/<repo>/commits/<sha>/pulls`, which works across merge/squash/rebase merges, with a commit-subject parse as fallback), maps the branch's prefix to a semver bump —

| Branch prefix | Bump |
| --- | --- |
| `hotfix`, `bugfix`, `fix` | patch (`+0.0.1`) |
| `feat`, `feature` | minor (`+0.1.0`) |
| `release`, `rel` | major (`+1.0.0`) |
| anything else | none — job exits cleanly |

— rewrites `app/package.json`'s `version` with `npm version <bump> --no-git-tag-version`, commits and pushes that single-file change straight to `main` as `chore(release): v<version> [skip ci]`, and finally dispatches `build.yml` via `gh workflow run build.yml -f version=<version> -f sha=<bump-commit-sha>`.

Pushing past `main`'s branch protection needs a token that can bypass "require a pull request" — the default `GITHUB_TOKEN` (as `github-actions[bot]`, a Write collaborator but not an admin) cannot. The job checks out with an owner-owned fine-grained PAT (`secrets.VERSION_BUMP_TOKEN`, `Contents: Read and write` on this repo only), and branch protection is configured with `enforce_admins: false` so the owner-acting PAT is exempt — no bypass-actor list to maintain. Because PAT-authored pushes (unlike `GITHUB_TOKEN`-authored ones) do trigger workflows, the `[skip ci]` marker plus the job's own `if:` guard are both load-bearing, not redundant — see the full rationale and the exact YAML in `.github/workflows/ci.yml`.

#### `build.yml`: `docker`

`workflow_dispatch`-only, taking `version` (required) and `sha` (optional, defaults to the dispatch ref's tip) as inputs — never triggered by `push`/`pull_request`, so a fork PR has no path to GHCR regardless of token permissions. Checks out `inputs.sha`, then:

```yaml
- uses: docker/setup-buildx-action@v3

- uses: docker/login-action@v3
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}

- id: meta
  uses: docker/metadata-action@v5
  with:
    images: ghcr.io/${{ github.repository }}
    tags: |
      type=raw,value=latest
      type=raw,value=${{ inputs.version }}
      type=raw,value=<major>.<minor computed from inputs.version>
      type=raw,value=sha-<short sha>

- id: push
  uses: docker/build-push-action@v6
  with:
    context: app
    file: app/Dockerfile
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    provenance: false

- uses: actions/attest-build-provenance@v2
  with:
    subject-name: ghcr.io/${{ github.repository }}
    subject-digest: ${{ steps.push.outputs.digest }}
    push-to-registry: true
```

Two deltas from a naive version of this workflow, both worth calling out: `metadata-action`'s `type=semver`/`type=sha` patterns read off `github.ref`/`github.sha`, which for a `workflow_dispatch` is the dispatch ref's tip, not the actual bumped commit — so every tag is built with `type=raw` from the `inputs.version`/computed-SHA values instead. And the attestation action is `actions/attest-build-provenance@v2`, not `actions/attest` (an earlier draft of this doc named the latter, which requires `predicate-type`/`predicate` inputs it never received and would fail at runtime — `actions/attest-build-provenance` is the purpose-built action for exactly this).

The final step follows [GitHub's own published-images tutorial](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images) and generates a build-provenance attestation for the image — a cryptographically verifiable record of which workflow run and commit produced it, requested via GitHub's own OIDC token (`id-token: write`) against Sigstore's public-good instance, with no extra secret or third-party account needed. `push-to-registry: true` stores it alongside the image in GHCR (as an OCI referrer) rather than only in GitHub's separate attestations API. This is additive to the "no extra secrets" shape of the *image publish* itself (see [[../arch/adr/009-cicd-ghcr-bun|ADR-009]]) — the version-bump job is the one piece of this pipeline that does need a secret, for the reason above.

### 4. GHCR visibility (one-time, after first successful `docker` job run)

The first push to `main` creates the `ghcr.io/<owner>/<repo>` package, defaulting to private regardless of the repo's own visibility. Make it public once: on GitHub, go to the package's page (linked from the repo sidebar under "Packages" once it exists) → **Package settings** → **Change visibility** → **Public**. This is a one-time step, not something to script into the workflow (see [[../arch/10-ci-cd|CI/CD]] for why). GitHub's REST API also exposes a way to set this programmatically if you'd rather script it once via `gh api` — check GitHub's current package-visibility API docs for the exact endpoint/payload at implementation time rather than assuming it here, since this corner of the API has shifted before.

## Done when

- Opening a PR that changes anything in `app/` triggers `lint`, `test`, and `build`, all passing on clean code and failing appropriately (spot-check: introduce an obvious Biome violation and an obvious type error on a throwaway branch, confirm each job catches its own; `version` never appears on a PR run).
- Merging a `feat/*`, `fix/*`, or `release/*` branch to `main` — via merge commit, squash, or rebase, all three — runs `version`, which bumps `app/package.json` correctly for the branch's prefix, commits `chore(release): v<version> [skip ci]` straight to `main`, and does **not** trigger a second CI run off that commit (the recursion guard).
- That bump dispatches `build.yml` for the bumped commit's exact SHA, producing `ghcr.io/<owner>/<repo>:latest`, `:<version>`, `:<major>.<minor>`, and `:sha-<short-sha>`.
- Merging a branch with no recognized prefix (`chore/*`, `docs/*`, anything else) bumps nothing and dispatches nothing.
- After the one-time visibility change, the image is pullable without authentication: `docker pull ghcr.io/<owner>/<repo>:latest` succeeds from a machine with no GHCR login.
- The pulled image runs and serves the app on the expected port.
- `gh attestation verify oci://ghcr.io/<owner>/<repo>:<version> --owner <owner>` succeeds, confirming the build-provenance attestation is attached and verifiable.
