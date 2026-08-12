---
title: CI/CD
tags:
  - arch
  - ci-cd
---

# CI/CD

**Scope**: the Next.js app in `app/`, only. The Quartz docs site ([[01-tech-stack|Tech Stack]]) has no CI — it's a local-only dev tool, per its own design ([[00-overview|Overview]]).

## Pipeline shape

Two GitHub Actions workflows. `ci.yml` runs on every push and pull request; `build.yml` is dispatched only by `ci.yml`'s `version` job, never directly by a `push`/`pull_request` event:

```
push / pull_request
       │
       ├─ lint    — bun install, biome ci .
       ├─ test    — bun install, bun test        (unit tests only — see below)
       └─ build   — bun install, bun run build   (also type-checks, via next build)
                       │
                       ▼  (all three must pass; push to main only, and not a
                       │   [skip ci] commit)
                    version  — resolve merged branch → semver bump type,
                               rewrite app/package.json, commit + push to main,
                               dispatch build.yml with the new version + commit SHA
                                     │
                                     ▼  (separate workflow, workflow_dispatch only)
                                  build.yml: docker — build the Dockerfile,
                                             push to ghcr.io, attest provenance
```

`lint`, `test`, and `build` run in parallel on every push and pull request — independent checks, none needing another's output. `version` runs only after all three succeed, and only on pushes to the default branch (never on pull requests, so a PR never bumps a version or reaches GHCR — not even from a fork, since `build.yml` has no `pull_request` trigger at all to reach). Because there's no tag or version yet at `push`-to-`main` time — semver here is derived from the *merged branch's name*, not from a manually-created tag — the pipeline computes the version and only then triggers the image build, rather than reacting to a version that already exists.

See [[../impl/10-ci-cd|impl: CI/CD]] for the actual workflow YAML.

## Why no separate type-check job, and why tests moved in-scope

- **Type-checking**: Biome is a linter/formatter, not a type checker (see [[adr/008-biome-for-lint-format|ADR-008]]) — it doesn't need a `tsc --noEmit` job alongside it, because `next build` (the `build` job) already performs full TypeScript type-checking as part of a production build. Adding a separate type-check job would be a second, slower way to catch the same class of error the build job already catches as a side effect of doing its actual job.
- **Tests**: an earlier pass of this pipeline left `bun test`/Playwright out deliberately, as a scoped follow-up (see [[09-testing-strategy|Testing Strategy]]). That follow-up is this pipeline: `test` runs the unit suite (`bun test`) on every push and PR — no services needed, since `app/tests/preload.ts` supplies a dummy `DATABASE_URL` and the DB-backed cases in `lib/cv.test.ts` self-skip without one. The Playwright e2e suite is **not** wired in yet: it needs Postgres, Mailpit, and a dev-mode server, and realistically costs 10–20 minutes of wall clock per run versus under two minutes for the rest of the pipeline combined — a poor fit for a check that blocks every merge. It remains a local/manual concern (or a candidate for a separate, non-blocking scheduled workflow) rather than a blocking CI job, and that's a scope decision now, not an oversight.

## Automatic semver versioning

`main` never receives a version bump directly — it's derived from the branch that was merged into it, via a fixed prefix → bump mapping:

| Branch prefix | Bump |
| --- | --- |
| `hotfix`, `bugfix`, `fix` | patch (`+0.0.1`) |
| `feat`, `feature` | minor (`+0.1.0`) |
| `release`, `rel` | major (`+1.0.0`) |
| anything else | no bump — `version` job exits cleanly |

The `version` job resolves the merged branch via the GitHub API (`commits/<sha>/pulls`), which works uniformly whether the merge was a merge commit, a squash, or a rebase — parsing `git log` locally would need three different strategies for those three cases. Only `app/package.json`'s `version` is bumped, not the repo-root `package.json` (which only carries the unrelated Quartz docs-site scripts) — the app is the thing this whole pipeline builds and tags.

Pushing that bump straight to a protected `main` needs a token the branch protection rule will actually let through; see [[../impl/10-ci-cd|impl: CI/CD]] for exactly which one and why the default `GITHUB_TOKEN` doesn't qualify.

## Docker image

A multi-stage `Dockerfile` at `app/Dockerfile`, built with Bun in mind end to end (see [[adr/009-cicd-ghcr-bun|ADR-009]] for why):

1. **deps** — install dependencies with `bun install --frozen-lockfile`, cached as its own layer so dependency changes (not every code change) invalidate it.
2. **builder** — copies deps' `node_modules` + the app source, runs `bun run build`. `next.config` sets `output: 'standalone'` so the build produces a minimal, self-contained server bundle (`(.next/standalone`, `.next/static`, `public/`) rather than requiring the full `node_modules` tree at runtime.
3. **runner** — copies just the standalone output from `builder`, runs it. Attempted first under `oven/bun:canary-alpine` (`bun server.js`) to keep the whole pipeline Bun-based; see [[adr/009-cicd-ghcr-bun|ADR-009]] for the documented fallback (`node:alpine` for this stage only) if that doesn't hold up during implementation. All three stages use the `canary` tag rather than the usual `1`/`1-alpine` because `app/bun.lock`'s lockfile format needs a Bun newer than any currently-tagged stable release — see [[../impl/10-ci-cd|impl: CI/CD]].

See [[../impl/10-ci-cd|impl: CI/CD]] for the actual Dockerfile.

## Build provenance attestation

After pushing the image, the `docker` job generates a build-provenance attestation (`actions/attest`) and stores it alongside the image in GHCR — a cryptographically verifiable record of exactly which workflow run, commit, and repository produced that image. It's requested via GitHub's own OIDC token (`id-token: write`) against Sigstore's public-good instance, so it costs nothing extra to set up (no account, no secret) beyond the two additional permissions (`attestations: write`, `id-token: write`) on the `docker` job. This follows [GitHub's own documented pattern](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images) for publishing images to GHCR, rather than being a bespoke addition. Anyone who pulls the image can verify it came from this repository's CI with `gh attestation verify oci://ghcr.io/<owner>/<repo>:latest --owner <owner>` — see [[../impl/10-ci-cd|impl: CI/CD]].

## GHCR: naming, tagging, visibility

- **Image name**: `ghcr.io/<owner>/<repo>` (lowercased automatically by the tooling used to compute it — GHCR requires lowercase, GitHub owner/repo names normally already are).
- **Tags**: `latest`, the bumped semver (`<major>.<minor>.<patch>`), its `<major>.<minor>` prefix, and the short commit SHA of the bump commit (`sha-<short>`) — one image per version bump, not per push, since `build.yml` only runs when `version` dispatches it. All four are supplied as explicit `type=raw` values rather than derived from a git tag or `github.sha`, because the workflow is triggered by a `workflow_dispatch` carrying the version and commit as inputs, not by a `refs/tags/*` push — see [[../impl/10-ci-cd|impl: CI/CD]] for why that distinction matters for the tag-generation step specifically.
- **Visibility**: public, matching the project itself (not a private project — see [[00-overview|Overview]]). GitHub does not offer a workflow-level setting that makes a GHCR package public from its very first push; the package is created (as a side effect of the first push) still needing a one-time visibility change afterward, done once via the GitHub UI (package settings → Change visibility → Public) or a single authenticated API call. This is a one-time repo-setup step, not a per-run CI step — automating it on every run would mean granting the workflow broader package-admin permissions for a change that only ever needs to happen once.

## Authentication

The `docker` job authenticates to GHCR using the workflow's own `GITHUB_TOKEN` (via `docker/login-action`, `registry: ghcr.io`, `username: ${{ github.actor }}`), with `permissions: packages: write` set on the workflow. No additional secret or PAT is needed — this is the standard same-repository GHCR publish path. The attestation step (above) adds two more permissions on the same job (`attestations: write`, `id-token: write`) — still no new secret, just a broader grant on the same built-in token.

The `version` job is the one exception to "no additional secret" in this pipeline: it needs to push a commit directly to a branch-protected `main`, which the default `GITHUB_TOKEN` (as `github-actions[bot]`, a Write collaborator but not a repo admin) cannot do. It authenticates instead with an owner-owned fine-grained PAT (`secrets.VERSION_BUMP_TOKEN`, scoped to `Contents: Read and write` on this repo only), and branch protection is configured with `enforce_admins: false` so the owner-acting PAT is exempt from the "require a pull request" rule with no bypass-actor list to maintain. See [[../impl/10-ci-cd|impl: CI/CD]] for the full mechanics, including why this doesn't reopen an infinite-push loop.
