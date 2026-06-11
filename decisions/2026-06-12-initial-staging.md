---
id: adr-001-comwatch-staging
title: "ComWatch: scope and rails locked from a 10-document product package"
date: 2026-06-12
status: accepted
tags: [staging, initial, curated, "cat:product"]
linked_features: [feat-question-experience-page, feat-interaction-modes, feat-result-reveal, feat-dv-engine, feat-personal-insight-layer, feat-discovery, feat-homepage-curation, feat-reactions-sharing, feat-question-lifecycle, feat-admin-console, feat-question-data-model, feat-anonymous-participation, feat-seed-content-pipeline, feat-region-capture, feat-vote-dedup, feat-share-landing, feat-og-image-gen]
linked_risks: [no-rate-limit, public-admin, no-tests, no-backup]
---

## Context

ComWatch arrived as a Type 2 package: 10 intent PDFs (master PRD through builder handoff,
written under the working title "Public Pulse"), a 116-row question catalogue XLSX
(25 content-ready), and a 23-image DV reference board. The product: a mobile-first
public-opinion platform where answering a structured question is instantly rewarded
with a visual, comparative, shareable result plus a template-driven personal insight.
Core loop: Question -> Answer -> Aggregation -> Visualization -> Reaction -> Return.

User is building the design system in parallel; this staging pass locked everything
upstream of Stage 2 UI work.

## Decision

- **Name**: ComWatch everywhere; "Public Pulse" retired as a working title.
- **Scope**: large. 17 features (13 doc-sourced + 4 AI-proposed companions accepted:
  region capture, vote dedup, share landing, OG image generation), 5 flows, 7 pages,
  10 risk instances.
- **Identity**: anonymous-only participation is a product decision (accepted risk
  `no-auth`), with device-scoped pseudonymous identity for comparisons + dedup and
  migration hooks for future auth. Admin surface protected separately.
- **Region**: IP-geo coarse capture (city/state only) + one-tap optional correction
  on geographic questions. No accounts, no precise location.
- **Launch content**: >=100 questions across all 6 categories and 5 interaction modes;
  25 imported from the catalogue, ~75 authored by Claude under the DOC-3 quality
  standards, user-reviewed before activation. Identity/Opinion/Society category needs
  all-new content (0 ready).
- **Tags**: cv + public-facing -> strict Stage 3 gates (critical-flow E2Es BLOCK deploy).
- **Hosting**: VAULT7A docker, port 8510, comwatch.vault7a.xyz.

## Consequences

- Stage 2 inherits: ui_hints deliberately sparse (user's design system in progress);
  component slots per page (47 components across 7 pages, all `picked: false`);
  DV family set flagged for possible trimming (risk: viz-complexity-creep).
- Locked-for-iteration: interaction modes (5), DV MVP families, anonymous model,
  question lifecycle states, curated homepage model, non-goals (11).
- Deferred: result-reveal thresholds (per-question, implementation decision);
  admin protection mechanism (Stage 2 tech architecture); IP-geo provider choice
  (Stage 2); success-criteria threshold numbers are AI-quantified starting points.
- Tech hints carried for Stage 2 BUILD: none — builder owns stack per DOC 9.
- **Scope risks without catalog entries** (risks_catalog has no write API — tracked
  as an Ottomate improvement): viz-complexity-creep (9 MVP DV variants is a lot to
  build well), cold-start-empty-results (mitigated by reveal patterns + seeding),
  content-pipeline-gap (91/116 catalogue rows are placeholders). All three recorded
  here so they survive; first two also mitigated via acceptance criteria on
  feat-dv-engine / feat-result-reveal.
