# UI Map — State of Us

A navigation guide to where the UI lives in this repository, so you don't have
to hunt for it. Purely a map — no commentary on the work itself.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
framer-motion (data-viz animations) · better-sqlite3. Light-only theme.

---

## How to see the built UI

Three ways, pick whichever you can use:

1. **Rendered screenshots** — `design-review/screenshots/` holds full-page captures
   of every surface (pages `00–04`, all 8 answer-mode screens `10–17`, all 14
   data-viz result screens `20–33`). Numbered so they read in order.
2. **Run it locally** —
   ```
   npm install
   npm run seed        # imports the question catalogue
   npm run seed:demo   # seeds sample votes so result charts render
   npm run dev         # http://localhost:3000
   ```
3. **Live** — the deployed app is at `https://stateofus.vault7a.xyz`.

---

## The design source (your own work, for comparison)

- `design/v5/State of Us v5.dc.html` — the v5 prototype (self-contained HTML/CSS/JS;
  open it in a browser — it renders the full app). **This is the design to compare against.**
- `design/v5/V5 Plan.md` — locked round-1 decisions (tagline, desk names, copy, motion).
- `design/v5/DECISIONS.md` — accepted design decisions / retained variants.
- `design/v5/V5 Lab A - Interactions.dc.html`, `V5 Lab B - Visuals.dc.html` — variant exploration.

## The product requirements

- `inputs/` — the source requirement docs (PDFs): Product Requirements Document,
  MVP Scope & Product Roadmap, Question System, Question Standards, Result System,
  Visualization System, Governance + Engagement System, Categories & Poll Universe,
  Design Handoff, Builder Handoff.

---

## Where the built UI is

### Theme / tokens
- `app/globals.css` — **all design tokens**: colour palette (`--ink`, `--fire`, `--lime`,
  `--gold`, `--paper*`, …), fonts (`--font-ui` Archivo / `--font-editorial` Spectral /
  `--font-label` Space Mono), the dot-grid page texture, and the `@keyframes` library.
- `app/layout.tsx` — root layout, font loading (next/font).

### Pages (routes)
| Route | File | What it is |
|---|---|---|
| `/` | `app/page.tsx` | Home / front page (masthead, headline, desk chips, hero carousel, editorial feed rails, heating-up rail, house rules) |
| `/q/[questionId]` | `app/q/[questionId]/page.tsx` | Question experience page — the answer interaction → result reveal |
| `/explore` | `app/explore/page.tsx` | Explore / trending |
| `/c/[categorySlug]` | `app/c/[categorySlug]/page.tsx` | Category (desk) browse |
| `/search` | `app/search/page.tsx` | Search |
| `/about` | `app/about/page.tsx` | About / manifesto |
| `/admin`, `/admin/q/[questionId]` | `app/admin/…` | Admin console (utilitarian; gated) |

### Components
- `components/home/` — `Masthead`, `EditorialHeader`, `DeskChips`, `Hero`, `HeroCarousel`,
  `FeedRow`, `TrendingRail`, `HouseRules`, `SurpriseMe`.
- `components/discovery/` — `QuestionCard` (the feed card; has teaser / stat / tug / plain
  variants), `RelatedRow`.
- `components/interactions/` — the **8 answer modes**: `QuickPick`, `TradeoffCards`,
  `SwipeStack`, `Sorter` (handles both bucket-sort and tier-placement), `RankOrder`,
  `PodiumSlots`, `LogoQuickPick`.
- `components/dv/` — the **14 result visualizations**: `Split`, `Radial`, `Liquid`, `Cups`,
  `Coins`, `Map`, `BubbleMap`, `Tier`, `Board`, `Podium`, `Medal`, `Treemap`, `HeatMatrix`,
  `Sankey` — plus `DvSwitcher`, `StillCounting`, `chrome.tsx` (shared motion + result chrome),
  `india-base.tsx` (shared India map plumbing).
- `components/experience/` — result-screen chrome: `ExperienceClient` (answer↔result state),
  `ShareSheet`, `ReactionBar`, `StatusBand`, `DeskStamp`, `BackBlock`, `SkipChip`,
  `SharedContextBand`.
- `components/region/` — `RegionChip` (region capture / correction).
- `components/admin/` — admin console UI (`QuestionForm`, …).

### Supporting logic (not visual, but drives what the UI shows)
- `lib/discovery/queries.ts` — homepage composition + the feed-rail grouping.
- `lib/dv/registry.ts`, `lib/results.ts`, `lib/aggregates.ts` — which DV renders + result data.
- `lib/catalogue/enums.ts` — the canonical modes, DV ids, categories.

---

## Please ignore (not UI / build-process only)
`ottomate/` (build-tracker mirror), `tests/`, `scripts/`, `drizzle/`, `*.config.*`,
`Dockerfile`, `docker-compose.yml`, and any `*.md` build/process notes. Review the **UI**.
