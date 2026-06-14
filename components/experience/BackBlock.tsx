"use client";

/**
 * BK2 back button — v5 prototype (lines 342 / 531): ink block, LIME arrow that
 * nudges continuously (cwNudge), "Back" in Archivo 800 uppercase inside the
 * block. ESC works as a silent shortcut (LAB-005, no visible keycap).
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
    <button
      onClick={() => router.push(href)}
      className="group inline-flex min-h-[44px] items-center gap-2.5 rounded-[9px] border-2 border-ink bg-ink px-4 py-2.5 text-paper shadow-[3px_3px_0_color-mix(in_srgb,var(--ink)_25%,transparent)] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_color-mix(in_srgb,var(--ink)_45%,transparent)]"
      aria-label="Back to the front page"
    >
      <motion.span
        aria-hidden
        className="text-xl font-black leading-none text-lime"
        animate={reduced ? undefined : { x: [0, -4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        ←
      </motion.span>
      <span className="font-ui text-[13px] font-extrabold uppercase tracking-[.05em]">
        Back
      </span>
    </button>
  );
}
