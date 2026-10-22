import { useId, type CSSProperties } from "react";
import "./Rocket.scss";

interface RocketProps {
  /** Largeur en px (la hauteur suit le dessin) */
  size?: number;
  style?: CSSProperties;
  className?: string;
}

/**
 * Fusée illustrée, dans le style des planètes : coque en volume, hublot vitré,
 * ailerons en dégradé et flamme qui scintille. Décorative.
 */
export function Rocket({ size = 110, style, className }: RocketProps) {
  const id = useId().replace(/:/g, "");
  const url = (name: string) => `url(#${id}-${name})`;

  return (
    <svg
      className={["rocket", className].filter(Boolean).join(" ")}
      width={size}
      height={size * 1.5}
      viewBox="0 0 120 180"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <defs>
        {/* Coque : éclairée à gauche, ombrée à droite */}
        <linearGradient id={`${id}-hull`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" className="rocket__hull-dark" />
          <stop offset="0.3" className="rocket__hull-light" />
          <stop offset="0.62" className="rocket__hull-mid" />
          <stop offset="1" className="rocket__hull-dark" />
        </linearGradient>
        <linearGradient id={`${id}-warm`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="rocket__warm-a" />
          <stop offset="1" className="rocket__warm-b" />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" className="rocket__glass-a" />
          <stop offset="0.6" className="rocket__glass-b" />
          <stop offset="1" className="rocket__glass-c" />
        </radialGradient>
        <linearGradient id={`${id}-flame`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="rocket__flame-a" />
          <stop offset="0.45" className="rocket__flame-b" />
          <stop offset="1" className="rocket__flame-c" stopOpacity="0" />
        </linearGradient>
        <filter id={`${id}-glow`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* Flamme : halo flou, puis cœur plus vif */}
      <g className="rocket__flame">
        <path d="M44 128c0 24 8 38 16 50 8-12 16-26 16-50z" fill={url("flame")} filter={url("glow")} opacity="0.8" />
        <path d="M49 128c0 18 5 28 11 38 6-10 11-20 11-38z" fill={url("flame")} />
      </g>

      {/* Ailerons (derrière la coque) */}
      <path d="M38 96c-14 8-22 22-22 40l24-10z" fill={url("warm")} />
      <path d="M82 96c14 8 22 22 22 40l-24-10z" className="rocket__fin-shade" fill={url("warm")} />

      {/* Coque */}
      <path d="M60 6c22 16 30 44 26 92l-4 32H38l-4-32C30 50 38 22 60 6z" fill={url("hull")} />
      {/* Nez et tuyère */}
      <path d="M60 6c10 7 17 17 21 30H39c4-13 11-23 21-30z" fill={url("warm")} />
      <rect x="40" y="126" width="40" height="8" rx="3" className="rocket__nozzle" />
      {/* Bande colorée et aileron central */}
      <path d="M35 104h50l-1 8H36z" className="rocket__band" />
      <path d="M57 104h6v30h-6z" fill={url("warm")} />

      {/* Hublot : bague, vitre, reflet */}
      <circle cx="60" cy="66" r="15" className="rocket__ring" />
      <circle cx="60" cy="66" r="11" fill={url("glass")} />
      <ellipse cx="55.5" cy="61.5" rx="4" ry="2.6" transform="rotate(-35 55.5 61.5)" className="rocket__shine" />

      {/* Liseré lumineux le long du bord éclairé */}
      <path d="M46 34c-6 14-9 34-8 60" className="rocket__rim" />
    </svg>
  );
}
