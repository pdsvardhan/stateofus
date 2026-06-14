"use client";

/**
 * The Big Question hero — faithful port of the v5 carousel hero.
 * Cream dot-grid card, hard ink shadow, colored corner disc, "The big question"
 * + desk tag, Spectral question, meta + ANSWER IT, 9s fire progress bar, then
 * ← dots → controls. Pauses on hover (NEW-04); reduced-motion drops auto-advance.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";
import type { DiscoveryCard } from "@/lib/discovery/queries";

const INTERVAL = 9000;
const DISCS = ["var(--fire)", "var(--lime)", "var(--gold)", "var(--blue)", "var(--pink)"];

export function Hero({ heroes }: { heroes: DiscoveryCard[] }) {
  const router = useRouter();
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (reduced || paused || heroes.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % heroes.length), INTERVAL);
    return () => clearInterval(t);
  }, [reduced, paused, heroes.length]);

  if (heroes.length === 0) return null;
  const hero = heroes[idx];
  const desk = DESK_BY_CATEGORY[hero.category as Category];
  const disc = DISCS[idx % DISCS.length];
  const open = () => router.push(`/q/${hero.id}`);

  return (
    <div style={{ position: "relative", marginBottom: 30 }}>
      <div
        onClick={open}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        role="link"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && open()}
        className="group min-h-[340px] shadow-[7px_7px_0_var(--ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[9px_9px_0_var(--ink)] exp:min-h-[280px]"
        style={{
          border: "2px solid var(--ink)",
          borderRadius: 12,
          background: "var(--paper-bright)",
          backgroundImage: "radial-gradient(rgba(24,22,42,.08) 1.5px, transparent 1.5px)",
          backgroundSize: "11px 11px",
          padding: "26px 28px 32px",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            right: -40,
            top: -40,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: disc,
            border: "2px solid var(--ink)",
            opacity: 0.92,
            transition: "background .5s",
          }}
        />
        <div
          key={hero.id}
          style={{
            animation: reduced ? undefined : "cwFadeSwap .45s cubic-bezier(.2,.7,.2,1)",
            position: "relative",
            minHeight: 175,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="flex items-center gap-[9px]">
            <span
              className="font-label uppercase"
              style={{ fontSize: 10, letterSpacing: "0.16em", background: "var(--ink)", color: "var(--lime)", borderRadius: 4, padding: "4px 9px" }}
            >
              The big question
            </span>
            {desk && (
              <span
                className="font-label uppercase text-ink"
                style={{ fontSize: 10, letterSpacing: "0.12em", border: "1.5px solid var(--ink)", borderRadius: 4, padding: "3px 8px", background: desk.color }}
              >
                {desk.desk}
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: "var(--font-editorial)",
              fontWeight: 600,
              fontSize: "clamp(23px, 3vw, 30px)",
              lineHeight: 1.1,
              maxWidth: 600,
              flex: 1,
            }}
          >
            {hero.text}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <span className="font-label uppercase" style={{ fontSize: 11, letterSpacing: "0.1em", color: "var(--muted)" }}>
              {hero.sample_n > 0 ? `${hero.sample_n.toLocaleString("en-IN")} voted` : "Fresh off the press"} ·{" "}
              {hero.mode.replace(/_/g, " ")} · under a minute
            </span>
            <span
              className="font-ui font-extrabold uppercase"
              style={{ fontSize: 14, letterSpacing: "0.04em", background: "var(--ink)", color: "var(--paper)", borderRadius: 7, padding: "12px 18px", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              Answer it <span style={{ color: "var(--lime)" }}>→</span>
            </span>
          </div>
        </div>
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, background: "rgba(24,22,42,.12)" }}>
          <div
            key={`bar-${hero.id}`}
            style={{
              height: "100%",
              background: "var(--fire)",
              animation: reduced || heroes.length < 2 ? undefined : "cwProgress 9s linear both",
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2.5">
        <CarBtn label="Previous" onClick={() => setIdx((i) => (i - 1 + heroes.length) % heroes.length)}>←</CarBtn>
        {heroes.map((h, i) => (
          <button
            key={h.id}
            onClick={() => setIdx(i)}
            aria-label={`Question ${i + 1}`}
            style={{ width: i === idx ? 28 : 11, height: 11, borderRadius: 100, border: "1.5px solid var(--ink)", background: i === idx ? "var(--ink)" : "var(--paper)", padding: 0, transition: "all .3s" }}
          />
        ))}
        <CarBtn label="Next" onClick={() => setIdx((i) => (i + 1) % heroes.length)}>→</CarBtn>
        <span className="font-label" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)" }}>
          {idx + 1}/{heroes.length}
        </span>
      </div>
    </div>
  );
}

function CarBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="inline-flex items-center justify-center font-extrabold transition-[transform,box-shadow,background] hover:-translate-x-px hover:-translate-y-px hover:bg-lime hover:shadow-[2px_2px_0_var(--ink)]"
      style={{ border: "2px solid var(--ink)", borderRadius: "50%", width: 36, height: 36, background: "var(--paper)", fontSize: 14, padding: 0 }}
    >
      {children}
    </button>
  );
}
