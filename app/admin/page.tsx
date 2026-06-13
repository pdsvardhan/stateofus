/**
 * Admin dashboard + question list — feat-admin-console (AC363).
 * Counts, filters, lifecycle actions per row, feature toggle, export links.
 */
import Link from "next/link";
import { rawDb } from "@/lib/db/client";
import { CATEGORIES, LIFECYCLE_STATES, MODES } from "@/lib/catalogue/enums";
import { AdminRow } from "@/components/admin/AdminRow";

export const dynamic = "force-dynamic";

export default async function AdminPage(props: {
  searchParams: Promise<{ status?: string; category?: string; mode?: string; source?: string }>;
}) {
  const filters = await props.searchParams;
  const conds: string[] = ["1=1"];
  const params: unknown[] = [];
  if (filters.status && (LIFECYCLE_STATES as readonly string[]).includes(filters.status)) {
    conds.push("q.status = ?");
    params.push(filters.status);
  }
  if (filters.category && (CATEGORIES as readonly string[]).includes(filters.category)) {
    conds.push("q.category = ?");
    params.push(filters.category);
  }
  if (filters.mode && (MODES as readonly string[]).includes(filters.mode)) {
    conds.push("q.mode = ?");
    params.push(filters.mode);
  }
  if (filters.source && ["catalogue", "authored", "manual"].includes(filters.source)) {
    conds.push("q.source = ?");
    params.push(filters.source);
  }

  const counts = rawDb
    .prepare("SELECT status, COUNT(*) AS n FROM questions GROUP BY status")
    .all() as { status: string; n: number }[];
  const picks = rawDb
    .prepare("SELECT value FROM app_meta WHERE key = 'editorial_picks'")
    .get() as { value: string } | undefined;
  const pickIds = new Set<string>(picks ? (JSON.parse(picks.value) as string[]) : []);

  const rows = rawDb
    .prepare(
      `SELECT q.id, q.category, q.text, q.mode, q.status, q.source, q.import_warnings_json,
              COALESCE(a.sample_n, 0) AS sample_n
       FROM questions q
       LEFT JOIN question_aggregates a ON a.question_id = q.id AND a.dim='overall' AND a.dim_key=''
       WHERE ${conds.join(" AND ")} ORDER BY q.id LIMIT 200`
    )
    .all(...params) as {
    id: string;
    category: string;
    text: string;
    mode: string;
    status: string;
    source: string;
    import_warnings_json: string;
    sample_n: number;
  }[];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-ink py-4">
        <div>
          <h1 className="font-editorial text-3xl font-extrabold text-ink">Editor&apos;s desk</h1>
          <p className="font-label text-xs text-muted">
            {counts.map((c) => `${c.n} ${c.status}`).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/new" className="border-2 border-ink bg-lime px-3 py-1.5 font-label text-xs font-bold text-ink">
            + New question
          </Link>
          <a href="/api/admin/export" className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-xs font-bold text-ink">
            Export JSON
          </a>
          <a href="/api/admin/export?format=csv" className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-xs font-bold text-ink">
            Export CSV
          </a>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 py-3">
        {LIFECYCLE_STATES.map((s) => (
          <Link
            key={s}
            href={filters.status === s ? "/admin" : `/admin?status=${s}`}
            className={`border-2 border-ink px-2.5 py-1 font-label text-[11px] font-bold uppercase ${
              filters.status === s ? "bg-ink text-paper-bright" : "bg-paper-bright text-ink"
            }`}
          >
            {s}
          </Link>
        ))}
        {["catalogue", "authored", "manual"].map((s) => (
          <Link
            key={s}
            href={filters.source === s ? "/admin" : `/admin?source=${s}`}
            className={`border-2 border-ink px-2.5 py-1 font-label text-[11px] font-bold uppercase ${
              filters.source === s ? "bg-ink text-paper-bright" : "bg-paper-deep text-ink"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {rows.map((r) => (
          <AdminRow
            key={r.id}
            row={{ ...r, warnings: JSON.parse(r.import_warnings_json ?? "[]").length }}
            featured={pickIds.has(r.id)}
          />
        ))}
      </div>
      <p className="mt-3 font-label text-xs text-muted">{rows.length} shown (cap 200)</p>
    </main>
  );
}
