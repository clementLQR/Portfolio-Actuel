import { Color } from "three";

/** Lit une couleur des tokens CSS (ex. "--accent") pour l'utiliser en 3D */
export function cssColor(variable: string, fallback = "#ffffff"): Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const color = new Color();
  try {
    color.setStyle(value || fallback);
  } catch {
    color.setStyle(fallback);
  }
  return color;
}
