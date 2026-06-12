# V5 Lab Feedback — round 2 (labs A & B)

Comments collected from Vardhan on the two lab pages. NOT implemented yet — batch-process all at once when he says done.

---

## LAB B VERDICTS (collected from live page — FINAL, overrides my interim picks)
N1 ✕ · **N2 ✓ (desk notes winner — highlighter pass)** · N3 ✕
**D1 ✓ D2 ✓ D3 ✓ (all download cards kept — style picker, D2 default)**
AR1 ✕ · **AR2 ✓ (archived winner — grey ink stripes)**
RG1 ✕ · **RG2 ✓ (region winner — press-pass card in rail)**
M1 ✕ · **M2 ✓ (mode label winner — lime index tab)** · M3 ✕
BK1 ✕ · **BK2 ✓ (back button winner — ink block + LAB-004/005 refinements)**
**MR1 ✓ MR2 ✓ (both liked — going MR1 lavender #B79CE4)**

## LAB B VERDICT (12 Jun, from Vardhan directly)
**"I like ALL of Lab B. Trusting you to pick/blend for v5 — no more selection rounds."**
Implication: I choose final treatments knowing his taste. My picks for v5:
- Desk notes → N3 pinned clippings (most editorial) with N2's highlighted-phrase trick inside the copy
- Download card → all 3 styles kept as a picker in the share sheet (D2 front-page as default); FB-014 Share+Download buttons
- Archived → AR1 sepia plate (most distinct from Frozen's violet stripes)
- Region chip → RG1 byline chip under every geo DV (RG2 press-pass dies — too heavy for MVP)
- Mode label → M1 tinted sticker ("highlight, not too much")
- Back button → BK2 ink block, REFINED per comments (LAB-004): arrow prominent + "Back" text INSIDE the block + arrow animates (nudge loop / stronger slide on hover). NO side text, NO visible ESC keycap (LAB-005) — ESC still works as a silent shortcut
- Mirror desk → MR1 lavender #B79CE4 (teal sits too close to lime in the chip row)

## V5 CONTENT RULE (from Vardhan, critical)
**Every question type AND every DV/result asset we finalized needs ≥2 examples in v5** — stub data fine — so the coding agent has reference implementations for all of them. Multi-DV switchers count: each DV family must appear at least twice somewhere.

---

### [LAB-001] Lab A · S1 sorter — bucket buttons look
**Element:** S1 "The tee-up tray" — the three bucket targets (Keep / Share acct / Cancel)
**Comment:** "I don't like the way it looks. S3's Keep / Share acct / Cancel cards look better."
**Read:** The S3 variant's bucket treatment (solid colour-filled card buttons, bold, chunky) is preferred over S1's white-bodied buckets with coloured header strips. Whatever sorter variant wins, use S3-style solid colour bucket cards for the targets.
**Status:** Logged

---

### [LAB-002] All sorting modes · Forced completion before submit — UX policy
**Element:** Lab A sorter pool (Netflix / Prime Video / YouTube Premium / Spotify / JioHotstar) — but applies platform-wide
**Comment:** "Should users have to rank ALL items before they can submit? That's not user friendly. What else is like this, forcing them to do all, instead of just submit whenever they're done?"
**Read:** Audit every mode that currently forces 100% completion and add an early-submit path. Current forced-completion modes:
- **Bucket Sort / Tier Placement (sorter):** auto-submits only when every item is filed → add a "Count what I've sorted" button that activates after N≥1 (or N≥2?) items are filed; unplaced items recorded as "skipped"
- **Swipe Stack:** result only after ALL cards swiped → allow "enough — show me the count" after min 1-2 cards (remaining cards = skipped)
- **Podium Slots:** needs all 3 slots filled → could allow submit with just 1st place filled (2nd/3rd optional)
- **Rank Order:** has explicit "Lock my order" — fine as-is, but starting order counts as valid answer so it's effectively zero-effort already
- **Quick Pick / Trade-off:** single tap, no issue
**Design question for v5:** partial answers affect result integrity (% based on who placed that item) — show "x% of sorters placed this" caveat, or count partials only into items they touched. Lean: count per-item, never block.
**Status:** Logged — needs interaction design in v5 build

---

### [LAB-003] Lab A · Feed rows — winner direction (pending one clarification)
**Element:** A card inside one of the feed-row variants (culture-desk music card)
**Comment:** "F1 cards are better looking than this, but overall component this is better."
**Read:** The card STYLING from F1 (wider 250px card proportions) should be kept, but the clicked component's MECHANISM is the preferred one. Ambiguous which was clicked: F2 (front-page grid + "open desk" tile) or F3 (deck of cards) — both show the culture card third. AWAITING CONFIRMATION from Vardhan.
**Status:** Logged — confirm F2 vs F3

---

## LAB A VERDICTS (collected from live page, 12 Jun)

| Variant | Verdict |
|---|---|
| S1 · Tee-up tray | ⚠ NEEDS CHANGE |
| S2 · Pick, then place | ✕ DISLIKE |
| S3 · One at a time | ⚠ NEEDS CHANGE |
| P1 · Editorial steps | ✓ LIKE |
| P2 · Ballot rows | ✓ LIKE |
| P3 · Fill the front page | ✕ DISLIKE |
| F1 · Peek & page | ✓ LIKE |
| F2 · Front page grid | ✕ DISLIKE |
| F3 · Deck of cards | ✓ LIKE |

**Working interpretation:**
- **Sorter:** no clean winner — S1 and S3 both "needs change", S2 out. Known changes: S3's solid-colour bucket cards everywhere (LAB-001), early submit (LAB-002). Likely v5 answer = S1 structure with S3's bucket styling + early submit; confirm with Vardhan what else needs changing.
- **Podium slots:** P1 + P2 both liked → keep BOTH (multi-variant philosophy); P3 dead.
- **Feed rows:** F1 + F3 both liked, F2 dead. LAB-003's "this component is better" was therefore about F3 (deck) — F1 cards better-looking + F3 better component. Plausible: F1 = default row pattern, F3 = a special "deal me one" feature row. Confirm split with Vardhan.

