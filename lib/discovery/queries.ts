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
import { CATEGORIES, type Category } from "@/lib/catalogue/enums";

export type DiscoveryCard = {
  id: string;
  category: string;
  text: string;
  mode: string;
  primary_dv: string;
  geo: boolean;
  status: string;
  sample_n: number;
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

/** Numeric sort on real counts — the NEW-01 regression lives here. */
export function getTrending(limit = 6): DiscoveryCard[] {
  return rows(
    `${CARD_SELECT}
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
    const picked = rows(
      `${CARD_SELECT} WHERE q.status = 'active' AND q.id IN (${placeholders})`,
      ...ids
    );
    // preserve curator order
    const byId = new Map(picked.map((c) => [c.id, c]));
    const ordered = ids.map((i) => byId.get(i)).filter((c): c is DiscoveryCard => Boolean(c));
    if (ordered.length > 0) return ordered.slice(0, limit);
  }
  // fallback: most shareable active questions
  return rows(
    `${CARD_SELECT}
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
  return rows(
    `${CARD_SELECT}
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
  return rows(
    `${CARD_SELECT} WHERE ${conds.join(" AND ")} ORDER BY q.category, q.id LIMIT 60`,
    ...params
  );
}

/** AC352: questions + categories only — result content is not searchable. */
export function searchQuestions(query: string, limit = 20): {
  questions: DiscoveryCard[];
  categories: Category[];
} {
  const like = `%${query.replace(/[%_]/g, "")}%`;
  const questions = rows(
    `${CARD_SELECT}
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
