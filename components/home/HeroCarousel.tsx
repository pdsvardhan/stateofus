"use client";

/**
 * Hero carousel — 5 heroes, 9s interval (FB-005), pause on hover (NEW-04),
 * min-height + 3-line clamp so long questions never clip (CA-006).
 * Reduced motion: no auto-advance, manual dots only.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";
import type { DiscoveryCard } from "@/lib/discovery/queries";

const INTERVAL_MS = 9000;

export function HeroCarousel({ heroes }: { heroes: DiscoveryCard[] }) {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (reduced || hovered || heroes.length < 2) return;
    timer.current = setInterval(() => {
      setIdx((i) => (i + 1) % heroes.length);
    }, INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [reduced, hovered, heroes.length]);

  if (heroes.length === 0) return null;
  const hero = heroes[idx];
  const desk = DESK_BY_CATEGORY[hero.category as Category];

  return (
    <section
      aria-label="Front-page questions"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border-4 border-ink bg-paper-white"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={hero.id}
          initial={reduced ? { opacity: 1 } : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduced ? { opacity: 1 } : { opacity: 0, x: -16 }}
          transition={{ duration: 0.45 }}
          className="flex min-h-[180px] flex-col justify-between p-5 sm:min-h-[200px]"
        >
          <div className="flex items-center gap-2">
            <span className="rotate-[-3deg] border-2 border-ink bg-fire px-2 py-0.5 font-label text-xs font-bold tracking-[0.2em] text-paper-white">
              FRONT PAGE
            </span>
            {desk && (
              <span
                className="border-2 border-ink px-2 py-0.5 font-label text-[10px] font-bold tracking-wider uppercase"
                style={{ backgroundColor: desk.color }}
              >
                {desk.desk}
              </span>
            )}
          </div>
          <Link href={`/q/${hero.id}`} className="group block py-3">
            <h2 className="font-editorial text-2xl font-extrabold leading-tight text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden group-hover:underline decoration-4 decoration-[var(--lime)] sm:text-3xl">
              {hero.text}
            </h2>
          </Link>
          <div className="flex items-center justify-between">
            <span className="font-label text-xs text-muted">
              {hero.sample_n > 0
                ? `${hero.sample_n.toLocaleString("en-IN")} counted — add yours`
                : "Fresh off the press — be counted first"}
            </span>
            <div className="flex gap-1.5" role="tablist" aria-label="Hero pages">
              {heroes.map((h, i) => (
                <button
                  key={h.id}
                  role="tab"
                  aria-selected={i === idx}
                  aria-label={`Hero ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className={`h-3 w-3 border-2 border-ink ${i === idx ? "bg-ink" : "bg-paper-bright"}`}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
