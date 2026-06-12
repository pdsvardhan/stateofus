# V5 Master Plan — consolidated analysis (13 Jun 2026)

## BUILD STATUS (12 Jun): v5 BUILT — State of Us v5.dc.html
All tranches complete: T1 brand/copy/fixes · T2 Lab-B winners (N2 notes, AR2 archived, RG2 press-pass, M2 mode tab, BK2 back, D1-3 download w/ real PNG export) · T3 interactions (sorter tray+solid buckets+early submit, rank drag+arrow fades, F1 peek&page rows, F3 deck row, FB-009 typed teaser previews, FB-010 related mini cards) · T4 content (24 questions: ≥2 per mode and per DV incl. 3 Mirror questions, 2nd geo map, archived IPL).
KNOWN DEFERRED: CA-009 global mono type floor (≥10px) left to the coding agent's build pass — bulk-bumping late risked layout regressions; all other CA accepts are in.

## ROUND-1 ANSWERS (LOCKED 13 Jun)
- Tagline: **"You answer. India answers back."** ✔
- Desk names: all six approved (City Desk / Daily Grind / Culture Desk / Bazaar / Chaos Bureau / Mirror) ✔
- 6th desk: SHIP in v5 with 2–3 demo questions ✔
- Dark mode: light-only MVP, exception recorded ✔
- Logo: file at uploads/logo-1781258926937.png (1996×788 PNG, cream bg → blend/crop into masthead) ✔
- Heroes: agent's 4 + keep city-life = 5 heroes, 9s interval ✔
- House rules: approved EXCEPT rule 02 — "No accounts ever" is NOT true. Reframe as privacy-first (e.g. "Privacy first — your opinion, never your identity"). Others "okayish" — light polish allowed.
- Region chip: design in v5 (chip + corrector sheet) ✔
- Archived: SHOW VARIANTS
- Content: design-completeness rule — v5 must have 2–3 examples of EVERY question type and EVERY DV type (stub data fine); coding agent arranges later ✔
- VARIANTS LAB SCOPE CORRECTED: not capped at 3 elements — ALL unfinalized visual elements get 2–3 variants each. Verdict = like/dislike/needs-change + comment per variant, multi-select, all copyable.

## VARIANTS LAB ELEMENTS (Lab A = interactions, Lab B = visuals)
A1 Sorter flow ×3 · A2 Podium slots ×3 · A3 Feed rows desktop ×3
B1 Desk notes ×3 · B2 Share/download card ×3 · B3 Archived band ×2 · B4 Region chip ×2 · B5 Mode label chip ×3 · B6 Back button ×2 · B7 6th-desk colour ×2

Sources: FB-001–020 (Vardhan) · CA-001–037 + section D/E (coding agent) · NEW-01–04 (my re-review).
Nothing implemented yet. This doc is the single source for the v5 build.

═══════════════════════════════════════════
## 1. MY VERDICTS ON THE CODING AGENT REVIEW
═══════════════════════════════════════════

| Item | Verdict | Note |
|---|---|---|
| CA-001 reduced-motion | ✅ ACCEPT | Cheap: one global media-query override + per-DV note for the build pipeline. Doesn't dilute design. |
| CA-002 focus-visible | ✅ ACCEPT | One house token: 3px lime outline / ink on lime surfaces. |
| CA-003 stray greens + dead PAL | ✅ ACCEPT | Housekeeping. Bless #2B8A3E as the agree-green, delete PAL. |
| CA-004 dead circle-packing code | ✅ ACCEPT | Pure cleanup. |
| CA-005 reaction count formats | ✅ ACCEPT | Real inconsistency. Both → compact K-format. |
| CA-006 hero fixed height clips | ✅ ACCEPT | min-height + 3-line clamp. Correct catch. |
| CA-007 cream map states ambiguous | ✅ ACCEPT | "No clear winner yet" legend chip. Protects trust. |
| CA-008 sankey label clip | ✅ ACCEPT | Shrink-to-fit + caption fallback. |
| CA-009 mono type floor 10px | ✅ ACCEPT (desktop too) | Valid contrast point, not just mobile. |
| CA-010 sorter tee-up space | ✅ FOLD into FB-016/17 redesign | Not separate. |
| CA-020 6th desk missing | ✅ VALID CATCH — needs your call | Real gap: catalogue has 6 categories, prototype has 5. |
| CA-021 region capture chip | ✅ VALID — scope question | Real honesty gap for geo DVs. But might be surfaces-phase. |
| CA-022 share card design | ✅ ACCEPT — strong point | Download (FB-014) needs a *designed* card, not a page screenshot. |
| CA-023 OG link preview | ⚠ PARTIAL | Valid, but an OG card is a build-pipeline artifact; v5 designs the family once (with CA-022), pipeline exports ratios. |
| CA-024 archived state | ✅ VALID — needs your call | One-line decision. |
| CA-025 surfaces confirmation | ✅ NOTED | No action. |
| CA-030–037 DS gaps table | ✅ ACCEPT | Mirrors the above; CA-037 search-reuses-feed-cards matches your FB-010 instinct. |
| D: tagline proposal | ✅ GOOD — needs your approval | "You answer. India answers back." is genuinely strong. |
| D: desk names | ✅ GOOD — needs your approval | The City Desk / The Daily Grind / The Culture Desk / The Bazaar / The Chaos Bureau / The Mirror. |
| D: hero curation (4 heroes, 9s) | ✅ SENSIBLE — needs your approval | Breakfast map, potato podium, internet-vs-phone, behaviour court. |
| D: feed rows peek-and-page | ✅ AGREE with their rejection of grid | But this was YOUR "think better" item — your call: accept or see variants. |
| D: house rules copy | ✅ GOOD — needs your approval | 5-line numbered draft. |
| E1: dark mode | AGREE with agent: light-only MVP | The paper IS the brand. Record exception; "Night Edition" later. Your call. |
| E2: logo | Needs your input | File vs in-system recreation. |
| E3/E4 | Needs your calls | See questions. |

**Deliberate-deviations check (your instruction):** nothing in the CA review tries to drag us back to abandoned doc decisions. CA-001/002 come from their build-pipeline rules (additive, not regressive). Dark mode is the only doc-rule colliding with a deliberate design choice — and the agent itself recommends recording the exception. ✔

═══════════════════════════════════════════
## 2. NEW BUGS FROM MY RE-REVIEW
═══════════════════════════════════════════

### [NEW-01] Trending rail sort bug — thin question ranks #1 🔴
Trending sorts by `parseFloat(votes)`: "214" (raw) beats "12.4K" (parsed 12.4). The 214-vote air-quality question tops "Heating up" with the 🔥 icon. Fix: normalize K/M suffixes before sorting.

### [NEW-02] URL hash not cleared on go-home
`openQ` writes `#qID` but going home never clears it — reload after browsing home reopens the last question. Fix: clear hash in goHome/ESC.

### [NEW-03] House rules card still has literal user-edit damage
The right-rail House Rules card body contains a user-edited span (placeholder-ish content). Agent drafted replacement copy (5 numbered lines) — needs your approval, then fix.

### [NEW-04] Carousel doesn't pause on hover
Auto-advance continues while the pointer is over the hero — you can lose the card you were reading mid-click. Fix: pause interval on hover, resume on leave (standard carousel behaviour; complements FB-005 slowdown).

═══════════════════════════════════════════
## 3. CATEGORIZATION — the build strategy
═══════════════════════════════════════════

### BUCKET A — Clear, no input needed (just do in v5)
FB-002 remove ghost number · FB-004 mono trending icons · FB-005 carousel 9s · FB-009 DV-typed card previews · FB-010 related = mini feed cards · FB-011 category chip contrast · FB-012 DEV_MODE flag · FB-013 back button distinct treatment · FB-018 rank arrow fades · FB-019 rank drag-to-reorder (FLIP, handle, arrows stay) · CA-001 reduced-motion · CA-002 focus token · CA-003 green/palette cleanup · CA-004 dead code removal · CA-005 count formats · CA-006 hero min-height · CA-007 map legend chip · CA-008 sankey labels · CA-009 type floor · NEW-01 trending sort · NEW-02 hash clear · NEW-04 carousel hover-pause · fire-emoji-used-twice fix · FB-007 mode chip highlight (subtle sticker treatment — will keep restrained)

### BUCKET B — Clear intent, want your pick → VARIANTS LAB (max 3 elements, 3 variants each)
1. **Sorter flow redesign** (FB-016/17 + CA-010) — the big one
2. **Podium slots redesign** (FB-020)
3. **Third slot — your choice** (see Q7): feed-row desktop pattern (FB-008) vs share/download card design (CA-022) vs desk-notes treatment (FB-015)
   (the two not chosen get my single best design directly in v5)

### BUCKET C — Need your answers first → QUESTIONS (round 1 asked now)
Dark mode · logo · 6th desk · demo-vs-catalogue content · copy approvals (tagline, desk names, heroes, house rules) · third variants slot · region chip scope · archived treatment · feed-rows accept-or-variants

═══════════════════════════════════════════
## 4. YOUR TWO DIRECT QUESTIONS ANSWERED
═══════════════════════════════════════════

**"Did we not build out any features?"** — All core MVP loop features are built and tested. Still NOT built (tracked, never lost): Explore page, Search, Onboarding/first-run, share-image export (FB-014/CA-022 brings it in v5), category desk full pages (header exists; full page is surfaces phase), region-capture chip (CA-021, new), archived band (CA-024, new), 6th desk (CA-020, new). Plus parked-by-you: opinion network, tournament bracket, multi-pick.

**"I hope you stored all the multi-likes"** — Yes. DECISIONS.md holds every multi-accept: both podium styles (steps + medal board), both liquid DVs (cups + coins), both surprise entries (masthead + FAB), both map modes (winner + bubbles), both bucket-sort drag styles (V1+V2 hybrid), all 3 heat ramps (gradient versions), liquid bars + coins for swipe. v5 keeps them all via the DV switcher.
