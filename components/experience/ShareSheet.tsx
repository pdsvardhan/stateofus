"use client";

/**
 * Share + Download — feat-reactions-sharing (FB-014) + feat-og-image-gen.
 * Share: Web Share API with the canonical question URL (?s=1 marks inbound
 * shares for the landing context); fallback = copy link + LINK2 toast.
 * Download: the three locked card styles as a picker (D2 front-page default),
 * served by /api/og/:id — real rendered PNG, never a screenshot.
 */
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const CARD_STYLES = [
  { id: "d2", label: "Front page" },
  { id: "d1", label: "Editorial" },
  { id: "d3", label: "Stat poster" },
] as const;

export function ShareSheet({ questionId }: { questionId: string }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const shareUrl = () =>
    `${window.location.origin}/q/${questionId}?s=1`;

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function share() {
    const url = shareUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: "State of Us", url });
        return;
      } catch {
        // user dismissed — fall through to copy? No: dismissal is a choice.
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied — pass it along");
  }

  return (
    <div className="relative flex items-center gap-2">
      <button
        onClick={share}
        className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-sm font-bold text-ink hover:-translate-y-0.5 transition-transform"
      >
        Share
      </button>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="border-2 border-ink bg-paper-bright px-3 py-1.5 font-label text-sm font-bold text-ink hover:-translate-y-0.5 transition-transform"
      >
        Download
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="absolute right-0 top-full z-10 mt-2 flex w-44 flex-col border-2 border-ink bg-paper-white shadow-[4px_4px_0_var(--ink)]"
          >
            {CARD_STYLES.map((s) => (
              <a
                key={s.id}
                href={`/api/og/${questionId}?style=${s.id}&download=1`}
                onClick={() => {
                  setOpen(false);
                  showToast("Card on its way");
                }}
                className="border-b-2 border-ink px-3 py-2 font-label text-sm font-bold text-ink last:border-b-0 hover:bg-lime"
              >
                {s.label}
                {s.id === "d2" && (
                  <span className="ml-1 text-xs text-muted">· default</span>
                )}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-full right-0 mb-2 whitespace-nowrap border-2 border-ink bg-ink px-3 py-1.5 font-label text-xs font-bold text-lime"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
