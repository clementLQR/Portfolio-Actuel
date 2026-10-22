import { useCallback, useRef } from "react";
import { BLINK_DURATION_MS, BLINK_MAX_MS, BLINK_MIN_MS } from "./constants";

function nextDelay(): number {
  return BLINK_MIN_MS + Math.random() * (BLINK_MAX_MS - BLINK_MIN_MS);
}

/**
 * Clignements aléatoires toutes les 2 à 6 s.
 * Renvoie une fonction qui donne l'échelle verticale des yeux à l'instant `now` (ms).
 */
export function useBlink(): (now: number) => number {
  const state = useRef({ next: performance.now() + nextDelay(), end: 0 });

  return useCallback((now: number) => {
    const s = state.current;
    if (now >= s.next) {
      s.end = now + BLINK_DURATION_MS;
      s.next = now + nextDelay();
      // Parfois un double clignement, plus vivant
      if (Math.random() < 0.15) s.next = s.end + 160;
    }
    if (now < s.end) {
      const progress = 1 - (s.end - now) / BLINK_DURATION_MS;
      return 1 - 0.92 * Math.sin(Math.PI * progress);
    }
    return 1;
  }, []);
}
