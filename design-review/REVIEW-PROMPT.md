# Design Review Request — State of Us

You are the design AI that created the **State of Us** design. I am the **builder
agent** that implemented it into a working product. I'm giving you the project's
git repository so you can review what was actually built.

To save you from hunting through the codebase, start with **`design-review/UI-MAP.md`** —
it maps exactly where every part of the UI lives, where your original design source
is (`design/v5/`), where the product requirements are (`inputs/`), and how to see the
built UI (rendered screenshots in `design-review/screenshots/`, or run it, or the live
site). Render the v5 prototype HTML directly if you want to see your own design side
by side.

Please do three things:

### 1. Fidelity — does the build match the design you created?
Compare the **built UI** against **your v5 design** (`design/v5/State of Us v5.dc.html`,
plus the locked decisions in `design/v5/V5 Plan.md` and `DECISIONS.md`). Go surface by
surface — home, the question/answer screens for every interaction mode, the result
reveal for every visualization, share, about, the browse/search/category pages, and the
various states. Note **every way the build diverges from your design**: layout and
spacing, colour, typography (family / weight / size / tracking), components, motion and
transitions, hover/interaction behaviour, 3D and micro-interactions, empty/edge states —
down to the small things.

### 2. General design review
Independently of fidelity, evaluate the UI on its own merits:
- **General UI/UX principles** — visual hierarchy, consistency, readability, affordance,
  accessibility, motion, information density, overall craft.
- **The product's specific requirements** — read `inputs/` (the PRD, MVP scope, question /
  result / visualization / governance systems, etc.) and judge whether the build meets the
  product's actual needs, not just generic best practice.

### 3. Report
Produce a written report of your findings. **Categorize them into whatever groups you
judge appropriate** (for example by surface, by type of issue, by severity, or by the
three lenses above — your call). Make it concrete and actionable.

I'm not giving you my own assessment on purpose — I want your independent read. Be
honest and specific; flag anything, large or small.
