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
