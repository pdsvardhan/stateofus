# Coding Agent Brief — State of Us / v5 Design Review

## Context
This is a public opinion poll platform called **State of Us** (previously prototyped as ComWatch). The designer has built an extensive interactive HTML prototype through multiple versions. The current working prototype is **`State of Us v4.dc.html`**.

A parallel design system has also been built in a separate tool. Your job is to review both, cross-reference them, log all inputs into a structured doc, and prepare a complete brief for v5.

---

## What to review

### 1. The prototype (`State of Us v4.dc.html`)
Go through the entire prototype end-to-end. Every screen, every interaction, every question type, every result visualisation. The following are already built and need to be understood:
- Home / Discovery feed (carousel hero, Netflix-style sectioned rows, trending rail, category chips)
- All 5 answer interaction modes: Quick Pick, Trade-off, Swipe Stack, Bucket Sort (one-screen sorter), Tier Placement, Rank Order, Podium Slots, Logo Quick Pick
- All result visualisations: Radial donut, Split cards, Verdict bars, Liquid cups, Liquid coins, Treemap, Tier board, Leaderboard, Medal board, Podium, India map (winner + bubble), Sankey flow, Heat matrix
- Personal layer + Desk notes on every result
- Multi-DV switcher (tab pills per result)
- Reactions (👍/👎), Skip, Question links, Related questions, Surprise me (masthead + FAB)
- Frozen question state, Low-data / "Still counting" state
- About page, Category desk headers, Reset (testing only)

**Things to evaluate as you go through:**
- Does each UI component function correctly?
- Are animations and transitions smooth and satisfying?
- Are the interactions clear — does the user always know what to do?
- Are there layout or visual issues at desktop width?
- Is the visual hierarchy clear on every screen?

### 2. The design system (shared separately)
Review all design components, tokens, and patterns in the design system. Cross-reference them with the prototype.

**Critique the design system on:**
- Colour — are the choices right? Any adjustments needed?
- Typography — scale, weight, pairings
- Component-level decisions — layout, spacing, interaction states, hover/active states
- Anything you are genuinely against or find unclear — raise it. Don't raise issues just for the sake of it, but don't hold back valid ones either.
- Components in the design system that feel out of place with the prototype's established visual direction

---

## Existing decisions (do not re-debate these)
The following are already locked — review these docs before logging anything so you don't duplicate:
- **`DECISIONS.md`** — all locked design decisions (palette, hover style, DV choices, interaction patterns)
- **`FEATURE-AUDIT.md`** — full feature status (done / easy knock-off / medium / deferred)
- **`V5 Feedback.md`** — FB-001 to FB-020 already logged by the product owner (Vardhan) — read these first, do not duplicate

---

## What to produce

Create a new document (or append to `V5 Feedback.md` under a new section **"Coding Agent Review"**) with:

### A. Design critique
For each issue you find: component name, what's wrong, recommended fix. Be specific — not "the colours are off" but "the tier board label column at 150px is too wide at 1280px viewport, suggest 120px."

### B. Missing or weak features
List any features that are:
- Described in the product docs but not yet implemented in the prototype
- Partially implemented but incomplete
- Present but broken or unclear

Reference the feature list in `FEATURE-AUDIT.md` as your baseline.

### C. Design system gaps
List any components or patterns the design system should create that are currently missing. Include:
- What the component is
- Where it's used in the product
- Any constraints or direction on how it should look/behave

### D. Questions for the designer (Vardhan)
Only raise questions you are **genuinely stuck on** — things that are ambiguous, contradictory, or where you are strongly against a decision and need his input before proceeding. Do not ask just because something could be asked. Keep this list short and high-value.

---

## Name & branding
- Product name: **State of Us** (not ComWatch — that was the working title during prototyping)
- Logo: Vardhan has a logo in progress — he will share it. If you can integrate it into the prototype, do so. If not, flag it as a task.
- Tagline/subhead on the home page is currently a placeholder (see FB-001 in `V5 Feedback.md`) — Vardhan wants you to write a better 1-line editorial tagline. Constraint: exactly 1 line, punchy, matches the newspaper editorial voice of the product.
- Category desk names (currently "City & Place", "Daily Life", "Entertainment", "Brands", "Internet Chaos") should also be revisited — see FB-003 and the `// TODO` comment in the CATS array of the prototype logic.
- Hero carousel question selection and labels — see FB-006 and the `// TODO` comment in the Q array near `carousel: true` questions.

---

## How to feed back
Once your review document is ready, share it back. The designer will review, confirm which inputs are valid, and all confirmed items will be folded into **v5** of the prototype.

---

## Important notes
- **Do not implement changes** — document only. v5 will be built after all inputs are consolidated.
- The prototype uses a custom Design Component framework (DC). Don't try to run or build it — just read the source to understand the UI.
- The voice of the product is editorial, newspaper-like, India-centric. Any copy suggestions should match that tone.
- The product is anonymous by design — no accounts, no profiles, no tracking. This is a core principle, not a constraint.
