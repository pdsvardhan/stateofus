# Design Review — Solution Plan (builder's analysis)

Builder agent's code-grounded analysis of every finding in `DESIGN-REVIEW.md`.
For each: **where** it lives, **why** it happens (root cause), **how hard**, the
**fix approach**, and whether it **needs owner input**. This is the homework for
the next-session *solutions file* (the precise, step-by-step how-to for the coding agent).

**Legend:** difficulty = Easy / Medium / Hard · input = ✅ none (just do it) / ⚠️ needs owner decision or variants.

---

## P0

### A1 — Restore the 2-column desktop layout (answer + result) · Hard · ✅ none
- **Where:** `app/q/[questionId]/page.tsx:188` (`<main … max-w-2xl>` — single ~672px column) + `components/experience/ExperienceClient.tsx` (renders both the answer interaction and the result in that column).
- **Why:** the experience page was built as one narrow centered reading column for both phases. v5 is a 2-col split ≥1024px (question/DV pinned left, interaction or "Your position" right). The build never implemented the split — this is the historical "use the left/right space, reduce vertical scroll" pushback.
- **Approach:** introduce a responsive grid in the experience page: `lg:grid lg:grid-cols-[minmax(0,1fr)_360px]` (≈ v5's `rGrid`). Left = the question header + the DV/interaction; right (sticky, `lg:sticky lg:top-6`) = the "Your position" rail (insights + reactions + share + region press-pass + next-up). Below `lg`, collapse to the existing single stack. Must work for BOTH phases (answer → interaction left, hints right; result → DV left, Your-position right). Widen the page container from `max-w-2xl` to ~`max-w-[1100px]`.
- **Risk:** ExperienceClient currently emits one column; splitting means deciding what goes in each rail per phase. Verify nothing in the answer interactions assumes full width. Reference v5 `rGrid` (proto ~line 557) + the sticky right rail (~line 912).

### C1 — Fix the About privacy copy · Easy · ✅ none
- **Where:** `app/about/page.tsx:121` (`"No accounts. No names. No tracking. Every vote is anonymous…"`) and the headline at `:44` (`"never your identity."`).
- **Why:** the /about page was ported verbatim from the prototype's ABT1 block, which still carried the absolutist framing that **V5 Plan §02 explicitly retired** ("No accounts ever / No names" is NOT accurate → reframe privacy-first). `components/home/HouseRules.tsx` already uses the correct line; About was never updated → the two surfaces contradict, and "No tracking" is false against `lib/identity.ts` (device-hash) + IP-region (press pass).
- **Approach:** rewrite the About promise to the privacy-first, *true* statement: anonymous · no accounts · no profile · device-scoped identity (for you-vs-crowd + dedup) · coarse region only, one-tap correctable. Drop "No tracking / No names / never your identity" absolutes. Mirror `HouseRules` voice. Pure copy edit, ~one paragraph.

---

## P1

### A2 / C2 — Bring back the editorial insight voice · Split · ⚠️ partly needs input
- **Where:** `components/experience/ExperienceClient.tsx:88` → `buildInsights` in `lib/insights/templates.ts`.
- **Why:** insights are 100% template-generated from the data (`YOU MATCHED` / `MAJORITY POSITION` / `MINORITY REPORT` / `AGAINST THE GRAIN`), and the same template strings repeat verbatim across questions (e.g. "More than half the country stands where you do…"). v5's reward was a **hand-written witty observation** ("Aloo tikki polls 11 points higher in the north"). The catalogue does NOT carry these — `"What Makes It Interesting"` is design-meta ("Strong visual payoff"), not the note.
- **Approach (two parts):**
  1. **Vary the templates** — *Easy, ✅ none.* Rewrite `templates.ts` so each insight type has a pool of phrasings selected by a stable per-question hash, so no two results read identically. Pure code.
  2. **Curated editorial note** — *Medium, ⚠️ needs decision.* There's no source for the witty note across 105 questions. **Owner decision needed:** (a) author an `editorial_note` per question (big content task — all 105, or just the launch-featured subset?), (b) add an `editorial_note` field + admin input and write them over time, or (c) accept varied-templates-only for now and defer the curated note. This is the one finding that genuinely can't be solved without your call. *(Could show how the field + card would look as a variant.)*

### B3 — Map legend + state labels · Medium · ✅ none (minor design)
- **Where:** `components/dv/Map.tsx` (winner choropleth) + `components/dv/BubbleMap.tsx`.
- **Why:** Map renders winner fills + the CA-007 "no clear winner yet" cream chip, but there is **no answer→colour key** (red means which option?) and **no state labels** (owner flagged "state names aren't visible"). BubbleMap bubbles are likewise unlabeled.
- **Approach:** add a compact legend mapping each option to its fill colour (reuse the result's option colours), shown beside/under the map. Add state labels — inline on the larger states + on hover/tap for the rest (the `india-base.tsx` centroid measurement already exists for bubble placement; reuse it for label anchors). For BubbleMap, label the top-N states.

### B2 — Result-card variant on Explore / Category / Search · Medium · ✅ none
- **Where:** `app/explore/page.tsx:58`, `app/c/[categorySlug]/page.tsx:48`, `app/search/page.tsx:74` — all call `<QuestionCard card={c} wide={false} />` with no `variant`, so QuestionCard defaults to `teaser` for every card.
- **Why:** those pages use the plain `rows()` query (no preview computation), so even questions that already have results show as locked teasers. The reward (seeing the split) only exists on Home, which uses `composeFeedRows` (computes variant + preview).
- **Approach:** extract the per-card variant/preview logic from `composeFeedRows` (in `lib/discovery/queries.ts`, the `buildPreview` + threshold) into a reusable helper; apply it in the explore/category/search queries so each card carries `variant` + `preview`; QuestionCard already renders stat/tug when given them. No new UI.

---

## P2

### B1 — Give Explore real curation · Medium · ⚠️ needs design decision
- **Where:** `app/explore/page.tsx` → `getExplore({})` in `lib/discovery/queries.ts` (flat, category-ordered, up to 60-100 cards).
- **Why:** Explore, Category and Search are three near-identical dense grids; Explore reads as *the catalogue*, not *what's hot*. Docs frame Explore/Trending as **curated**.
- **Approach:** redesign Explore as curated rows — e.g. **Trending** (by sample_n velocity), **Rising**, **By desk** — visibly distinct from Category's exhaustive list. **Owner input:** the exact curation sections + ordering aren't fully specified in v5 → worth 2-3 layout variants before building.

### A3 — Per-DV teaser ghosts on all grids · Low · ✅ none (verify)
- **Status:** appears **already satisfied** — QuestionCard's `teaser` (used by all grids) calls `ghostKind(card.primary_dv)` → the correct per-DV ghost. The review likely misjudged because `blur(5px)` (faithful to v5) flattens the families visually.
- **Approach:** verify by rendering an explore grid; if distinguishability is the real concern, slightly reduce blur or add a tiny DV-type label. Otherwise close as already-done.

### B4 — Spread the demo seed · Easy · ✅ none
- **Where:** `scripts/seed-sample-votes.mjs` — the `skew()` helper biases hard toward index 0, so for `placements` (bucket/tier) almost everything lands in the first tier/bucket → Tier result shows 3-of-4 tiers "NOTHING LANDED HERE".
- **Approach:** for placement modes, distribute items across the target labels (round-robin + light random) instead of `skew`-to-first; keep a slight winner bias for pick modes. Re-run `npm run seed:demo`. Pure script edit.

### B5 — Louder reaction bar · Medium · ⚠️ minor variant
- **Where:** `components/experience/ReactionBar.tsx`.
- **Why:** 👍/👎 sit in tiny mono boxes; short of the owner's "your reaction counted" signal.
- **Approach:** larger targets, a definite selected + animated state (the `cwPopIn`/spring is available), and show the count. Direction is clear; could do directly or show one variant.

### C3 — Verify Frozen / Archived result chrome · Low · ✅ none (verify)
- **Status:** `components/experience/StatusBand.tsx` already handles `frozen` + `archived`. Likely works; it just wasn't in the screenshot set (no frozen/archived question rendered).
- **Approach:** render a frozen + an archived question (transition a demo question, or `q730`/`q809` equivalents) and confirm the sealed/grey-striped chrome shows. Close if good.

### A4 — Small ones · Easy · ✅ none
- Mode chip on the question screen reads button-like (lime outline) vs v5's flatter tab — `components/dv/DvSwitcher.tsx` / the mode chip; soften to a flat index-tab.
- Verify the back-block arrow-nudge animation + silent ESC are live (LAB-005: no visible ESC keycap — build correctly honors).

---

## Summary for next session

**Do without input (most of it):** C1, A1, B2, B3, B4, A2-templating, A3-verify, C3-verify, A4, B5.
**Needs an owner decision / variants before building:**
- **A2 curated editorial note** — author them (how many / who writes) vs defer to varied-templates-only. *(the one real blocker)*
- **B1 Explore curation** — pick a curation layout (variants).
- **B5** — optional: one reaction-bar variant to approve.

**Refinements to the review (be honest with the coding agent):** A3 is already wired (per-DV ghosts on all grids); C3 already has frozen/archived chrome in StatusBand — both are verify-not-build. Everything else stands.

**Next-session output:** expand each P0/P1/P2 above into a precise, file-and-line step-by-step *solutions file* the coding agent can follow literally; show variants for A2/B1/B5 where flagged.
