"use client";
/**
 * DvSwitcher — v5 pill-tab group (prototype lines 561–570). The result-left
 * column opens with a "The count" header row: ink tag + 2px ink hairline rule,
 * and — when a question carries >1 DV — a rounded pill-group of DV tabs on the
 * right (active tab filled ink, inactive transparent). Rise transition on DV
 * swap unchanged (SW1 locked winner).
 *
 * CountHeader is exported so the single-DV path in ExperienceClient renders the
 * same "The count" header (without the pill group) above its chart.
 */
import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DvDefinition } from "@/lib/dv/registry";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { EASE, useMotionPrefs } from "./chrome";

/** v5 "The count" header: ink tag + hairline rule + optional right-side slot. */
export function CountHeader({ children }: { children?: ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <span className="rounded bg-ink px-[11px] py-[5px] font-label text-[10px] font-bold uppercase tracking-[.22em] text-paper">
        The count
      </span>
      <span aria-hidden className="h-0.5 flex-1 bg-ink" />
      {children}
    </div>
  );
}

export function DvSwitcher({
  defs,
  question,
  result,
}: {
  defs: DvDefinition[];
  question: QuestionPublic;
  result: QuestionResult;
}) {
  const prefs = useMotionPrefs();
  const [activeId, setActiveId] = useState(defs[0]?.id);
  const active = defs.find((d) => d.id === activeId) ?? defs[0];
  if (!active) return null;
  const Active = active.Component;

  return (
    <div>
      <CountHeader>
        <div
          role="tablist"
          aria-label="Ways to read this result"
          className="inline-flex rounded-full border-2 border-ink bg-paper p-[3px] align-middle"
        >
          {defs.map((d) => {
            const on = d.id === active.id;
            return (
              <button
                key={d.id}
                role="tab"
                aria-selected={on}
                onClick={() => setActiveId(d.id)}
                className={`rounded-full px-[14px] py-[7px] font-label text-[10px] font-bold uppercase tracking-[.08em] transition-colors duration-200 ${
                  on ? "bg-ink text-lime" : "bg-transparent text-ink"
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </CountHeader>

      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={prefs.reduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefs.reduced ? { opacity: 1 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Active question={question} result={result} dvId={active.id} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default DvSwitcher;
