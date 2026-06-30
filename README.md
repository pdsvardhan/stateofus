# State of Us

**Answer one question. See what everyone thinks.**

State of Us is a mobile-first public-opinion platform. You answer a structured question
with one playful interaction (quick pick, trade-off, swipe stack, sorter, rank, podium, and
more) and instantly get a rewarding visual result — donuts, split cards, treemaps, tier
boards, India maps — plus a template-driven personal insight comparing you to the country.
Anonymous, curated, and built like a neo-brutalist newspaper: editorial desks, editions, and
results that read like front pages.

Live at **https://stateofus.vault7a.xyz** (self-hosted on vault7a). Renamed from the working
titles *Public Pulse* / *ComWatch* (adr-004).

## The loop

> **Question → Answer → Aggregation → Visualization → Reaction → Return**

One question = one experience page: a fast thumb-friendly interaction, an instantly readable
primary visualization, 0–2 secondary visualizations, and a mandatory personal insight layer
("you matched 12%; your city differs"). Skip is always allowed; sample sizes are always
visible; nothing is forced.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Data | SQLite via better-sqlite3 + Drizzle ORM (aggregates-as-tables, never live scans) |
| Visualization | **Custom SVG engine** (d3-geo/hierarchy/scale/shape; `@svg-maps/india`) — no chart library |
| Interactions | 13 interaction modes via an interaction registry |
| Region | offline `geoip-lite` (bundled MaxMind GeoLite2), India-only — no live API/key |
| Theme | light-only neo-brutalist newspaper (adr-005) |
| Deploy | Docker on vault7a (`:8510`), Cloudflare Tunnel |

## Architecture

- **One question = one experience page** (`/q/[questionId]`): interaction → result reveal →
  primary + secondary DVs → template insight card → reactions/share.
- **13 interaction modes** (`lib/catalogue/enums.ts`, `components/interactions/`) and **15
  custom SVG DV renderers** (`components/dv/`), each behind a registry.
- **Aggregates-as-tables:** answers UPSERT idempotently per `(question_id, device_hash)`;
  `question_aggregates` are recomputed on write, never scanned live.
- **Anonymous + dedup:** a random device id lives in an httpOnly cookie; the server stores only
  `SHA-256(rawId : DEVICE_HASH_SALT)`. Per-device and per-IP sliding-window rate limits guard
  against ballot stuffing. No accounts, no login, no tracking.
- **Curated content:** questions are internal assets with lifecycle governance
  (draft → active → paused → frozen → archived); 105 launch questions across 6 desks and all
  interaction modes. See `docs/question-authoring-standard.md`.

## Admin

The admin console (`/admin/*`, `/api/admin/*`) is gated by an **`ADMIN_TOKEN` signed
httpOnly cookie** enforced in `middleware.ts` (503 if `ADMIN_TOKEN` is unset; constant-time
compare). The public product is fully anonymous. (An Authentik forward-auth wrap was planned
in adr-006 but deferred — the ADMIN_TOKEN gate is what ships.)

## Develop

```bash
npm install
cp .env.example .env        # set ADMIN_TOKEN and DEVICE_HASH_SALT (required)
npm run db:push             # apply schema
npm run import:catalogue && npm run seed   # load + activate launch questions
npm run dev                 # http://localhost:8510
```

Key env vars: `ADMIN_TOKEN` (admin gate), `DEVICE_HASH_SALT` (dedup hashing — the app throws
if unset). Both are required; see `.env.example`.

### Quality

```bash
npm run typecheck && npm run lint
npm run test        # Vitest unit (aggregate math, insight selection, dedup, lifecycle)
npm run test:e2e    # Playwright critical flows (core loop, discovery, share landing)
```

CI runs lint/typecheck/build on every push; unit + e2e run when the `RUN_TESTS` Gitea var is
`true` (adr-020). The critical-flow E2Es BLOCK deploy on red (cv-tagged project).

## Docs

- `docs/question-authoring-standard.md` — how questions are authored (SOU-QAS).
- `docs/question-fit-evaluator.md` — the question QC reviewer protocol (SOU-QFE).
- `decisions/` — architecture decision records (adr-001…009).
- `public_docs/` — the published thesis, technical deep-dive, validation and retrospective.
- `CODING_GUIDELINES.md` — engine rails and conventions.
