---
title: "ADR-001: Postgres over SQLite"
tags:
  - arch
  - adr
---

# ADR-001: Postgres over SQLite

## Context

The content behind this app (profile, roles, projects, etc.) needs real relational storage — replacing the prototype's single `localStorage` JSON blob. Two options were considered: SQLite (a single file, simplest possible relational store) and Postgres (a managed server, more moving parts).

## Decision

**Postgres**, via a managed provider (Neon or Vercel Postgres).

## Why

SQLite was the initial default recommendation — this is a single-tenant app with low write volume, exactly the profile SQLite fits best. It was reconsidered once **Vercel** was chosen as the deployment target ([[../08-deployment|deployment]]): Vercel's serverless functions have no persistent local disk. A SQLite file written during one invocation would not be visible to the next invocation (different container instance), and would be wiped entirely on every deploy. Postgres, as an external managed service, is unaffected by the app's own compute being serverless/ephemeral.

## Alternatives rejected

- **SQLite on a persistent volume** — would require a self-hosted long-running server (Docker/VPS), which was explicitly ruled out when the deployment target was fixed to Vercel.
- **A single JSON document, server-persisted** (closest to the prototype's own shape) — rejected for losing migrations, referential integrity, and query ergonomics for no offsetting benefit once a real DB was already needed for Postgres-class reasons.

## Consequences

- Requires provisioning and paying for (or using the free tier of) an external Postgres instance, rather than zero-config local file storage.
- Needs a serverless-aware connection strategy (pooling) — see [[../08-deployment|deployment]].
- If deployment ever moves off Vercel to a long-running host, Postgres remains a fine choice (it's not a Vercel-specific technology) — this decision doesn't need revisiting on a future deployment change, only on a future *storage* change.
