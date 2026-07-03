"use client";

/**
 * The experience orchestrator — feat-question-experience-page (#6) +
 * feat-result-reveal (#8).
 *
 * One question = one experience page (rail): the question, interaction, result,
 * personal layer and exploration are visibility states of THIS component — no
 * separate result route (AC334).
 *
 * The page shell (masthead / footer / dice) is owned by the route; this owns
 * the in-content header per phase, matching the v5 prototype:
 *  - ANSWER (v5 341-356): [Back] ↔ [gold Skip + colored Desk pill]; meta = mode
 *    chip (ink/lime) + subcategory; question h2 (Spectral 600); interaction.
 *  - RESULT (v5 530-556): [Back]; inline StatusBand; meta = "DESK · N votes
 *    counted"; question h2 + Counted ✓ stamp top-right; DV left / rail right.
 */
import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { dvsForQuestion } from "@/lib/dv/registry";
import { DV_REGISTRY } from "@/components/dv";
import StillCounting from "@/components/dv/StillCounting";
import { DvSwitcher, CountHeader } from "@/components/dv/DvSwitcher";
import { INTERACTION_REGISTRY } from "@/components/interactions";
import { DESK_BY_CATEGORY, MODE_HINT, type Category } from "@/lib/catalogue/enums";
import { personalVerdict } from "@/lib/insights/personalVerdict";
import { PersonalCard } from "./PersonalCard";
import { DeskNotes } from "@/components/insight/DeskNotes";
import { StatusBand } from "./StatusBand";
import { BackBlock } from "./BackBlock";
import { SkipChip } from "./SkipChip";
import RegionChip from "@/components/region/RegionChip";
import { ReactionBar } from "./ReactionBar";
import { ShareActions } from "./ShareActions";
import type { ReactNode } from "react";

type Phase = "answer" | "submitting" | "result";

/** v5 top-right desk pill (line 345) — desk name on its brand-colour fill. */
function DeskPill({ category }: { category: string }) {
  const d = DESK_BY_CATEGORY[category as Category];
  if (!d) return null;
  return (
    <span
      style={{ background: d.color }}
      className="rounded border-2 border-ink px-[10px] py-[5px] font-label text-[10.5px] font-bold uppercase tracking-[.12em] text-ink shadow-[2px_2px_0_color-mix(in_srgb,var(--ink)_20%,transparent)]"
    >
      {d.desk}
    </span>
  );
}

export function ExperienceClient({
  question,
  initialResult,
  railRelated,
  closedDate,
}: {
  question: QuestionPublic;
  initialResult: QuestionResult | null;
  /** v5 in-rail "Up next" + related mini-cards — server-rendered, passed in. */
  railRelated: ReactNode;
  /** human date the count closed (frozen/archived) for the StatusBand. */
  closedDate?: string | null;
}) {
  const reduced = useReducedMotion();
  const answerable = question.status === "active";
  const alreadyAnswered = Boolean(initialResult?.your_payload);

  const [result, setResult] = useState<QuestionResult | null>(initialResult);
  const [phase, setPhase] = useState<Phase>(
    alreadyAnswered || !answerable ? "result" : "answer"
  );
  const [error, setError] = useState<string | null>(null);

  const interaction = INTERACTION_REGISTRY[question.mode];
  const chipLabel = interaction?.chipLabel ?? question.mode;
  const deskName = DESK_BY_CATEGORY[question.category as Category]?.desk ?? question.category;

  const onSubmit = useCallback(
    async (payload: Record<string, unknown>) => {
      setError(null);
      setPhase("submitting");
      try {
        const res = await fetch("/api/answers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: question.id, payload }),
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `answer failed (${res.status})`);
        }
        const full = await fetch(`/api/questions/${question.id}/result`);
        if (!full.ok) throw new Error("result unavailable");
        setResult((await full.json()) as QuestionResult);
        setPhase("result");
      } catch (e) {
        setError(e instanceof Error ? e.message : "something went wrong");
        setPhase("answer");
      }
    },
    [question.id]
  );

  const dvDefs = useMemo(() => {
    const defs = dvsForQuestion(DV_REGISTRY, question);
    if (defs.length > 0) return defs;
    const fallback = Object.values(DV_REGISTRY).find(
      (d) => d && d.supportedModes.includes(question.mode)
    );
    return fallback ? [fallback] : [];
  }, [question]);
  const PrimaryDv = dvDefs[0]?.Component ?? null;

  const verdict = useMemo(
    () =>
      result && result.your_payload && !result.still_counting
        ? personalVerdict(question, result, dvDefs[0]?.id)
        : null,
    [question, result, dvDefs]
  );
  const notes = useMemo(
    () =>
      [question.editorial_note, question.editorial_note_2].filter(
        (s): s is string => Boolean(s)
      ),
    [question]
  );

  const rise = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
      };

  // v5 uses two distinct question sizes (parity Δ3): answer screen 36px desktop /
  // 25px below the exp breakpoint (line 355); result screen a flat 25px (line 552).
  const answerHeading = (
    <h2 className="font-editorial text-[25px] font-semibold leading-[1.1] text-ink exp:text-[36px]">
      {question.text}
    </h2>
  );
  const resultHeading = (
    <h2 className="font-editorial text-[25px] font-semibold leading-[1.15] text-ink">
      {question.text}
    </h2>
  );

  return (
    <div>
      <AnimatePresence mode="wait">
        {(phase === "answer" || phase === "submitting") && (
          <motion.section
            key="interaction"
            {...rise}
            transition={{ duration: 0.4 }}
            aria-label="Answer this question"
          >
            {/* header row — back ↔ skip + desk (v5 341-347) */}
            <div className="mb-7 flex items-center justify-between gap-3">
              <BackBlock href="/" />
              <div className="flex items-center gap-2.5">
                <SkipChip questionId={question.id} />
                <DeskPill category={question.category} />
              </div>
            </div>

            <div className="exp:grid exp:grid-cols-[0.85fr_1.15fr] exp:items-start exp:gap-12">
              <div className="mb-6 exp:mb-0">
                <div className="mb-4 inline-flex items-center gap-2">
                  <span className="rounded bg-ink px-[9px] py-1 font-label text-[10px] font-bold uppercase tracking-[.14em] text-lime">
                    {chipLabel}
                  </span>
                  <span className="font-label text-[10px] uppercase tracking-[.1em] text-muted">
                    {question.hint ?? MODE_HINT[question.mode]}
                  </span>
                </div>
                {answerHeading}
              </div>
              <div>
                <interaction.Component
                  question={question}
                  onSubmit={onSubmit}
                  submitting={phase === "submitting"}
                />
                {error && (
                  <p
                    role="alert"
                    className="mt-3 border-2 border-fire bg-fire-tint px-3 py-2 font-label text-sm text-ink"
                  >
                    {error}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        )}

        {phase === "result" && result && (
          <motion.section
            key="result"
            data-testid="result-area"
            {...rise}
            transition={{ duration: 0.5, delay: reduced ? 0 : 0.1 }}
            aria-label="What everyone thinks"
          >
            {/* header row — back only (v5 530-535) */}
            <div className="mb-5 flex items-center justify-between gap-3">
              <BackBlock href="/" />
            </div>

            {/* Lifecycle band — inline, inside the result container (v5 537-548) */}
            <StatusBand
              status={question.status}
              date={closedDate}
              votes={result.sample_n}
            />

            {/* Question header — canonical vote count lives here (trust visible,
                never dominant); the Counted ✓ stamp was removed per iter-3 #10/#17. */}
            <div className="mb-6">
              <div className="mb-2 font-label text-[10px] uppercase tracking-[.16em] text-muted">
                {deskName} · {result.sample_n.toLocaleString("en-IN")} votes counted
              </div>
              {resultHeading}
            </div>

            {result.still_counting ? (
              <StillCounting question={question} result={result} />
            ) : (
              // iter-6 item-411: two columns above the exp breakpoint — the
              // count + personal layer + rate/share on the left, recommended
              // questions as a sticky right rail (report #50 [6]). Below exp
              // the iter-3 stacked order is unchanged: viz → where you landed
              // → rate + share → recommendations.
              <div className="mx-auto flex max-w-[860px] flex-col gap-7 exp:mx-0 exp:grid exp:max-w-none exp:grid-cols-[minmax(0,1fr)_340px] exp:items-start exp:gap-10">
                <div className="flex min-w-0 flex-col gap-7">
                  {/* the count, read first */}
                  <div className="flex flex-col gap-5">
                    {result.early_returns && (
                      <div className="border-2 border-ink bg-gold-tint px-3 py-1.5 font-label text-xs font-bold tracking-wider text-ink">
                        EARLY RETURNS — the count is young, numbers may move
                      </div>
                    )}
                    {dvDefs.length > 1 ? (
                      <DvSwitcher defs={dvDefs} question={question} result={result} />
                    ) : PrimaryDv ? (
                      <div>
                        <CountHeader />
                        <PrimaryDv question={question} result={result} dvId={dvDefs[0].id} />
                      </div>
                    ) : null}
                  </div>

                  {/* WHERE YOU LANDED — mandatory personal insight + desk notes */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span className="rounded border-[1.5px] border-ink bg-lime px-[11px] py-[5px] font-label text-[10px] font-bold uppercase tracking-[.22em] text-ink">
                        Where you landed
                      </span>
                      <span aria-hidden className="h-0.5 flex-1 bg-ink" />
                    </div>
                    {verdict && <PersonalCard big={verdict.big} sub={verdict.sub} />}
                    {notes.length > 0 && <DeskNotes notes={notes} />}
                    {question.geo && <RegionChip />}
                  </div>

                  {/* rate the question + share/download, one line (#20/#21) */}
                  <div className="flex flex-col gap-4 border-t-2 border-ink pt-5 exp:flex-row exp:items-center exp:justify-between exp:gap-6">
                    <div className="shrink-0">
                      <ReactionBar questionId={question.id} />
                    </div>
                    <div className="w-full exp:max-w-[440px]">
                      <ShareActions questionId={question.id} />
                    </div>
                  </div>

                  {/* change my answer (vote count is canonical in the header above) */}
                  {answerable && result.your_payload && (
                    <div className="flex justify-end border-t-2 border-ink pt-3">
                      <button
                        onClick={() => setPhase("answer")}
                        className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2"
                      >
                        Change my answer
                      </button>
                    </div>
                  )}
                </div>

                {/* recommendations / up next — right rail on wide, below on mobile */}
                <aside className="exp:sticky exp:top-[90px] exp:self-start" aria-label="Recommended questions">
                  {railRelated}
                </aside>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
