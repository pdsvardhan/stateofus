"use client";
/**
 * SW1 DV switcher — pill tabs + rise transition (the locked v4 Lab winner).
 * Tabs only render when a question carries >1 supported DV; the parent
 * handles still-counting before we ever mount.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { DvDefinition } from "@/lib/dv/registry";
import type { QuestionPublic, QuestionResult } from "@/lib/types";
import { EASE, useMotionPrefs } from "./chrome";

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
      <div role="tablist" aria-label="Ways to read this result" className="mb-3 flex flex-wrap gap-2">
        {defs.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={d.id === active.id}
            onClick={() => setActiveId(d.id)}
            className={`border-2 border-ink px-3 py-1 font-label text-xs font-bold tracking-wider uppercase transition-transform ${
              d.id === active.id
                ? "bg-ink text-paper-bright"
                : "bg-paper-bright text-ink hover:-translate-y-0.5"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
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
