"use client";
/**
 * Shared DV chrome — feat-dv-engine.
 *
 * The house pieces every renderer leans on: the bordered plate, mono
 * captions, the visible sample count (every renderer must surface
 * result.sample_n), the YOU tag, the cwGrow/cwRise equivalents in
 * framer-motion, and the reduced-motion gate (CA-001).
 */
import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatCount } from "@/lib/dv/transforms";
import { inkVeil } from "@/lib/dv/palette";

/** v5 cubic-bezier(.2,.7,.2,1) — bars, rises, pops. */
export const EASE: [number, number, number, number] = [0.2, 0.7, 0.2, 1];
/** v5 cubic-bezier(.65,0,.35,1) — liquid floods. */
export const FLOOD_EASE: [number, number, number, number] = [0.65, 0, 0.35, 1];

export function useMotionPrefs() {
  const reduced = !!useReducedMotion();
  return {
    reduced,
    /** duration in seconds, zeroed under prefers-reduced-motion */
    dur: (s: number) => (reduced ? 0 : s),
    delay: (s: number) => (reduced ? 0 : s),
  };
}

/** Mono label style — never below the 10px floor (CA-009). */
export function mono(size = 10, letterSpacing = ".12em"): CSSProperties {
  return {
    fontFamily: "var(--font-label)",
    fontSize: Math.max(10, size),
    letterSpacing,
    textTransform: "uppercase",
  };
}

export function Plate({
  dark = false,
  style,
  children,
}: {
  dark?: boolean;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        border: "2px solid var(--ink)",
        borderRadius: 12,
        background: dark ? "var(--ink)" : "var(--paper-bright)",
        boxShadow: dark ? `6px 6px 0 ${inkVeil(35)}` : "6px 6px 0 var(--ink)",
        padding: 26,
        color: dark ? "var(--paper)" : "var(--ink)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Caption({
  children,
  color = "var(--muted)",
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  return <div style={{ ...mono(10, ".14em"), color, ...style }}>{children}</div>;
}

/** The visible sample size — “1,204 counted”, Space Mono, 10px floor. */
export function SampleLine({
  n,
  color = "var(--muted)",
  style,
}: {
  n: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={{ ...mono(10, ".12em"), color, marginTop: 14, ...style }}>
      {formatCount(n)} counted
    </div>
  );
}

/** The ink-on-lime YOU stamp the prototype puts on the reader's answer. */
export function YouTag({
  label = "You",
  style,
}: {
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        ...mono(10, ".1em"),
        fontWeight: 700,
        background: "var(--ink)",
        color: "var(--lime)",
        borderRadius: 3,
        padding: "2px 7px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

/** cwRise — fade up into place. */
export function Rise({
  delay = 0,
  duration = 0.45,
  style,
  children,
}: {
  delay?: number;
  duration?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const prefs = useMotionPrefs();
  return (
    <motion.div
      initial={prefs.reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: prefs.dur(duration), delay: prefs.delay(delay), ease: EASE }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** cwGrow — a bordered track with a scaleX-growing fill. */
export function GrowBar({
  pct,
  fill,
  track = "var(--paper-edge)",
  height = 10,
  delay = 0,
  duration = 0.7,
  bordered = true,
  style,
}: {
  pct: number;
  fill: string;
  track?: string;
  height?: number;
  delay?: number;
  duration?: number;
  bordered?: boolean;
  style?: CSSProperties;
}) {
  const prefs = useMotionPrefs();
  return (
    <div
      style={{
        height,
        border: bordered ? "1.5px solid var(--ink)" : "none",
        borderRadius: 100,
        background: track,
        overflow: "hidden",
        ...style,
      }}
    >
      <motion.div
        initial={prefs.reduced ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: prefs.dur(duration), delay: prefs.delay(delay), ease: EASE }}
        style={{
          height: "100%",
          width: `${Math.max(0, Math.min(100, pct))}%`,
          background: fill,
          transformOrigin: "left",
          borderRadius: bordered ? 0 : 100,
        }}
      />
    </div>
  );
}

/** The sloshing surface inside cups and coins (cwSpin, gated for CA-001). */
export function LiquidWave({
  size = "large",
  tint,
}: {
  size?: "large" | "small";
  tint: string;
}) {
  const prefs = useMotionPrefs();
  if (prefs.reduced) return null; // JS-driven loop — explicitly killed
  const h = size === "large" ? 28 : 22;
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: size === "large" ? 3.6 : 3, ease: "linear" }}
      style={{
        position: "absolute",
        left: "-55%",
        top: -(h / 2),
        width: "210%",
        height: h,
        background: tint,
        borderRadius: "42%",
      }}
    />
  );
}
