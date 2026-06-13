"use client";

/**
 * Surprise me — SUR1: masthead lime pill (dice animation) AND floating die FAB.
 * Routes to a random unanswered question via /api/questions/next.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export function SurpriseMe({ variant }: { variant: "masthead" | "fab" }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [spin, setSpin] = useState(0);

  async function go() {
    if (busy) return;
    setBusy(true);
    setSpin((s) => s + 1);
    try {
      const res = await fetch("/api/questions/next");
      if (res.ok) {
        const { question_id } = (await res.json()) as { question_id: string };
        router.push(`/q/${question_id}`);
      }
    } finally {
      setBusy(false);
    }
  }

  if (variant === "fab") {
    return (
      <motion.button
        onClick={go}
        disabled={busy}
        whileHover={reduced ? undefined : { rotate: 18, scale: 1.06 }}
        whileTap={reduced ? undefined : { rotate: 180 }}
        className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center border-2 border-ink bg-lime text-2xl"
        style={{ boxShadow: "4px 4px 0 var(--ink)" }}
        aria-label="Surprise me with a random question"
      >
        🎲
      </motion.button>
    );
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="inline-flex items-center gap-[7px] font-ui font-extrabold uppercase text-ink transition-transform disabled:opacity-60"
      style={{
        fontSize: 12,
        letterSpacing: "0.04em",
        border: "2px solid var(--ink)",
        borderRadius: 100,
        background: "var(--lime)",
        padding: "8px 14px",
      }}
    >
      <span
        key={spin}
        style={{ display: "inline-block", animation: reduced ? undefined : "cwDice .6s cubic-bezier(.2,.7,.2,1)" }}
      >
        🎲
      </span>{" "}
      Surprise me
    </button>
  );
}
