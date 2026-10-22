import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { anchorRect, viewportSize } from "./anchorRect";
import { useMascotteStore, type Mood } from "./useMascotteStore";

const MOODS: readonly Mood[] = ["neutre", "curieuse", "heureuse", "surprise", "reflechie"];

function readMood(el: HTMLElement): Mood {
  const value = el.dataset.mascotMood;
  return MOODS.find((mood) => mood === value) ?? "neutre";
}

/**
 * Choisit l'ancre `[data-mascot-anchor]` la plus visible et la donne au store.
 * Réévalué au scroll, au redimensionnement et quand le DOM change (nouvelle page).
 */
export function useAnchors(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    let frame = 0;

    const pick = () => {
      frame = 0;
      const { anchor: current, setAnchor, setBaseMood } = useMascotteStore.getState();
      const { width: viewportW, height: viewportH } = viewportSize();
      const anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-mascot-anchor]"));

      let best: HTMLElement | null = null;
      let bestScore = 0;
      for (const el of anchors) {
        // Position en cache (au plus 200 ms d'âge) : pas de mise en page forcée à chaque défilement
        const rect = anchorRect(el, el.hasAttribute("data-mascot-priority"));
        if (rect.height === 0 || rect.width === 0) continue;
        // Part visible sur les deux axes : une ancre cachée hors écran à droite ne compte pas
        const visibleY = Math.max(0, Math.min(rect.bottom, viewportH) - Math.max(rect.top, 0)) / rect.height;
        const visibleX = Math.max(0, Math.min(rect.right, viewportW) - Math.max(rect.left, 0)) / rect.width;
        const visible = visibleX * visibleY;
        // Petite inertie pour l'ancre courante, gros bonus pour une ancre prioritaire
        const priority = visible > 0 && el.hasAttribute("data-mascot-priority") ? 1 : 0;
        const score = visible + (el === current ? 0.15 : 0) + priority;
        if (score > bestScore) {
          best = el;
          bestScore = score;
        }
      }

      // Aucune ancre vraiment visible : on garde la courante si elle existe encore.
      // Seuil bas : dès qu'une autre ancre apparaît un peu, la mascotte la rejoint au lieu de
      // suivre l'ancre précédente hors de l'écran
      if (bestScore < 0.1) best = current?.isConnected ? current : (best ?? anchors[0] ?? null);

      if (best !== current) {
        setAnchor(best);
        if (best) setBaseMood(readMood(best));
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(pick);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new MutationObserver(schedule);
    const root = document.getElementById("root");
    if (root) {
      // Les ancres peuvent aussi apparaître ou devenir prioritaires par simple changement d'attribut
      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-mascot-anchor", "data-mascot-priority"],
      });
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [pathname]);
}
