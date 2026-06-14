"use client";

/**
 * Surprise me — SUR1: masthead lime pill (dice animation) AND floating die FAB.
 * Routes to a random unanswered question via /api/questions/next.
 *
 * FAB follows the v5 prototype (line 1046): a DARK ink circle, dice wobbles
 * continuously, hover scales + rotates and flips to fire. (Not the lime square.)
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
        whileHover={reduced ? undefined : { scale: 1.14, rotate: -12 }}
        whileTap={reduced ? undefined : { rotate: 180 }}
        className="fixed bottom-6 right-[22px] z-[70] flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-ink text-[22px] transition-colors duration-200 hover:bg-fire"
        style={{ boxShadow: "5px 5px 0 color-mix(in srgb, var(--ink) 30%, transparent)" }}
        aria-label="Surprise me with a random question"
      >
        <span
          aria-hidden
          style={{ display: "inline-block", animation: reduced ? undefined : "cwWobble 5s ease-in-out infinite" }}
        >
          🎲
        </span>
      </motion.button>
    );
  }

  return (
    <button
      onClick={go}
      disabled={busy}
      className="inline-flex items-center gap-[7px] font-ui font-extrabold uppercase text-ink transition-[transform,box-shadow] duration-150 hover:[transform:translate(-1px,-2px)] hover:shadow-[3px_3px_0_var(--ink)] disabled:opacity-60"
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
