# syntax=docker/dockerfile:1
#
# Base image pinned to the `canary` channel, not the usual `1-alpine`/`1`: app/bun.lock
# is lockfileVersion 2, a format the current stable release (Bun 1.3.x, what `1-alpine`
# resolves to) cannot parse — confirmed by `bun install --frozen-lockfile` failing with
# "Unknown lockfile version" against oven/bun:1-alpine. No stable 1.4.x tag exists yet
# (checked Docker Hub's oven/bun tag list); `canary-alpine` is the only currently
# published image that reads this lockfile. Revisit once Bun 1.4 ships stable and drop
# back to `oven/bun:1-alpine` (or a pinned `1.4-alpine`) at that point.

# ---- deps ----
FROM oven/bun:canary-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
# --ignore-scripts is required, not optional: package.json's "postinstall" is
# `prisma generate`, which needs prisma/schema.prisma and prisma.config.ts. Copying
# those here would defeat the point of a deps-only cache layer, so the client is
# generated in the builder stage instead. Bun does not run *dependency* lifecycle
# scripts unless they're listed in trustedDependencies (none are here), so this flag
# suppresses only our own postinstall.
RUN bun install --frozen-lockfile --ignore-scripts

# ---- builder ----
FROM oven/bun:canary-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# app/generated/ is gitignored, so it's never in the build context — regenerate it.
# Needs no DATABASE_URL: prisma.config.ts tolerates an undefined datasource url.
RUN bunx prisma generate
# public/ is empty and therefore untracked by git — a clean checkout has no such
# directory, and the runner stage's COPY below would fail without this.
RUN mkdir -p public
# Needs no database: the only build-time prerenders are /_global-error, /_not-found,
# /favicon.ico and /robots.txt, none of which touch Prisma. app/sitemap.ts is
# force-dynamic specifically to keep it that way.
RUN bun run build

# ---- runner ----
FROM oven/bun:canary-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Next's standalone server.js binds to process.env.HOSTNAME. Docker sets HOSTNAME to
# the container id, which is not a bindable address, so the server would listen on
# nothing without this. Pinning it is mandatory, not cosmetic.
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Per ADR-009 this Bun runtime stage is the one genuinely uncertain part of this
# project — Next's standalone server.js is generated for and normally run under
# Node. If `bun server.js` misbehaves, change ONLY this stage's FROM to
# node:22-alpine and this CMD to ["node", "server.js"], leaving deps/builder on Bun
# — the build itself proving out Bun is what matters most, and did, by getting this
# far. Note the change with a short comment here explaining why.
CMD ["bun", "server.js"]
