---
id: adr-002-stateofus-tech-stack
title: "Custom SVG visualization engine over a chart library, on the house Next.js + SQLite stack"
date: 2026-06-12
status: accepted
tags: [stage-2, tech-stack, curated, "cat:system"]
linked_features: [feat-dv-engine, feat-region-capture, feat-og-image-gen, feat-admin-console, feat-question-data-model]
linked_risks: []
---

## Context

State of Us's product docs are unusually opinionated about what results must NOT feel
like: corporate dashboard, dense BI, static charts (DOC 4 §3). The visualization IS
the product reward — split cards, radial splits, liquid fills, heat maps, tier boards,
podiums, leaderboards, treemaps — each with 300-700ms purposeful motion. A chart
library cannot express most of these shapes, and fighting one produces exactly the
analytics feel the docs reject. Geographic DVs need India boundaries that are
Survey-of-India compliant — a problem already solved in MapsOfBharat.

## Decision

| Concern | Choice | Why (project-tied) |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript strict | House standard; SSR required anyway for share-link OG pages |
| Database | better-sqlite3 + drizzle-orm | Single container, single writer; answers are append-only; aggregates as tables recomputed on answer + periodic |
| Styling | Tailwind v4 + shadcn copy-paste | Tokens wired to the user's design system (Stage 2.2 input) |
| **DV engine** | **Custom SVG + d3 utilities (d3-scale/shape/geo/hierarchy) + Framer Motion** | The 9 MVP DV variants are bespoke interactives; Recharts overridden per house table "3D/interactive viz → d3" |
| India geo | Reuse MapsOfBharat Survey-of-India-compliant TopoJSON (states; cities as bubble points) | Boundary compliance solved once; legal must-have |
| IP geolocation | Self-hosted MaxMind GeoLite2 (monthly DB refresh) | No per-request external dependency; silent-skip on miss; city/state granularity only |
| Share images | satori (@vercel/og) server-rendered cards | Share formats: image + link + structured card (DOC 5 §14) |
| Admin protection | ADMIN_TOKEN → signed httpOnly cookie, middleware on /admin/* + admin APIs | Closes risk public-admin without adding auth to the anonymous product; CF Access optional later |
| State | RSC-first; Zustand only for interaction state (drag/swipe buffers) | Interactions are the only rich client state |
| Forms | react-hook-form + zod (admin editor only) | Public product has zero forms by design |
| Rate limiting | Middleware sliding window (per-IP + per-device) backed by SQLite | Risk no-rate-limit (vote stuffing); no Redis at MVP scale |
| Tests | Vitest + Playwright | cv project: critical-flow E2Es BLOCK deploy |
| Error tracking | GlitchTip (house) | Risk no-error-tracking |
| Backups | Nightly SQLite snapshot + rotation via house backup infra | Risk no-backup; answers DB is the accumulated value |
| Deploy | Docker, VAULT7A projects-net, 8510→3000, NPM Proxy + Cloudflare Tunnel | House standard |

## Consequences

- Stage 3 scaffolding has zero ambiguity; CODING_GUIDELINES.md encodes the patterns.
- The DV engine is the largest custom surface (risk viz-complexity-creep stays open);
  each DV variant ships behind the per-question DV registry so weak variants can be
  trimmed without touching questions.
- The 18 component slots with no master_components candidates (9 DV renderers, 5
  interaction modes, editor primitives) are authored fresh at Stage 3 and seeded back
  into the asset library afterward.
- GeoLite2 adds a monthly refresh job + ~60MB volume mount; acceptable for zero
  external calls.
