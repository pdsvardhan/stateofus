/**
 * INTERACTION_REGISTRY — the product modes (adr-005 §4), one component per
 * mode. tier_placement keeps the Sorter (v5 `sort` token, parameterized by
 * question.targets); bucket_sort moved to the BucketStack card-pile flow
 * (iter-6 item-412). chipLabel strings mirror the v5 prototype modeLabel
 * data (logoquick renders as "Quick Pick" in the prototype, kept here).
 */
import type { InteractionRegistry } from "@/lib/interactions/registry";
import { QuickPick } from "./QuickPick";
import { LogoQuickPick } from "./LogoQuickPick";
import { TradeoffCards } from "./TradeoffCards";
import { SwipeStack } from "./SwipeStack";
import { Sorter } from "./Sorter";
import { BucketStack } from "./BucketStack";
import { RankOrder } from "./RankOrder";
import { PodiumSlots } from "./PodiumSlots";
import { Spectrum } from "./Spectrum";
import { CoinAllocation } from "./CoinAllocation";
import { TwoAxis } from "./TwoAxis";
import { Bracket } from "./Bracket";
import { PinMap } from "./PinMap";

export const INTERACTION_REGISTRY: InteractionRegistry = {
  quick_pick: { mode: "quick_pick", chipLabel: "Quick Pick", Component: QuickPick },
  tradeoff_cards: {
    mode: "tradeoff_cards",
    chipLabel: "Trade-off",
    Component: TradeoffCards,
  },
  swipe_stack: { mode: "swipe_stack", chipLabel: "Swipe Stack", Component: SwipeStack },
  bucket_sort: { mode: "bucket_sort", chipLabel: "Bucket Sort", Component: BucketStack },
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
  two_axis: { mode: "two_axis", chipLabel: "Two-Axis", Component: TwoAxis },
  bracket: { mode: "bracket", chipLabel: "Bracket", Component: Bracket },
  pin_map: { mode: "pin_map", chipLabel: "Pin on Map", Component: PinMap },
};

export {
  QuickPick,
  LogoQuickPick,
  TradeoffCards,
  SwipeStack,
  Sorter,
  BucketStack,
  RankOrder,
  PodiumSlots,
  Spectrum,
  CoinAllocation,
  TwoAxis,
  Bracket,
  PinMap,
};
