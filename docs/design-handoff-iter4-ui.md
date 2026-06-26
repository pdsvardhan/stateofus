# State of Us — UI / Design Handoff (iter-4 deferred items)

**For:** a design/UI agent working **with the `stateofus` repo checked out** (`/mnt/storage/websites/stateofus`, Next.js 15 + Tailwind, framer-motion).
**Scope:** these are the comments deliberately split OUT of the functional iteration (iter-4) as pure UI/styling work. The non-visual changes (download = one-tap, share copies link) are already done and are NOT in your scope.
**Source of truth:** comments were captured via the in-page DOM commenting tool; Ottomate iteration #4 holds them as observations (ids in brackets).

## Hard rails — do NOT break these
- **Light mode only.** No dark mode. (Locked product non-goal.)
- **Newspaper aesthetic.** Design tokens (CSS vars): `--ink`, `--ink-soft`, `--paper`, `--paper-bright`, `--paper-white`, `--paper-edge`, `--fire`, `--fire-tint`, `--lime`, `--gold`, `--blue`, `--pink`, `--muted`, `--muted-warm`, `--muted-violet`. Fonts: `font-ui` (display/UI), `font-label` (uppercase meta), body. Borders are 2px solid ink with hard offset shadows (`shadow-[Npx_Npx_0_var(--ink)]`). Keep that language.
- **Every interaction works tap-only at 375px.** Don't introduce hover- or drag-only affordances. Respect `prefers-reduced-motion` (the codebase already gates motion via a `reduceMotion` flag in `components/interactions/useDelayedSubmit.ts`).
- **Don't change copy/labels** beyond what an item explicitly asks.
- Match existing motion vocabulary (framer-motion, cubic-bezier `[0.2,0.7,0.2,1]`, ~0.2–0.55s).

## Items

### 1. Responsive for wide / 4K monitors  [#319]
**Comment:** "UI not responsive… 4K 27in, large empty space left and right… make it responsive."
**Where:** the top-level page shell — `div.min-h-screen` wrapper (see `app/` layout + page containers; home is `components/home/*`, e.g. `Masthead.tsx`, `FeedRow.tsx`). Current max-width is tuned for laptop widths.
**Goal:** use the extra width on large viewports without breaking the 375px / tablet layouts. Options: widen the content max-width tier, add a `2xl`/`3xl` breakpoint, or use the side gutters for secondary content. Keep line-length readable for text blocks.

### 2. Result page layout + recommended-question colours  [#320, #321]
**Comment:** "On the result page I don't like the layout (DV → where you landed → rating + share/download → recommended questions). The recommended cards are different colours — 'Up next' is one colour, the two below are another — looks weird / out of place." + "maybe use a two-column layout (recommended in a right column)."
**Where:** the question experience / result reveal view — `components/experience/ExperienceClient.tsx` and the recommended-questions block; cards come from `components/discovery/QuestionCard.tsx` (variants: teaser/stat/tug/plain) via `lib/discovery/queries.ts`.
**Goal:** (a) make the recommended-question cards visually consistent (stop the "Up next" vs the-two-below colour split unless it's an intentional, legible hierarchy); (b) evaluate a two-column result layout on wide screens (DV + meta left, recommended right) — ties into item 1. Keep single-column on mobile.

### 3. Bucket Sort interaction UI  [#322]
**Comment:** "This question UI should be fixed, I hate it (bucket sort)." (Under-specified — needs a design pass + a proposal.)
**Where:** `components/interactions/Sorter.tsx` (bucket_sort and tier_placement share this sorter, parameterized by `question.targets`). Registry: `lib/interactions/registry.ts`.
**Goal:** propose a cleaner bucket-sort interaction. Constraints: tap-to-select-then-tap-bucket must keep working at 375px (no drag-only); partial sorts are valid (untouched items = per-item skip); "0 of N filed" progress affordance should stay legible. Bring 2–3 visual directions before building.

### 4. About page polish  [#323]
**Comment:** "Needs to be stylised better — more interactive on hover, on load, 3D effects, animations wherever possible."
**Where:** the `/about` route (`app/about/…`), container `main.mx-auto.max-w-[900px]`. (Note: about is not modeled as a tracked page entity in Ottomate.)
**Goal:** add tasteful on-load + on-hover motion and depth consistent with the newspaper aesthetic (hard-shadow "card lift", staggered reveals). Keep it readable and reduced-motion-safe. Don't go generic-glassy — stay on-brand.

### 5. Standardised download card (paired with a done functional change)  [#313 visual half]
**Context:** the Download button now does ONE tap → a single standard card image at `/api/og/<id>?style=d2&download=1` (the "Front page" template). The functional change is shipped; the **card's visual design** is yours if it needs standardising/improving.
**Where:** `app/api/og/[id]/route.tsx` (Satori/OG image; styles `d1` editorial, `d2` front-page, `d3` stat-poster — `d2` is now the only one used).
**Goal:** ensure the `d2` card is the strong, consistent "shareable" artifact: question text + the result DV, on-brand, legible at typical share sizes. Only the result DV should vary; the frame/template stays fixed.

### 6. (Optional) Rank-Order arrow affordance  [#316 — NOT a bug]
**Context:** a comment flagged the rank-order ↑/↓ arrows as "greyed out after dragging but still working." This is **intentional** (FB-019: arrows fade to `opacity-25`, return on hover/focus, after the first successful drag). The controls are NOT disabled. If you want, soften the *perception* that they look disabled — e.g. a quiet-but-clearly-enabled treatment rather than opacity that mimics a disabled state — WITHOUT removing the FB-019 fade intent.
**Where:** `components/interactions/RankOrder.tsx` → the `arrowClass()` helper.

## Deliverable
For each item: 2–3 on-brand directions (screenshots/Figma or a code branch), then implement the chosen one. Keep changes scoped to the files listed; run `npm run typecheck` and `npx eslint <files>` before handoff back.
