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
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";
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

  const questionHeading = (
    <h2 className="font-editorial text-[26px] font-semibold leading-[1.12] text-ink sm:text-[30px]">
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

            <div className="lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12">
              <div className="mb-6 lg:mb-0">
                <div className="mb-4 inline-flex items-center gap-2">
                  <span className="rounded bg-ink px-[9px] py-1 font-label text-[10px] font-bold uppercase tracking-[.14em] text-lime">
                    {chipLabel}
                  </span>
                  {question.subcategory && (
                    <span className="font-label text-[10px] uppercase tracking-[.1em] text-muted">
                      {question.subcategory}
                    </span>
                  )}
                </div>
                {questionHeading}
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

            {/* Question header with the Counted ✓ stamp slammed top-right (v5 550-556) */}
            <div className="relative mb-6 pr-24 sm:pr-28">
              <div className="mb-2 font-label text-[10px] uppercase tracking-[.16em] text-muted">
                {deskName} · {result.sample_n.toLocaleString("en-IN")} votes counted
              </div>
              {questionHeading}
              {result.your_payload && (
                <motion.span
                  initial={reduced ? false : { scale: 0.6, opacity: 0, rotate: 4 }}
                  animate={{ scale: 1, opacity: 1, rotate: -6 }}
                  transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                  className="absolute right-0 top-0 rounded-[7px] border-[3px] border-fire bg-paper/70 px-[11px] py-[7px] font-ui text-[15px] font-black tracking-wide text-fire uppercase"
                >
                  Counted ✓
                </motion.span>
              )}
            </div>

            {result.still_counting ? (
              <StillCounting question={question} result={result} />
            ) : (
              <div className="lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-6">
                {/* MAIN — the count, read left */}
                <div className="mb-6 flex flex-col gap-5 lg:mb-0">
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

                  {notes.length > 0 && (
                    <div className="hidden lg:block">
                      <DeskNotes notes={notes} />
                    </div>
                  )}
                </div>

                {/* RAIL — "Your position", sticky below the masthead */}
                <aside className="flex flex-col gap-4 lg:sticky lg:top-[90px]">
                  <div className="flex items-center gap-3">
                    <span className="rounded border-[1.5px] border-ink bg-lime px-[11px] py-[5px] font-label text-[10px] font-bold uppercase tracking-[.22em] text-ink">
                      Your position
                    </span>
                    <span aria-hidden className="h-0.5 flex-1 bg-ink" />
                  </div>

                  {verdict && <PersonalCard big={verdict.big} sub={verdict.sub} />}

                  {notes.length > 0 && (
                    <div className="lg:hidden">
                      <DeskNotes notes={notes} inline />
                    </div>
                  )}

                  <ReactionBar questionId={question.id} />

                  {railRelated}

                  {question.geo && <RegionChip />}

                  <ShareActions questionId={question.id} />

                  <div className="flex items-center justify-between border-t-2 border-ink pt-3">
                    <span className="font-label text-xs text-muted">
                      {result.sample_n.toLocaleString("en-IN")} counted
                    </span>
                    {answerable && result.your_payload && (
                      <button
                        onClick={() => setPhase("answer")}
                        className="font-label text-xs font-bold text-ink underline decoration-2 underline-offset-2"
                      >
                        Change my answer
                      </button>
                    )}
                  </div>
                </aside>
              </div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
