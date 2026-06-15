"use client";
/**
 * ShareActions — v5's three big result actions (prototype lines 988–995).
 *  • Share        — paper, ink text (Web Share API → clipboard fallback)
 *  • ⬇ Download PNG — big DARK button, "PNG" in lime (opens the 3 card styles)
 *  • Link         — paper; copies the canonical URL, flips to "Copied ✓"
 *
 * Keeps the existing /api/og/:id?style=…&download=1 pipeline and the ?s=1
 * inbound-share marker. Replaces ShareSheet's placement in the result rail.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CARD_STYLES = [
  { id: "d2", label: "Front page", def: true },
  { id: "d1", label: "Editorial", def: false },
  { id: "d3", label: "Stat poster", def: false },
] as const;

const BTN =
  "flex min-h-[56px] items-center justify-center rounded-lg border-2 border-ink px-[18px] py-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[.04em] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5";

export function ShareActions({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function share() {
    const url = `${window.location.origin}/q/${questionId}?s=1`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "State of Us", url });
        return;
      } catch {
        return; // dismissal is a choice
      }
    }
    await navigator.clipboard.writeText(url);
    showToast("🔗 Link copied — pass it along");
  }

  return (
    <div className="relative flex flex-wrap gap-3">
      <button
        type="button"
        onClick={share}
        className={`${BTN} min-w-[130px] flex-1 bg-paper-bright text-ink hover:shadow-[5px_5px_0_var(--ink)]`}
      >
        Share
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`${BTN} min-w-[150px] flex-1 bg-ink text-paper hover:shadow-[5px_5px_0_color-mix(in_srgb,var(--ink)_40%,transparent)]`}
      >
        ⬇&nbsp;Download
      </button>

      {/* download style popover */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22 }}
            className="absolute right-0 top-full z-10 mt-2 flex w-48 flex-col border-2 border-ink bg-paper-white shadow-[4px_4px_0_var(--ink)]"
          >
            {CARD_STYLES.map((s) => (
              <a
                key={s.id}
                href={`/api/og/${questionId}?style=${s.id}&download=1`}
                onClick={() => {
                  setOpen(false);
                  showToast("Card on its way");
                }}
                className="border-b-2 border-ink px-3 py-2.5 font-label text-sm font-bold text-ink last:border-b-0 hover:bg-lime"
              >
                {s.label}
                {s.def && <span className="ml-1 text-xs text-muted">· default</span>}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* copied / share toast — v5 pill */}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 6, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="absolute -top-11 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-4 py-2 font-label text-[10px] font-bold uppercase tracking-[.1em] text-lime"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ShareActions;
