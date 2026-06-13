"use client";

/**
 * BK2 back button — ink block, arrow + "Back" INSIDE the block, arrow nudges
 * on hover (LAB-004). No side text, no visible ESC keycap (LAB-005) — ESC
 * still works as a silent shortcut.
 */
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export function BackBlock({ href = "/" }: { href?: string }) {
  const router = useRouter();
  const reduced = useReducedMotion();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.push(href);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, href]);

  return (
    <motion.button
      onClick={() => router.push(href)}
      whileHover={reduced ? undefined : "hover"}
      className="group flex items-center gap-2 border-2 border-ink bg-ink px-3 py-1.5 font-label text-sm font-bold text-paper-bright"
      aria-label="Back to the front page"
    >
      <motion.span
        variants={{ hover: { x: [-1, -5, -1] } }}
        transition={{ duration: 0.45, repeat: Infinity, repeatDelay: 0.2 }}
        aria-hidden
      >
        ←
      </motion.span>
      Back
    </motion.button>
  );
}
