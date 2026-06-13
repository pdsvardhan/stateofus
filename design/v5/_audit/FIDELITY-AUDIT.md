# State of Us — v5 Fidelity Audit (design prototype vs as-built)

**Date:** 2026-06-13 · **Auditor session:** ottomate/stateofus
**Build baseline:** HEAD `cc709f3`, container `stateofus` healthy, live `https://stateofus.vault7a.xyz` (200), local `:8510` (200).
**Source of truth (confirmed with owner):**
- Visual: `design/v5/State of Us v5.dc.html` (2674 lines, self-contained HTML/CSS/JS via `support.js`).
- Locked decisions: `design/v5/V5 Plan.md` (tagline, desks, house-rule-02 reframe, light-only) + `DECISIONS.md` (multi-accept variants the DV switcher retains).
- Labs (`V5 Lab A/B`) = upstream variant exploration, not build targets. `design/v4/*` = obsolete.

## Method
1. **Source extraction** — prototype palette/type/shadow/keyframes/JS (it uses NO `:root` tokens; values hardcoded inline) diffed vs build (`app/globals.css`, `components/*`, server = canonical).
2. **Computed-style probes** — Playwright read font-family/size/weight/bg per page (hard proof).
3. **Matched screenshots @1400px** — home + 5 answer modes + 9 result DVs.
4. **Data seeding** — the build had only **3 total votes**, so every result fell back to "still counting." Seeded ~55 authentic votes each across 9 questions (one per live DV) through the real `POST /api/answers` path (unique device cookie + `X-Forwarded-For` per vote, region set for geo DVs) so DVs render at realistic data. **This left ~500 synthetic votes in the build DB — purge on request.**

---

## VERDICT (revised after seeding)
The build is a **more faithful port than first impressions suggested** — once fonts and vote-data are present, the **interaction modes and DV renderers are largely accurate**. The real divergences are **concentrated**, not pervasive:
1. **Home/discovery** — wrong feed taxonomy, blurred teasers, invented microcopy (the single biggest UI gap).
2. **Animations** — 9 of 17 keyframes missing/undefined (incl. the podium stamp ceremony, liquid flood, heat ramp).
3. **Result chrome** — simplified vs the prototype's editorial treatment (stamps, 3-button share, multi-column density).
4. **Type/colour details** — home headline oversized, body paper too light, dot-grid too coarse.
5. **Holes** — `/about` is a 404; 3 interaction modes + 5 DV renderers have zero live content; the build shipped with ~0 vote data.

Most of this is **port-completion + content + animation work, not reconstruction.** The "looks nothing like the design" impression came mostly from (a) the (now-fixed) font bug, (b) the home divergences, and (c) empty results showing "still counting" everywhere.

---

## A. Design system — tokens, colour, type, shadow
| Aspect | Prototype | Build | Verdict |
|---|---|---|---|
| Palette | hardcoded hex | named tokens `--ink/--lime/--fire/--gold/--pink`… | **MATCH** (every high-freq hex → token) |
| Fonts (root cause) | Archivo / Spectral / Space Mono | computed: Archivo body, Spectral question-h1, Space Mono labels — every page | **FIXED & VERIFIED LIVE** |
| Home headline | `64px`/900 | **`76px`**/900 | **DIFF** ~19% oversized |
| Page background | body `#e7e0cd` | body **`#f2ecdf`** | **DIFF** wrong paper tone |
| Dot-grid | ~7px page / ~11px hero | `22px` | **DIFF** too coarse |
| Hard shadows | `6px 6px 0 #18162A` | style correct; some use `--ink-soft` + 4/5px | **MINOR DIFF** offset/colour drift |

## B. Animations / motion — SOURCE-LEVEL, HIGH CONFIDENCE
Prototype **17 keyframes** → build **8**.
- **Missing entirely (7):** `cwFlood` (liquid fill), `cwHeat` (heat ramp), `cwTick` (still-counting blink), `cwNudge`, `cwFloat`, `cwFadeIn`, `cwWobble`.
- **Referenced but undefined (2):** `cwStamp` (podium "India's pick" stamp ceremony) → no-op; `cwSpin`.
- Prototype uses **39 cubic-bezier** easings + **213 transforms**; hover is **JS-driven** (0 CSS `:hover`) → hover/3D effects must be ported from the prototype JS, not its CSS. Easing/timing parity not yet line-checked.

## C. Home / discovery — FRESH SCREENSHOTS, HIGH CONFIDENCE — biggest UI gap
- **Feed taxonomy wrong.** Build = 2 rails (*Hot off the press / Off the floor*). Prototype `rowDefs` = **5**: *Vote to unlock · Results are out · Quick picks · The sorting desk · The swipe court*. Grouping logic differs (prototype groups by card-type/mode).
- **"Results are out" row missing** (stat/tug result-preview cards, e.g. 52% / 29%).
- **Teaser cards = blurred gradient strips** vs the prototype's **DV-typed ghost previews** (FB-009: donut/bars/treemap/map ghosts matching each card's real DV).
- **Invented microcopy** — "YOUR VOTE IS THE TICKET" / "BE COUNTED FIRST" aren't in the prototype card anatomy.
- Headline oversized (A); hero corner disc renders **lime** vs prototype **fire** (confirm disc-colour rotation); desk-chip order differs.
- **MATCH:** masthead + tagline; HOUSE RULES copy (locked v5 decisions incl. privacy-first rule 02); HEATING UP rail.

## D. Answer interactions — GOOD
| Mode | Build answer screen | Verdict |
|---|---|---|
| bucket_sort | solid fire/gold/lime buckets, "NOW SORTING" tray, tap-or-drag + mobile tap fallback, early-submit counter | **FAITHFUL** (LAB-001) |
| quick_pick / tradeoff / swipe / tier | render with correct type (Spectral question, Space Mono labels), archive/desk chips | **GOOD** (per-pixel polish pending) |
| podium_slots / rank_order / logo_quick_pick | components exist; **zero live questions** → never render | **DEAD CONTENT** |

## E. Result DVs — DATA-SEEDED, render faithfully
| DV | Built render (with seeded data) | Verdict |
|---|---|---|
| radial (S2) | donut + per-option bars, "YOU" marker, top-answer % | **FAITHFUL** |
| split (S1) | split-cards (switcher alt on many) | renders |
| liquid (S3) | liquid fill | renders (no `cwFlood` motion) |
| treemap (P1) | proportional colour blocks | **FAITHFUL** |
| tier (R1) | colour tier rows, chips %, YOU markers, empty-tier handling | **FAITHFUL** |
| board (R2) | dark card, ranked bars, rank numerals | **FAITHFUL** |
| podium (R3) | fire #1/navy #2/lavender #3, "INDIA'S PICK" gold tag, off-podium line | **FAITHFUL** (no `cwStamp` ceremony) |
| map (G1) | India choropleth, per-state winner fill (the prior fix holds) | **FAITHFUL** |
| bubblemap (G2) | India outline, state-sized bubbles | **FAITHFUL** |

**Common result-chrome gaps (all DVs):** Share/Download only (prototype = **SHARE / DOWNLOAD PNG / LINK**); **no rubber-stamp badges** ("SAMPLE DATA"/"COUNTED"); flatter single-column layout vs the prototype's multi-column insight cards + right rail; reveal animations absent (B). Personal-insight markers ("AGAINST THE GRAIN", "MINORITY REPORT", "YOU MATCHED") and the region "press pass" chip **are present**.
**Never exercised live:** 5 of 14 DV renderers (`cups`, `coins`, `medal`, `heatmatrix`, `sankey`) — no active question uses them as primary.

## F. Other surfaces
- **`/about` → 404** (h1 literally "404", system-ui, white bg) — not built; the 404 itself is unthemed. Prototype has the ABT1 broadsheet manifesto.
- `/explore`, `/search`, `/c/[slug]`, `/admin` render & type correctly — per-pixel diff pending.
- **Data:** build shipped with **3 total votes** → every result showed "still counting." (Seeded for this audit; see Method.)

## Fixability
**Easy (port verbatim / token swap):** feed 5-rail taxonomy + names (C); home headline 64px + body bg `#e7e0cd` + finer dot-grid (A); shadow token/offset alignment (A); share LINK split (E); the 7 missing keyframes + define `cwStamp`/`cwSpin` (B).
**Medium:** FB-009 DV-typed teaser previews (C); wire reveal animations into DV components (B/E); rubber-stamp badges + result-chrome density (E); build `/about` from ABT1 (F); decide the 3 dead modes + 5 unused DVs — add content or formally defer (D/E); a real sample-data seed so the live product isn't empty (F).
**Hard / flag-don't-assume:** prototype loads the India map from an external ESM CDN (`@svg-maps/india` via jsdelivr) — build must bundle offline; exact easing/timing parity across 39 cubic-beziers; whether JS-driven hover/3D micro-interactions reproduce 1:1 in React — confirm per component, **report don't silently substitute**.

## Coverage & next step
**Done (high confidence):** design-system, home (deep), all 5 live answer modes, all 9 live result DVs (data-seeded), animation source audit, `/about`, mode + DV inventory.
**Pending for 100%:** per-pixel polish diffs (explore/search/category/admin); frozen/archived/empty/low-data states; hover/click/3D motion capture; the 3 dead modes + 5 unused DVs (need content to render); secondary-DV switcher behaviour.
**Recommended next:** start fixes with the **easy bucket** (home taxonomy, headline/bg/grid, missing keyframes, share split) — high visual payoff, low risk — then medium items. Decide whether to keep or purge the ~500 seeded votes.
