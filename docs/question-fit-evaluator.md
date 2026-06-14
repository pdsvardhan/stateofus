# Question-Fit Evaluator (SOU-QFE v1)

A reusable, independent QC pass for State of Us questions. Run it on **every** batch
before activation. It is deliberately strict: questions are assets, and a bad one
that goes live destroys trust. When genuinely torn, prefer **REVISE** over SPEC.

## How to run
Dispatch a sub-agent (independent context — it must NOT see the author's reasoning,
only the questions). Give it: (a) this file, (b) `question-authoring-standard.md`
(SOU-QAS v1), (c) the candidate batch as JSON, (d) the list of existing active+draft
question texts for duplicate detection. The agent returns the verdict table below.
Do not let the author and evaluator be the same reasoning pass.

## Inputs (per candidate)
`{ id?, category, text, mode, options[], targets?, primary_dv, secondary_dvs[],
   geo, insight_type?, reveal_pattern? }`

## Step 1 — Hard gate (any fail ⇒ REJECT or REVISE, never SPEC)
- text 1–200 chars; experience-based (S2), not a fact-guess
- mode ∈ 8; category ∈ 6; primary_dv ∈ 14; primary_dv ≠ the personal layer
- options ≥2, real & specific, **no** placeholders (`A|B|C|D`, `None`, empty, bare `A`/`B`)
- `bucket_sort`/`tier_placement` carry descriptive `targets` (2–4 labels, **no S/A/B**)
- `tradeoff_cards` has exactly 2 competing options
- `swipe_stack` options are clean card labels — **no** `Cards:`/`Directions:` leakage
- secondary_dvs ≤2, differ from primary, **don't repeat** the primary's information
- `geo=1` only if geography genuinely drives the answer
- DV actually fits the answer shape (Split / Geo / Rank / Distribution per SOU-QAS §6)

## Step 2 — Score 1–10 (justify each in ≤8 words)
participation · result_interestingness · ease · discussion · shareability

## Step 3 — Duplicate / redundancy check
Flag if text is a near-duplicate (same intent/answer space) of an existing question,
or if it merely restates another question in the same batch.

## Step 4 — Verdict
- **SPEC** — average ≥7.0, no axis <5, zero hard-gate fails, not a dup → activate-eligible
- **REVISE** — good idea, fixable defect (give the exact fix)
- **REJECT** — boring / guess-based / no visual payoff / unfixable / duplicate (give the reason)

## Output format (strict)
```
| id | verdict | avg | P | I | E | D | S | flags | fix / reason |
```
Then a one-paragraph batch summary: how many SPEC/REVISE/REJECT, the weakest axis
across the batch, and any systemic issue (e.g. "3 questions share the same answer space").

## Calibration anchors
- SPEC: "Rank these delivery experiences by rage" (vivid, real split, screenshot-worthy)
- REVISE: a strong idea with S/A/B tiers, or a swipe with leaked `Directions:` labels
- REJECT: "What would you keep forever?" with empty options (the stub-draft pattern)
