"use client";

/**
 * RegionChip — the press-pass region card (RG2, the Lab B live-page winner)
 * shown on geo questions. feat-region-capture, AC376–AC378.
 *
 * Shows the detected coarse region ("Counting you in: Bengaluru, Karnataka")
 * with a one-tap "Not right?" correction sheet: canonical state picker +
 * optional city text input, POSTing to /api/region/correct. City/state only —
 * the caption says exactly what we hold. Tap-only targets (≥44px), 375px-first,
 * design tokens only (no hardcoded hex).
 *
 * Pass `initial` when the server already resolved the region (the experience
 * page calls ensureRegion); otherwise the chip fetches GET /api/region itself.
 * `onCorrected` lets the result page refetch aggregates after a correction
 * (the server recomputes them synchronously).
 */
import { useEffect, useState } from "react";
import { INDIAN_STATES } from "@/lib/region/states";

export type RegionInfo = {
  state: string | null;
  city: string | null;
  source: string | null;
};

export default function RegionChip({
  initial,
  onCorrected,
}: {
  initial?: RegionInfo;
  onCorrected?: (region: { state: string; city: string | null }) => void;
}) {
  const [region, setRegion] = useState<RegionInfo | null>(initial ?? null);
  const [open, setOpen] = useState(false);
  const [pickedState, setPickedState] = useState<string | null>(null);
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    fetch("/api/region")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: RegionInfo | null) => {
        if (!cancelled && data) setRegion(data);
      })
      .catch(() => {
        /* chip degrades to "region unknown" — never blocks the page */
      });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  async function save() {
    if (!pickedState || saving) return;
    setSaving(true);
    setError(null);
    const trimmedCity = city.trim();
    try {
      const res = await fetch("/api/region/correct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: pickedState,
          ...(trimmedCity ? { city: trimmedCity } : {}),
        }),
      });
      if (!res.ok) throw new Error("save failed");
      const corrected = {
        state: pickedState,
        city: trimmedCity ? trimmedCity : null,
      };
      setRegion({ ...corrected, source: "user-corrected" });
      setOpen(false);
      setPickedState(null);
      setCity("");
      onCorrected?.(corrected);
    } catch {
      setError("Couldn't save that — try again.");
    } finally {
      setSaving(false);
    }
  }

  const hasRegion = Boolean(region?.state);
  const placeLabel = hasRegion
    ? region?.city
      ? `${region.city}, ${region.state}`
      : `${region?.state}`
    : "Region unknown";
  const sourceLine =
    region?.source === "user-corrected"
      ? "set by you · city/state only"
      : hasRegion
        ? "guessed from network · never stored"
        : "couldn't place you · city/state only";

  return (
    <section
      aria-label="Your press pass — region"
      className="rounded-[10px] border-2 border-ink bg-ink-soft px-[18px] py-4 text-paper shadow-[4px_4px_0_var(--ink)]"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="font-label text-[10px] font-bold uppercase tracking-[.18em] text-lime">
          Your press pass
        </span>
        <span className="font-label text-[10px] uppercase tracking-[.08em] text-muted-warm">
          anonymous
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] border-2 border-lime text-xl"
        >
          📍
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-label text-[10px] uppercase tracking-[.1em] text-muted-warm">
            {hasRegion ? "Counting you in:" : "Counting you, location pending"}
          </div>
          <div className="truncate text-base font-extrabold">{placeLabel}</div>
          <div className="font-label text-[10px] uppercase tracking-[.06em] text-muted-warm">
            {sourceLine}
          </div>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => {
            setOpen((v) => !v);
            setError(null);
          }}
          className="min-h-[44px] shrink-0 rounded-[7px] border-[1.5px] border-lime bg-transparent px-3 font-label text-[10px] font-bold uppercase tracking-[.08em] text-lime"
        >
          {open ? "Close" : hasRegion ? "Not right?" : "Set it"}
        </button>
      </div>

      {open && (
        <div className="mt-3 border-t-[1.5px] border-ink pt-3">
          <div className="mb-2 font-label text-[10px] font-bold uppercase tracking-[.14em] text-lime">
            Pick your state
          </div>
          <div
            role="listbox"
            aria-label="State"
            className="flex max-h-56 flex-wrap content-start gap-1.5 overflow-y-auto pr-1"
          >
            {INDIAN_STATES.map((s) => {
              const selected = pickedState === s;
              return (
                <button
                  key={s}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setPickedState(s)}
                  className={`min-h-[44px] rounded-full border-[1.5px] px-3 text-xs font-semibold ${
                    selected
                      ? "border-lime bg-lime text-ink"
                      : "border-paper-deep bg-transparent text-paper"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <label className="mt-3 block">
            <span className="mb-1 block font-label text-[10px] uppercase tracking-[.1em] text-muted-warm">
              City (optional)
            </span>
            <input
              type="text"
              value={city}
              maxLength={60}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Bengaluru"
              className="min-h-[44px] w-full rounded-[7px] border-[1.5px] border-paper-deep bg-paper-white px-3 text-sm text-ink placeholder:text-muted"
            />
          </label>

          {error && (
            <div
              role="alert"
              className="mt-2 font-label text-[10px] font-bold uppercase tracking-[.08em] text-fire"
            >
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!pickedState || saving}
            onClick={save}
            className="mt-3 min-h-[44px] w-full rounded-[8px] border-2 border-ink bg-lime px-4 font-bold uppercase tracking-[.04em] text-ink disabled:opacity-40"
          >
            {saving
              ? "Saving…"
              : pickedState
                ? `Count me in ${pickedState}`
                : "Pick a state first"}
          </button>
        </div>
      )}
    </section>
  );
}
