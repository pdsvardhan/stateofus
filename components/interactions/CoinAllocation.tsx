"use client";

/**
 * Coin Allocation — spend your 10 coins across the options (v5 `coins`).
 * Each option row has −/＋ tap steppers; a running "coins left" counter starts
 * at the budget (10) and ＋ disables once it hits zero. Tap-only by design
 * (RAILS: works at 375px, no drag). A partial spend is a valid early submit —
 * "Lock my coins" enables as soon as at least one coin is placed; Skip never
 * reaches onSubmit. Submits { alloc } (option key → coins) after the v5 520ms
 * beat. Options with zero coins are dropped from the payload.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { COIN_BUDGET } from "@/lib/interactions/payloads";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function CoinAllocation({ question, onSubmit, submitting }: InteractionProps) {
  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [counting, setCounting] = useState(false);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  const spent = Object.values(alloc).reduce((a, b) => a + b, 0);
  const left = COIN_BUDGET - spent;
  const busy = counting || submitting;
  const canSubmit = spent >= 1 && !busy;

  function step(key: string, by: 1 | -1) {
    if (busy) return;
    setAlloc((cur) => {
      const next = Math.max(0, (cur[key] ?? 0) + by);
      if (by === 1 && left <= 0) return cur; // budget exhausted
      const out = { ...cur, [key]: next };
      if (out[key] === 0) delete out[key];
      return out;
    });
  }

  function lock() {
    if (!canSubmit) return;
    // drop zero entries; refine on the server also guards 1..BUDGET
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(alloc)) if (v > 0) payload[k] = v;
    if (Object.keys(payload).length === 0) return;
    setCounting(true);
    submitAfter(520, { alloc: payload }, () => setCounting(false));
  }

  return (
    <div>
      <div className="mb-3.5 flex items-center justify-between gap-3">
        <span className="font-label text-[11px] uppercase tracking-[0.14em] text-muted">
          Spend your {COIN_BUDGET} coins — more coins, stronger vote
        </span>
        <span
          className={`shrink-0 rounded-lg border-2 border-ink px-3 py-1.5 font-label text-[12px] font-bold uppercase tracking-[0.06em] ${
            left === 0 ? "bg-lime" : "bg-paper-bright"
          }`}
        >
          {left} left
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {question.options.map((o, i) => {
          const coins = alloc[o.key] ?? 0;
          return (
            <motion.div
              key={o.key}
              data-testid="option"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: reduceMotion ? 0 : i * 0.05 }}
              className={`flex min-h-[58px] items-center gap-3 rounded-lg border-2 border-ink px-3.5 py-2.5 font-ui ${
                coins > 0 ? "bg-lime" : "bg-paper-bright"
              }`}
            >
              <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded border-[1.5px] border-ink bg-paper font-label text-[11px] font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-[15.5px] font-semibold leading-tight">{o.label}</span>
              <span
                aria-label={`${coins} coins on ${o.label}`}
                className="w-7 shrink-0 text-center font-ui text-[18px] font-extrabold tabular-nums"
              >
                {coins}
              </span>
              <button
                type="button"
                aria-label={`Remove a coin from ${o.label}`}
                onClick={() => step(o.key, -1)}
                disabled={busy || coins === 0}
                className="h-9 w-9 shrink-0 rounded-lg border-2 border-ink bg-paper font-ui text-base font-extrabold transition-all duration-150 hover:-translate-y-0.5 hover:bg-fire-tint disabled:opacity-40 disabled:hover:translate-y-0"
              >
                −
              </button>
              <button
                type="button"
                aria-label={`Add a coin to ${o.label}`}
                onClick={() => step(o.key, 1)}
                disabled={busy || left === 0}
                className="h-9 w-9 shrink-0 rounded-lg border-2 border-ink bg-paper font-ui text-base font-extrabold transition-all duration-150 hover:-translate-y-0.5 hover:bg-lime disabled:opacity-40 disabled:hover:translate-y-0"
              >
                ＋
              </button>
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={lock}
        disabled={!canSubmit}
        className="mt-[18px] min-h-[56px] w-full rounded-lg border-2 border-ink bg-ink p-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[0.04em] text-paper transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_var(--ink-soft)] disabled:translate-x-0 disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none"
      >
        {counting ? "Locked — counting…" : "Lock my coins"} <span className="text-lime">→</span>
      </button>
    </div>
  );
}
