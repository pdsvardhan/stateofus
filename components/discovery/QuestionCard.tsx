/**
 * Feed card — faithful port of the v5 prototype card. Four variants match the
 * prototype's card types (lines 150–245 of the v5 prototype):
 *   - teaser : FB-009 DV-typed ghost (blur 5px) + "🔒 Your vote is the ticket"
 *   - stat   : big % + statline + cwGrow bar (a single dominant result)
 *   - tug    : "India has decided · score" + lime/fire-tint tug-of-war bar
 *   - plain  : header + question + footer only (mode-grouped, tap to answer)
 * Default = teaser (so category/search/explore keep their lock-to-vote cards).
 */
import Link from "next/link";
import { DESK_BY_CATEGORY, type Category, type DvId } from "@/lib/catalogue/enums";
import type { DiscoveryCard } from "@/lib/discovery/queries";

const MODE_TAG: Record<string, string> = {
  quick_pick: "Quick pick",
  logo_quick_pick: "Logo pick",
  tradeoff_cards: "Trade-off",
  swipe_stack: "Swipe stack",
  bucket_sort: "Bucket sort",
  tier_placement: "Tier placement",
  rank_order: "Rank order",
  podium_slots: "Podium",
};

/** primary DV id → which ghost family to draw */
function ghostKind(dv: DvId): "bars" | "donut" | "podium" | "map" | "flow" | "tier" | "heat" | "treemap" {
  if (dv === "radial") return "donut";
  if (dv === "map" || dv === "bubblemap") return "map";
  if (dv === "sankey") return "flow";
  if (dv === "tier") return "tier";
  if (dv === "heatmatrix") return "heat";
  if (dv === "treemap") return "treemap";
  if (dv === "podium" || dv === "medal" || dv === "board") return "podium";
  return "bars";
}

function Ghost({ kind }: { kind: ReturnType<typeof ghostKind> }) {
  switch (kind) {
    case "donut":
      return (
        <div className="flex items-center gap-3">
          <span style={{ width: 44, height: 44, borderRadius: "50%", background: "conic-gradient(var(--fire) 0 38%, var(--gold) 38% 62%, var(--blue) 62% 83%, var(--lime) 83% 100%)", border: "1.5px solid var(--ink)", flexShrink: 0 }} />
          <span className="flex flex-1 flex-col gap-[5px]">
            <span style={{ height: 8, borderRadius: 100, background: "var(--fire)", width: "70%" }} />
            <span style={{ height: 8, borderRadius: 100, background: "var(--gold)", width: "45%" }} />
          </span>
        </div>
      );
    case "podium":
      return (
        <div className="flex items-end gap-[7px]" style={{ height: 46 }}>
          <span style={{ flex: 1, height: "60%", background: "var(--ink-soft)", borderRadius: "4px 4px 0 0" }} />
          <span style={{ flex: 1, height: "100%", background: "var(--fire)", borderRadius: "4px 4px 0 0" }} />
          <span style={{ flex: 1, height: "38%", background: "var(--muted-violet)", borderRadius: "4px 4px 0 0" }} />
        </div>
      );
    case "map":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 3, maxWidth: 150 }}>
          {[["2", "var(--fire)"], ["3", "var(--gold)"], ["4", "var(--fire)"], ["2", "var(--lime)"], ["3", "var(--fire)"], ["4", "var(--ink)"], ["3", "var(--gold)"]].map(([col, bg], i) => (
            <span key={i} style={{ gridColumn: col, aspectRatio: "1", background: bg, borderRadius: 2 }} />
          ))}
        </div>
      );
    case "flow":
      return (
        <div className="flex flex-col gap-[5px]">
          <span style={{ height: 11, background: "linear-gradient(90deg, var(--ink) 18%, var(--fire) 80%)", borderRadius: 100, width: "90%", transform: "skewY(-2deg)" }} />
          <span style={{ height: 8, background: "linear-gradient(90deg, var(--ink) 18%, var(--gold) 80%)", borderRadius: 100, width: "74%", transform: "skewY(2deg)" }} />
          <span style={{ height: 6, background: "linear-gradient(90deg, var(--ink) 18%, var(--blue) 80%)", borderRadius: 100, width: "58%", transform: "skewY(-1deg)" }} />
        </div>
      );
    case "tier":
      return (
        <div className="flex flex-col gap-[5px]">
          {[["var(--fire)", [38, 26]], ["var(--gold)", [48]], ["var(--lime)", [34]]].map(([bg, widths], r) => (
            <span key={r} className="flex items-center gap-1">
              <span style={{ width: 30, height: 13, background: bg as string, borderRadius: 3 }} />
              {(widths as number[]).map((w, i) => (
                <span key={i} style={{ width: w, height: 13, background: "var(--paper)", border: "1px solid var(--ink)", borderRadius: 100 }} />
              ))}
            </span>
          ))}
        </div>
      );
    case "heat":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 3, maxWidth: 140 }}>
          {["var(--gold)", "var(--fire)", "var(--paper-bright)", "var(--fire)", "var(--ink)", "var(--gold)", "var(--fire)", "var(--gold)"].map((bg, i) => (
            <span key={i} style={{ aspectRatio: "1.6", background: bg, border: bg === "var(--paper-bright)" ? "1px solid var(--ink)" : undefined, borderRadius: 2 }} />
          ))}
        </div>
      );
    case "treemap":
      return (
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr 1.4fr", gridTemplateRows: "24px 20px", gap: 3 }}>
          <span style={{ gridRow: "1 / 3", background: "var(--fire)", borderRadius: 3 }} />
          <span style={{ background: "var(--gold)", borderRadius: 3 }} />
          <span style={{ background: "var(--blue)", borderRadius: 3 }} />
          <span style={{ background: "var(--lime)", borderRadius: 3 }} />
          <span style={{ background: "var(--pink)", borderRadius: 3 }} />
        </div>
      );
    default:
      return (
        <div className="flex flex-col gap-1.5">
          <span style={{ height: 9, borderRadius: 100, background: "var(--fire)", width: "82%" }} />
          <span style={{ height: 9, borderRadius: 100, background: "var(--gold)", width: "64%" }} />
          <span style={{ height: 9, borderRadius: 100, background: "var(--blue)", width: "47%" }} />
        </div>
      );
  }
}

const dashTop: React.CSSProperties = { borderTop: "1.5px dashed rgba(24,22,42,.3)", paddingTop: 12 };

/** TYPE 2a — big stat (a single dominant result) */
function StatBlock({ p }: { p: Extract<NonNullable<DiscoveryCard["preview"]>, { kind: "stat" }> }) {
  return (
    <div style={dashTop}>
      <div className="flex items-baseline gap-[9px]">
        <span style={{ fontWeight: 900, fontSize: 42, letterSpacing: "-0.03em" }}>{p.pct}%</span>
        <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.25, flex: 1 }}>{p.line}</span>
      </div>
      <div style={{ height: 9, border: "1.5px solid var(--ink)", borderRadius: 100, background: "var(--paper-edge)", overflow: "hidden", marginTop: 8 }}>
        <div style={{ height: "100%", width: `${p.pct}%`, background: p.color, transformOrigin: "left", animation: "cwGrow .8s cubic-bezier(.2,.7,.2,1) both" }} />
      </div>
    </div>
  );
}

/** TYPE 2b — tug of war (two-sided result) */
function TugBlock({ p }: { p: Extract<NonNullable<DiscoveryCard["preview"]>, { kind: "tug" }> }) {
  return (
    <div style={dashTop}>
      <div className="font-label font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "var(--fire)", marginBottom: 7 }}>
        India has decided · {p.score}
      </div>
      <div className="flex justify-between gap-2" style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 5 }}>
        <span>{p.lLabel}</span>
        <span style={{ color: "var(--muted)" }}>{p.rLabel}</span>
      </div>
      <div style={{ position: "relative", height: 22, border: "2px solid var(--ink)", borderRadius: 100, overflow: "hidden", display: "flex" }}>
        <div className="font-label" style={{ width: `${p.lPct}%`, background: "var(--lime)", display: "flex", alignItems: "center", paddingLeft: 9, fontSize: 10, fontWeight: 700 }}>{p.lPct}%</div>
        <div className="font-label" style={{ flex: 1, background: "var(--fire-tint)", borderLeft: "2px solid var(--ink)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 9, fontSize: 10, fontWeight: 700 }}>{p.rPct}%</div>
      </div>
    </div>
  );
}

/** TYPE 1 — teaser (DV-typed ghost behind the lock badge) */
function TeaserBlock({ dv }: { dv: DvId }) {
  return (
    <div style={{ position: "relative", ...dashTop }}>
      <div style={{ filter: "blur(5px)", opacity: 0.7, minHeight: 44 }}>
        <Ghost kind={ghostKind(dv)} />
      </div>
      <div style={{ position: "absolute", inset: "12px 0 0 0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span
          className="font-label font-bold uppercase"
          style={{ fontSize: 10, letterSpacing: "0.1em", background: "var(--ink)", color: "var(--lime)", borderRadius: 100, padding: "6px 13px", transform: "rotate(-2deg)" }}
        >
          🔒 Your vote is the ticket
        </span>
      </div>
    </div>
  );
}

export function QuestionCard({ card, wide = true }: { card: DiscoveryCard; wide?: boolean }) {
  const desk = DESK_BY_CATEGORY[card.category as Category];
  const variant = card.variant ?? "teaser";
  const meta = `${(card.sample_n ?? 0).toLocaleString("en-IN")} voted`;
  return (
    <Link
      href={`/q/${card.id}`}
      className={`group flex flex-col gap-[13px] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 ${wide ? "shrink-0" : "w-full min-w-0"}`}
      style={{
        width: wide ? 330 : undefined,
        scrollSnapAlign: wide ? "start" : undefined,
        border: "2px solid var(--ink)",
        borderRadius: 10,
        background: "var(--paper-bright)",
        padding: 20,
        boxShadow: "4px 4px 0 rgba(24,22,42,.16)",
      }}
    >
      <div className="flex flex-wrap items-center gap-[7px]">
        <span style={{ width: 11, height: 11, borderRadius: 3, border: "1.5px solid var(--ink)", background: desk?.color ?? "var(--gold)", display: "inline-block" }} />
        <span className="font-label uppercase" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "var(--muted)" }}>
          {desk?.desk.replace("The ", "") ?? card.category}
        </span>
        <span
          className="font-label font-bold uppercase text-ink"
          style={{ fontSize: 9.5, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", background: variant === "stat" || variant === "tug" ? "var(--lime)" : desk?.color ?? "var(--lime)", padding: "3px 14px 3px 9px", marginLeft: "auto", clipPath: "polygon(0 0, calc(100% - 7px) 0, 100% 100%, 0 100%)" }}
        >
          {variant === "stat" || variant === "tug" ? "Result" : MODE_TAG[card.mode] ?? card.mode}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: card.text.length > 80 ? 15 : 16.5, lineHeight: 1.18 }}>
        {card.text}
      </div>

      {variant === "stat" && card.preview?.kind === "stat" && <StatBlock p={card.preview} />}
      {variant === "tug" && card.preview?.kind === "tug" && <TugBlock p={card.preview} />}
      {variant === "teaser" && <TeaserBlock dv={card.primary_dv as DvId} />}

      <div className="mt-auto flex items-center justify-between gap-2.5">
        <span className="font-label uppercase" style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--muted)" }}>
          {meta}
        </span>
        <span className="font-extrabold" style={{ fontSize: 16 }}>→</span>
      </div>
    </Link>
  );
}
