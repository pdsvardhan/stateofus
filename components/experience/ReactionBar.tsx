"use client";

/**
 * REA1 quiet thumb pair — feat-reactions-sharing.
 * Counts hidden until YOU react (then revealed with a ring-pop confirm).
 * Same thumb again un-reacts. Lives on results + answered feed cards.
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
        if (live && d) {
          setYours(d.yours);
          if (d.yours) setCounts(d.counts);
        }
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

  const thumb = (kind: "up" | "down", glyph: string, label: string) => (
    <motion.button
      onClick={() => react(kind)}
      animate={
        popped === kind && !reduced ? { scale: [1, 1.25, 1] } : { scale: 1 }
      }
      transition={{ duration: 0.4 }}
      aria-pressed={yours === kind}
      aria-label={label}
      className={`relative flex items-center gap-1.5 border-2 border-ink px-2.5 py-1 font-label text-sm font-bold ${
        yours === kind ? "bg-lime text-ink" : "bg-paper-bright text-ink"
      }`}
    >
      <span aria-hidden>{glyph}</span>
      {yours && counts && (
        <span className="text-xs">
          {(kind === "up" ? counts.up : counts.down).toLocaleString("en-IN")}
        </span>
      )}
      {popped === kind && !reduced && (
        <motion.span
          initial={{ opacity: 0.8, scale: 0.6 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none absolute inset-0 border-2 border-lime"
          aria-hidden
        />
      )}
    </motion.button>
  );

  return (
    <div className="flex items-center gap-2">
      {thumb("up", "👍", "This question was worth answering")}
      {thumb("down", "👎", "Not for me")}
    </div>
  );
}
