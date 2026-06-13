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
