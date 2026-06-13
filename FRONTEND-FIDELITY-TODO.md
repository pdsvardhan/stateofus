# State of Us — Frontend Fidelity Handoff (next session)

**Owner mandate:** the v5 design is 10/10 and final. The build must replicate the
**frontend** to it — every colour, font, size, dot, animation, transition, 3D
feel, interaction, and UI element should look near-identical across **all pages**.
Backend is at the builder's discretion (it was prototyped, not final). If the
design itself has a small imperfection, report it and fix.

**Source of truth for frontend:** `design/v5/State of Us v5.dc.html` (2674 lines,
inline-styled, exact hex/sizes/animations). Render it for reference with the
headless-chromium recipe in `design/v5/_audit/` scripts. Verify **key views**
(home, each interaction mode, each DV family) by screenshot-diff against the
prototype before marking a surface done — this is the check that was skipped and
let the scaffold + system-fonts ship.

---

## What this session already FIXED (verified)

1. **Brand fonts now load.** The single biggest issue: Archivo/Spectral/Space
   Mono never applied — the whole app rendered in system sans-serif, which is
   why it looked "nothing like the design." Root cause: app font vars were
   defined at `:root` but next/font scopes `--font-archivo/-spectral/-space-mono`
   to `<body>`; fixed by defining `--font-ui/-editorial/-label` in the `body`
   rule (`app/globals.css`). **Re-verify first thing**: every surface should now
   be in the right type.
2. **Home / discovery re-ported faithfully** from the prototype (masthead with
   pulsing dot, "WHAT DOES INDIA *ACTUALLY* THINK?" headline, desk chips, cream
   dot-grid hero with corner disc + 9s progress bar + ANSWER IT, Netflix feed
   rows with FB-009 DV-typed teaser cards + lock badge, dark "Heating up" rail,
   lime "House rules"). `app/page.tsx`, `components/home/*`, `components/discovery/QuestionCard.tsx`,
   `app/c|explore|search`.
3. **India winner map** painted every state Option-A's colour — now picks the
   real per-state winner (`components/dv/Map.tsx`). Pill relabelled "Winner map".
4. **5 tier_placement questions rendered chart-less** (primary_dv=podium, which
   doesn't support that mode) — retargeted to `tier`; `ExperienceClient` now
   falls back to any mode-supporting DV so a result is never blank.
5. **Question content:** salvaged Q-301 (broken placeholder options), Q-403/404/602
   (US-centric → India), archived Q-101/102/302 (duplicates). **102 active.**

## Visual-audit verdicts (from this session — full report in chat / `design/v5/_audit/`)

- **MATCH:** home (after font fix), question/answer pages for quick_pick,
  tradeoff_cards, swipe_stack, bucket_sort, tier_placement; result DVs radial,
  split, liquid, treemap, tier, board, bubblemap, still-counting; share landing;
  admin login (utilitarian by design — prototype has no admin).
- **FIXED this session:** fonts (all surfaces), winner map, podium-blank.
- **STILL TODO** (below).

---

## NEXT SESSION — the fidelity pass (priority order)

### A. Re-verify the font fix landed everywhere, then pixel-polish the home to 100%
Owner said home was "95%". With fonts fixed it should be ~99%. Diff `home` vs
`proto-home.png` and close residuals: exact type sizes/weights/letter-spacing,
the hero disc colour rotation, progress-bar timing, chip hover (translate -2,-2 +
3px hard shadow), card shadow depths, the dot-grid sizes (page 7px, hero 11px).

### B. Question / experience page — match the prototype answer screen exactly
Prototype lines 340–528. Compare each of the 8 interaction modes against the
prototype's interaction (`components/interactions/*`). The audit called the 5
present modes MATCH, but the owner found them "far from design" pre-font-fix —
re-judge now that type is correct, and close gaps in: card proportions, the
sorter focus/tray + solid bucket cards (LAB-001), swipe verdict buttons, rank
drag+arrow fades (FB-018/019), the answer-button + meta styling.

### C. Result reveal — match the prototype result screen + DV switcher
Prototype lines ~2280–2560. The DV switcher pills (SW1 rise transition), the
"YOU"/"AGAINST THE GRAIN"/"YOU TOO" personal markers, the insight cards (stamped
editorial style), reactions (REA1 quiet thumbs, ring-pop), share/download. Verify
each of the 14 DV renderers against the prototype's `_renderDV` for: exact
colours, the flood/grow/wave animations (cwFlood/cwGrow/cwHeat), the podium
ceremony (cwStamp "India's pick", silver-gold-bronze flood), the map gradients.

### D. Three interaction modes have ZERO content
`rank_order`, `podium_slots`, `logo_quick_pick` components exist but no question
uses them, so they were never visually verified and never appear live. Either add
≥2 questions per mode (so they show + can be screenshot-checked against the
prototype), or confirm they're intentionally deferred. The prototype demonstrates
all three.

### E. Smaller items
- `--pink` token: deployed `#f2a0c4` vs prototype sometimes `#ffd9d3` — reconcile
  per the prototype's desk-chip vs tug-of-war usage (adr-005 locked #f2a0c4 for
  the Bazaar desk; the tug-of-war right side uses fire-tint #ffd9d3 — likely both
  are correct in different places; confirm against prototype).
- Share sheet: prototype splits Download into "⬇ DOWNLOAD PNG" + "🔗 LINK"
  (`components/experience/ShareSheet.tsx`).
- About page: `/about` is linked from the masthead but not built — prototype has
  a broadsheet manifesto (ABT1). Build it.
- States to verify against prototype: frozen, archived (AR sepia/stripes),
  low-data/still-counting, empty search.

### F. Durability — bake the question salvage into the seed source
The salvage/archive in §5 was applied to the **live DB only**. A re-seed
(`npm run seed`) re-imports original options from `inputs/catalogue-full.json`
and re-activates the 3 archived dupes. Before any reseed: update
`inputs/catalogue-full.json` with the relocalized options for Q-301/403/404/602,
and add Q-101/102/302 to a do-not-activate set in `scripts/seed.ts`. Also have
the owner review the salvaged option wording in `/admin`.

---

## Do NOT re-litigate (backend is solid + verified)
Data model, anonymous identity, vote dedup + rate limiting, question lifecycle,
seed pipeline, the answer/result/region/reactions/og APIs, discovery queries,
admin governance — all built, unit + e2e tested (92 + 20), verifier-approved,
CI green. The fidelity work is **frontend/visual only**. Don't rebuild the data
or API layers.

## Infra reminders (see also memory: vault7a-infra-gotchas)
- Edit locally in `C:\Users\pdsva\Desktop\Projects\State of Us\repo`, scp to
  `/mnt/storage/websites/stateofus`, build + `docker compose up -d` (port 8510).
  **Bracket paths** (`app/c/[categorySlug]`, `app/q/[questionId]`) — scp to /tmp
  then `mv` server-side (scp mangles `[]`).
- Screenshot recipe: headless chromium via `node_modules/playwright-core`,
  `waitUntil:"domcontentloaded"` (networkidle times out). Examples in `/tmp/shot*.cjs`.
- Public URL https://stateofus.vault7a.xyz (NPM host 45 + cloudflared route).
- Prototype renders the home view on load; drive clicks to reach answer/result.
