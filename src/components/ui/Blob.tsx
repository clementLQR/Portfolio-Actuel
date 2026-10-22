import { useId, type CSSProperties } from "react";
import { usePrefersReducedMotion } from "../../hooks/useMediaQuery";
import "./Blob.scss";

export type BlobVariant = "planet-warm" | "planet-blue" | "planet-violet" | "glow-warm" | "glow-violet" | "glow-blue";

interface BlobProps {
  variant: BlobVariant;
  size: number | string;
  /** Position absolue dans la section (top / left / right / bottom) */
  style?: CSSProperties;
  /** Anneau autour de la planète (toujours présent sur la planète violette) */
  ring?: boolean;
  /** Petite enveloppe en orbite sur l'anneau (implique l'anneau) */
  mail?: boolean;
}

// Tour complet de l'anneau, en commençant par l'arc avant (celui qui passe devant la sphère)
const RING_ORBIT = "M-51.9 147.6 A158 30 -16 0 0 251.9 60.4 A158 30 -16 0 0 -51.9 147.6";
const ORBIT_DURATION = "10s";

/** Enveloppe en orbite. `half` : moitié du tour où cette copie est visible */
function Mail({ half, still }: { half: "front" | "back"; still: boolean }) {
  const shape = (
    <g className="planet__mail">
      <rect x="-22" y="-15" width="44" height="30" rx="5" />
      <path d="M-17-9 0 4l17-13" />
    </g>
  );
  // Mouvement réduit : posée sur l'arc avant, sans bouger
  if (still) return half === "front" ? <g transform="translate(31 151)">{shape}</g> : null;
  return (
    <g>
      {shape}
      <animateMotion dur={ORBIT_DURATION} repeatCount="indefinite" path={RING_ORBIT} />
      {/* Devant la sphère pendant la première moitié du tour, derrière pendant la seconde */}
      <animate
        attributeName="opacity"
        dur={ORBIT_DURATION}
        repeatCount="indefinite"
        calcMode="discrete"
        keyTimes="0;0.5"
        values={half === "front" ? "1;0" : "0;1"}
      />
    </g>
  );
}

/**
 * Planète illustrée, en couches : halo d'atmosphère, sphère éclairée en haut à gauche,
 * bandes de surface, côté nuit, liseré de contre-jour, reflet et grain.
 * Les couleurs viennent des variables --p-* posées par la variante (Blob.scss).
 */
function Planet({ ring, mail }: { ring: boolean; mail: boolean }) {
  const id = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();
  const url = (name: string) => `url(#${id}-${name})`;
  return (
    <svg className="planet" viewBox="0 0 200 200" focusable="false">
      <defs>
        <radialGradient id={`${id}-body`} cx="0.36" cy="0.32" r="0.8" fx="0.3" fy="0.26">
          <stop offset="0" className="planet__light" />
          <stop offset="0.38" className="planet__main" />
          <stop offset="0.78" className="planet__mid" />
          <stop offset="1" className="planet__dark" />
        </radialGradient>
        {/* Côté nuit : transition assez nette pour dessiner le terminateur */}
        <radialGradient id={`${id}-night`} cx="0.3" cy="0.26" r="1">
          <stop offset="0.46" className="planet__night" stopOpacity="0" />
          <stop offset="0.62" className="planet__night" stopOpacity="0.72" />
          <stop offset="0.9" className="planet__night" stopOpacity="0.95" />
        </radialGradient>
        {/* Contre-jour : le liseré s'allume en bas à droite */}
        <linearGradient id={`${id}-rim`} x1="0.2" y1="0.15" x2="0.85" y2="0.9">
          <stop offset="0.45" className="planet__atmo" stopOpacity="0" />
          <stop offset="1" className="planet__atmo" stopOpacity="1" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <circle cx="100" cy="100" r="100" />
        </clipPath>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="12" />
        </filter>
        <filter id={`${id}-soft`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
        {/* Bandes de gaz : bruit étiré à l'horizontale */}
        <filter id={`${id}-bands`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.055" numOctaves="3" seed="7" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 -0.55" />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
      </defs>

      {/* Anneau, moitié arrière */}
      {ring && (
        <ellipse className="planet__ring" cx="100" cy="104" rx="158" ry="30" transform="rotate(-16 100 104)" />
      )}
      {mail && <Mail half="back" still={reducedMotion} />}

      <circle className="planet__halo" cx="100" cy="100" r="100" filter={url("glow")} />
      <circle cx="100" cy="100" r="100" fill={url("body")} />

      <g clipPath={url("clip")}>
        <rect className="planet__bands" x="-20" y="-20" width="240" height="240" filter={url("bands")} transform="rotate(-14 100 100)" />
        <circle className="planet__shadow" cx="100" cy="100" r="100" fill={url("night")} />
        <circle cx="100" cy="100" r="97" fill="none" stroke={url("rim")} strokeWidth="5" filter={url("soft")} />
        <ellipse className="planet__shine" cx="66" cy="58" rx="26" ry="17" transform="rotate(-30 66 58)" filter={url("glow")} />
        <rect className="planet__grain" width="200" height="200" filter={url("grain")} />
      </g>

      {/* Anneau, moitié avant : seul l'arc du bas passe devant la sphère */}
      {ring && (
        <path
          className="planet__ring planet__ring--front"
          d="M-51.9 147.6 A158 30 -16 0 0 251.9 60.4"
        />
      )}
      {mail && <Mail half="front" still={reducedMotion} />}
    </svg>
  );
}

/**
 * Formes organiques du décor : planètes illustrées ou halos flous.
 * Toujours décoratives, placées dans les coins des sections.
 */
export function Blob({ variant, size, style, ring = false, mail = false }: BlobProps) {
  const isPlanet = variant.startsWith("planet");
  return (
    <span className={`blob blob--${variant}`} aria-hidden="true" style={{ ...style, width: size, height: size }}>
      {isPlanet && <Planet ring={ring || mail || variant === "planet-violet"} mail={mail} />}
    </span>
  );
}
