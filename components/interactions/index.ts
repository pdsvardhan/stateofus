/**
 * INTERACTION_REGISTRY — the 8 product modes (adr-005 §4), one component per
 * mode. bucket_sort and tier_placement share the Sorter (v5 `sort` token),
 * parameterized by question.targets; their chip labels differ. chipLabel
 * strings mirror the v5 prototype modeLabel data (logoquick renders as
 * "Quick Pick" in the prototype, kept here).
 */
import type { InteractionRegistry } from "@/lib/interactions/registry";
import { QuickPick } from "./QuickPick";
import { LogoQuickPick } from "./LogoQuickPick";
import { TradeoffCards } from "./TradeoffCards";
import { SwipeStack } from "./SwipeStack";
import { Sorter } from "./Sorter";
import { RankOrder } from "./RankOrder";
import { PodiumSlots } from "./PodiumSlots";
import { Spectrum } from "./Spectrum";
import { CoinAllocation } from "./CoinAllocation";

export const INTERACTION_REGISTRY: InteractionRegistry = {
  quick_pick: { mode: "quick_pick", chipLabel: "Quick Pick", Component: QuickPick },
  tradeoff_cards: {
    mode: "tradeoff_cards",
    chipLabel: "Trade-off",
    Component: TradeoffCards,
  },
  swipe_stack: { mode: "swipe_stack", chipLabel: "Swipe Stack", Component: SwipeStack },
  bucket_sort: { mode: "bucket_sort", chipLabel: "Bucket Sort", Component: Sorter },
  tier_placement: {
    mode: "tier_placement",
    chipLabel: "Tier Placement",
    Component: Sorter,
  },
  rank_order: { mode: "rank_order", chipLabel: "Rank Order", Component: RankOrder },
  podium_slots: {
    mode: "podium_slots",
    chipLabel: "Podium Slots",
    Component: PodiumSlots,
  },
  logo_quick_pick: {
    mode: "logo_quick_pick",
    chipLabel: "Quick Pick",
    Component: LogoQuickPick,
  },
  spectrum: { mode: "spectrum", chipLabel: "Spectrum", Component: Spectrum },
  coin_allocation: {
    mode: "coin_allocation",
    chipLabel: "Coin Allocation",
    Component: CoinAllocation,
  },
};

export {
  QuickPick,
  LogoQuickPick,
  TradeoffCards,
  SwipeStack,
  Sorter,
  RankOrder,
  PodiumSlots,
  Spectrum,
  CoinAllocation,
};
