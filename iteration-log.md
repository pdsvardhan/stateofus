# ComWatch — Iteration Log

## 2026-06-12 — Stage 0 + Stage 1 (session 1)

**Stage 0 (Type 2 preprocessing):**
- Journey: Type 2 — 12 artifacts (10 intent PDFs DOC 0-9 under working title "Public Pulse",
  question catalogue XLSX 116 rows / 25 content-ready, DV reference DOCX 23 images). No F1 code.
- Identity: slug `comwatch`, display ComWatch, port 8510, tags cv + public-facing.
  Naming decision: ComWatch everywhere; Public Pulse retired.
- Decisions at sketch review: all 13 doc-sourced features + 4 AI companions approved;
  region capture = IP-geo + one-tap refine; launch content = >=100 questions
  (25 imported + ~75 Claude-authored, user-reviewed).
- ND1 finalized: 17 features, 5 flows, 10 risks, 6 success criteria, 11 non-goals.
  `staging/ND1.yaml` + archive copy. Known drift: no nd1_archive/intent-draft-finalize
  API routes — file is canonical (documented in ND1 known_drift).

**Stage 1 (SO1 production):**
- 348 API writes: Doc 1 overview (tagline/description/core idea/problem/preferences,
  11 non-goals, 6 success criteria), Doc 3 features (17, each with 3-4 ACs),
  Doc 2 flows (5, step-locked with pre-conditions + edge cases), Doc 4 pages
  (7, page-comwatch-* ids — page ids are globally unique) + 48 components (picked:false),
  Doc 5 data (concepts + 3 sources), Doc 7 risks (10 instances + policies +
  auth-config custom-admin-gate + 3 secrets + 4 third-party services),
  Doc 8 ADR-001 (curated, cat:product) linked to 17 features + 4 risks.
- 5-pass verification: PASS (0 hard, 0 orphans, 0 anti-gaslight violations).
- YAML mirrors: 7 files written, 0 drift.

**Next:** Stage 2 — user is building the design system in parallel; UI master plan
must be saved BEFORE component picking. MVP DV-set trimming flagged for Stage 2 review
(risk viz-complexity-creep).

## 2026-06-12 — Design landed + rename (session 1, continued)

- Design system arrived: State of Us v4 prototype (Claude design session export) —
  neo-brutalist newspaper, 8 interaction modes, 14 DV renderers, personal layer
  everywhere. Preserved at design/v4/ (prototypes, DECISIONS, FEATURE-AUDIT,
  BACKLOG, V5 Feedback, dv reference board).
- Renamed: ComWatch -> State of Us (adr-004). Slug/repo stay comwatch (infra).
- Coding Agent Review delivered into V5 Feedback.md (CA-001..CA-037 + FB-001/003/
  006/008 deliverables: tagline, desk names, hero curation, peek-and-page rows).
  Key asks: reduced-motion + focus tokens, region-capture affordance, share-card
  design, 6th desk (Identity/Society), archived-state treatment.
- Pending owner decisions: dark-mode exception, logo asset, public domain.

## 2026-06-12 — Full identity migration + UI master plan lock

- Owner: "ALL indications of comwatch change to State of Us" → full migration:
  new tracker slug `stateofus` (346-call data migration, same feature/flow ids,
  pages re-prefixed page-stateofus-*, ADRs re-id'd adr-00N-stateofus-*),
  dir moved to /mnt/storage/websites/stateofus, Gitea repo renamed pdsv/stateofus,
  public URL stateofus.vault7a.xyz. Old comwatch row archived (history preserved).
- UI master plan LOCKED from v4 tokens: light-only per owner (adr-005; house
  dark+light rule relaxed plugin-side to default-with-opt-out).
- Component picking: v4 prototype seeded as mc-stateofus-v4 in the asset library;
  30/48 slots picked against it; 18 deliberately unpicked (admin/explore/search/
  region-chip — documented in adr-005).
- Design deltas accepted via adr-005: 8 interaction modes, 14 DVs, @svg-maps/india.
- Coding Agent Review delivered to design agent via V5 Feedback.md.


## 2026-06-12 — Feature audit + design review handoff (session 2)

**Stage:** Pre-Stage-3 / analysis
**Duration:** ~20 min
**What changed:**
- No DB or file changes — read-only analysis session.
- Full feature audit: 17 tracker features mapped against v4 prototype coverage.
  7 fully done (question-experience, interaction-modes, result-reveal, dv-engine,
  personal-insight-layer, homepage-curation, anonymous-participation). 3 partial
  (reactions-sharing, discovery, question-lifecycle). 7 correctly absent (backend/P1).
- Cross-referenced partial + absent features against V5 Feedback.md:
  - reactions-sharing (share half): FB-014 + CA-022/023 cover it.
  - discovery: CA-025 + other-open-items cover it.
  - question-lifecycle (archived state): CA-024 covers it.
  - og-image-gen: CA-023 covers it.
  - region-capture: CA-021 + CA-032 cover it.
- GAP FOUND: feat-share-landing has no design anywhere. FB-014 adds the button,
  CA-022 designs the share card, but the landing page someone arrives at after
  clicking a shared link is undesigned and unflagged in V5 Feedback.md.
  Add to v5 scope before scaffolding.

**Decisions:** none (analysis only)
**Next session context:** v5 code build. Design agent has V5 Feedback.md.
  Trigger when v5 design lands. Flag feat-share-landing gap to design agent first.

## 2026-06-13 — Stage 3 complete: v5 adopted, 17 features built+verified+deployed (session 3)

**Stage:** 3 (full) — scaffold through deploy gate
**What shipped (commits 271ccaa..3a57def):**
- v5 design adopted (adr-006): prototype + labs preserved at design/v5; owner locked:
  share-landing from spec, Authentik admin auth, all 105 questions approved, full
  17-feature scope.
- Stage 3.1 scaffold: Next.js 15 + Tailwind 4 + drizzle, Docker on :8510, adr-005
  tokens, admin-gate middleware, /design route, CI workflow.
- Builds #1-17 per adr-003 order, all claims verifier-reconciled:
  verifier-A (features 1-5): 5x APPROVE. verifier-B (6-17): 11x APPROVE + 1 ITERATE
  (feat-dv-engine: 4 renderers 800-850ms vs AC346 window) -> auto-fixed to 700ms,
  re-checked, APPROVE. Zero stub detections across both runs.
- Tests: 92 vitest + 20 playwright e2e (Pixel5 mobile + desktop) green; critical
  flows covered (core answer loop, discovery, share landing, admin gate).
- Deployed: https://stateofus.vault7a.xyz live (NPM host 45 + tunnel route);
  prod DB 146 questions / 105 active; nightly backup cron 03:15 (+ first snapshot).
- Ledger: 17 feature_claims reconciled verified, 17 verification_reports,
  deploy_artifact #6, test_runs (manual + CI).
- Risks resolved: public-admin (75 — token gate live), no-tests (76).

**Deploy gate:** #27 auth ADMIN_TOKEN gate (Authentik wrap PENDING — see below);
#28 gitleaks clean every push; #29 backup cron live; #30 data sensitivity: anonymous
opinions, pseudonymous device hashes, coarse region only — low-sensitivity tier
acknowledged; #31 tunnel route live; #32 all 17 features verifier-APPROVE.

**Known deferrals (explicit, not silent):**
- Authentik SSO wrap on /admin (adr-006 §3): AUTHENTIK_BOOTSTRAP_TOKEN expired —
  app-level constant-time token gate live + verified instead. Stage 4 item.
- Stage 3.2 extended CI (Lost Pixel, Lighthouse, axe suite, k6): core CI green
  (typecheck/lint/vitest/playwright/trivy-if-present); extended tiers Stage 4.
- Catalogue observation (verifier-A): inputs/catalogue-full.json has 50 intra-file
  duplicate ids (116 rows -> 66 distinct, last-row-wins) — owner awareness.
- CA-009 mono floor + swipe verdict labels (q.yes/q.no custom labels need a data
  field) — Stage 4 polish candidates.

**Next session:** Stage 4 iterations (Authentik wrap, extended CI tiers, owner
review of share-landing page + 105-question editorial pass in /admin).

## 2026-06-13 — Correction: real homepage was not deployed (session 3, post-close)

Owner caught via browser that stateofus.vault7a.xyz served the Stage 3.1 SCAFFOLD
placeholder ("the presses are being built"), not the curated front page.

Root cause: during the homepage build, an scp of app/page.tsx targeted the repo
root, landing the real page at /page.tsx (the "stray page.tsx" later removed)
instead of app/page.tsx, which stayed the scaffold. The gap passed e2e + verifier
because both matched on masthead text + a 200 — content the scaffold also has.

Fix (f3b63ec): the real composeHomepage front page now lives at app/page.tsx,
rebuilt + redeployed. 16 question cards render across hero/trending/recent/explore;
public URL confirmed serving it. The homepage e2e is hardened to assert curated
content ("Heating up", "House rules", a /q/ card) and the ABSENCE of the scaffold
tell, so it cannot regress. Correction verification report posted (corrects #115).

Process lesson: feature verification must diff deployed CONTENT against the spec,
not just assert route-exists + 200. Logged for Stage 4 verifier-prompt tightening.

## 2026-06-13 — Frontend fidelity pass + critical font fix (session 3, continued)

Owner reviewed the live site and (rightly) flagged that it looked nothing like
the v5 design. Root-caused and fixed the biggest issue + re-ported the home view.

**Root cause of "looks nothing like the design": brand fonts never loaded.**
The whole app rendered in system sans-serif. app/globals.css defined the app
font vars at :root, but next/font scopes --font-archivo/-spectral/-space-mono to
<body>; combined with Tailwind @theme inline stripping the vars from runtime,
var(--font-ui/-editorial/-label) resolved empty everywhere. Fixed by defining the
font vars in the body rule. Verified: body + h1 now compute Archivo; Spectral +
Space Mono apply. This single fix transforms every surface.

**Also fixed:** faithful re-port of the home/discovery view from the prototype
(the prior version was a from-memory reconstruction shipped after an agent hit
its session limit); India winner map (was painting every state Option-A colour);
5 tier_placement questions that rendered chart-less (retargeted podium->tier +
empty-dvDefs fallback in ExperienceClient); DV pill label "The map"->"Winner map".

**Question audit + cleanup:** audited all 105 vs DOC 3 standards. The 80 authored
questions are launch-quality; the 25 imported Q-* rows were the filler. Salvaged
Q-301 (broken placeholder options), Q-403/404/602 (US-centric -> India context);
archived Q-101/102/302 (duplicates of authored). 102 active. NOTE: applied to the
live DB only — see FRONTEND-FIDELITY-TODO.md section F (bake into seed source).

**Visual audit:** screenshot-diffed every surface vs prototype (27 PNGs at
design/v5/_audit/). Most surfaces MATCH after the font fix. Remaining fidelity
polish is documented in FRONTEND-FIDELITY-TODO.md.

**Next session:** the frontend fidelity pass — see FRONTEND-FIDELITY-TODO.md.
Mandate: frontend 100% replicated to design/v5; backend is solid + verified, do
not rebuild it. Start by re-verifying the font fix across all pages.

## Session 2026-06-13 — fidelity audit → iteration #18 → Stage-3 deploy-gate close-out

**Stage:** Stage 4 (iterate) + Stage 3 deploy-gate close-out
**Duration:** ~one long session

**What changed:**
- **v5 fidelity audit** (design vs build). Found real gaps (home feed taxonomy, tokens, /about 404, result chrome) and *corrected several audit claims with evidence* — the DV-typed teasers + reveal animations were already faithful (framer-motion), the India map was already bundled locally, and "🔒 your vote is the ticket" is the prototype's own text.
- **Iteration #18 — 10 locked items, all built + INDEPENDENTLY VERIFIED (APPROVE), merged `iter-18`→master @`bcba2c9`:**
  - home 5-rail feed taxonomy (Vote to unlock / Results are out / Quick picks / Sorting desk / Swipe court) + stat/tug result cards; FB-009 teasers; tokens (#e7e0cd paper, 7px dot-grid, h1 64px, +ink-warm/muted-violet theme tokens); 9 missing keyframes; `/about` ABT1 broadsheet page; result chrome (SHARE / DOWNLOAD PNG / LINK + truthful "Counted" stamp, NO sample-data stamp); committed sample-data seed `scripts/seed-sample-votes.mjs` (+ `npm run seed:demo`) with 6 stub questions (NEW-90..95) → all **8 modes + 14 DVs** now live with data. DV animations + map CDN verified **no-change**.
- **Stage-3 deploy-gate CLOSED:** e2e **20/20** + unit **92/92** green @master; all **5 flows recorded passing** in `flow_test_runs`; backup verified (`stateofus-backup.sh`, 14d WAL-aware snapshots) → `no-backup` resolved; secret scan clean (gitleaks 28 commits 0 leaks + trivy 0 secrets) + production deploy-artifact recorded; **6 risks resolved** (rate-limit/caching/xss/data-drift/mobile + backup).
- **`design-review/`** package added (UI-MAP + neutral review prompt + 27 rendered screenshots) for an independent design-AI review; internal audit/TODO docs removed.

**Decisions:** no new ADRs (iteration #18 integrated under existing adr-005/006).
**Open follow-ups:** `no-error-tracking` (GlitchTip/Sentry) still OPEN; result-screen multi-column layout + mobile/responsive fidelity deferred-with-reason.
**Soft warning (pre-existing):** `stale-verification` on 5 features (edited ~16s after their 2026-06-12 verify, during original build).
**Next session pick-up:** design-AI review report (prompt in `design-review/REVIEW-PROMPT.md`); optionally wire error-tracking + the deferred layout/mobile items.

## Session 2026-06-13 (cont.) — design-AI review intake + solution plan; site published

**Stage:** Stage 4 (iterate) — pre-build: review received, code-grounded analysis, plan
**What changed:**
- Received the **design AI's review** of the built UI → `design-review/DESIGN-REVIEW.md`. Verdict: "refinements on a strong base." Findings: A (fidelity), B (UX/craft), C (product reqs). **P0:** A1 two-column desktop layout, C1 About privacy copy. **P1:** A2/C2 editorial insight voice, B3 map legend+labels, B2 result-card variant on grids. **P2:** B1 Explore curation, A3 per-DV ghosts, B4 seed spread, B5 reaction bar, C3 frozen/archived.
- Builder **code-grounded analysis** → `design-review/SOLUTION-PLAN.md` (per-issue where/why/difficulty/approach/needs-input). Refined 2 review findings against the code: **A3 already wired** (`ghostKind` on all grids) and **C3 already present** (`StatusBand` frozen/archived) → verify-not-build. One real blocker needing owner input: **A2 curated editorial note** (no source content for 105 Qs — author vs defer). B1 Explore curation + B5 reaction bar may want variants.
- **Infra (see OPS_LOG):** published `stateofus` to the public internet — added the missing Cloudflare DNS CNAME → site now reachable externally over HTTPS, no auth/credentials.

**Next session pick-up:** expand `SOLUTION-PLAN.md` into a precise file-and-line *solutions file* for the coding agent (the issues file `DESIGN-REVIEW.md` + the solutions file go to the coder together); decide the A2 editorial-note approach; show B1 / B5 variants where flagged.

## Session 2026-06-13 (cont. 2) — design-review fixes BUILT + home mini-iteration

**Stage:** Stage 4 (iterate) — build + deploy + independent verification

**What changed:**
- Expanded the plan into the file-and-line **Fix Spec** (owner's Downloads), then **built and shipped all 10 design-review fixes** across 4 commits (`bf11730`, `fc63ccd`, `664d803`, `e4b41b1`), each CI-green + smoke-verified:
  - FIX 1 (A1) two-column experience layout w/ sticky "Your position" rail · FIX 2 (C1) truthful About copy · FIX 3a varied insight phrasings (no-LLM) · FIX 3b editorial-note schema (drizzle `0002`) + "From the desk" card + 6 seeded notes · FIX 4 (B2) result cards on explore/category/search · FIX 5 (B3) map state labels (`<title>` + inline + bubble) · FIX 6 (B1) Explore curated rails · FIX 7 (B4) seed round-robin spread (+ live re-spread of 4 tier Qs) · FIX 8 (B5) louder reaction bar · FIX 9 (A4) flat mode chip.
  - Held the plan's honest corrections: **A3 + C3 already wired** (verify-not-build, confirmed live). The B5 review-vs-draft contradiction was surfaced and resolved by owner → "make it louder."
- **Independent verifier sub-agent APPROVE** on everything — report #136 (FIX 1–9) + report #137 (FIX 3b), separate context, checked diff + live app not coder claims. Deploy-artifacts #9/#10.
- **Home mini-iteration** (`61a2603`, deploy-artifact #11): hid the feed scrollbar (`.no-scrollbar`, horizontal scroll kept) · one-line headline · removed the subtitle · reworded House Rules 04 · sticky right rail on desktop. All verified in live HTML/CSS.
- **Catalogue analysis** (owner request): 152 questions (108 active / 41 draft / 3 archived). Flagged that `logo_quick_pick` / `rank_order` / `podium_slots` and the `medal/coins/cups/sankey/heatmatrix` DVs are **demo-stub-only** (authored catalogue has 0) — content gap, not a bug.

**Decisions:** no new ADRs (design-review polish + UI iteration under existing adr-005/006). A2 shipped as **Variant B** (field + card + featured-subset notes); B1 shipped the **curated-rails** layout.

**Open follow-ups:** `no-error-tracking` (GlitchTip/Sentry) still OPEN; content gap on 3 interaction modes + 5 DVs (authored questions needed); ~99 active questions still have no `editorial_note` (room to author more).

**Soft warning (pre-existing):** `stale-verification` on 5 features — from the original 2026-06-12 build, not this session.

**Next session pick-up:** optionally wire error-tracking; author the missing-mode/DV questions + more editorial notes. The Fix Spec in Downloads is the reference — every item in it is now built and live.
