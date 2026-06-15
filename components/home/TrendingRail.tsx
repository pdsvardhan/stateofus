/**
 * "Heating up · live" rail — faithful port. Dark ink card, animated flame,
 * numbered trending list (icon box + Spectral text + ▲ velocity + meta).
 * Sort is numeric on real counts (NEW-01 regression lives in lib/discovery).
 */
import Link from "next/link";
import type { DiscoveryCard } from "@/lib/discovery/queries";
import { DESK_BY_CATEGORY, type Category } from "@/lib/catalogue/enums";

export function TrendingRail({ cards }: { cards: DiscoveryCard[] }) {
  if (cards.length === 0) return null;
  return (
    <aside
      aria-label="Heating up"
      style={{ border: "2px solid var(--ink)", borderRadius: 10, background: "var(--ink)", color: "var(--paper)", padding: 22 }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span aria-hidden style={{ fontSize: 18, display: "inline-block", transformOrigin: "50% 90%", animation: "cwFlame 1.1s ease-in-out infinite" }}>
          🔥
        </span>
        <span className="font-label uppercase" style={{ fontSize: 10.5, letterSpacing: "0.18em", color: "var(--lime)" }}>
          Heating up · live
        </span>
      </div>
      <div className="flex flex-col gap-3.5">
        {cards.map((c, i) => (
          <Link
            key={c.id}
            href={`/q/${c.id}`}
            className="group flex gap-3"
            style={{ borderBottom: "1px solid rgba(242,236,223,.18)", paddingBottom: 13 }}
          >
            <span
              className="font-label font-bold"
              style={{ fontSize: 12, color: "var(--lime)", width: 30, height: 26, flexShrink: 0, textAlign: "center", border: "1.5px solid rgba(242,236,223,.28)", borderRadius: 6, display: "inline-flex", alignItems: "center", justifyContent: "center", alignSelf: "flex-start" }}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div style={{ fontFamily: "var(--font-editorial)", fontSize: 14.5, lineHeight: 1.25, fontWeight: 500 }} className="group-hover:text-lime">
                {c.text}
              </div>
              <div className="mt-[5px] flex items-center gap-[7px]">
                <span className="font-label font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.06em", color: "var(--lime)" }}>
                  {c.sample_n > 0 ? `${c.sample_n.toLocaleString("en-IN")} votes` : "fresh"}
                </span>
                <span className="font-label uppercase" style={{ fontSize: 9.5, letterSpacing: "0.06em", color: DESK_BY_CATEGORY[c.category as Category]?.color ?? "var(--muted-warm)" }}>
                  {DESK_BY_CATEGORY[c.category as Category]?.desk ?? c.mode.replace(/_/g, " ")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
}
