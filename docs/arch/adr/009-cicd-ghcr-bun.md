---
title: "ADR-009: GitHub Actions to GHCR, built with Bun, public image"
tags:
  - arch
  - adr
---

# ADR-009: GitHub Actions to GHCR, built with Bun, public image

## Context

The app needs a CI pipeline that lints and builds it on every change, and publishes a container image somewhere on the main branch. The project already lives on GitHub, is not a private project, and standardizes on Bun as its runtime/package manager everywhere else (see [[../01-tech-stack|Tech Stack]]).

## Decision

- **CI**: GitHub Actions, not an external CI service — the project is already on GitHub, and Actions needs no separate account/billing setup for a public repo.
- **Registry**: GitHub Container Registry (`ghcr.io`), not Docker Hub — same-platform auth (the workflow's own `GITHUB_TOKEN` can push to GHCR with no extra secret), and no separate registry account to manage.
- **Image build**: a multi-stage `Dockerfile` using `oven/bun:canary-alpine` as the base for both the build stage and (attempted first) the runtime stage — see [[../10-ci-cd|CI/CD]] for the stage breakdown, and [[../../impl/10-ci-cd|impl: CI/CD]] for why `canary` rather than the usual `1-alpine` (in short: `app/bun.lock`'s format needs a Bun newer than any currently-tagged stable release).
- **Visibility**: public — matching the project's own visibility, set once manually after the first image push (see [[../10-ci-cd|CI/CD]] for why this one step isn't automated).
- **Provenance**: the published image carries a build-provenance attestation, generated in the same job — see [[../10-ci-cd|CI/CD]].

## Why

Each piece here is the "no extra service, no extra secret" option given what's already true of the project: it's on GitHub, it's public, and Bun is already the standardized runtime. Introducing a different CI provider or a different registry would mean managing credentials and accounts for capability GitHub already provides natively to a public repo at no cost.

Building with Bun specifically (rather than falling back to a Node base image for the Docker build, even though the app is Next.js/Node-ecosystem code) keeps the promise made elsewhere in this project (Bun as executor everywhere, not just locally) — see [[../01-tech-stack|Tech Stack]]. This is flagged as something to verify empirically during implementation rather than asserted as risk-free: Next.js's `output: 'standalone'` server (`server.js`) is generated for and normally run under Node.js, and while Bun aims for Node compatibility, it isn't guaranteed to run every generated server.js without issue. See [[../10-ci-cd|CI/CD]] for the fallback if it doesn't.

The `docker` job's step sequence (`docker/login-action` → `docker/metadata-action` → `docker/build-push-action` → `actions/attest`) follows [GitHub's own tutorial for publishing Docker images to GHCR](https://docs.github.com/en/actions/tutorials/publish-packages/publish-docker-images) rather than being assembled from scratch — verified directly against that page rather than recalled from memory, including the exact action name for the attestation step (`actions/attest@v4`), which is easy to mis-guess (`actions/attest-build-provenance` also exists as a real, different action).

## Alternatives rejected

- **Docker Hub** — rejected: would need a separate account and a separate secret (`DOCKERHUB_TOKEN` or similar) for no capability GHCR doesn't already provide to a GitHub-hosted public project.
- **A Node.js base image for the Docker build** (sidestepping the Bun-compatibility question entirely) — rejected as the default; it's the safer choice in isolation, but it abandons the project's stated "Bun everywhere" direction for the one place (the shipped artifact) where it arguably matters most. Kept as the documented fallback if the Bun runtime stage doesn't work out in practice.
- **A separate CI provider** (CircleCI, GitLab CI mirrored from GitHub, etc.) — rejected: no benefit over Actions for a project already hosted on GitHub, and adds an external account/integration to maintain.

## Consequences

- The workflow needs `permissions: packages: write` to push to GHCR using `GITHUB_TOKEN` — no additional secret to configure.
- The first image push creates the GHCR package linked to the repo; GitHub does not currently offer a fully declarative "always public from the first push" setting, so making it public is a one-time manual step (or a one-time authenticated API call) after that first push — see [[../10-ci-cd|CI/CD]].
- If the Bun-runtime final stage proves unreliable (see "Why" above), switching just that stage's base image to `node:alpine` is a contained change — it doesn't affect the build stage, the CI workflow, or anything else documented here.
