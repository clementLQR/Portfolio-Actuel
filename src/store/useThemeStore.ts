import { create } from "zustand";

export type Theme = "dark" | "light";

const STORAGE_KEY = "hub-theme";

// Le script inline de index.html a déjà posé data-theme : on part de là
function readInitialTheme(): Theme {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitialTheme(),
  setTheme: (theme) => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // stockage indisponible (navigation privée) : le thème reste valable pour la session
    }
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
