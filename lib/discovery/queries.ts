/**
 * Discovery queries — feat-discovery + feat-homepage-curation.
 *
 * All reads; aggregates come from question_aggregates (never answers scans).
 * Editorial picks contract (AC356): app_meta key "editorial_picks" holds a
 * JSON array of question ids, managed by the admin console (feature #17,
 * POST /api/admin/questions/:id/feature). Empty/missing → top-shareability
 * fallback so the homepage never renders an empty lead module.
 */
import { rawDb } from "@/lib/db/client";
import { CATEGORIES, DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";

/** Result preview shown on a feed card (stat = one dominant %, tug = two-sided). */
export type CardPreview =
  | { kind: "stat"; pct: number; line: string; color: string }
  | { kind: "tug"; score: string; lLabel: string; rLabel: string; lPct: number; rPct: number };

export type DiscoveryCard = {
  id: string;
  category: string;
  text: string;
  mode: string;
  primary_dv: string;
  geo: boolean;
  status: string;
  sample_n: number;
  /** home feed only: which prototype card variant to render */
  variant?: "plain" | "teaser" | "stat" | "tug";
  preview?: CardPreview | null;
};

const CARD_SELECT = `
  SELECT q.id, q.category, q.text, q.mode, q.primary_dv, q.geo, q.status,
         COALESCE(a.sample_n, 0) AS sample_n
  FROM questions q
  LEFT JOIN question_aggregates a
    ON a.question_id = q.id AND a.dim = 'overall' AND a.dim_key = ''`;

function rows(sql: string, ...params: unknown[]): DiscoveryCard[] {
  return (rawDb.prepare(sql).all(...params) as Record<string, unknown>[]).map((r) => ({
    id: r.id as string,
    category: r.category as string,
    text: r.text as string,
    mode: r.mode as string,
    primary_dv: r.primary_dv as string,
    geo: r.geo === 1,
    status: r.status as string,
    sample_n: (r.sample_n as number) ?? 0,
  }));
}

/* FIX 4 (B2) — CARD_SELECT plus the columns needed to compute a result preview,
   so browse surfaces (explore/category/search) can show result cards too, not
   only Home. */
const CARD_SELECT_FULL = `
  SELECT q.id, q.category, q.text, q.mode, q.primary_dv, q.geo, q.status,
         q.options_json, a.agg_json,
         COALESCE(a.sample_n, 0) AS sample_n
  FROM questions q
  LEFT JOIN question_aggregates a
    ON a.question_id = q.id AND a.dim = 'overall' AND a.dim_key = ''`;

/** Decorate a raw row with the stat/tug result variant once it clears
 *  RESULT_THRESHOLD and a preview is computable; otherwise a lock-to-vote teaser. */
function decorate(r: Record<string, unknown>): DiscoveryCard {
  const base: DiscoveryCard = {
    id: r.id as string,
    category: r.category as string,
    text: r.text as string,
    mode: r.mode as string,
    primary_dv: r.primary_dv as string,
    geo: r.geo === 1,
    status: r.status as string,
    sample_n: (r.sample_n as number) ?? 0,
  };
  if (base.sample_n >= RESULT_THRESHOLD) {
    const preview = buildPreview(
      base.mode,
      r.options_json as string,
      (r.agg_json as string) ?? null,
      base.category
    );
    if (preview) return { ...base, variant: preview.kind, preview };
  }
  return { ...base, variant: "teaser" };
}

function rowsFull(sql: string, ...params: unknown[]): DiscoveryCard[] {
  return (rawDb.prepare(sql).all(...params) as Record<string, unknown>[]).map(decorate);
}

/** Numeric sort on real counts — the NEW-01 regression lives here. */
export function getTrending(limit = 6): DiscoveryCard[] {
  return rowsFull(
    `${CARD_SELECT_FULL}
     WHERE q.status = 'active'
     ORDER BY COALESCE(a.sample_n, 0) DESC, q.score_shareability DESC NULLS LAST, q.id
     LIMIT ?`,
    limit
  );
}

export function getRecent(limit = 6): DiscoveryCard[] {
  return rows(
    `${CARD_SELECT}
     WHERE q.status = 'active'
     ORDER BY q.created_at DESC, q.id DESC
     LIMIT ?`,
    limit
  );
}

export function getEditorialPicks(limit = 5): DiscoveryCard[] {
  const meta = rawDb
    .prepare("SELECT value FROM app_meta WHERE key = 'editorial_picks'")
    .get() as { value: string } | undefined;
  let ids: string[] = [];
  if (meta) {
    try {
      const parsed = JSON.parse(meta.value);
      if (Array.isArray(parsed)) ids = parsed.filter((v) => typeof v === "string");
    } catch {
      ids = [];
    }
  }
  if (ids.length > 0) {
    const placeholders = ids.map(() => "?").join(",");
    const picked = rowsFull(
      `${CARD_SELECT_FULL} WHERE q.status = 'active' AND q.id IN (${placeholders})`,
      ...ids
    );
    // preserve curator order
    const byId = new Map(picked.map((c) => [c.id, c]));
    const ordered = ids.map((i) => byId.get(i)).filter((c): c is DiscoveryCard => Boolean(c));
    if (ordered.length > 0) return ordered.slice(0, limit);
  }
  // fallback: most shareable active questions
  return rowsFull(
    `${CARD_SELECT_FULL}
     WHERE q.status = 'active'
     ORDER BY q.score_shareability DESC NULLS LAST, COALESCE(a.sample_n,0) DESC, q.id
     LIMIT ?`,
    limit
  );
}

/** AC353: same category first, same mode as backfill, never the question itself. */
export function getRelated(questionId: string, limit = 3): DiscoveryCard[] {
  const q = rawDb
    .prepare("SELECT category, mode FROM questions WHERE id = ?")
    .get(questionId) as { category: string; mode: string } | undefined;
  if (!q) return [];
  const sameCategory = rows(
    `${CARD_SELECT}
     WHERE q.status = 'active' AND q.id != ? AND q.category = ?
     ORDER BY RANDOM() LIMIT ?`,
    questionId,
    q.category,
    limit
  );
  if (sameCategory.length >= limit) return sameCategory;
  const fill = rows(
    `${CARD_SELECT}
     WHERE q.status = 'active' AND q.id != ? AND q.category != ? AND q.mode = ?
     ORDER BY RANDOM() LIMIT ?`,
    questionId,
    q.category,
    q.mode,
    limit - sameCategory.length
  );
  return [...sameCategory, ...fill];
}

export function getByCategory(category: Category, limit = 30): DiscoveryCard[] {
  return rowsFull(
    `${CARD_SELECT_FULL}
     WHERE q.status = 'active' AND q.category = ?
     ORDER BY COALESCE(a.sample_n,0) DESC, q.id LIMIT ?`,
    category,
    limit
  );
}

export function getExplore(filters: { mode?: string; category?: string }): DiscoveryCard[] {
  const conds = ["q.status = 'active'"];
  const params: unknown[] = [];
  if (filters.mode) {
    conds.push("q.mode = ?");
    params.push(filters.mode);
  }
  if (filters.category) {
    conds.push("q.category = ?");
    params.push(filters.category);
  }
  return rowsFull(
    `${CARD_SELECT_FULL} WHERE ${conds.join(" AND ")} ORDER BY q.category, q.id LIMIT 60`,
    ...params
  );
}

/** AC352: questions + categories only — result content is not searchable. */
export function searchQuestions(query: string, limit = 20): {
  questions: DiscoveryCard[];
  categories: Category[];
} {
  const like = `%${query.replace(/[%_]/g, "")}%`;
  const questions = rowsFull(
    `${CARD_SELECT_FULL}
     WHERE q.status = 'active' AND (q.text LIKE ? OR q.title LIKE ? OR q.subcategory LIKE ?)
     ORDER BY COALESCE(a.sample_n,0) DESC LIMIT ?`,
    like,
    like,
    like,
    limit
  );
  const ql = query.toLowerCase();
  const categories = CATEGORIES.filter((c) => c.toLowerCase().includes(ql));
  return { questions, categories };
}

/* ------------------------------------------------------------------ */
/* Homepage composition — AC354 + AC355                                */
/* ------------------------------------------------------------------ */

export type HomepageModule = {
  kind: "editorial" | "trending" | "recent" | "explore";
  cards: DiscoveryCard[];
};

/**
 * AC355 — diversity rule: walking the composed modules in order, the same
 * category never occupies more than two consecutive card slots. Repeats are
 * swapped backward within their module where possible.
 */
export function applyDiversity(modules: HomepageModule[]): HomepageModule[] {
  const prev: string[] = [];
  for (const m of modules) {
    for (let i = 0; i < m.cards.length; i++) {
      const cat = m.cards[i].category;
      const lastTwo = [...prev.slice(-2)];
      if (lastTwo.length === 2 && lastTwo.every((c) => c === cat)) {
        const j = m.cards.findIndex((c, k) => k > i && c.category !== cat);
        if (j > i) {
          const [swap] = m.cards.splice(j, 1);
          m.cards.splice(i, 0, swap);
        }
      }
      prev.push(m.cards[i].category);
    }
  }
  return modules;
}

export function composeHomepage(): HomepageModule[] {
  const editorial = getEditorialPicks(5);
  const editorialIds = new Set(editorial.map((c) => c.id));
  const trending = getTrending(8).filter((c) => !editorialIds.has(c.id)).slice(0, 6);
  const seen = new Set([...editorialIds, ...trending.map((c) => c.id)]);
  const recent = getRecent(10).filter((c) => !seen.has(c.id)).slice(0, 6);
  for (const c of recent) seen.add(c.id);
  const explore = getExplore({})
    .filter((c) => !seen.has(c.id))
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  return applyDiversity([
    { kind: "editorial", cards: editorial },
    { kind: "trending", cards: trending },
    { kind: "recent", cards: recent },
    { kind: "explore", cards: explore },
  ]);
}

/* ------------------------------------------------------------------ */
/* Feed rows — the prototype's 5 editorial rails (rowDefs).            */
/* Each active question lands in exactly one rail by result/mode:      */
/*   results (has data) · vote-to-unlock (fresh teasers) · quick ·     */
/*   the sorting desk · the swipe court.                               */
/* ------------------------------------------------------------------ */

export type FeedRowDef = { key: string; title: string; sub: string; cards: DiscoveryCard[] };

/** votes needed before a card shows its result instead of a teaser */
const RESULT_THRESHOLD = 5;
/** how many fresh questions head the "Vote to unlock" rail */
const LOCKED_QUOTA = 6;

/** Build a stat/tug preview from a question's overall aggregate. */
export function buildPreview(
  mode: string,
  optionsJson: string,
  aggJson: string | null,
  category: string
): CardPreview | null {
  if (!aggJson) return null;
  let opts: { key: string; label: string }[];
  let agg: Record<string, unknown>;
  try {
    opts = JSON.parse(optionsJson);
    agg = JSON.parse(aggJson);
  } catch {
    return null;
  }
  const labelOf = (k: string) => opts.find((o) => o.key === k)?.label ?? k;
  const deskColor = DESK_BY_CATEGORY[category as Category]?.color ?? "var(--fire)";

  if (mode === "quick_pick" || mode === "logo_quick_pick" || mode === "tradeoff_cards") {
    const counts = (agg.counts ?? {}) as Record<string, number>;
    const entries = Object.entries(counts)
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, n]) => s + n, 0);
    if (total <= 0 || entries.length === 0) return null;
    if (entries.length === 2 || mode === "tradeoff_cards") {
      const [k1, n1] = entries[0];
      const second = entries[1];
      const lPct = Math.round((n1 / total) * 100);
      return {
        kind: "tug",
        score: `${lPct}–${100 - lPct}`,
        lLabel: labelOf(k1),
        rLabel: second ? labelOf(second[0]) : "Everyone else",
        lPct,
        rPct: 100 - lPct,
      };
    }
    const [k1, n1] = entries[0];
    return { kind: "stat", pct: Math.round((n1 / total) * 100), line: labelOf(k1), color: deskColor };
  }

  if (mode === "swipe_stack") {
    const cards = (agg.cards ?? {}) as Record<string, { yes: number; no: number }>;
    const entries = Object.entries(cards)
      .map(([k, v]) => ({ k, yes: v.yes || 0, tot: (v.yes || 0) + (v.no || 0) }))
      .filter((e) => e.tot > 0);
    if (!entries.length) return null;
    entries.sort((a, b) => b.yes / b.tot - a.yes / a.tot);
    const top = entries[0];
    return {
      kind: "stat",
      pct: Math.round((top.yes / top.tot) * 100),
      line: `said yes to “${labelOf(top.k)}”`,
      color: deskColor,
    };
  }

  // place / rank / podium previews aren't a single % — show those as plain.
  return null;
}

export function composeFeedRows(excludeIds: Set<string> = new Set()): FeedRowDef[] {
  const raw = rawDb
    .prepare(
      `SELECT q.id, q.category, q.text, q.mode, q.primary_dv, q.geo, q.status, q.options_json,
              COALESCE(a.sample_n, 0) AS sample_n, a.agg_json
       FROM questions q
       LEFT JOIN question_aggregates a
         ON a.question_id = q.id AND a.dim = 'overall' AND a.dim_key = ''
       WHERE q.status = 'active'
       ORDER BY COALESCE(a.sample_n, 0) DESC, q.id`
    )
    .all() as Record<string, unknown>[];

  const groups: Record<string, DiscoveryCard[]> = {
    locked: [],
    results: [],
    quick: [],
    sort: [],
    swipe: [],
  };
  let lockedQuota = LOCKED_QUOTA;

  for (const r of raw) {
    const id = r.id as string;
    if (excludeIds.has(id)) continue;
    const base: DiscoveryCard = {
      id,
      category: r.category as string,
      text: r.text as string,
      mode: r.mode as string,
      primary_dv: r.primary_dv as string,
      geo: r.geo === 1,
      status: r.status as string,
      sample_n: (r.sample_n as number) ?? 0,
    };

    if (base.sample_n >= RESULT_THRESHOLD) {
      const preview = buildPreview(
        base.mode,
        r.options_json as string,
        (r.agg_json as string) ?? null,
        base.category
      );
      if (preview) {
        groups.results.push({ ...base, variant: preview.kind, preview });
        continue;
      }
    }

    if (lockedQuota > 0) {
      groups.locked.push({ ...base, variant: "teaser" });
      lockedQuota--;
      continue;
    }

    const g =
      base.mode === "bucket_sort" ||
      base.mode === "tier_placement" ||
      base.mode === "rank_order" ||
      base.mode === "podium_slots"
        ? "sort"
        : base.mode === "swipe_stack"
          ? "swipe"
          : "quick";
    groups[g].push({ ...base, variant: "plain" });
  }

  return [
    { key: "locked", title: "Vote to unlock", sub: "answers hidden until you vote", cards: groups.locked },
    { key: "results", title: "Results are out", sub: "the country has spoken", cards: groups.results },
    { key: "quick", title: "Quick picks", sub: "one tap, thirty seconds", cards: groups.quick },
    { key: "sort", title: "The sorting desk", sub: "file things where they belong", cards: groups.sort },
    { key: "swipe", title: "The swipe court", sub: "verdict per card", cards: groups.swipe },
  ].filter((row) => row.cards.length > 0);
}
