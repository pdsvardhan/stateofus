"use client";
/**
 * Feed row — v5 Netflix-style sectioned row with peek-&-page paging (prototype
 * lines 126–141): bold uppercase title + mono sub + rule + count + prev/next
 * circles; the card track slides via translateX on the springy cubic-bezier
 * (no native scrollbar). Buttons gate (fade + disable) at each end.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { DiscoveryCard } from "@/lib/discovery/queries";
import { QuestionCard } from "@/components/discovery/QuestionCard";

export function FeedRow({
  title,
  sub,
  cards,
}: {
  title: string;
  sub?: string;
  cards: DiscoveryCard[];
}) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);

  const measure = useCallback(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;
    const max = Math.max(0, tr.scrollWidth - vp.clientWidth);
    setMaxOffset(max);
    setOffset((o) => Math.min(o, max));
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure, cards.length]);

  const page = (dir: 1 | -1) => {
    const vp = viewportRef.current;
    const step = (vp ? vp.clientWidth : 600) * 0.85;
    setOffset((o) => Math.max(0, Math.min(maxOffset, o + dir * step)));
  };

  if (cards.length === 0) return null;
  const paged = maxOffset > 1;
  const atStart = offset <= 1;
  const atEnd = offset >= maxOffset - 1;

  return (
    <section aria-label={title}>
      <div className="mb-3 flex items-baseline gap-3">
        <span className="font-ui font-black uppercase" style={{ fontSize: 20, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          {title}
        </span>
        {sub && (
          <span className="font-label uppercase" style={{ fontSize: 10, letterSpacing: "0.12em", color: "var(--muted)", whiteSpace: "nowrap" }}>
            {sub}
          </span>
        )}
        <span style={{ flex: 1, height: 2, background: "rgba(24,22,42,.22)" }} />
        <span className="font-label uppercase" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--muted)" }}>
          {cards.length} question{cards.length === 1 ? "" : "s"}
        </span>
        {paged && (
          <>
            <RowBtn label="Scroll left" onClick={() => page(-1)} disabled={atStart}>
              ←
            </RowBtn>
            <RowBtn label="Scroll right" onClick={() => page(1)} disabled={atEnd}>
              →
            </RowBtn>
          </>
        )}
      </div>
      <div ref={viewportRef} style={{ overflow: "hidden", padding: "4px 4px 16px" }}>
        <div
          ref={trackRef}
          className="flex items-stretch gap-4"
          style={{
            transform: `translateX(-${offset}px)`,
            transition: "transform .55s cubic-bezier(.22,1.2,.36,1)",
          }}
        >
          {cards.map((c) => (
            <QuestionCard key={c.id} card={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function RowBtn({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-full border-2 border-ink font-extrabold transition-[opacity,background] hover:bg-lime"
      style={{
        background: "var(--paper)",
        fontSize: 14,
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? "none" : "auto",
      }}
    >
      {children}
    </button>
  );
}
