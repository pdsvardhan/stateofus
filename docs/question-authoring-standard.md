# Question Authoring Standard (SOU-QAS v1)

**State of Us — the single source of truth for seeding questions.**
Consolidates DOC 2 (Question System), DOC 3 (Question Standards), the codified
`questionInsertSchema` gate, the canonical enums, and the locked product rails
into one checklist a human or an AI agent can follow every time.

> Authority order if anything here disagrees with code: **live API behavior >
> `lib/catalogue/enums.ts` + `normalize.ts` > this doc.** Update this doc when the
> code moves; never let it drift silently.

---

## 0. The one-line bar
> **A good question is one a thumb wants to answer in 5 seconds, that produces a
> result worth screenshotting, and that reveals something rather than confirms it.**

Questions are **assets**. A bad question destroys trust. When in doubt, reject.

---

## 1. Quality principles (DOC 3 — the editorial bar)

| ID | Principle | What it means when authoring |
|----|-----------|------------------------------|
| S1 | Participation-first | The user must *want* to answer. If it feels like homework, kill it. |
| S2 | Experience-first | Ask about what people **used / visited / experienced** — never ask them to *guess* facts. |
| S3 | Result-worthiness | Only ask if the aggregate result can become *interesting* (a split, a surprise, a fight). |
| S4 | Low-effort | 1–2 lines, **one** interaction, mobile-thumb friendly. Hard cap: **200 chars** of question text. |
| S5 | Skip always allowed | Never force. `skip_allowed` is always `1`. Don't write "you must" framing. |
| S6 | Visualization-awareness | Know the **primary DV before launch**. If no DV fits the answer shape, the question isn't ready. |
| S7 | Discovery > Validation | Reveal, don't confirm. Avoid questions whose answer everyone already knows. |
| S8 | Transparency | Votes + sample size are always visible. Don't imply false precision. |
| S9 | Bias-tolerance | Assume imperfect answers; design to *reduce* impact, not pretend it's eliminated. |

**Auto-reject (DOC 3):** boring · too technical · requires expertise · needs a long
explanation · **no visual payoff**.

**Builder challenge (run on every question):** Can the question be *shorter*? Can the
result be *better*? Can the interaction be *simpler*? Challenge everything.

---

## 2. Product rails (locked — non-negotiable)

**Must-haves:** one question = one interaction = one completion · personal insight
layer on **every** result (template-driven, **never** generative) · sample size + vote
count visible · anonymous participation · result must *reward* (no empty charts, no fake
precision).

**Avoid:** engagement farming / XP / streaks · infinite algorithmic feeds · **forcing
maps where geography doesn't matter** · **secondary DVs that repeat the primary's
information** · **S/A/B tier labels — use descriptive labels** · analytics rabbit holes
(max 2–3 exploration layers) · personalized share exports.

**Voice (from the live, approved set):** witty, concrete, India-flavored, present-tense,
second-person. Prefer specifics ("the 'attempted delivery' lie", "snooze x3", "honking")
over abstractions. Mild edge is good; cruelty/politics-bait is not.

---

## 3. The hard gate (`questionInsertSchema` — the DB will reject otherwise)

| Field | Rule |
|-------|------|
| `id` | Auto for manual (`NEW-n`); imports match `C1-21` / `Q-203` / `NEW-7`. |
| `category` | Exactly one of the **6** (§4). |
| `text` | **1–200 chars.** |
| `mode` | Exactly one of the **8** (§5). |
| `options` | **≥2**, each `{key, label}`, `label` non-empty. Keys `opt-0, opt-1, …`. |
| `targets` | Required for `bucket_sort` / `tier_placement`: `{kind:"buckets"\|"tiers", labels:[≥2]}`. |
| `skip_allowed` | Always `1`. |
| `primary_dv` | Exactly one of the **14** (§6). Never `Insight Cards` (that's the personal layer, not a DV). |
| `secondary_dvs` | **≤2**, must differ from primary, must **not** repeat the primary's information. |
| `geo` | `1` **only** when a map DV (`map`/`bubblemap`) is used and geography genuinely matters. |
| `reveal_pattern` | `immediate` \| `threshold` (default) \| `progressive`. |
| `status` | New rows are `draft`. `draft→active` **requires `approved_by`** (governance). |

**Forbidden content:** placeholder options (`A\|B\|C\|D`, `None`, empty) · generic
recycled titles ("Experience Question 1") · `Cards:` / `Directions:` text leaking into
option labels (swipe hygiene — see §5).

---

## 4. Categories → editorial desks (the 6)

| Category | Desk | Colour | Seeds about… |
|----------|------|--------|--------------|
| City and Place Experience | The City Desk | fire | commute, neighbourhoods, city life, places |
| Daily Life and Livability | The Daily Grind | blue | routines, chores, money, energy, adulting |
| Entertainment and Culture | The Culture Desk | pink | film/TV/music, going out, fandom |
| Consumption and Brand Experience | The Bazaar | gold | shopping, delivery, brands, value-for-money |
| Identity Opinion and Society | The Mirror | lavender | self, relationships, social norms, opinions |
| Fun and Internet Chaos | The Chaos Bureau | lime | memes, hot takes, internet absurdity, "would you" |

---

## 5. Interaction modes (the 8) + option recipe

| Mode | Token | When to use | Options recipe | Natural DVs |
|------|-------|-------------|----------------|-------------|
| Quick Pick | `quick_pick` | Fast single decision, high volume | 2–6 plain choices | split, radial, liquid, map |
| Logo Quick Pick | `logo_quick_pick` | Brand/logo trust pick | 2–6 brand choices | split, radial |
| Trade-off Cards | `tradeoff_cards` | Force a signal between competing values | **exactly 2** competing options | radial, split, liquid |
| Swipe Stack | `swipe_stack` | Fast exploration, verdict per card | 4–6 **cards**; verdict = yes/no labels | board, treemap, heatmatrix |
| Bucket Sort | `bucket_sort` | Group items by an experience axis | items + `targets.buckets` (2–4 **descriptive** labels) | treemap, tier, sankey |
| Tier Placement | `tier_placement` | Structured preference into tiers | items + `targets.tiers` (3–4 **descriptive** labels — never S/A/B) | tier, board, heatmatrix |
| Rank Order | `rank_order` | Strict ordering | 4–6 items to order | board, podium, medal |
| Podium Slots | `podium_slots` | Pick your top 3 | 5–8 candidates, choose 3 | podium, medal, board |

**Swipe hygiene (do NOT repeat the import bug):** options are *clean card labels only*
(e.g. `Sholay`, `The Godfather`). The yes/no verdict words go in the swipe-label fields,
**never** inside option labels. No `"Cards: …"` prefix, no `"— Directions: X / Y"` suffix.

**Descriptive bucket/tier labels** (rail): use `Daily / Sometimes / Fantasy`,
`Dealbreaker / Nice to have / Don't care`, `Worth it / Regret / Still in the box` —
not `S / A / B / C`.

---

## 6. Visualization (DV) families (the 14)

Pick the **primary DV by the answer's shape**, then (optionally) ≤2 secondaries that add a
*different* cut (geography, distribution) — never a restated primary.

| Family | DVs | Answer shape it fits |
|--------|-----|----------------------|
| Split | `split`, `radial`(donut), `liquid`, `cups`, `coins` | 2–6 way share / one clear split |
| Geo | `map`(winner fill), `bubblemap` | answer varies by region (set `geo=1`) |
| Rank | `tier`, `board`(leaderboard), `podium`, `medal` | ordered / tiered preference |
| Distribution | `treemap`, `heatmatrix`, `sankey` | many items, proportions, flows |

`Insight Cards` is **not** a DV — it is the mandatory personal layer (§7).

---

## 7. Personal insight layer (mandatory, automatic)

Every answered result gets ≤3 insights from a **deterministic, no-LLM** template registry
(`region-differs` · `you-matched` · `you-differ` · `majority` · `minority` · `counted`).
You don't author these — but you **enable good ones** by:
- giving questions a **real split** (so majority/minority fire),
- setting `geo=1` on genuinely regional questions (so `region-differs` can fire; needs
  ≥5 state sample),
- choosing an `insight_type` hint that matches the question's payoff.

---

## 8. Lifecycle

`draft → active → (paused ⇄ active) → frozen → archived`.
- New = `draft`. Only `active` accepts answers; everything except `draft` shows results.
- `draft→active` needs `approved_by` (recorded review).
- `paused` is **reversible** (use it to take a question down). `archived` is **terminal** —
  never archive without explicit human sign-off.

---

## 9. Scoring rubric (1–10 each; gate at the bottom)

Score every candidate on the five axes the catalogue already tracks:

1. **Participation** — will a thumb actually tap this?
2. **Result interestingness** — is the aggregate worth seeing?
3. **Ease** — understandable in one read, zero expertise?
4. **Discussion potential** — would people argue/compare?
5. **Shareability** — would someone screenshot the result?

**Gate:** average **≥7.0** AND no single axis **<5** AND zero hard-gate violations AND not
a near-duplicate of an existing question → **SPEC (activate-eligible)**. Otherwise
**REVISE** (fixable) or **REJECT** (kill).

---

## 10. Seeding workflow

**Create (always lands as `draft`):**
```
POST /api/admin/questions   (admin cookie = sha256(ADMIN_TOKEN))
{ category, text, mode, options:[{key,label}…], targets?, primary_dv,
  secondary_dvs?, insight_type?, geo?, reveal_pattern?, subcategory?, notes? }
```
**Run the evaluator** (`question-fit-evaluator.md`) over the batch → SPEC / REVISE / REJECT.

**Activate clean passers:**
```
POST /api/admin/questions/{id}/transition
{ "to": "active", "approved_by": "<reviewer>", "reason": "QC SPEC pass" }
```
**Take one down (reversible):** transition `to:"paused"` with a reason.

---

## 11. Pre-flight checklist (paste-and-tick per question)

- [ ] Experience-based, not a guess (S2)
- [ ] ≤200 chars, 1–2 lines, one interaction (S4)
- [ ] Options are real, specific, ≥2, no placeholders
- [ ] `bucket_sort`/`tier_placement` have descriptive `targets` (no S/A/B)
- [ ] `swipe_stack` labels are clean cards (no `Cards:`/`Directions:` leakage)
- [ ] primary DV fits the answer shape; secondaries add a *different* cut; no repeat
- [ ] `geo=1` only if geography truly matters
- [ ] Result will produce a real split (S3) → insight layer can fire
- [ ] Not a near-duplicate of an existing question
- [ ] Rubric average ≥7, no axis <5
