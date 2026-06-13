/**
 * Admin question editor — /admin/q/[questionId] (tracker page id
 * page-stateofus-admin-question-edit). Form + lifecycle trail.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { rawDb } from "@/lib/db/client";
import { QuestionForm, type FormValue } from "@/components/admin/QuestionForm";

export const dynamic = "force-dynamic";

export default async function AdminQuestionPage(props: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await props.params;
  const q = rawDb.prepare("SELECT * FROM questions WHERE id = ?").get(questionId) as
    | Record<string, unknown>
    | undefined;
  if (!q) notFound();

  const events = rawDb
    .prepare(
      "SELECT from_status, to_status, actor, reason, at FROM lifecycle_events WHERE question_id = ? ORDER BY id DESC LIMIT 12"
    )
    .all(questionId) as {
    from_status: string;
    to_status: string;
    actor: string;
    reason: string | null;
    at: string;
  }[];

  const options = (JSON.parse(q.options_json as string) as { label: string }[])
    .map((o) => o.label)
    .join("\n");
  const targets = q.targets_json
    ? (JSON.parse(q.targets_json as string) as { labels: string[] }).labels.join("\n")
    : "";

  const initial: FormValue = {
    category: q.category as string,
    text: q.text as string,
    mode: q.mode as string,
    optionsText: options,
    targetsText: targets,
    primary_dv: q.primary_dv as string,
    secondary_dvs: JSON.parse(q.secondary_dvs_json as string) as string[],
    insight_type: (q.insight_type as string) ?? "",
    geo: q.geo === 1,
    reveal_pattern: (q.reveal_pattern as string) ?? "threshold",
    subcategory: (q.subcategory as string) ?? "",
    notes: (q.notes as string) ?? "",
  };

  const warnings = JSON.parse((q.import_warnings_json as string) ?? "[]") as string[];

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="flex items-center justify-between py-4">
        <Link href="/admin" className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          ← Editor&apos;s desk
        </Link>
        <Link href={`/q/${questionId}`} className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2">
          View live →
        </Link>
      </div>
      <h1 className="mb-1 font-editorial text-2xl font-extrabold text-ink">
        {questionId} <span className="font-label text-sm text-muted">· {q.status as string} · {q.source as string}</span>
      </h1>

      {warnings.length > 0 && (
        <div className="mb-4 border-2 border-fire bg-fire-tint p-2">
          {warnings.map((w, i) => (
            <p key={i} className="font-label text-xs text-ink">
              ⚠ {w}
            </p>
          ))}
        </div>
      )}

      <QuestionForm initial={initial} questionId={questionId} />

      <section className="mt-8">
        <h2 className="mb-2 border-b-2 border-ink pb-1 font-label text-sm font-bold tracking-[0.2em] text-ink uppercase">
          Lifecycle trail
        </h2>
        {events.map((e, i) => (
          <p key={i} className="font-label text-xs text-ink-soft">
            {e.at} · {e.from_status} → {e.to_status} · {e.actor}
            {e.reason ? ` · ${e.reason}` : ""}
          </p>
        ))}
      </section>
    </main>
  );
}
