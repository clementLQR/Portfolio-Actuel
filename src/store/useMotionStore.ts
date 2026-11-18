import { create } from "zustand";

/**
 * Animations du site : actives par défaut, même quand le système signale « mouvement réduit »
 * (réglage souvent coupé d'office sur les PC d'école ou en économie d'énergie, ce qui figeait
 * la mascotte). Le visiteur peut les réduire avec l'interrupteur du menu, choix mémorisé.
 * Version réduite : plus de déplacements, de flottement, de parallax ni d'orbites animées.
 */
export type Motion = "full" | "reduced";

const STORAGE_KEY = "hub-motion";

// Le script inline de index.html a déjà posé data-motion : on part de là
function readInitialMotion(): Motion {
  return document.documentElement.dataset.motion === "reduced" ? "reduced" : "full";
}

interface MotionState {
  motion: Motion;
  toggleMotion: () => void;
}

export const useMotionStore = create<MotionState>((set, get) => ({
  motion: readInitialMotion(),
  toggleMotion: () => {
    const motion: Motion = get().motion === "full" ? "reduced" : "full";
    document.documentElement.dataset.motion = motion;
    try {
      localStorage.setItem(STORAGE_KEY, motion);
    } catch {
      // stockage indisponible (navigation privée) : le choix reste valable pour la session
    }
    set({ motion });
  },
}));

/** Animations réduites (hook : le composant se met à jour quand on bascule) */
export function useReducedMotion(): boolean {
  return useMotionStore((s) => s.motion === "reduced");
}

/** Animations réduites, lu à l'instant (hors rendu React) */
export function isReducedMotion(): boolean {
  return useMotionStore.getState().motion === "reduced";
}
