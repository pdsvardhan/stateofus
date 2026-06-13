"use client";
/**
 * ReactionBar — v5 "Rate the question" row (prototype lines 932–939) with the
 * REA1 *quiet reveal* preserved (owner decision): counts stay hidden until YOU
 * react, then surface with a pop confirm. One bordered paper row: label left,
 * two PILL thumbs, selected up→lime / down→fire-tint. After voting, a green
 * "Noted ✓ · your signal shapes tomorrow's edition" line appears.
 *
 * Same thumb again un-reacts (counts hide again). The reactions API only
 * returns counts once you've reacted — matched here, no pre-vote count.
 */
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Counts = { up: number; down: number };

export function ReactionBar({ questionId }: { questionId: string }) {
  const reduced = useReducedMotion();
  const [yours, setYours] = useState<"up" | "down" | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [popped, setPopped] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    let live = true;
    fetch(`/api/questions/${questionId}/reactions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!live || !d) return;
        setYours(d.yours ?? null);
        if (d.yours && d.counts) setCounts(d.counts); // quiet: only after reacting
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [questionId]);

  async function react(kind: "up" | "down") {
    const res = await fetch("/api/reactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question_id: questionId, kind }),
    });
    if (!res.ok) return;
    const d = (await res.json()) as { yours: "up" | "down" | null; counts: Counts };
    setYours(d.yours);
    setCounts(d.yours ? d.counts : null);
    if (d.yours) {
      setPopped(d.yours);
      setTimeout(() => setPopped(null), 500);
    }
  }

  const thumb = (kind: "up" | "down", glyph: string, label: string) => {
    const on = yours === kind;
    return (
      <motion.button
        type="button"
        onClick={() => react(kind)}
        whileHover={reduced ? undefined : { y: -2, scale: 1.08 }}
        animate={popped === kind && !reduced ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        aria-pressed={on}
        aria-label={label}
        className={`flex min-h-[44px] items-center gap-2 rounded-full border-2 border-ink px-[14px] py-2 font-ui text-sm font-bold text-ink ${
          on ? (kind === "up" ? "bg-lime" : "bg-fire-tint") : "bg-paper-bright"
        }`}
      >
        <span aria-hidden>{glyph}</span>
        {yours && counts && (
          <span className="font-label text-[12px] font-bold">
            {(kind === "up" ? counts.up : counts.down).toLocaleString("en-IN")}
          </span>
        )}
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2.5 rounded-[10px] border-2 border-ink bg-paper-bright px-[18px] py-[13px]">
        <span className="flex-1 font-label text-[10px] uppercase tracking-[.12em] text-muted">
          Rate the question
        </span>
        {thumb("up", "👍", "This question was worth answering")}
        {thumb("down", "👎", "Not for me")}
      </div>
      {yours && (
        <div className="font-label text-[9.5px] font-bold uppercase tracking-[.1em] text-agree">
          Noted ✓ · your signal shapes tomorrow&rsquo;s edition
        </div>
      )}
    </div>
  );
}

export default ReactionBar;
