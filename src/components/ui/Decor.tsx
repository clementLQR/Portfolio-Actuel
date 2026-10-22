import { useId, type CSSProperties } from "react";
import "./Decor.scss";

// Éléments décoratifs inspirés de la planche « style graphique ».
// Tous sont aria-hidden : ils n'apportent aucune information.

type Corner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

interface OrganicWaveProps {
  corner: Corner;
  tone?: "cool" | "warm";
  /** Largeur du bloc (la hauteur suit le ratio du dessin) */
  width?: string;
  style?: CSSProperties;
}

// Crête de chaque ruban, de l'arrière vers l'avant. Les courbes débordent du cadre
// (-60 → 660) pour que l'ondulation ne découvre jamais de bord.
const WAVE_CRESTS = [
  "M-60 150C40 90 120 110 190 160S330 230 410 170 560 70 660 110",
  "M-60 220C30 170 110 180 180 225S320 290 400 245 560 160 660 200",
  "M-60 285C20 250 100 255 170 290S310 345 390 310 540 245 660 280",
  "M-60 340C10 315 90 318 160 345S300 390 380 365 530 315 660 345",
  "M-60 390C0 372 80 372 150 392S290 425 370 410 520 380 660 400",
];

/** Formes organiques : rubans ondulés superposés, avec reflet sur la crête et grain */
export function OrganicWave({ corner, tone = "cool", width = "clamp(260px, 38vw, 620px)", style }: OrganicWaveProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={`wave wave--${corner} wave--${tone}`}
      viewBox="0 0 600 420"
      preserveAspectRatio="xMinYMax meet"
      aria-hidden="true"
      focusable="false"
      style={{ width, ...style }}
    >
      <defs>
        {WAVE_CRESTS.map((_, i) => (
          <linearGradient key={i} id={`${id}-fill-${i}`} x1="0" y1="0" x2="1" y2="0.6">
            <stop offset="0" style={{ stopColor: `var(--w${i + 1})` }} />
            <stop offset="1" style={{ stopColor: `var(--w${i + 2})` }} />
          </linearGradient>
        ))}
        {/* Le bas de chaque ruban s'assombrit : la crête du ruban suivant ressort */}
        <linearGradient id={`${id}-shade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="wave__shade" stopOpacity="0" />
          <stop offset="0.7" className="wave__shade" stopOpacity="0.55" />
        </linearGradient>
        {/* Reflet de crête : il s'allume au centre et s'éteint vers les bords */}
        <linearGradient id={`${id}-crest`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.05" className="wave__crest" stopOpacity="0" />
          <stop offset="0.45" className="wave__crest" stopOpacity="0.9" />
          <stop offset="0.95" className="wave__crest" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g filter="url(#grain-overlay)">
        {WAVE_CRESTS.map((crest, i) => (
          <g key={crest} className={`wave__band wave__band--${i + 1}`}>
            <path fill={`url(#${id}-fill-${i})`} d={`${crest}V480H-60z`} />
            <path fill={`url(#${id}-shade)`} d={`${crest}V480H-60z`} />
            <path className="wave__crest-line" fill="none" stroke={`url(#${id}-crest)`} d={crest} />
          </g>
        ))}
      </g>
    </svg>
  );
}

type PixelTone = "highlight" | "detail" | "accent" | "warm" | "violet";

// Étoile à 4 branches en pixel art (7 × 7)
const STAR = ["...#...", "...#...", "..###..", "#######", "..###..", "...#...", "...#..."];

interface PixelSparkleProps {
  tone?: PixelTone;
  /** Taille d'un pixel en px */
  pixel?: number;
  style?: CSSProperties;
  delay?: number;
}

/** Élément rétro réinterprété : étincelle pixelisée qui scintille par paliers */
export function PixelSparkle({ tone = "highlight", pixel = 4, style, delay = 0 }: PixelSparkleProps) {
  return (
    <svg
      className={`pixel-sparkle pixel-tone--${tone}`}
      width={pixel * 9}
      height={pixel * 9}
      viewBox="0 0 9 9"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      {STAR.flatMap((row, y) =>
        [...row].map((cell, x) => (cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)),
      )}
      {/* Petit pixel satellite, comme sur la planche */}
      <rect x="8" y="0" width="1" height="1" className="pixel-sparkle__satellite" />
    </svg>
  );
}

/** Anneau en pointillés qui tourne lentement */
export function DottedRing({ size = 160, style }: { size?: number; style?: CSSProperties }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className="dotted-ring" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false" style={style}>
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="dotted-ring__stop-a" />
          <stop offset="1" className="dotted-ring__stop-b" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke={`url(#${id}-g)`} strokeWidth="3" strokeDasharray="0.6 4.2" strokeLinecap="round" />
      <circle cx="50" cy="50" r="36" fill="none" stroke={`url(#${id}-g)`} strokeWidth="1" strokeDasharray="0.4 6" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
