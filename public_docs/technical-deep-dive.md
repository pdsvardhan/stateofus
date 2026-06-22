---
public: true
type: technical-deep-dive
title: The one-question experience loop
order: 2
summary: How a single question becomes interaction → aggregation → visualization → personal insight.
read_minutes: 4
---

# Technical Deep Dive — The Experience Loop

The core subsystem is the **single-question experience page**. Every question flows through the same five stages, but the *rendering* of each stage is chosen per question so results never feel templated even though the pipeline is uniform.

## 1. Interaction
The answer step is a playful, thumb-friendly interaction chosen to fit the question — quick-pick, logo/image pick, trade-off cards, a swipe stack, a sorter, a ranker, or podium slots. Skip is always available; one question = one interaction = one completion.

## 2. Aggregation
Answers are tallied anonymously. Sample size and vote count travel with every result so the reader can judge how much to trust it.

## 3. Visualization
A **primary** visualization renders the aggregate (donut, split cards, verdict bars, treemap, tier board, leaderboard, podium, India choropleth/bubble maps, and more). At most one or two *secondary* views add curiosity — and never simply restate the primary.

## 4. Personal insight (the load-bearing constraint)
Every result carries a **template-driven** personal-insight card — "you matched X%", "your pick is the minority", "your city differs". This layer is **never generative**: it is composed from fixed templates over the aggregate + the reader's own answer, so it is fast, reproducible, and can never hallucinate a claim about the data.

## 5. Reaction → Return
A light reaction step and related-questions rail close the loop and pull the reader to the next question.

| Stage | Examples | Constraint |
|---|---|---|
| Interaction | quick / trade-off / swipe / sorter / rank / slots | skip always allowed |
| Visualization | donut, split, treemap, tier, leaderboard, maps | one primary; secondaries must add, not repeat |
| Personal insight | "you matched 12%", "your city differs" | template-only, never generative |

## Why it matters
The uniform pipeline keeps engineering tractable while the per-question rendering keeps the product feeling alive. The never-generative insight rule is the key trust decision: the reward is always honest.

