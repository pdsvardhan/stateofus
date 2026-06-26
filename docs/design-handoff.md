# State of Us — UI / design handoff

For a design/UI agent working **with the `stateofus` repo checked out**. Each item is a problem to solve; where Sai offered a direction it's marked **"Sai's suggestion"** — treat those as input, not fixed decisions. Functional behaviour for these areas is already done; this brief is purely the visual / UX layer.

## Rails (please keep)
- **Light mode only** — no dark mode.
- **Newspaper aesthetic**: 2px ink borders, hard offset shadows (`shadow-[Npx_Npx_0_var(--ink)]`), tokens `--ink / --paper(-bright/-white/-edge) / --fire / --lime / --gold / --blue / --pink / --muted`, fonts `font-ui` + `font-label`. Stay in this language.
- **Tap-only at 375px** — every interaction must work without hover or drag. Honour `prefers-reduced-motion` (`components/interactions/useDelayedSubmit.ts` already exposes a `reduceMotion` flag).
- Motion vocabulary: framer-motion, cubic-bezier `[0.2,0.7,0.2,1]`, ~0.2–0.55s.

---

## 1. Wide / 4K screens look empty
**Problem:** on large monitors (e.g. 27" 4K) the layout leaves big empty margins on both sides — it's sized for laptop widths and doesn't use the extra space. Keep mobile/tablet intact.
**Where:** the page shell + home (`app/` layout, `components/home/*`, the `min-h-screen` container).

## 2. Result page layout + inconsistent recommended-card colours
**Problem:** the result page's vertical order (DV → "where you landed" → rating + share/download → recommended) feels off, and the recommended-question cards are inconsistently coloured — the "Up next" card differs from the two below it, which reads as out of place.
**Sai's suggestion:** consider a two-column layout on wider screens, with recommended questions in a right-hand column (ties into item 1). Single column on mobile.
**Where:** `components/experience/ExperienceClient.tsx`, the recommended block, `components/discovery/QuestionCard.tsx`.

## 3. Bucket Sort interaction needs rework
**Problem:** the bucket-sort question UI isn't landing — Sai strongly dislikes it. Under-specified; please propose 2–3 directions before building.
**Constraints:** tap-to-select-then-tap-bucket must keep working at 375px (no drag-only); partial sorts are valid; the "0 of N filed" progress affordance should stay legible.
**Where:** `components/interactions/Sorter.tsx` (shared by bucket_sort + tier_placement).

## 4. About page feels flat
**Problem:** the about page is under-styled.
**Sai's suggestion:** more life — on-load and hover motion, subtle depth/3D, tasteful animation where it fits. Keep it readable and reduced-motion-safe; stay on-brand (not generic/glassy).
**Where:** `app/about/…`, container `main.mx-auto.max-w-[900px]`.

## 5. Standardised share/download card
**Problem:** Download now produces one fixed card (the `d2` "Front page" OG template); the result DV varies inside it, the frame stays fixed. Make that single card a strong, consistent shareable artifact (question + DV, legible at share sizes).
**Sai's suggestion:** keep it standardised — one template regardless of result type.
**Where:** `app/api/og/[id]/route.tsx` (the `d2` style).

## 6. Rank-order arrows look disabled after a drag (optional)
**Problem:** in rank-order, once you drag a row the ↑/↓ nudge buttons fade to a quiet state. This is intentional (they return on hover/focus and still work), but the faded look reads as *disabled*. Make "still usable" clearer without losing the quiet-after-drag intent.
**Where:** `components/interactions/RankOrder.tsx` → `arrowClass()`.

---

## Surfaced later this session

## 7. Logo Quick Pick — fallback treatment + missing brand marks
**Problem:** logo questions used to mix real brand logos with plain letter tiles, which looked inconsistent. The shipped fix makes each question **all-logos or all-tiles**. Side effect: most logo questions now show letter tiles, because ~13 India-specific brands have no open SVG glyph (BHIM, CRED, Blinkit, Zepto, JioHotstar, SonyLIV, Zee5, Ola, Rapido, inDrive, BluSmart, Tata Tea, Patanjali). Two things for design: (a) the letter-tile fallback could be a more intentional brand-badge treatment; (b) decide whether to source/commission proper brand marks for those apps so they light up. As soon as a question's options are fully covered, logos appear automatically.
**Where:** `components/interactions/LogoQuickPick.tsx`, `lib/brand-icons.ts`.

## 8. Optional review — 5 new interaction modes
**Note (functional, not broken):** five new modes shipped this session, built with the existing newspaper primitives — review for polish only. Demo questions to look at: **NEW-217** Spectrum (1D scale), **NEW-218** Coin allocation, **NEW-219** Two-axis quadrant, **NEW-220** Head-to-head bracket, **NEW-221** Pin-on-map.
**One UX call worth your eye:** Pin-on-map uses a labelled region **button-grid** as the canonical tap target (a tappable map proved unreliable for small states on phones) — confirm that's the right affordance or propose better.
**Where:** `components/interactions/{Spectrum,CoinAllocation,TwoAxis,Bracket,PinMap}.tsx`, `components/dv/Distribution.tsx`.

## 9. Optional — mini result previews on home cards
**Note:** home cards now show a miniature of each question's real result DV (reusing the existing `Ghost` mini-shapes). bars / donut / podium / treemap / tier are driven by live proportions; the **map / flow / heat** ghosts keep a representative (non-data) look — you may want those three to reflect real data too.
**Where:** `components/discovery/QuestionCard.tsx` (the `Ghost`), `lib/discovery/queries.ts`.

---

**Deliverable:** for each item, 2–3 on-brand directions, then implement the chosen one. Keep changes scoped to the files listed; run `npm run typecheck` and `npx eslint <files>` before handing back.
