"use client";
/**
 * ShareActions — v5's result actions (prototype lines 988–995).
 *  • Share        — paper, ink text. Web Share API when available; ALWAYS copies
 *                   the canonical question link to the clipboard too (iter-4 #314).
 *  • ⬇ Download   — big DARK button; one tap downloads the single standard card
 *                   image (iter-4 #313 — the d1/d2/d3 style chooser was removed;
 *                   the result DV varies, the card template is fixed = d2).
 *
 * Keeps the existing /api/og/:id?style=…&download=1 pipeline and the ?s=1
 * inbound-share marker.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/** The one standard download card. The result DV varies inside it; the template
 *  is fixed. If this default ever changes, change it here only. */
const DOWNLOAD_STYLE = "d2";

const BTN =
  "flex min-h-[56px] items-center justify-center rounded-lg border-2 border-ink px-[18px] py-4 font-ui text-[14.5px] font-extrabold uppercase tracking-[.04em] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5";

export function ShareActions({ questionId }: { questionId: string }) {
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function share() {
    const url = `${window.location.origin}/q/${questionId}?s=1`;
    // iter-4 #314: always copy the link, even when the native share sheet opens.
    let copied = false;
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      copied = false;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: "State of Us", url });
      } catch {
        // dismissal is a choice — the link is already on the clipboard.
      }
    }
    showToast(copied ? "🔗 Link copied — pass it along" : "Couldn’t copy — try again");
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

      {/* iter-4 #313: one tap → the single standard card image, no style chooser. */}
      <a
        href={`/api/og/${questionId}?style=${DOWNLOAD_STYLE}&download=1`}
        onClick={() => showToast("Card on its way")}
        className={`${BTN} min-w-[150px] flex-1 bg-ink text-paper hover:shadow-[5px_5px_0_color-mix(in_srgb,var(--ink)_40%,transparent)]`}
      >
        ⬇&nbsp;Download
      </a>

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
