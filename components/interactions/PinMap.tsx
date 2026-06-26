"use client";

/**
 * Pin on Map — tap the region where you stand (v5 `pin_map`).
 * The question's options are regions. We reuse the @svg-maps/india geometry
 * (IndiaPaths) as a tappable selector: every option whose label matches a real
 * India boundary becomes a tappable region, and the picked region fills lime.
 *
 * FALLBACK (RAILS — tap-only at 375px): option region names don't always map
 * 1:1 to the @svg-maps/india location set (e.g. zones like "North India" or
 * cities), and tiny states are hard tap targets on a phone. So a labelled
 * region button-grid sits beneath the map as the canonical, always-present tap
 * target — it covers every option, matched on the map or not. Tapping a region
 * (on the map OR a button) selects it and submits { region } after the v5 560ms
 * beat. Skip never reaches onSubmit.
 */
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { InteractionProps } from "@/lib/interactions/registry";
import { INDIA_VIEWBOX, locationForState } from "@/lib/dv/india";
import { IndiaPaths } from "../dv/india-base";
import { useDelayedSubmit } from "./useDelayedSubmit";

export function PinMap({ question, onSubmit, submitting }: InteractionProps) {
  const [picked, setPicked] = useState<string | null>(null);
  const { submitAfter, reduceMotion } = useDelayedSubmit(onSubmit);

  // option key → India location name (when its label matches a real boundary)
  const locationByKey = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of question.options) {
      const loc = locationForState(o.label);
      if (loc) map.set(o.key, loc.name);
    }
    return map;
  }, [question.options]);
  const keyByLocation = useMemo(() => {
    const map = new Map<string, string>();
    for (const [key, name] of locationByKey) if (!map.has(name)) map.set(name, key);
    return map;
  }, [locationByKey]);

  const labelByKey = new Map(question.options.map((o) => [o.key, o.label]));

  function pick(key: string) {
    if (picked !== null || submitting) return;
    setPicked(key);
    submitAfter(560, { region: key }, () => setPicked(null));
  }

  const fillFor = (locationName: string): string => {
    const key = keyByLocation.get(locationName);
    if (!key) return "var(--paper-edge)"; // not one of the question's regions
    if (picked === key) return "var(--lime)";
    return "var(--paper-bright)"; // a selectable region
  };

  return (
    <div>
      <div className="mb-3.5 font-label text-[11px] uppercase tracking-[0.14em] text-muted">
        Tap your region — on the map or the list below
      </div>

      <div className="mb-4 rounded-lg border-2 border-ink bg-paper p-3">
        <svg
          viewBox={INDIA_VIEWBOX}
          role="group"
          aria-label="Tap a region of India"
          style={{ width: "100%", height: "auto", maxHeight: 420 }}
        >
          {/* base boundaries; selectable regions sit on top as tappable paths */}
          <IndiaPaths fillFor={fillFor} />
          {question.options.map((o) => {
            const name = locationByKey.get(o.key);
            if (!name) return null;
            const loc = locationForState(o.label);
            if (!loc) return null;
            return (
              <path
                key={`tap-${o.key}`}
                d={loc.path}
                role="button"
                aria-label={`Pin ${o.label}`}
                tabIndex={picked !== null || submitting ? -1 : 0}
                onClick={() => pick(o.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    pick(o.key);
                  }
                }}
                fill={picked === o.key ? "var(--lime)" : "transparent"}
                stroke="var(--ink)"
                strokeWidth={picked === o.key ? 2 : 1.2}
                style={{
                  cursor: picked === null && !submitting ? "pointer" : "default",
                  outline: "none",
                }}
              >
                <title>{o.label}</title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* canonical tap target: every region option as a labelled button */}
      <div className="flex flex-wrap gap-2">
        {question.options.map((o, i) => {
          const isPicked = picked === o.key;
          return (
            <motion.button
              key={o.key}
              type="button"
              data-testid="option"
              onClick={() => pick(o.key)}
              disabled={picked !== null || submitting}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.03 }}
              className={`min-h-[46px] rounded-full border-2 border-ink px-4 py-2.5 font-ui text-[14px] font-semibold transition-all duration-150 hover:-translate-y-0.5 disabled:hover:translate-y-0 ${
                isPicked ? "bg-lime shadow-[3px_3px_0_var(--ink)]" : "bg-paper-bright"
              }`}
            >
              {o.label}
              {isPicked && (
                <span className="ml-1.5 font-label text-[10px] uppercase tracking-[0.08em]">
                  ✓
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {picked !== null && (
        <div className="mt-3 font-label text-[11px] uppercase tracking-[0.1em] text-muted">
          Pinned {labelByKey.get(picked)} — counting…
        </div>
      )}
    </div>
  );
}
