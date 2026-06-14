---
id: adr-007-stateofus-design-deviations
title: "Accepted deviations from the v5 prototype: category pages, no prod dev-reset, one-line headline"
date: 2026-06-14
status: accepted
tags: [stage-4, design, curated, cat:product]
---

## Context

The V5 design-parity wave (iteration #19, branch `parity-fixes`, commit `de54428`)
re-aligned the build to the locked v5 prototype across ~12 root-cause clusters.
A handful of build choices diverge from the prototype on purpose. This ADR records
them as accepted deviations so they are not re-opened as "bugs" in future parity
passes.

## Decisions (deviations the owner has accepted — do NOT "fix")

1. **Desk chips navigate to category pages `/c/[slug]`** instead of expanding the
   prototype's in-page desk panel (design lines 79–90). The dedicated route is the
   stronger product behaviour; the in-page panel is retired.
2. **No production dev-reset.** The footer dev-reset control stays omitted from the
   production build (kept only as a dev affordance).
3. **One-line home headline.** The italic Spectral subhead from v5
   ("Answer one question. See the country split open…") is intentionally dropped;
   a prior home iteration chose the one-line headline and the owner has ratified it
   (decision confirmed 2026-06-14).
4. **RC2 — 10px mono type floor kept (won't-fix).** The CA-009 ≥10px floor clamps
   some sub-10px design labels; the owner keeps the floor for legibility.
5. **RC5 — build-only card extras kept + harmonized.** SampleLine, "Change my
   answer", heat you-ring, early-submit buttons, rank arrow-fade etc. are richer
   than the prototype; kept and styled to house rhythm rather than removed.

## Consequences

- Parity audits must treat the above as the target state, not as gaps.
- The sub-pixel P3 tail (≤4px spacing, .02em tracking, micro-easing) is likewise
  accepted as imperceptible and not chased.
