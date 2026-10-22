import { create } from "zustand";

export type Mood = "neutre" | "curieuse" | "heureuse" | "surprise" | "reflechie";

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface Speech {
  id: number;
  text: string;
}

interface MascotteState {
  /** Humeur affichée */
  mood: Mood;
  /** Humeur de repos, définie par l'ancre courante (data-mascot-mood) */
  baseMood: Mood;
  /** Incrémenté à chaque changement d'humeur : déclenche un rebond */
  moodNonce: number;
  /** Point de l'écran (px) que la mascotte doit regarder en priorité */
  focus: ScreenPoint | null;
  sleeping: boolean;
  dizzy: boolean;
  /** Elle tire quelque chose (le tiroir de la section « Nouvelle quête ») */
  pulling: boolean;
  speech: Speech | null;
  anchor: HTMLElement | null;

  setMood: (mood: Mood) => void;
  /** Humeur temporaire, puis retour à l'humeur de repos */
  pulseMood: (mood: Mood, durationMs?: number) => void;
  resetMood: () => void;
  setBaseMood: (mood: Mood) => void;
  setFocus: (point: ScreenPoint | null) => void;
  say: (text: string, durationMs?: number) => void;
  setSleeping: (sleeping: boolean) => void;
  setDizzy: (dizzy: boolean) => void;
  setPulling: (pulling: boolean) => void;
  setAnchor: (anchor: HTMLElement | null) => void;
}

let pulseTimer: number | undefined;
let speechTimer: number | undefined;
let speechId = 0;

export const useMascotteStore = create<MascotteState>((set, get) => ({
  mood: "neutre",
  baseMood: "neutre",
  moodNonce: 0,
  focus: null,
  sleeping: false,
  dizzy: false,
  pulling: false,
  speech: null,
  anchor: null,

  setMood: (mood) => {
    window.clearTimeout(pulseTimer);
    if (get().mood === mood) return;
    set((s) => ({ mood, moodNonce: s.moodNonce + 1 }));
  },

  pulseMood: (mood, durationMs = 1800) => {
    window.clearTimeout(pulseTimer);
    set((s) => ({ mood, moodNonce: s.moodNonce + 1 }));
    pulseTimer = window.setTimeout(() => get().resetMood(), durationMs);
  },

  resetMood: () => {
    window.clearTimeout(pulseTimer);
    const { mood, baseMood } = get();
    if (mood !== baseMood) set((s) => ({ mood: baseMood, moodNonce: s.moodNonce + 1 }));
  },

  setBaseMood: (baseMood) => {
    set({ baseMood });
    get().resetMood();
  },

  setFocus: (focus) => set({ focus }),

  say: (text, durationMs = 4000) => {
    window.clearTimeout(speechTimer);
    speechId += 1;
    set({ speech: { id: speechId, text } });
    speechTimer = window.setTimeout(() => set({ speech: null }), durationMs);
  },

  setSleeping: (sleeping) => {
    if (get().sleeping !== sleeping) set((s) => ({ sleeping, moodNonce: s.moodNonce + 1 }));
  },

  setDizzy: (dizzy) => set({ dizzy }),

  setPulling: (pulling) => {
    if (get().pulling !== pulling) set((s) => ({ pulling, moodNonce: s.moodNonce + 1 }));
  },

  setAnchor: (anchor) => {
    if (get().anchor !== anchor) set({ anchor });
  },
}));

/**
 * Position de la mascotte à l'écran, écrite à chaque image par la scène 3D.
 * Lue par la zone cliquable HTML (le canvas ignore les pointeurs).
 * Volontairement hors de React pour ne pas déclencher de rendus.
 */
export const mascotScreen = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  visible: false,
};
