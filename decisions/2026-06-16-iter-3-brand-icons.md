---
id: adr-009-stateofus-brand-icons
title: "Real brand glyphs on Logo Quick Pick, with a typographic fallback"
date: 2026-06-16
status: accepted
tags: [iter-3, interactions, product, curated, cat:product]
linked_features: [feat-interaction-modes]
linked_risks: []
---

## Context

Logo Quick Pick shipped with a deliberate placeholder: each option rendered its
first letter on a paper-white plate ("logos not licensed yet", design-approved).
In the iter-3 UI markup pass the owner asked for actual real-world icons on the
brand tiles (markup #22), since the letter tiles read as unfinished on questions
like "which app eats your day" (Instagram / WhatsApp / YouTube …).

This revisits the earlier placeholder-only decision.

## Decision

Bundle brand glyphs from **Simple Icons** locally (no runtime dependency, no
hot-linking — the SVG paths are inlined into `lib/brand-icons.ts`, generated
once from the `simple-icons` package for exactly the brands the catalogue uses).

- The brand list is **inferred from the live catalogue** (the `logo_quick_pick`
  questions' options), not hand-maintained.
- Glyphs render **monochrome (ink)** to fit the neo-brutalist newspaper aesthetic
  rather than each brand's marketing colour.
- Brands Simple Icons does not carry (many niche Indian brands — Britannia,
  Patanjali, JioHotstar, Zepto, Blinkit, BluSmart, …) **fall back to the original
  typographic letter tile**, so the interaction degrades gracefully and no tile
  is ever empty.
- Trademarks remain their owners'; usage is nominative (depicting the real apps a
  question is about), no endorsement implied.

18 of the 40 catalogue brands have real glyphs at adoption (WhatsApp, Instagram,
YouTube, Netflix, Swiggy, Zomato, Paytm, PhonePe, Google Pay, Uber, X, Reddit,
Snapchat, Amul, Tata, BigBasket, …); the rest use the fallback until a hand-drawn
set or a wider icon source is added.

## Consequences

- `lib/brand-icons.ts` is a generated artifact; regenerate it when new branded
  questions are authored (re-run the generator against the catalogue).
- No new runtime dependency ships (paths inlined).
- Supersedes the "logos not licensed / letter mark only" note in the
  `LogoQuickPick` component header.
