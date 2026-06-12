# ComWatch — Logged requests (not yet built)

## 1. Quick Pick option hover interactions (logged 2026-06-11)
Request: "Any on-hover interactions possible — will make it look cooler? Give 2–3 variants."
Element: Quick Pick answer buttons (A/B/C/D list on Question screen).
Plan when picked up: build 2–3 hover variants to choose from, e.g.
- V1 "Ink press": option fills with its category color from the left edge on hover, letter badge flips dark.
- V2 "Ballot lean": card tilts ~1deg, letter badge rotates like a stamp, soft offset shadow grows.
- V3 "Tally tease": tiny anonymous tally marks / dotted bar slides in on the right edge on hover, hinting at the result behind the answer.
(Will also apply chosen variant to trade-off + sorter buckets for consistency.)

## 2. Data-viz palette still not right (logged 2026-06-11)
Request: "Colours bad" — on the radial result legend bars (and by extension the donut/treemap palette).
Context: already swapped candy tones → riso inks (#D8431F, #2E5FB7, #E3A312, #2F8B5D, #8A4FC2); user still unhappy.
Plan when picked up: present 3–4 palette swatch options side-by-side ON the actual donut+legend (not abstract chips), e.g.
- A. Monochrome ink: shades of one ink (#18162A scale) + single red accent for the winner/you.
- B. Warm press: tomato / terracotta / ochre / sand — all warm, no blue-green clash.
- C. Two-ink riso: red + blue only, alternating tints (classic risograph).
- D. Brand-only: derive everything from masthead colors (red/lime/yellow + ink tints).
User picks on sight.

## 1b. (More detail on #1) Quick Pick hover — "3D pop" direction (logged 2026-06-11)
Request: "More happening on hover, 3D pop out or something — not too crazy, but good on eye."
→ When building #1's variants, bias toward tactile/3D: lift + scale with deepening offset shadow ("card pops off the press"), letter badge pushing in like a key, maybe a 1–2deg perspective tilt toward cursor. Keep it subtle.

## 3. Trade-off "VS" badge overlaps right card text (logged 2026-06-11)
Bug: the centered VS pill sits on top of the right card's option text (esp. on narrower widths / longer copy).
Fix when picked up: reserve a gutter between the two cards (e.g. grid `1fr auto 1fr` with VS in the middle track), or add inner padding on card edges facing center; on mobile (stacked cards) place VS between them vertically.

## 4. Result screen: weak visual segregation between zones (logged 2026-06-11)
Request: the main result (DV) vs Desk Notes vs "Where you landed" blend together — need clearer separation of the three zones.
Ideas when picked up: labeled section rules (thin newspaper-style section headers like "THE COUNT", "YOUR POSITION", "FROM THE DESK"), or distinct band backgrounds per zone, or heavier divider + spacing rhythm. Keep one option per zone group, show 2 treatments to pick from.

## 5. Treemap rework: colors + slow reveal (logged 2026-06-11)
Request: "I hate this" — treemap blocks (streaming-services result). Two asks:
(a) better fill/bg colors (ties into palette rework #2),
(b) slow 2–3s reveal animation — blocks should FILL gradually like a reveal, not pop in. Ideas: blocks sweep-fill from 0 area to final size in sequence (biggest last for drama), or color floods each block left→right slowly, count-up %s in sync.

<!-- Append future logged requests below -->
