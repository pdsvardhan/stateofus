"use client";

/**
 * Surprise me — SUR1: masthead button AND floating die FAB (both shipped,
 * per the locked v4 Lab outcome). Routes to a random unanswered question
 * via the /api/questions/next primitive.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export function SurpriseMe({ variant }: { variant: "masthead" | "fab" }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
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
        whileHover={reduced ? undefined : { rotate: 20, scale: 1.06 }}
        whileTap={reduced ? undefined : { rotate: 180 }}
        className="fixed bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center border-2 border-ink bg-lime text-2xl shadow-[4px_4px_0_var(--ink)]"
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
      className="border-2 border-ink bg-lime px-4 py-1.5 font-label text-sm font-bold tracking-wider text-ink uppercase transition-transform hover:-translate-y-0.5 disabled:opacity-60"
    >
      🎲 Surprise me
    </button>
  );
}
