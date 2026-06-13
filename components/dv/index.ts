/**
 * DV registry assembly — all 14 v5 renderers (AC386) + still-counting.
 * Static imports keep the client bundle tree-shakeable per route.
 */
import type { DvRegistry } from "@/lib/dv/registry";
import { splitDefinition } from "./Split";
import { radialDefinition } from "./Radial";
import { liquidDefinition } from "./Liquid";
import { cupsDefinition } from "./Cups";
import { coinsDefinition } from "./Coins";
import { mapDefinition } from "./Map";
import { bubblemapDefinition } from "./BubbleMap";
import { tierDefinition } from "./Tier";
import { boardDefinition } from "./Board";
import { podiumDefinition } from "./Podium";
import { medalDefinition } from "./Medal";
import { treemapDefinition } from "./Treemap";
import { heatmatrixDefinition } from "./HeatMatrix";
import { sankeyDefinition } from "./Sankey";

export const DV_REGISTRY: Partial<DvRegistry> = {
  split: splitDefinition,
  radial: radialDefinition,
  liquid: liquidDefinition,
  cups: cupsDefinition,
  coins: coinsDefinition,
  map: mapDefinition,
  bubblemap: bubblemapDefinition,
  tier: tierDefinition,
  board: boardDefinition,
  podium: podiumDefinition,
  medal: medalDefinition,
  treemap: treemapDefinition,
  heatmatrix: heatmatrixDefinition,
  sankey: sankeyDefinition,
};
