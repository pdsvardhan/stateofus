# State of Us v4 → v5 Feedback Log

All items collected here before v5 build. Sources: inline comments, markups, coding-agent review, verbal feedback.
Nothing is actioned until v5 build begins.

---

## From inline comments on v4 (Vardhan, 12 Jun 2026)

### [FB-002] Home · Hero carousel — big background number
**Element:** Hero carousel card — large outlined ghost number (04, 08 etc.) bottom-right corner
**Comment:** "don't need it" — remove the oversized edition number watermark from the hero card background
**Status:** Logged, awaiting v5 build

---

### [FB-001] Home · Subhead copy
**Element:** Home page subhead beneath the H1 "What does India actually think?"
**Current text:** "Answer one question. See the country split open. No accounts, no feeds of strangers — just the public, counted."
**Direction:** Replace with a crafted tagline/manifesto line. Coding agent to supply the actual copy.
**Expectation:** Should capture the spirit of the product — anonymous public opinion, no friction, the surprise of seeing the country split — in a single punchy editorial sentence.
**Constraint:** ⚠ Exactly 1 line (no wrapping into 2 sentences). Short, confident, editorial voice matching the masthead tone.
**Status:** Placeholder — awaiting copy from coding agent

---

## From verbal feedback (earlier sessions — already logged in BACKLOG.md + DECISIONS.md)

| Ref | Area | Note |
|-----|------|------|
| BL-01 | Donut DV | Colours bad (palette rework in v4 partially done — re-check) |
| BL-02 | VS badge | Overlapping right-card text (fixed in v3 grid layout) |
| BL-03 | Result zones | Segregation between count / your position / desk notes (section rules added in v3+) |
| BL-04 | Treemap | Slow flood reveal + gradient colours (done in v4) |
| BL-05 | Treemap | Single-colour ramps hated → gradient ramps done in v4 heat matrix |

---

## From coding agent (pending — to be added after Vardhan's review)

# Coding Agent Review (12 Jun 2026 · against State of Us v4 + DECISIONS/FEATURE-AUDIT/FB-001–020)

Reviewed: full v4 source end-to-end (all screens, 8 interaction modes, 14 DV renderers,
home/question/result/about, frozen/thin states, deep links, drag systems). Cross-referenced
with the build-pipeline spec (17 locked features, 56 acceptance criteria) and the question
catalogue. Locked decisions were not re-debated. Numbering: CA-xxx.

**Overall verdict:** the system is coherent and strong. The newspaper metaphor is carried
consistently (masthead, desks, editions, stamps, "the count"), the personal layer is
genuinely mandatory everywhere, and the locked interaction/DV decisions are implemented
as decided. The items below are mostly tightening, not redirection.

---

## A. Design critique

### [CA-001] System-wide · No reduced-motion path
Every reveal (donut RAF sweep 1.1s, treemap flood 1.5s, cup fills 1.7s, staggered rises)
runs unconditionally. `prefers-reduced-motion` is never consulted. The build pipeline's
coding guidelines hard-require a reduced-motion variant for every DV and interaction.
**Ask of the design system:** define the reduced-motion behavior per animation family
(recommend: fades-in-place at final state, durations ≤200ms, no floods/sweeps/wobbles).
This is a v5 system token, not per-component patchwork.

### [CA-002] System-wide · No keyboard focus states
Components define `style-hover` everywhere but no `:focus-visible` treatment exists.
Tab-navigation through options/buckets/cards is invisible. **Recommend:** a single house
focus treatment (e.g. 3px lime outline + 2px offset, ink outline on lime surfaces) applied
to all interactive elements. One token, system-wide.

### [CA-003] Tokens · Two stray greens + one dead palette
- Verdict/agree green appears as `#2B8A3E` (swipe stamps, "you said" labels) — not in any
  declared palette. The old riso `PAL` also carries `#2F8B5D`.
- `PAL = ['#D8431F','#2E5FB7','#E3A312','#2F8B5D','#8A4FC2']` is declared but unused in v4
  (superseded by `RANKPAL`) — dead tokens.
**Recommend:** bless ONE green as the official "agree/yes" ink (suggest keeping `#2B8A3E`,
it reads well on cream), add it to the palette docs, delete `PAL`.

### [CA-004] Dead code · Circle packing renderer still shipped
`dvPacking` is hardcoded `false` (killed per DECISIONS) but the full render block +
personal-layer copy remain (~60 lines). Remove in v5 — it will confuse the build agent.

### [CA-005] Result · Reaction count formats disagree
After reacting, 👍 shows `(votes*0.14)K` ("1.7K") but 👎 shows `max(40, votes*9)` raw
("112"). Two different scales/formats side by side. Sample data, but v5 should emit both
in the same format (recommend compact K-format for both).

### [CA-006] Hero · Fixed heights will clip long questions
`heroH` is fixed (280px wide / 340px narrow) and hero text renders at fixed 30/23px.
Current carousel questions are short; anything two lines longer clips against the CTA row.
**Recommend:** `min-height` instead of `height` + clamp hero text to 3 lines with ellipsis,
CTA row pinned by flex (already is).

### [CA-007] Winner map · Cream states are ambiguous
States without sample data render `#EFE8D6` — indistinguishable from "lost narrowly".
Add a legend chip: cream = "no clear winner yet" (or "count too small"). One-line fix,
protects trust ("every count shows its sample").

### [CA-008] Sankey · Right labels can clip
Right node labels render at `x=506` in a 600-wide viewBox with no wrapping — option labels
longer than ~12 chars ("Bumrah's yorkers" already tight) will clip on narrow result rails.
Recommend ellipsis + full label in a caption line, or shrink-to-fit.

### [CA-009] Typography · Monospace floor
Several Space Mono labels sit at 8.5–9.5px with wide tracking (donut "top answer", card
meta, legend "you" chips). On a 360px phone this is squint territory and `#6B6478` on
`#F7F1E2` is only ~4.6:1. **Recommend:** floor mono labels at 10px and reserve `#6B6478`
for ≥10.5px; below that use ink.

### [CA-010] Sorter · (supports FB-016/17, no re-debate) one addition
When the redesign lands, also fix: the focused pill currently renders BETWEEN pool and
buckets with negative margin (`margin: 2px 0 -10px`) — at narrow widths it overlaps the
first bucket header. Whatever the new flow is, give the tee-up zone real layout space.

---

## B. Missing or weak features (vs product docs + build spec)

### [CA-020] The 6th desk is missing: Identity / Opinion / Society
The catalogue has 6 categories; the prototype CATS has 5 — Identity/Opinion/Society is
absent entirely (no desk, no color, no questions). The launch content set includes 13
authored questions for it. **Need from design:** 6th desk name + color + chip treatment.
(Color suggestion: a violet/lavender family — the only hue space the palette hasn't used;
e.g. `#8A4FC2` ink-violet for the dot, paler tint for chips.)

### [CA-021] Region capture affordance (geo questions) — not designed anywhere
The spec ships geographic DVs with coarse IP-region + one-tap correction (no accounts).
The prototype's maps are display-only. **Need from design:** a "Counted you in
〈Maharashtra〉 · wrong? fix it" chip pattern — where it sits on geo results, what the
one-tap correction looks like (state picker sheet?), and its quiet/unobtrusive state.
Without it, "your region differs" insights and the bubble map have no honest data story.

### [CA-022] Share card / download artifact — needs actual design (extends FB-014)
FB-014 adds the Download button; what's missing is the design of the thing downloaded:
a social-proportioned result card (suggest 1080×1350 portrait + 1080×1080 square) with
question, primary DV snapshot, sample size, wordmark, and URL. This is the product's
growth engine — worth a dedicated v5 component, not a screenshot of the page.

### [CA-023] Result link previews (OG image) — same family as CA-022
Link copies exist (LINK2 ✓) but no OG/unfurl card is designed. The share card design
should define the link-preview variant too (1200×630 landscape).

### [CA-024] Archived state — frozen exists, archived doesn't
Governance defines Paused / Frozen / Archived as distinct public states. The prototype
has the (great) frozen striped band only. Decide: does Archived get its own quieter
treatment (e.g. sepia/dimmed band, "from the archives" label) or does Frozen's band serve
both? Either answer is fine — it just needs to be decided, not defaulted.

### [CA-025] Already-tracked gaps — confirming, not re-raising
Explore/Search, Onboarding, About-page polish, empty states are correctly tracked in
FEATURE-AUDIT as the surfaces phase. No new asks; just noting the build pipeline blocks
public deploy on search + explore existing (they're MVP-scoped features in the locked spec).

---

## C. Design system gaps (new components/patterns to create)

| # | Component | Used where | Direction |
|---|---|---|---|
| CA-030 | Reduced-motion variants (system token) | every DV + interaction | see CA-001 |
| CA-031 | Focus-visible treatment (system token) | all interactive elements | see CA-002 |
| CA-032 | Region chip + corrector | geo results, first geo question | see CA-021 |
| CA-033 | Share/download card (3 ratios) | result actions, OG unfurls | see CA-022/023 |
| CA-034 | 6th desk identity | chips, desk hero, question/result chrome | see CA-020 |
| CA-035 | Archived band | result screen for archived questions | see CA-024 |
| CA-036 | Standard toast | link copy (exists), download done, region corrected | generalize the LINK2 toast into the house feedback pattern |
| CA-037 | Search surface (surfaces phase) | masthead entry | flagging early: results list should reuse feed cards (same instinct as FB-010) |

---

## D. Assigned deliverables (FB items owned by the coding agent)

### [FB-001] Tagline — exactly one line
**Recommended:** **"You answer. India answers back."**
Alternates if the room disagrees:
- "No names, no noise — just India, counted."
- "One tap from you. One picture of the country."
Rationale: present tense, second person, captures the contribution→reward loop, keeps the
"counted" brand equity from the footer line, and survives at any width on one line.

### [FB-003] Desk names (map 1:1 to catalogue, 6 desks)
| key | Current | **Proposed** | Alternate |
|---|---|---|---|
| city | City & Place | **The City Desk** | Streets & Signals |
| daily | Daily Life | **The Daily Grind** | House & Habit |
| culture | Entertainment | **The Culture Desk** | Screens & Stages |
| brand | Brands | **The Bazaar** | The Counter |
| fun | Internet Chaos | **The Chaos Bureau** | (keep Internet Chaos) |
| society (NEW) | — | **The Mirror** | Us, Honestly |
Notes: all read as newspaper desks, all ≤16 chars (chip-safe), "All desks" chip still works
("All Desks → every desk"). If "The Bazaar" feels too cute for brand questions, The Counter
is the sober alternate.

### [FB-006] Hero carousel content
Keep the label **"The big question"** (it earns its place). Curate heroes for mode + DV
variety and shareability — recommended set:
1. q110 breakfast map (quick pick → winner map; the most India-coded result in the build)
2. q605 potato podium (chaos + podium)
3. q603 internet-vs-phone (trade-off → split; highest tension)
4. q103 public behaviour court (swipe → verdict bars; replaces q101 which is worthy but
   utilitarian — it lives happily in Quick Picks)
Hero chips adopt the FB-003 desk names. Carousel interval per FB-005: 9s, progress bar
animation matched to 9s.

### [FB-008] Feed rows — desktop pattern
**Recommend "peek-and-page":** keep horizontal rows (the desk metaphor wants rows), add
arrow buttons at row ends that advance one full page (3 cards) with a spring, last card
peeks ~15% as the scroll affordance, scrollbar hidden. Mobile: native touch pan-x +
momentum, no scrollbar. Rejected alternates: masonry grid (breaks desk-by-desk scanning,
floods the fold), "show more" expanders (kills the newspaper rhythm).

### House rules card (home right rail) — currently a literal `<PLACEHOLDER>`
Not logged in any FB; needs copy. Draft for v5 (edit freely):
> 01 · Answer first — the result is the reward.
> 02 · No accounts. No names. Ever.
> 03 · Skip anything, judgment-free.
> 04 · Every count shows its sample size.
> 05 · Questions retire. Results stay.

---

## E. Questions for Vardhan (genuinely stuck / decisions needed)

1. **Dark mode.** The build pipeline's house rule mandates dark + light themes; the v4
   design is deliberately a light newspaper. Options: (a) ship light-only for MVP with a
   recorded exception, design a "Night Edition" later; (b) commission Night Edition in v5
   now. My recommendation: (a) — the paper metaphor IS the brand; a rushed dark mode would
   dilute it. Need your call to record it.
2. **Logo asset.** The wordmark (navy STATE/US, coral OF) only exists as a chat image. Drop
   the actual file (SVG strongly preferred, else highest-res PNG) into the design folder or
   project repo. Alternative: I recreate it in-system (Archivo 900 wordmark, "OF" in fire
   `#FF5A47` matching house inks) — visually equivalent, scalable, and theme-able. Which?
3. **6th desk.** Confirm Identity/Opinion/Society ships as a desk in v5 (CA-020) — content
   exists (13 authered questions) — or is parked for launch.
4. **Prototype questions vs catalogue.** Confirm the 17 prototype questions are demo data
   and launch content comes from the curated catalogue (25 ready + 80 authored = 105). The
   prototype's questions are good — recommend merging the best of them into the catalogue
   rather than discarding.

---
_End of Coding Agent Review · pipeline-side actions (rename to State of Us across tracker/repo, logo integration plan) are handled in the build pipeline, not in v5 scope._

---

### [FB-020] Question screen · Podium Slots — visual clarity + UX
**Element:** Podium Slots interaction — "Tap a snack ↓" placeholder slots + podium columns
**Comment:** "Like the concept but it's not clear. Need to reformat — don't like: the colour scheme, the number font, what 'tap a snack' does isn't clear"
**Action for v5:**
- **Colour scheme:** Rethink podium column colours (currently gold/silver/bronze tones but clashing with site palette). Use site palette consistently — e.g. #FF5A47 for 1st, ink tones for 2nd/3rd
- **Number font:** The rank number (1, 2, 3) is too plain/small — make it a bold editorial statement, not just a number
- **"Tap a snack ↓" placeholder:** Replace with a clearer empty-state — e.g. a dashed outline slot with "1st place" label and a hint like "tap any option below to place it here". The interaction flow (tap option → it fills a slot) needs to be self-evident
- **Option chips below:** Should visually signal they're tappable/selectable, and once placed they should grey out in the pool with a clear "placed" state
- **Overall:** The podium slots should feel like a game mechanic — satisfying to fill, clear what's empty vs filled
**Status:** Logged, awaiting v5 build

---

### [FB-019] Question screen · Rank Order — drag to reorder
**Element:** Rank Order question — currently only ↑/↓ arrow buttons to reorder
**Comment:** "Should be able to drag options with mouse or touch on screen"
**Action for v5:** Add full drag-to-reorder on the rank rows — pointer events (mouse + touch). Use FLIP animation so rows slide smoothly into their new positions. The ↑/↓ buttons stay as a fallback for accessibility/precision, but drag becomes the primary interaction. Drag handle icon on the left of each row to signal draggability.
**Status:** Logged, awaiting v5 build

---

### [FB-018] Question screen · Rank Order — ↑↓ button edge states
**Element:** Rank Order question — ↑ and ↓ nudge buttons on each row
**Comment:** "If it can't go up any more, hide/disable the ↑ button smoothly. Same for ↓ at the bottom. Choose hide or disable — whichever looks better."
**Action for v5:** 
- Top item: hide or smoothly fade out the ↑ button (opacity transition, not a hard disappear)
- Bottom item: hide or smoothly fade out the ↓ button
- Recommended: fade to opacity 0 + pointer-events none (stays in layout so rows don't jump) rather than display:none (avoids layout shift)
- Consistent with the "smooth transition" philosophy of the rank row sliding animation
**Status:** Logged, awaiting v5 build

---

### [FB-016 + FB-017] Question screen · Sorter — focused item pill UX + entire selection flow
**Element:** Sorter (tier/bucket) question — focused item pill e.g. "Phantom traffic jams ▼" / "Netflix ▼"
**Comment (FB-016):** "Looks out of place, overlaps the UI below, doesn't give any indication it should be dragged to the buckets"
**Comment (FB-017):** "Same thing — it's a huge bug, need to handle nicely. Not just fixing this element but understanding the entire flow: how users select something, when selected how to visually separate it from the group, etc."
**Action for v5 — rethink the entire sorter interaction flow:**
- **Selection state:** When an item is "up next" / focused, it must be visually unmistakable as the current item — clear separation from the unselected pool, not just a dark background chip floating awkwardly
- **Pool → focused → bucket:** The three states (in pool / selected/focused / filed in bucket) need distinct, unambiguous visual treatments
- **Drag affordance:** Drag-handle icon, grab cursor, subtle float animation to signal draggability
- **Spacing:** Focused pill must NOT overlap bucket targets — dedicated tee-up zone with clear whitespace
- **Tap-to-file:** Tapping a bucket when an item is focused should feel satisfying and obvious — animate the item flying into the bucket
- **Consider:** Whether the "teed-up" item should appear INSIDE the bucket zone as a ghost/preview on hover, to clarify the interaction model
- Consider a complete redesign of the sorter interaction — this is the most complex mode and currently the weakest UX
**Status:** High priority — logged, full redesign needed in v5

---

### [FB-015] Result screen · Desk notes — background colour + visual differentiation
**Element:** Result screen — "Desk note 01" and "Desk note 02" insight cards
**Comment:** "Don't like the background colour — the box beside it also doesn't look good. Desk note 1 and 2 look the same — aesthetically need at least a tiny difference between them."
**Action for v5:**
- Rethink the background colour of desk note cards (currently #F7F1E2 cream — too close to page bg, feels flat)
- The two notes should have *subtle* visual differentiation — e.g. slightly different background tint, a coloured left border accent, alternating label colour, or numbered medallion in different ink. Not dramatic — just enough to read as distinct items.
- The "From the desk" section rule + the cards together should feel like a newspaper sidebar, not just two identical boxes
**Status:** Logged, awaiting v5 build

---

### [FB-014] Result screen · Action buttons — Share + Download
**Element:** Result screen action buttons — currently one "Share" button
**Comment:** "Two buttons: Share (copies question link) and Download (downloads the final infographic as JPEG or PNG)"
**Action for v5:**
- **Share button:** copies the question URL to clipboard (current behaviour, keep)
- **Download button:** NEW — exports the result card (the DV + personal layer + question text) as a JPEG/PNG infographic. Should use html-to-image or canvas capture of the result card only (not the full page). Quality should be share-worthy — Instagram/WhatsApp card proportions preferred.
- Both buttons should sit side by side in the actions row
**Status:** Logged, awaiting v5 build — Download is a new feature

---

### [FB-013] Question screen · Back button ("← THE FEED ESC") — visual distinction
**Element:** Question screen — "← The feed ESC" back button
**Comment:** "Background colour same as the options — doesn't distinguish well. Did we run out of colours?"
**Action for v5:** Give the back button a clearly distinct treatment from the answer option buttons. Options: use a different background (e.g. cream #F2ECDF with ink border, or a desaturated tone), smaller/lighter weight, or position it more visually separated from the interaction zone. It should feel like navigation chrome, not a selectable option.
**Status:** Logged, awaiting v5 build

---

### [FB-012] Footer · Reset button & sample data banner
**Element:** Footer — "⟲ Reset my answers (testing)" button + "PROTOTYPE WITH SAMPLE DATA" label
**Comment:** "Only for testing phase — once done should be closed/removed"
**Action for v5:** These are dev/testing affordances only. In v5 (and certainly in production handoff) hide or remove: the reset button, the "Sample data" dashed badge on result screens, and the "PROTOTYPE WITH SAMPLE DATA" footer text. Could be controlled by a `DEV_MODE` flag in the code so they're easy to toggle off.
**Status:** Logged, awaiting v5 build

---

### [FB-011] Question screen · Category chip — visibility
**Element:** Question screen top-right — category chip e.g. "CITY & PLACE"
**Comment:** "Not visible" — the chip is hard to see / low contrast
**Action for v5:** Increase contrast on the category chip on the question screen. Currently uses category colour as background (e.g. #FF5A47 for city) — may be washing out against the page. Options: add a solid border, darken text, or switch to ink-on-colour treatment consistently. Ensure it's always legible regardless of category colour.
**Status:** Logged, awaiting v5 build

---

### [FB-010] Result · Related questions chips — presentation
**Element:** Result screen — "+ What is the scientifically superior shape for a potato?" related question chips at the bottom of the result rail
**Comment:** "Very bad way to show — why can't we just use the same cards we built for the homepage?"
**Action for v5:** Replace the plain text chips with proper mini feed cards (same component/style as homepage feed cards — category dot, question text, mode label, vote count, → arrow). Keep them compact but recognisable as the same design system.
**Status:** Logged, awaiting v5 build

---

### [FB-009] Feed · "Results are out" row — DV variety on cards
**Element:** "Results are out" section — Type 2 result cards showing mini-previews
**Comment:** "Most results look the same — all just bar graphs / horizontal stuff. We finalised a lot of cool DVs, need better variety."
**Action for v5:**
- The teaser/result card previews on the feed should reflect the *actual* DV type of each question — not all bar graphs
- E.g. a podium question should preview a mini podium silhouette; a treemap question should show blurred treemap blocks; a sankey should tease a flow; a map question should ghost-show the India outline
- Tie the card preview thumbnail to the question's assigned DV family
- This also means the "Vote to unlock" teaser blur should vary per DV type, not always be 3 horizontal bars
**Status:** Logged, awaiting v5 build

---

### [FB-008] Feed · Section row scroll behaviour
**Element:** Netflix-style horizontal scrolling feed rows
**Comment:** "Horizontal scroll is old school — need swiping on phone; for desktop/laptop think of better solutions"
**Action for v5:** 
- **Mobile:** Replace scrollbar-based scroll with proper touch swipe (touch-action: pan-x, momentum scrolling, hide scrollbar visually)
- **Desktop/laptop:** Consider alternatives — e.g. left/right arrow buttons at row ends (peek + advance), or a masonry/grid layout that shows all cards without horizontal scroll, or a "show more" expand. Coding agent to suggest the best pattern given the card widths and content density.
**Status:** Logged — needs design decision for desktop pattern before v5 build

---

### [FB-007] Feed cards · Mode label chip ("SWIPE STACK" etc.)
**Element:** Feed card top-right mode label — e.g. "SWIPE STACK", "QUICK PICK", "TIER PLACEMENT"
**Comment:** "Looks too plain — can highlight it, not too much"
**Action for v5:** Give the mode label chip slightly more presence — e.g. subtle background fill (category colour at low opacity, or a pale yellow), slightly bolder border, or a small icon prefix. Should feel like a newspaper tag/sticker, not just an outline chip. Keep it secondary to the question text.
**Status:** Logged, awaiting v5 build

---

### [FB-006] Home · Hero carousel — question content & copy
**Element:** Hero carousel card — labels ("THE BIG QUESTION"), category name ("INTERNET CHAOS"), question text, and supporting metadata
**Comment:** All carousel content (question selection, labels, copy) should be revisited by the coding/content agent — not just the category names but the full editorial framing per card.
**Action for v5:** Add a `// TODO: hero carousel content — see V5 Feedback.md FB-006` comment in the Q array near the carousel:true questions. Coding agent to review: which questions should be hero, what the "The big question" label should be called, and whether the category chip inside the hero card should use revised desk names (ties to FB-003).
**Status:** Placeholder — awaiting content review from coding agent

---

### [FB-005] Home · Hero carousel — auto-rotation speed
**Element:** Hero carousel — auto-advance interval (currently 5 seconds)
**Comment:** "Moving too fast — slow down"
**Action for v5:** Increase carousel interval. Suggested: 8–10s. Also consider slowing the progress-bar animation to match.
**Status:** Logged, awaiting v5 build

---

### [FB-004] Home · Trending rail — row icons
**Element:** Trending rail ("Heating up · live") — per-row emoji icons (⚡ 📈 👀 etc.)
**Comment:** Sub-icons (rows 2–4) should NOT use coloured/animated emojis — use a single neutral monochrome icon style for all of them. Only the 🔥 header flame gets its colour + animation treatment.
**Action for v5:** Replace ⚡ 📈 👀 (and any future row icons) with a single consistent monochrome style (e.g. all rendered as a small ink-coloured SVG or a plain text glyph at fixed size/colour). Fire stays as-is.
**Status:** Logged, awaiting v5 build

---

### [FB-003] Home · Category chip labels
**Element:** Category filter chips — "All Desks / City & Place / Daily Life / Entertainment / Brands / Internet Chaos"
**Comment:** Names should be revisited — may not be the final editorial desk names.
**Owner:** AI coding agent to propose revised names.
**Constraint:** Should feel like newspaper desk names — editorial, specific, interesting. Not generic. Should map 1-to-1 with the question catalogue categories.
**Action for v5:** Add a `// TODO: category names — see V5 Feedback.md FB-003` comment in the CATS array in the logic class so the coding agent finds it immediately. Also include the current names and catalogue mapping as context.
**Status:** Placeholder — awaiting naming from coding agent

---

## Other open items to carry into v5

- Map colours still need full brand-ink sweep on winner + bubble modes
- Fire emoji used twice in trending (🔥 header + row 1 both red — minor)
- Fine-tuning / layout polish pass (deferred to end)
- Explore, Search, Share image export, Onboarding surfaces (surfaces phase — next after v5 fixes)

---
_Last updated: 12 Jun 2026_
