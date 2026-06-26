"use client";

/**
 * Bracket — single-elimination, tap the winner each round (v5 `bracket`).
 * Runs the bracket client-side over question.options, padded to the next power
 * of two with byes (a bye auto-advances its opponent). Each round shows its
 * matchups; tapping a contender advances it. When the round is fully decided
 * the next round seeds from the winners; the last contender is the champion
 * and auto-submits { winner } after the v5 560ms beat. Tap-only by design
 * (RAILS: works at 375px); Skip never reaches onSubmit. A bracket can only be
 * submitted complete (a champion), so there is no partial early submit — but
 * skipping mid-bracket records nothing, honouring the skip rail.
 */
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { useDelayedSubmit } from "./useDelayedSubmit";

const BYE = "__bye__";

/** next power of two ≥ n (min 2). */
function nextPow2(n: number): number {
  let p = 2;
  while (p < n) p *= 2;
  return p;
}

/** Pad the seed list with byes to a power-of-two field. Byes sit at the end so
 *  top seeds get the auto-advances (standard single-elim seeding). */
function buildField(keys: string[]): string[] {
  const size = nextPow2(Math.max(2, keys.length));
  const field = keys.slice();
  while (field.length < size) field.push(BYE);
  return field;
}

/** Pair a round's contenders into [a, b] matchups (in order). */
function pairUp(round: string[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < round.length; i += 2) {
    pairs.push([round[i], round[i + 1]]);
  }
  return pairs;
}

export function Bracket({ question, onSubmit, submitting }: InteractionProps) {
  const labelByKey = useMemo(
    () => new Map(question.options.map((o) => [o.key, o.label])),
    [question.options]
  );

  // the full field (with byes) never changes; the live round shrinks each round.
  const [round, setRound] = useState<string[]>(() =>
    buildField(question.options.map((o) => o.key))
  );
  // winners accumulated within the round currently being played.
  const [winners, setWinners] = useState<string[]>([]);
  const [decided, setDecided] = useState<Record<number, string>>({});
  const [roundNo, setRoundNo] = useState(1);
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const pairs = useMemo(() => pairUp(round), [round]);
  const busy = counting || submitting;

  function advanceRound(nextWinners: string[]) {
    if (nextWinners.length === 1) {
      // champion crowned
      setCounting(true);
      submitAfter(560, { winner: nextWinners[0] }, () => setCounting(false));
      return;
    }
    setRound(nextWinners);
    setWinners([]);
    setDecided({});
    setRoundNo((n) => n + 1);
  }

  function pickWinner(pairIdx: number, key: string) {
    if (busy || key === BYE || decided[pairIdx] !== undefined) return;
    const nextDecided = { ...decided, [pairIdx]: key };
    const nextWinners = [...winners, key];
    setDecided(nextDecided);
    setWinners(nextWinners);
    // auto-resolve any remaining bye matchups so the round can complete on taps
    // alone (a pair with a bye has only one real contender).
    let resolvedWinners = nextWinners;
    let resolvedDecided = nextDecided;
    pairs.forEach(([a, b], i) => {
      if (resolvedDecided[i] !== undefined) return;
      const real = a === BYE ? (b === BYE ? null : b) : b === BYE ? a : null;
      if (real) {
        resolvedDecided = { ...resolvedDecided, [i]: real };
        resolvedWinners = [...resolvedWinners, real];
      }
    });
    if (resolvedDecided !== nextDecided) {
      setDecided(resolvedDecided);
      setWinners(resolvedWinners);
    }
    // round complete when every pair has a winner — keep matchup order.
    if (Object.keys(resolvedDecided).length === pairs.length) {
      const ordered = pairs.map((_, i) => resolvedDecided[i]);
      advanceRound(ordered);
    }
  }

  const roundName =
    pairs.length === 1 ? "Final" : pairs.length === 2 ? "Semi-finals" : `Round ${roundNo}`;

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <span className="font-label text-[11px] uppercase tracking-[0.14em] text-muted">
          Tap the winner of each matchup
        </span>
        <span className="shrink-0 rounded-lg border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-[11px] font-bold uppercase tracking-[0.06em]">
          {roundName}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={roundNo}
          initial={reduceMotion ? false : { opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, x: -18 }}
          transition={{ duration: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
          className="flex flex-col gap-3"
        >
          {pairs.map(([a, b], i) => {
            const won = decided[i];
            return (
              <div
                key={`${roundNo}-${i}`}
                className="flex items-stretch gap-2 rounded-lg border-2 border-ink bg-paper p-2"
              >
                {[a, b].map((key, side) => {
                  const isBye = key === BYE;
                  const isWinner = won === key;
                  const isLoser = won !== undefined && won !== key && !isBye;
                  return (
                    <button
                      key={`${key}-${side}`}
                      type="button"
                      data-testid="option"
                      onClick={() => pickWinner(i, key)}
                      disabled={busy || isBye || won !== undefined}
                      className={`flex min-h-[52px] flex-1 items-center justify-center rounded-md border-2 border-ink px-3 py-2 text-center font-ui text-[14.5px] font-semibold transition-all duration-150 ${
                        isBye
                          ? "cursor-default border-dashed bg-paper-edge text-muted"
                          : isWinner
                            ? "bg-lime shadow-[3px_3px_0_var(--ink)]"
                            : isLoser
                              ? "bg-paper-edge text-muted line-through"
                              : "bg-paper-bright hover:-translate-y-0.5 hover:bg-lime/40"
                      }`}
                    >
                      {isBye ? "— bye —" : labelByKey.get(key)}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 text-center font-label text-[10px] uppercase tracking-[0.1em] text-muted">
        {counting ? "Champion locked — counting…" : `${pairs.length} ${pairs.length === 1 ? "matchup" : "matchups"} this round`}
      </div>
    </div>
  );
}
