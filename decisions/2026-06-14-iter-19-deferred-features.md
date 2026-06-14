---
id: adr-008-stateofus-deferred-design-features
title: "Deferred v5 features: off-the-deck, share overlay/PNG, feed-card reactions; per-question brand data blocked on frozen backend"
date: 2026-06-14
status: accepted
tags: [stage-4, design, curated, cat:product]
---

## Context

During the V5 design-parity wave (iteration #19) several prototype elements were
identified as not frontend-completable within the wave's scope — they need new
data, schema/seed changes, or large net-new builds. The owner deferred them
explicitly rather than stubbing them.

## Decisions (deferred — tracked, not dropped)

1. **"Off the deck" deal-a-card feature** (design 263–295) — whole feature unbuilt;
   deferred (needs a net-new interaction + data).
2. **Share overlay + 3-card picker + canvas PNG** (RC8) — the designed share
   overlay and poster/clipping/ticket render are deferred; the build keeps the
   `/api/og` image route as the interim share artifact.
3. **Feed-card "Answered ✓" badge + 👍👎 reactions** — deferred; requires
   per-card device-answered data that the feed payload does not carry today.
4. **RC11 — per-question brand data is blocked on a frozen backend.**
   `QuestionOption` is `{key,label,sublabel}` and `DiscoveryCard` carries no
   editorial icon/velocity, so logo brand marks (markBg/markFg), sorter chip
   colours/marks, and true trending velocity/icon all require schema + catalogue
   seed changes. The backend is owner-frozen, so these stay as honest frontend
   approximations (deterministic logo tiles; trending = real votes + desk).

## Consequences

- A future iteration that unfreezes the question schema can pick up RC11 and the
  feed-card reactions together (shared data dependency).
- These items are NOT regressions and must not be re-logged as parity gaps until
  their data dependency is unblocked.
