/**
 * /q/[questionId] — THE experience page (feat-question-experience-page).
 *
 * RSC shell: reads the question + this device's result state directly from
 * the DB (no self-HTTP), resolves region on first visit (feat-region-capture
 * AC376), and hands off to the client orchestrator. One question = one page;
 * result/insight are visibility states, never a separate route (AC334).
 */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { rawDb } from "@/lib/db/client";
import { getDevice } from "@/lib/identity";
import { ensureRegion } from "@/lib/region/resolve";
import { decideReveal, MIN_REVEAL_N, type RevealPattern } from "@/lib/results";
import { DESK_BY_CATEGORY, type Category, type LifecycleState } from "@/lib/catalogue/enums";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { ExperienceClient } from "@/components/experience/ExperienceClient";
import { StatusBand } from "@/components/experience/StatusBand";
import { DeskStamp } from "@/components/experience/DeskStamp";
import { BackBlock } from "@/components/experience/BackBlock";
import { SharedContextBand } from "@/components/experience/SharedContextBand";
import { RelatedRow } from "@/components/discovery/RelatedRow";
import { INTERACTION_REGISTRY } from "@/components/interactions";

export const dynamic = "force-dynamic";

/** AC332 — OG/Twitter unfurls per question via the generated card. */
export async function generateMetadata(props: {
  params: Promise<{ questionId: string }>;
}): Promise<Metadata> {
  const { questionId } = await props.params;
  const q = loadQuestion(questionId);
  if (!q) return { title: "State of Us" };
  const og = `/api/og/${q.id}`;
  return {
    title: `${q.text} — State of Us`,
    description: "You answer. India answers back. Anonymous, one tap, instantly counted.",
    openGraph: {
      title: q.text,
      description: "You answer. India answers back.",
      images: [{ url: og, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: q.text,
      images: [og],
    },
  };
}

function loadQuestion(id: string): QuestionPublic | null {
  const q = rawDb
    .prepare(
      `SELECT id, category, subcategory, title, text, mode, options_json, targets_json,
              skip_allowed, primary_dv, secondary_dvs_json, insight_type, geo, status, created_at
       FROM questions WHERE id = ?`
    )
    .get(id) as Record<string, unknown> | undefined;
  if (!q || q.status === "draft") return null;
  const desk = DESK_BY_CATEGORY[q.category as Category];
  return {
    id: q.id as string,
    category: q.category as string,
    desk: desk?.desk ?? null,
    subcategory: (q.subcategory as string) ?? null,
    title: (q.title as string) ?? null,
    text: q.text as string,
    mode: q.mode as QuestionPublic["mode"],
    options: JSON.parse(q.options_json as string),
    targets: q.targets_json ? JSON.parse(q.targets_json as string) : null,
    skip_allowed: true,
    primary_dv: q.primary_dv as QuestionPublic["primary_dv"],
    secondary_dvs: JSON.parse(q.secondary_dvs_json as string),
    insight_type: (q.insight_type as string) ?? null,
    geo: q.geo === 1,
    status: q.status as LifecycleState,
    created_at: q.created_at as string,
  };
}

async function loadResult(question: QuestionPublic): Promise<QuestionResult | null> {
  const device = await getDevice();

  const overall = rawDb
    .prepare(
      "SELECT agg_json, sample_n, updated_at FROM question_aggregates WHERE question_id = ? AND dim = 'overall' AND dim_key = ''"
    )
    .get(question.id) as
    | { agg_json: string; sample_n: number; updated_at: string }
    | undefined;
  const sampleN = overall?.sample_n ?? 0;

  let yourPayload: Record<string, unknown> | null = null;
  let yourRegion: { state: string | null; city: string | null } | null = null;
  if (device) {
    const yours = rawDb
      .prepare(
        "SELECT payload_json, region_state, region_city FROM answers WHERE question_id = ? AND device_id = ?"
      )
      .get(question.id, device.id) as
      | { payload_json: string; region_state: string | null; region_city: string | null }
      | undefined;
    if (yours) {
      yourPayload = JSON.parse(yours.payload_json);
      yourRegion = {
        state: yours.region_state ?? device.region_state,
        city: yours.region_city ?? device.region_city,
      };
    } else {
      yourRegion = { state: device.region_state, city: device.region_city };
    }
  }

  // Nothing to show yet for an unanswered active question — client starts in
  // the answer phase and fetches the result after submitting.
  if (!yourPayload && question.status === "active") return null;

  const pattern = (rawDb
    .prepare("SELECT reveal_pattern FROM questions WHERE id = ?")
    .get(question.id) as { reveal_pattern: RevealPattern }).reveal_pattern;
  const reveal = decideReveal(pattern ?? "threshold", sampleN);

  if (!reveal.revealed) {
    return {
      question_id: question.id,
      status: question.status,
      still_counting: true,
      sample_n: sampleN,
      min_reveal_n: MIN_REVEAL_N,
      reveal_pattern: pattern,
      your_payload: yourPayload,
      your_region: yourRegion,
    };
  }

  let stateAggregates: Record<string, { agg: unknown; sample_n: number }> | null = null;
  if (question.geo) {
    const rows = rawDb
      .prepare(
        "SELECT dim_key, agg_json, sample_n FROM question_aggregates WHERE question_id = ? AND dim = 'state'"
      )
      .all(question.id) as { dim_key: string; agg_json: string; sample_n: number }[];
    stateAggregates = Object.fromEntries(
      rows.map((r) => [r.dim_key, { agg: JSON.parse(r.agg_json), sample_n: r.sample_n }])
    );
  }

  return {
    question_id: question.id,
    status: question.status,
    still_counting: false,
    early_returns: reveal.early_returns,
    sample_n: sampleN,
    min_reveal_n: MIN_REVEAL_N,
    reveal_pattern: pattern,
    aggregate: overall ? JSON.parse(overall.agg_json) : null,
    updated_at: overall?.updated_at ?? null,
    state_aggregates: stateAggregates,
    your_payload: yourPayload,
    your_region: yourRegion,
  };
}

export default async function QuestionPage(props: {
  params: Promise<{ questionId: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { questionId } = await props.params;
  const { s } = await props.searchParams;
  const question = loadQuestion(questionId);
  if (!question) notFound();
  const inboundShare = s === "1";

  // AC376 — coarse region from IP on first visit, no prompting.
  const device = await getDevice();
  if (device && !device.region_source) {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    if (ip) ensureRegion(device, ip);
  }

  const result = await loadResult(question);
  const chip = INTERACTION_REGISTRY[question.mode]?.chipLabel ?? question.mode;

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-4 pb-16 lg:max-w-[1120px] lg:px-8">
      <header className="flex items-center justify-between py-4">
        <BackBlock href="/" />
        <span className="bg-paper-bright border border-ink px-2 py-0.5 font-label text-xs font-bold tracking-[0.15em] text-ink uppercase">
          {chip}
        </span>
      </header>

      <StatusBand status={question.status} />

      {inboundShare && !result?.your_payload && (
        <SharedContextBand
          sampleN={
            (rawDb
              .prepare(
                "SELECT sample_n FROM question_aggregates WHERE question_id = ? AND dim='overall' AND dim_key=''"
              )
              .get(question.id) as { sample_n: number } | undefined)?.sample_n ?? 0
          }
        />
      )}

      <ExperienceClient
        question={question}
        initialResult={result}
        header={
          <div className="py-6">
            <div className="mb-3 flex items-center gap-2">
              <DeskStamp category={question.category} />
              {question.subcategory && (
                <span className="font-label text-xs tracking-wider text-muted uppercase">
                  {question.subcategory}
                </span>
              )}
            </div>
            <h1 className="font-editorial text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              {question.text}
            </h1>
          </div>
        }
      />

      {/* AC353/AC384 — exploration affordance on every question page */}
      <RelatedRow questionId={question.id} />
    </main>
  );
}
