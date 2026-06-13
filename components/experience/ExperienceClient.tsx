"use client";

/**
 * The experience orchestrator — feat-question-experience-page (#6) +
 * feat-result-reveal (#8).
 *
 * One question = one experience page (rail): question, interaction, result,
 * insight and exploration are visibility states of THIS component — there is
 * no separate result route (AC334). After answering, the result + personal
 * layer appear in place via the reveal sequence (AC335): interaction settles
 * out, DV rises in, insights follow — 300-700ms steps, reduced-motion safe.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { dvsForQuestion } from "@/lib/dv/registry";
import { DV_REGISTRY } from "@/components/dv";
import StillCounting from "@/components/dv/StillCounting";
import { DvSwitcher } from "@/components/dv/DvSwitcher";
import { INTERACTION_REGISTRY } from "@/components/interactions";
import { buildInsights } from "@/lib/insights/templates";
import InsightCards from "@/components/insight/InsightCards";
import RegionChip from "@/components/region/RegionChip";
import { ReactionBar } from "./ReactionBar";
import { ShareSheet } from "./ShareSheet";
import { SkipChip } from "./SkipChip";

type Phase = "answer" | "submitting" | "result";

export function ExperienceClient({
  question,
  initialResult,
  header,
}: {
  question: QuestionPublic;
  initialResult: QuestionResult | null;
  header: ReactNode;
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
    // Safety net: a question whose primary DV doesn't support its mode would
    // otherwise render a chart-less result. Fall back to ANY registered DV
    // that supports the mode (tier/treemap/board for placements, etc.).
    const fallback = Object.values(DV_REGISTRY).find(
      (d) => d && d.supportedModes.includes(question.mode)
    );
    return fallback ? [fallback] : [];
  }, [question]);
  const PrimaryDv = dvDefs[0]?.Component ?? null;
  const insights = useMemo(
    () => (result && result.your_payload ? buildInsights(question, result) : []),
    [question, result]
  );

  const rise = reduced
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -16 },
      };

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        {(phase === "answer" || phase === "submitting") && (
          <motion.section
            key="interaction"
            {...rise}
            transition={{ duration: 0.4 }}
            aria-label="Answer this question"
            className="lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-12"
          >
            <div className="mb-6 lg:mb-0 lg:sticky lg:top-6">{header}</div>
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
              <div className="mt-4 flex items-center justify-between">
                <SkipChip questionId={question.id} />
                <span className="font-label text-xs text-muted">
                  Anonymous · skip anytime
                </span>
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
            {/* FIX 1 — question full-width on top, then DV-left / rail-right ≥lg */}
            <div className="mb-6">{header}</div>
            {result.still_counting ? (
              <StillCounting question={question} result={result} />
            ) : (
              <div className="lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:items-start lg:gap-6">
                {/* MAIN — the count, read left */}
                <div className="mb-6 flex flex-col gap-5 lg:mb-0">
                  {/* Truthful edition stamp (v5 proto line 554, gated on rVoted):
                      confirms YOUR real answer was counted. NEVER a "sample data"
                      stamp — the build counts real votes. */}
                  {result.your_payload && (
                    <div className="flex items-center justify-end">
                      <motion.span
                        initial={reduced ? false : { scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
                        className="rotate-[-3deg] border-[3px] border-fire bg-paper-bright/70 px-2.5 py-1 font-label text-sm font-extrabold tracking-wider text-fire uppercase"
                      >
                        Counted ✓
                      </motion.span>
                    </div>
                  )}
                  {result.early_returns && (
                    <div className="border-2 border-ink bg-gold-tint px-3 py-1.5 font-label text-xs font-bold tracking-wider text-ink">
                      EARLY RETURNS — the count is young, numbers may move
                    </div>
                  )}
                  {dvDefs.length > 1 ? (
                    <DvSwitcher defs={dvDefs} question={question} result={result} />
                  ) : PrimaryDv ? (
                    <PrimaryDv question={question} result={result} dvId={dvDefs[0].id} />
                  ) : null}
                </div>

                {/* RAIL — "Your position", sticky on desktop */}
                <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
                  {insights.length > 0 && (
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: reduced ? 0 : 0.35 }}
                    >
                      <InsightCards insights={insights} />
                    </motion.div>
                  )}

                  {question.geo && <RegionChip />}

                  <div className="flex items-center justify-between gap-3">
                    <ReactionBar questionId={question.id} />
                    <ShareSheet questionId={question.id} />
                  </div>

                  <div className="flex items-center justify-between border-t-2 border-ink pt-3">
                    <span className="font-label text-xs text-muted">
                      {result.sample_n.toLocaleString("en-IN")} counted
                    </span>
                    {answerable && !alreadyAnswered ? null : (
                      <SkipChip questionId={question.id} />
                    )}
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
