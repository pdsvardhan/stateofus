# State of Us — Design Review

*From the design AI (author of the v5 prototype) to the builder agent. Read against `design/v5/State of Us v5.dc.html`, `V5 Plan.md`, `DECISIONS.md`, and `inputs/`.*

---

## Headline

This is a faithful, high-craft build. The brand system survived implementation intact — the cream dot-grid paper, ink/fire/lime/gold palette, Archivo / Spectral / Space-Mono type, the hard 2px borders + offset shadows, the COUNTED ✓ stamp, the desk colour-coding (incl. The Mirror lavender). Everything that mattered structurally shipped: all 8 answer modes, all 14 visualizations, the **DV switcher**, the **press-pass region capture** (with a graceful "region unknown" state), reactions, download, skip, and the "Keep the count going" related-loop. Several of my v5 micro-decisions came through exactly — the FB-018 rank-row edge-arrow fade, the FB-020 podium redesign, the sorter tee-up tray + solid buckets + early-submit, the M2 index-tab mode chips, the BK2 ink back-block. The token file even fixes a real Tailwind-v4 font circular-ref bug and bakes in the CA-001/002/003/009 accessibility rules.

So the notes below are **refinements on a strong base**, not a rescue list. They fall into three buckets: where the build diverges from the v5 design, where it can be better on its own merits, and where it meets (or misses) the product docs.

---

## A · Fidelity — build vs. the v5 design

**A1 · Answer & result screens are a single narrow centered column. _(biggest divergence)_**
In v5 these screens are a **two-column split on desktop**: question pinned left / interaction right, and on results the **visualization left / personal "Your position" rail right**. The build stacks everything into one ~720–1000px column centered in the page, so on a 1440px display roughly half the width is empty margin and the screen scrolls long — the question sits far above its own chart, and the reward rail is below the fold. This is also the exact thing the owner pushed back on historically ("use the left/right space, reduce vertical scroll on wide screens"). **Fix:** restore the 2-column layout ≥1024px — sticky question/DV on the left, interaction/`Your position` on the right; keep the single column as the mobile stack.

**A2 · Editorial "desk notes" became templated data-insights.**
v5's result rail carried **hand-written editorial insight cards** — the surprising, witty observation that is the brand's whole "this is not a survey" personality (e.g. *"Aloo tikki polls 11 points higher in the north"*), rendered in the N2 highlighter style. The build instead **generates** the insight cards from the data (`YOU MATCHED` / `MAJORITY POSITION` / `MINORITY REPORT` / `AGAINST THE GRAIN`). The highlighter-kicker styling is preserved nicely, and personalization is a genuine upgrade — but two costs: (a) the editorial *voice* is gone, and (b) the generated copy **repeats verbatim** across questions — *"More than half the country stands where you do on this one."* appears identically on the map, bubble-map, podium, trade-off and cups results. **Fix:** keep the data-insights, but (i) add the curated editorial note per question (the catalogue already carried these) as one more card, and (ii) vary the templated phrasings so two results never read identically.

**A3 · Per-DV teaser ghosts only on the home rail.**
v5 (FB-009) tied each locked-card's blurred ghost to that question's real DV family (mini donut, podium silhouette, map grid, treemap…). Home does this; **Explore / Category / Search** fall back to the same generic blurred-bars ghost on every card. **Fix:** reuse the per-DV ghost everywhere.

**A4 · Small ones.** Mode chip on the question screen reads a touch button-like (lime outline) vs the flatter v5 tab — minor. Confirm the back-block's arrow-nudge animation and the silent ESC shortcut are both live (can't tell from stills; LAB-005 said *no* visible ESC keycap, which the build correctly honors).

---

## B · General UX & craft

**B1 · The browse surfaces are three near-identical dense grids.** Explore, Category and Search all render the same locked-teaser grid. Explore especially is a flat ~100-card dump with no hierarchy — it reads as *the catalogue*, not *what's hot*. The docs frame Explore/Trending as a **curated** surface. **Fix:** give Explore real editorial curation (trending / rising / by desk) that's visibly distinct from Category's exhaustive list.

**B2 · The two-card-type system collapses off the homepage.** The owner's single most-emphasized request was the **two home card types** — result-shown vs answer-hidden. Home honors it (the "Results are out" stat cards vs "Vote to unlock" teasers). But Explore / Category / Search show **everything as a locked teaser**, even questions that already have results — so the reward (seeing the split) only exists on the front page. **Fix:** render the result-card variant for answered / result-available questions on every surface.

**B3 · Maps need a legend and labels.** The winner map is red-vs-grey with **no legend** (what does red mean? which answer won? what's grey — the other answer, or no data?) and **no state labels** — the owner explicitly flagged "state names aren't visible." The bubble map's bubbles are likewise unlabeled. The maps themselves are great (real choropleth, on-palette fire/lime); they just need a compact winning-answer colour key and at least the major states labeled (inline or on hover).

**B4 · Seed data makes some results look sparse.** The Tier result shows **three of four tiers empty** ("NOTHING LANDED HERE") because the demo seed piled every item into the top tier. The empty state itself is fine, but 3-of-4 empty reads broken. **Fix:** spread the demo seed so every DV demonstrates well.

**B5 · The reaction bar is too quiet.** 👍/👎 sit in tiny mono boxes that are easy to miss — short of the owner's ask for a clear, confident "your reaction counted" signal. **Fix:** larger targets, a definite selected/animated state, and show the count.

**B6 · Low density on widescreen** — a direct consequence of A1; fixing the two-column layout largely resolves it.

**Keep, unchanged — these are wins:** the COUNTED ✓ stamp, the `Your position` rail, "Keep the count going" (next-up blind pick + related cards is a genuinely good loop mechanic and a great use of the catalogue), the DV-switcher tabs, the press-pass with its honest "couldn't place you" state, Change-my-answer, and the cups / podium / leaderboard / treemap / heat-matrix / real-India maps — all on-brand and animated.

---

## C · Product requirements (`inputs/` + locked decisions)

**C1 · Privacy copy overclaims and contradicts itself. _(should fix)_** The About page (`app/about/page.tsx:121`) reads *"No accounts. No names. No tracking. Every vote is anonymous…"* — but your own `V5 Plan.md §02` records the owner's locked call that the absolutist *"No accounts ever / No names"* framing is **not accurate** and must be reframed privacy-first. Home's `HouseRules.tsx` correctly says *"Privacy first — your opinion counts, your identity never does."* About was never updated, so the **two surfaces now contradict each other**. Worse, *"No tracking"* is hard to defend against the actual build, which uses coarse IP-region geolocation (the press pass) and a device-hash identity (`lib/identity.ts`) for you-vs-crowd + dedup. **Fix:** align About to the privacy-first line and state what's true — anonymous, no accounts, no profile, device-scoped, coarse region only with one-tap correction — and drop the "No tracking / never your identity" absolutes.

**C2 · The "insight = reward" requirement is under-delivered.** The Result / Visualization-System docs make the personal layer **plus an insight** the payoff that stops this feeling like a dashboard. The build nails the personal layer but the insight is a stat-restatement (see A2). This is the single change most likely to move the result screen from "a chart with my dot on it" back to "the public, narrated."

**C3 · Verify the governance states.** `StillCounting.tsx` (low-data) exists — good. I didn't see **Frozen** or **Archived** result chrome in the screenshot set; v5 specified both (grey-striped Archived, sealed Frozen). Worth a quick verification that those render.

**Met cleanly:** all 8 modes + 14 DVs present and matched to questions (visualization-system breadth ✓); Skip on every screen + "Anonymous · skip anytime" (participation/anonymity ✓); no feed-of-strangers; the anonymous device-scoped identity model; admin console present.

---

## Priority

**P0**
- **A1** — two-column desktop layout for answer + result screens.
- **C1** — fix the About privacy copy (contradiction + overclaim).

**P1**
- **A2 / C2** — add the curated editorial insight card; de-duplicate the templated insight copy.
- **B3** — map legend + state labels.
- **B2** — result-card variant on Explore / Category / Search.

**P2**
- **B1** — give Explore real curation distinct from Category.
- **A3** — per-DV teaser ghosts on all grids.
- **B4** — spread demo seed; **B5** — bigger, clearer reaction bar.
- **C3** — verify Frozen / Archived states.

---

*Net: you built the thing. The structure, system and interactions are right. Close the gap on (1) widescreen layout, (2) the editorial voice of the insight, and (3) the small honesty/clarity items — copy, map legends — and it's there.*
