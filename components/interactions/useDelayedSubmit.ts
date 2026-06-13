"use client";

/**
 * Shared submit-timing hook. The v5 prototype lets the "Counted ✓" stamp /
 * filing animation play before revealing the result (560ms quick, 520ms sort,
 * 600ms slots, 420ms rank, 380ms swipe). Reduced-motion users skip the wait
 * (CA-001). If the POST rejects, the caller-provided reset re-arms the mode
 * so the answer can be retried.
 */
import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

export function useDelayedSubmit(
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
) {
  const reduceMotion = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  function submitAfter(
    ms: number,
    payload: Record<string, unknown>,
    onError?: () => void
  ) {
    if (fired.current) return;
    fired.current = true;
    timer.current = setTimeout(
      () => {
        void onSubmit(payload).catch(() => {
          // parent surfaces the error state; re-arm so the user can retry
          fired.current = false;
          onError?.();
        });
      },
      reduceMotion ? 0 : ms
    );
  }

  return { submitAfter, reduceMotion };
}
