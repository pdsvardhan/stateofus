---
id: adr-003-stateofus-build-plan
title: "Build order: data foundation first, content pipeline early, admin UI last"
date: 2026-06-12
status: accepted
tags: [stage-2, build-plan, curated]
linked_features: [feat-question-data-model, feat-seed-content-pipeline, feat-dv-engine]
linked_risks: []
---

## Context

17 features, one developer-agent pipeline, strict verifier gates per feature.
The content pipeline is deliberately early (#5): every feature after it develops
and tests against ~105 real questions instead of synthetic fixtures, which is the
only honest way to validate 9 DV variants and 5 interaction modes.

## Decision

```
build_plan:
  - { order: 1,  feature_id: feat-question-data-model,      rationale: "Foundation — everything reads questions", blocks: "all" }
  - { order: 2,  feature_id: feat-anonymous-participation,  rationale: "Device identity — answers need it",       blocks: "answers, dedup, insights" }
  - { order: 3,  feature_id: feat-vote-dedup,               rationale: "Rides on identity + answer endpoints; integrity before volume", blocks: "" }
  - { order: 4,  feature_id: feat-question-lifecycle,       rationale: "States drive what renders everywhere",    blocks: "experience page, admin" }
  - { order: 5,  feature_id: feat-seed-content-pipeline,    rationale: "105 real questions as dev/test data for everything after", blocks: "" }
  - { order: 6,  feature_id: feat-question-experience-page, rationale: "Shell of the core surface",               blocks: "interactions, DVs" }
  - { order: 7,  feature_id: feat-interaction-modes,        rationale: "Answering works end-to-end",              blocks: "results" }
  - { order: 8,  feature_id: feat-result-reveal,            rationale: "Reveal patterns + placeholders before DVs render", blocks: "dv-engine" }
  - { order: 9,  feature_id: feat-region-capture,           rationale: "Geo DVs and region insights need it",     blocks: "dv-engine geo family" }
  - { order: 10, feature_id: feat-dv-engine,                rationale: "The big one — 9 DV variants on real aggregates", blocks: "insights" }
  - { order: 11, feature_id: feat-personal-insight-layer,   rationale: "Templates on top of aggregates",          blocks: "" }
  - { order: 12, feature_id: feat-discovery,                rationale: "Related/next, categories, search, trending", blocks: "homepage" }
  - { order: 13, feature_id: feat-homepage-curation,        rationale: "Modules once discovery data exists",      blocks: "" }
  - { order: 14, feature_id: feat-reactions-sharing,        rationale: "Like/dislike + share links",              blocks: "og-image" }
  - { order: 15, feature_id: feat-og-image-gen,             rationale: "Share cards + unfurls",                   blocks: "share-landing" }
  - { order: 16, feature_id: feat-share-landing,            rationale: "Inbound share context completes the loop", blocks: "" }
  - { order: 17, feature_id: feat-admin-console,            rationale: "Governance UI last — import/activation runs via pipeline scripts until then", blocks: "" }
deferred: []
```

Test gate per feature: verifier APPROVE required (no small-fix exception);
critical-flow E2Es (core answer loop, discovery, admin lifecycle) green before deploy.

## Consequences

- Stage 3 codegen consumes this order verbatim; deviations need an ADR.
- Admin-console-last means content activation before #17 happens via reviewed
  pipeline scripts — acceptable for a single-operator project.
- Parallel lanes possible after #5: (6-11 core loop) and (12-13 discovery) can
  interleave if the pipeline supports it; sharing chain (14-16) strictly ordered.
