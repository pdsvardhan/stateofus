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
  spectrum: "Spectrum",
  coin_allocation: "Coin allocation",
  two_axis: "Two-axis",
  bracket: "Bracket",
  pin_map: "Pin on map",
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

/** ghost accent palette (cycled) — matches the fixed dummy shapes' inks. */
const GHOST_INKS = ["var(--fire)", "var(--gold)", "var(--blue)", "var(--lime)", "var(--pink)"];

/**
 * The DV-typed mini shape behind teaser cards AND on data cards (variant "dv").
 * When `props` (descending result proportions, integer %) is supplied, the
 * proportion-bearing shapes (bars/donut/podium/treemap/tier) are driven by the
 * real numbers instead of fixed dummy widths; map/flow/heat keep their fixed
 * representative look (no single-% mapping). When `labels` accompany live
 * props (iter-6 item 409), the live families also name their options + show
 * the % so the mini-DV is readable standalone, not just colour blocks.
 */
function Ghost({ kind, props, labels }: { kind: ReturnType<typeof ghostKind>; props?: number[]; labels?: string[] }) {
  const live = props && props.length > 0 ? props : null;
  const named = live && labels && labels.some((l) => l) ? labels : null;
  switch (kind) {
    case "donut": {
      // build conic stops from the live shares (capped to 5), else the dummy ring.
      let ring = "conic-gradient(var(--fire) 0 38%, var(--gold) 38% 62%, var(--blue) 62% 83%, var(--lime) 83% 100%)";
      if (live) {
        const total = live.reduce((a, b) => a + b, 0) || 1;
        let acc = 0;
        const stops = live
          .slice(0, 5)
          .map((p, i) => {
            const from = (acc / total) * 360;
            acc += p;
            const to = (acc / total) * 360;
            return `${GHOST_INKS[i % GHOST_INKS.length]} ${from}deg ${to}deg`;
          })
          .join(", ");
        ring = `conic-gradient(${stops})`;
      }
      if (live && named) {
        // legend rows replace the abstract side bars: dot + option + %
        return (
          <div className="flex items-center gap-3">
            <span style={{ width: 44, height: 44, borderRadius: "50%", background: ring, border: "1.5px solid var(--ink)", flexShrink: 0 }} />
            <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
              {live.slice(0, 3).map((p, i) => (
                <span key={i} className="flex min-w-0 items-center gap-[6px]">
                  <span style={{ width: 8, height: 8, borderRadius: 100, background: GHOST_INKS[i % GHOST_INKS.length], border: "1px solid var(--ink)", flexShrink: 0 }} />
                  <span className="font-label truncate font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.06em", flex: 1, fontWeight: i === 0 ? 800 : 700, color: i === 0 ? "var(--ink)" : "var(--muted)" }}>
                    {labels![i] || `Option ${i + 1}`}
                  </span>
                  <span className="font-label" style={{ fontSize: 10, fontWeight: 900, flexShrink: 0 }}>{p}%</span>
                </span>
              ))}
            </span>
          </div>
        );
      }
      const bars = live ? live.slice(0, 2) : [70, 45];
      const maxBar = Math.max(...bars, 1);
      return (
        <div className="flex items-center gap-3">
          <span style={{ width: 44, height: 44, borderRadius: "50%", background: ring, border: "1.5px solid var(--ink)", flexShrink: 0 }} />
          <span className="flex flex-1 flex-col gap-[5px]">
            {bars.map((p, i) => (
              <span key={i} style={{ height: 8, borderRadius: 100, background: GHOST_INKS[i % GHOST_INKS.length], width: `${Math.max(18, Math.round((p / maxBar) * 100))}%` }} />
            ))}
          </span>
        </div>
      );
    }
    case "podium": {
      // 3 steps in visual order 2|1|3; heights from top-3 shares when live.
      const top3 = live ? live.slice(0, 3) : [60, 100, 38];
      const max = Math.max(...top3, 1);
      const h = (p: number) => `${Math.max(24, Math.round((p / max) * 100))}%`;
      const steps = live
        ? [
            { p: top3[1] ?? 0, bg: "var(--ink-soft)" },
            { p: top3[0] ?? 0, bg: "var(--fire)" },
            { p: top3[2] ?? 0, bg: "var(--muted-violet)" },
          ]
        : [
            { p: 60, bg: "var(--ink-soft)" },
            { p: 100, bg: "var(--fire)" },
            { p: 38, bg: "var(--muted-violet)" },
          ];
      return (
        <div className="flex flex-col gap-[5px]">
          <div className="flex items-end gap-[7px]" style={{ height: named ? 38 : 46 }}>
            {steps.map((s, i) => (
              <span key={i} style={{ flex: 1, height: h(s.p), background: s.bg, borderRadius: "4px 4px 0 0" }} />
            ))}
          </div>
          {named && (
            <span className="font-label truncate font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.06em" }}>
              <span style={{ color: "var(--fire)" }}>{labels![0] || "Leader"}</span>
              <span style={{ fontWeight: 900 }}> takes it · {live![0]}%</span>
            </span>
          )}
        </div>
      );
    }
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
    case "treemap": {
      // first column width follows the leader's share when live (bigger leader
      // → wider first block); reuse the same 5-block mosaic otherwise. With
      // labels, the leader block names itself + carries its %.
      const leader = live ? live[0] : 50;
      const firstFr = Math.max(1.6, Math.min(4, (leader / 100) * 5));
      return (
        <div style={{ display: "grid", gridTemplateColumns: `${firstFr}fr 2fr 1.4fr`, gridTemplateRows: named ? "26px 22px" : "24px 20px", gap: 3 }}>
          <span style={{ gridRow: "1 / 3", background: "var(--fire)", borderRadius: 3, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "0 5px" }}>
            {named && (
              <>
                <span className="font-label" style={{ fontSize: 11, fontWeight: 900, color: "var(--paper-bright)", lineHeight: 1.1 }}>{live![0]}%</span>
                <span className="font-label truncate font-bold uppercase" style={{ fontSize: 8, letterSpacing: "0.06em", color: "var(--paper-bright)", maxWidth: "100%" }}>
                  {labels![0]}
                </span>
              </>
            )}
          </span>
          <span style={{ background: "var(--gold)", borderRadius: 3 }} />
          <span style={{ background: "var(--blue)", borderRadius: 3 }} />
          <span style={{ background: "var(--lime)", borderRadius: 3 }} />
          <span style={{ background: "var(--pink)", borderRadius: 3 }} />
        </div>
      );
    }
    default: {
      // bars family — widths from the top shares when live, else the dummy set.
      // With labels each bar becomes a named micro-row: option · track · %.
      const vals = live ? live.slice(0, 3) : [82, 64, 47];
      const max = Math.max(...vals, 1);
      if (named) {
        return (
          <div className="flex flex-col gap-[5px]">
            {vals.map((p, i) => (
              <span key={i} className="flex min-w-0 items-center gap-[7px]">
                <span
                  className="font-label truncate font-bold uppercase"
                  style={{ fontSize: 9.5, letterSpacing: "0.06em", width: 84, flexShrink: 0, fontWeight: i === 0 ? 800 : 700, color: i === 0 ? "var(--ink)" : "var(--muted)" }}
                >
                  {labels![i] || `Option ${i + 1}`}
                </span>
                <span style={{ flex: 1, height: 8, borderRadius: 100, background: "var(--paper-edge)", overflow: "hidden" }}>
                  <span style={{ display: "block", height: "100%", borderRadius: 100, background: GHOST_INKS[i % GHOST_INKS.length], width: `${Math.max(6, Math.round((p / max) * 100))}%` }} />
                </span>
                <span className="font-label" style={{ fontSize: 10, fontWeight: 900, width: 30, textAlign: "right", flexShrink: 0 }}>{p}%</span>
              </span>
            ))}
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-1.5">
          {vals.map((p, i) => (
            <span
              key={i}
              style={{ height: 9, borderRadius: 100, background: GHOST_INKS[i % GHOST_INKS.length], width: `${Math.max(16, Math.round((p / max) * 100))}%` }}
            />
          ))}
        </div>
      );
    }
  }
}

const dashTop: React.CSSProperties = { borderTop: "1.5px dashed rgba(24,22,42,.3)", paddingTop: 12 };

/** TYPE 2a — big stat (a single dominant result). The visual form follows the
 *  question's primary DV so the results rail isn't all identical bars (#6):
 *  radial DVs read as a donut ring, everything else as the % + ink bar. */
function StatBlock({ p, dv }: { p: Extract<NonNullable<DiscoveryCard["preview"]>, { kind: "stat" }>; dv: DvId }) {
  if (dv === "radial") {
    return (
      <div style={dashTop} className="flex items-center gap-3.5">
        <span
          style={{
            position: "relative", width: 56, height: 56, flexShrink: 0, borderRadius: "50%",
            background: `conic-gradient(${p.color} ${p.pct * 3.6}deg, var(--paper-edge) 0)`,
            border: "1.5px solid var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--paper-bright)", border: "1.5px solid var(--ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 14, letterSpacing: "-0.02em" }}>
            {p.pct}%
          </span>
        </span>
        <span style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.25, flex: 1 }}>{p.line}</span>
      </div>
    );
  }
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

/** TYPE 2c — DV mini (the question's real result DV, unblurred, with live
 *  proportions + option labels). Renders for modes whose result isn't a single
 *  % / tug, so each data card reflects its actual DV instead of falling back
 *  to a teaser. Families that keep a fixed representative shape (map / flow /
 *  heat / tier) get a leader caption below so the card still names a result. */
function DvBlock({ p }: { p: Extract<NonNullable<DiscoveryCard["preview"]>, { kind: "dv" }> }) {
  const kind = ghostKind(p.primary_dv as DvId);
  const fixedShape = kind === "map" || kind === "flow" || kind === "heat" || kind === "tier";
  const leader = p.labels?.[0];
  return (
    <div style={dashTop}>
      <div className="font-label font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: "var(--fire)", marginBottom: 8 }}>
        India has decided
      </div>
      <div style={{ minHeight: 44 }}>
        <Ghost kind={kind} props={p.props} labels={p.labels} />
      </div>
      {fixedShape && leader && (
        <div className="font-label truncate font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.06em", marginTop: 7 }}>
          <span style={{ color: "var(--fire)" }}>{leader}</span>
          <span style={{ fontWeight: 900 }}> leads · {p.props[0]}%</span>
        </div>
      )}
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
      className={`group flex flex-col gap-[13px] shadow-[4px_4px_0_color-mix(in_srgb,var(--ink)_16%,transparent)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_var(--ink)] ${wide ? "shrink-0" : "w-full min-w-0"}`}
      style={{
        width: wide ? 330 : undefined,
        scrollSnapAlign: wide ? "start" : undefined,
        border: "2px solid var(--ink)",
        borderRadius: 10,
        background: "var(--paper-bright)",
        padding: 20,
        overflow: "hidden",
      }}
    >
      <div className="flex flex-wrap items-center gap-[7px]">
        <span style={{ width: 11, height: 11, borderRadius: 3, border: "1.5px solid var(--ink)", background: desk?.color ?? "var(--gold)", display: "inline-block" }} />
        <span className="font-label font-bold uppercase" style={{ fontSize: 9.5, letterSpacing: "0.14em", color: desk?.textColor ?? "var(--muted)" }}>
          {desk?.desk.replace("The ", "") ?? card.category}
        </span>
        <span
          className="font-label font-bold uppercase text-ink"
          style={{ fontSize: 9.5, letterSpacing: "0.1em", border: "1.5px solid var(--ink)", background: variant === "stat" || variant === "tug" || variant === "dv" ? "var(--lime)" : desk?.color ?? "var(--lime)", padding: "3px 14px 3px 9px", marginLeft: "auto", clipPath: "polygon(0 0, calc(100% - 7px) 0, 100% 100%, 0 100%)" }}
        >
          {variant === "stat" || variant === "tug" || variant === "dv" ? "Result" : MODE_TAG[card.mode] ?? card.mode}
        </span>
      </div>

      <div style={{ fontFamily: "var(--font-editorial)", fontWeight: 600, fontSize: card.text.length > 80 ? 14.5 : 16, lineHeight: 1.18 }}>
        {card.text}
      </div>

      {variant === "stat" && card.preview?.kind === "stat" && <StatBlock p={card.preview} dv={card.primary_dv as DvId} />}
      {variant === "tug" && card.preview?.kind === "tug" && <TugBlock p={card.preview} />}
      {variant === "dv" && card.preview?.kind === "dv" && <DvBlock p={card.preview} />}
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
