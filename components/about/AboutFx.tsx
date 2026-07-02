"use client";

/**
 * About page motion layer — iter-6 item-413 (report #50 [12], owner picked
 * "editorial motion pass" 2026-07-02). Scroll-reveals, tilt-on-hover ledger
 * cards, a rubber-stamp entrance for the promise plate, and staggered chip
 * pops — all inside the house rules: 300–700ms, motion explains (sections
 * arrive as you read, the promise lands like a stamp), reduced-motion renders
 * everything static. Client layer; the page stays a server component.
 */
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

const SETTLE = [0.2, 0.7, 0.2, 1] as const;
const SPRINGY = [0.34, 1.56, 0.64, 1] as const;

/** Scroll-reveal: rises into place once, as the reader reaches it. */
export function Reveal({
  children,
  delay = 0,
  y = 24,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: SETTLE }}
    >
      {children}
    </motion.div>
  );
}

/** Ledger card: newspaper hover — lift toward the reader with a hard ink
 *  shadow and the faintest tilt, like picking a card off the desk. */
export function TiltCard({
  children,
  style,
  tilt = -0.8,
}: {
  children: ReactNode;
  style?: CSSProperties;
  tilt?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      style={style}
      whileHover={
        reduced
          ? undefined
          : { rotate: tilt, y: -5, x: -2, boxShadow: "6px 6px 0 var(--ink)" }
      }
      transition={{ duration: 0.3, ease: SPRINGY }}
    >
      {children}
    </motion.div>
  );
}

/** Promise plate: lands like a rubber stamp — slightly oversized and rotated,
 *  settling into a resting -0.4° press. Hover re-squares it. */
export function StampIn({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div style={style}>{children}</div>;
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0, scale: 1.08, rotate: -2 }}
      whileInView={{ opacity: 1, scale: 1, rotate: -0.4 }}
      viewport={{ once: true, margin: "-60px" }}
      whileHover={{ rotate: 0 }}
      transition={{ duration: 0.45, ease: SPRINGY }}
    >
      {children}
    </motion.div>
  );
}

/** Pipeline chip pop — scales in with a small overshoot; staggered by index. */
export function PopIn({
  children,
  index = 0,
}: {
  children: ReactNode;
  index?: number;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <span style={{ display: "inline-flex" }}>{children}</span>;
  return (
    <motion.span
      style={{ display: "inline-flex" }}
      initial={{ opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: 0.3 + index * 0.09, ease: SPRINGY }}
    >
      {children}
    </motion.span>
  );
}
