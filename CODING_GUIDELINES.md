# State of Us — Coding Guidelines (project slug: stateofus)

Written at Stage 2 (2026-06-12). Stage 3 reformat + codegen read this file.
Stack is locked by adr-002; build order by adr-003. Deviations need an ADR.

## Stack (locked)

Next.js 15 App Router · TypeScript strict · Tailwind v4 + shadcn (copy-paste, never
the CLI registry at runtime) · better-sqlite3 + drizzle-orm · Framer Motion ·
custom SVG DVs with d3-scale/shape/geo/hierarchy (NO chart libraries) ·
satori for share images · self-hosted GeoLite2 · Vitest + Playwright.

## Non-negotiables (from product rails — do not relitigate in code)

1. **One question = one experience page.** No separate result route. Result, insight,
   and exploration are visibility states of `/q/[questionId]`.
2. **Skip is always available** and records nothing.
3. **Personal insights are template-driven.** A typed template registry
   (`insight-templates.ts`); NEVER generative/LLM text at runtime.
4. **Sample size + vote count visible** on every result. Never fake precision:
   below reveal threshold render the placeholder component, never an empty chart.
5. **Motion explains, never decorates.** 300-700ms standard, <900ms heavy,
   `prefers-reduced-motion` honored in every DV and interaction.
6. **Every interaction mode has a tap-only fallback** that works at 375px.
7. **No accounts.** Device identity = salted hash (DEVICE_HASH_SALT) persisted in
   an httpOnly cookie; region at city/state granularity only.
8. **Admin surface**: middleware-gated (ADMIN_TOKEN → signed cookie) on `/admin/*`
   AND `/api/admin/*`. Public APIs are rate-limited per-IP + per-device.

## Architecture patterns

- **RSC-first.** Server components by default; `"use client"` only for interactions
  (drag/swipe/tap buffers) and DV animation wrappers.
- **DV registry**: each DV variant registers `{id, family, render, dataShape,
  motionPreset}` in `lib/dv/registry.ts`. Questions reference DV ids from the
  catalogue enum. Adding/trimming a variant never touches question data.
- **Interaction registry**: same pattern for the 5 modes in `lib/interactions/`.
- **Aggregates are tables, not queries**: `question_aggregates` updated in the
  answer transaction + recomputed by a periodic job. Result pages read aggregates
  only — never scan `answers` at request time.
- **Answer writes are idempotent** per (question_id, device_hash): UPSERT, never
  duplicate. Reject + log burst patterns.
- **Zod on every API input** (risk no-input-validation). Drizzle parameterized
  queries only.
- **Question content is sanitized at render** even though admin-authored
  (risk xss-html-injection): plain text rendering, no dangerouslySetInnerHTML.

## Style

- Design tokens come from the user's design system (Stage 2.2) via CSS variables
  in `globals.css` — components consume `var(--*)`, never hardcoded colors.
- Light-only per adr-005 (house dark+light rule waived for this project); no next-themes.
- Mobile-first: build at 375px, then scale up. Thumb-zone for primary actions.
- File naming: kebab-case files, PascalCase components, `feat-<id>` referenced in
  PR/commit messages for traceability.

## Testing

- Vitest: aggregate math, insight template selection, dedup logic, lifecycle
  transition map.
- Playwright (critical flows — these BLOCK deploy on red):
  1. core answer loop (open → answer → result → insight → next)
  2. discovery/browse (home → category/search → question)
  3. admin lifecycle (create → activate → freeze; gated access)
- Every feature lands with its tests in the same PR. `test_runs` reported to the
  Ottomate tracker per ledger rules.

## Things that will get a PR rejected

- A chart library import (recharts/chart.js/echarts/nivo).
- GSAP or any paid animation plugin (framer-motion only).
- `NEXT_PUBLIC_` prefix on anything secret-adjacent.
- Live `answers`-table scans on a request path.
- A DV without a reduced-motion path or below-threshold placeholder.
- Unparameterized SQL, unvalidated API input, unsanitized rendered content.
- Stub/placeholder code without `@intentional-placeholder` + a linked TODO.
