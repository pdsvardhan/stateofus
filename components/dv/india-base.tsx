"use client";
/**
 * Shared India SVG plumbing — feat-dv-engine.
 *
 * Real boundaries from @svg-maps/india (the v5 prototype used the same
 * package). Exposes the path layer and the centroid measurement the
 * prototype did with getBBox after mount (bubbles sit at state centroids).
 */
import { useEffect, useState } from "react";
import type { RefObject } from "react";
import { INDIA_LOCATIONS } from "@/lib/dv/india";

export type Centroids = Record<string, { x: number; y: number }>;

/** Measure each state path's bbox centre once the SVG is in the DOM. */
export function useCentroids(svgRef: RefObject<SVGSVGElement | null>): Centroids | null {
  const [centroids, setCentroids] = useState<Centroids | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const out: Centroids = {};
    svg.querySelectorAll<SVGGraphicsElement>("path[data-name]").forEach((p) => {
      try {
        const b = p.getBBox();
        const name = p.getAttribute("data-name");
        if (name) out[name] = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
      } catch {
        // detached/hidden node — skip; the bubble simply waits for a re-measure
      }
    });
    if (Object.keys(out).length > 0) setCentroids(out);
  }, [svgRef]);
  return centroids;
}

/** The boundary layer. fillFor decides each state's ink. */
export function IndiaPaths({
  fillFor,
}: {
  fillFor: (locationName: string) => string;
}) {
  return (
    <>
      {INDIA_LOCATIONS.map((loc) => (
        <path
          key={loc.id}
          d={loc.path}
          data-name={loc.name}
          fill={fillFor(loc.name)}
          stroke="var(--ink)"
          strokeWidth={0.9}
        />
      ))}
    </>
  );
}
