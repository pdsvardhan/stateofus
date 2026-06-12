---
id: adr-005-stateofus-ui-master-plan
title: "Light-only newspaper theme locked from the user-tested v4 prototype (with design-driven scope deltas)"
date: 2026-06-12
status: accepted
tags: [stage-2, ui-master-plan, curated, "cat:product"]
linked_features: [feat-dv-engine, feat-interaction-modes, feat-question-experience-page]
linked_risks: []
---

## Context

The owner built the design in a parallel Claude design session through four prototype
versions; v4 ("State of Us v4.dc.html", preserved at design/v4/) is user-tested and
final-ish, with v5 fixes consolidated in V5 Feedback.md (FB-001..020 + Coding Agent
Review CA-001..037). The design is a deliberate light-only newspaper: dot-grid cream
paper, ink borders, stamps, editorial desks.

## Decision

1. **UI master plan locked from v4 tokens** (ui_master_plans row): paper #E7E0CD /
   #F7F1E2 / #F2ECDF, ink #18162A, fire #FF5A47, lime #BFEE4F, gold #FFC53D,
   blue #7DA7FF, pink #F2A0C4; rank scale, map palette, tier palette, heat ramp as
   captured; Archivo (UI) + Spectral (editorial serif) + Space Mono (labels);
   animation level: playful.
2. **Light-only, by owner decision.** The house "dark + light mandatory" default is
   waived for this project (owner 2026-06-12: "not all require light and dark" — the
   paper IS the brand). A "Night Edition" dark palette is a future design-system
   request, not an MVP requirement. The house rule itself is being relaxed to
   default-both-with-per-project-opt-out (plugin change, same date).
3. **The v4 prototype is the component source of truth.** All 30 v4-covered component
   slots are picked with asset_library_ref `mc-stateofus-v4` (the prototype seeded
   into the asset library). Build must match the prototype exactly — functions AND
   animations (owner requirement).
4. **Design-driven scope deltas** (design evolved the locked spec; accepted):
   - Interaction modes grew 5 → 8: + Rank Order, Podium Slots, Logo Quick Pick.
   - DV set grew to 14 renderers + still-counting state (adds: verdict bars, liquid
     coins, liquid cups, heat matrix, medal board, sankey; circle packing + tile
     bubble map killed per design DECISIONS).
   - India map ships via @svg-maps/india (v4 implementation) — supersedes ADR-002's
     MapsOfBharat TopoJSON plan unless boundary-compliance review at Stage 3 says
     otherwise (verify Survey-of-India compliance of the package before deploy).
   - d3 utilities now optional: v4 hand-rolls treemap/sankey/map geometry.
5. **18 slots remain unpicked, deliberately**, awaiting design: admin surface (10 —
   admin may live outside the product per DOC 7), explore/search (4 — surfaces phase),
   category empty-state, region-correction-chip (CA-021), search states. They block
   nothing until their features enter the build.

## Consequences

- Stage 2 component-pick gate: 30 picked + 18 documented above = gate-clean for the
  features in the v4 scope; surfaces-phase picks happen when v5/surfaces designs land.
- WCAG note: ink-on-paper pairs pass AA comfortably; the one borderline token
  (#6B6478 muted on cream at <10px) is flagged as CA-009 for v5.
- Stage 3 build order unchanged; CODING_GUIDELINES.md updated to reference design/v4
  as the visual contract.
