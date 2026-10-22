import { useId, type ReactNode } from "react";
import "./Icon.scss";

// Jeu d'icônes maison : traits simples et arrondis, grille 24×24
const ICONS = {
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5.5 9.5V20h4.5v-5.5h4V20h4.5V9.5" />
    </>
  ),
  folder: <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H9l2 2.2h7.5A2.5 2.5 0 0 1 21 9.7v7.8a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  bolt: <path d="M13.5 2.5L4.5 14h7l-1 7.5 9-11.5h-7z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M3.5 7.5l8.5 6 8.5-6" />
    </>
  ),
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  "arrow-left": <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-up-right": <path d="M7 17L17 7M8.5 7H17v8.5" />,
  "arrow-up": <path d="M12 19V5M6 11l6-6 6 6" />,
  download: <path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6L6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h10" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  github: (
    <path d="M9 19c-4.3 1.4-4.3-2.1-6-2.6M15 21v-3.4c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.9 5.4 3.2 5.4 3.2a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.6c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.2v.1M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17" />
    </>
  ),
  gamepad: (
    <>
      <path d="M7 7.5h10a4.5 4.5 0 0 1 4.5 4.5v1.2a3.8 3.8 0 0 1-6.9 2.2L13.5 14h-3l-1.1 1.4a3.8 3.8 0 0 1-6.9-2.2V12A4.5 4.5 0 0 1 7 7.5z" />
      <path d="M7.5 10.5v3M6 12h3M15.5 11v.1M17.5 13v.1" />
    </>
  ),
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />,
  braces: (
    <path d="M8 4C6 4 5.5 5 5.5 7v2c0 1.5-1 2.5-2.5 3 1.5.5 2.5 1.5 2.5 3v2c0 2 .5 3 2.5 3M16 4c2 0 2.5 1 2.5 3v2c0 1.5 1 2.5 2.5 3-1.5.5-2.5 1.5-2.5 3v2c0 2-.5 3-2.5 3" />
  ),
  ts: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M6.5 11h6M9.5 11v6.5M18 11.6c-.4-.6-1-.9-1.8-.9-1 0-1.7.6-1.7 1.4 0 2 3.6 1.2 3.6 3.4 0 .9-.8 1.6-1.9 1.6-.9 0-1.6-.4-2-1" />
    </>
  ),
  // Logiciels Adobe : carré arrondi et initiales, comme l'icône TypeScript
  photoshop: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 17V8h2.6a2.2 2.2 0 0 1 0 4.4H7M17.5 11.6c-.4-.6-1-.9-1.7-.9-.9 0-1.5.5-1.5 1.2 0 1.8 3.4 1 3.4 3 0 .8-.7 1.5-1.8 1.5-.8 0-1.5-.4-1.9-1" />
    </>
  ),
  illustrator: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M6.5 17l3-9 3 9M7.5 14.2h4M16 11v6M16 8.3v.1" />
    </>
  ),
  indesign: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7.5 8v9M17.5 7.5V17M17.5 13.5a2.3 2.3 0 1 0-4.6 0v.7a2.3 2.3 0 0 0 4.6 0" />
    </>
  ),
  // WordPress : le W dans un cercle
  wordpress: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M6 8.5l3 8 3-6.5 3 6.5 3-8M5 8.5h3M10.5 8.5h3M16 8.5h3" />
    </>
  ),
  // Python : les deux serpents stylisés du logo
  python: (
    <>
      <path d="M12 3.5c-3 0-4.5 1-4.5 3v2.5H12M7.5 9H6c-2 0-3 1.5-3 3.5S4 16 6 16h1.5M12 20.5c3 0 4.5-1 4.5-3V15H12M16.5 15H18c2 0 3-1.5 3-3.5S20 8 18 8h-1.5V6.5c0-2-1.5-3-4.5-3M7.5 16v1.5c0 2 1.5 3 4.5 3M7.5 9v7M16.5 8v7" />
      <circle cx="10" cy="6.2" r=".6" />
      <circle cx="14" cy="17.8" r=".6" />
    </>
  ),
  // Blender : anneau et œil, avec les trois branches du logo
  blender: (
    <>
      <circle cx="14" cy="13.5" r="6" />
      <circle cx="14" cy="13.5" r="2.2" />
      <path d="M8.6 10.6 3.5 7.5M9.4 8.5 6.5 4.5M8.5 14l-5 .2" />
    </>
  ),
  atom: (
    <>
      <circle cx="12" cy="12" r="1.6" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
    </>
  ),
  hexagon: (
    <>
      <path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z" />
      <path d="M12 7.5l3.9 2.25v4.5L12 16.5l-3.9-2.25v-4.5z" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 12.5l9 5 9-5" />
      <path d="M3 16.5l9 5 9-5" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.1M7 16.5h.1M11 7.5h6M11 16.5h6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M7 9.5l3 2.5-3 2.5M13 15h4" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="3" />
      <path d="M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3" />
    </>
  ),
  cube: (
    <>
      <path d="M12 2.5l8.5 4.8v9.4L12 21.5l-8.5-4.8V7.3z" />
      <path d="M12 21.5V12M20.5 7.3L12 12 3.5 7.3" />
    </>
  ),
  pen: (
    <>
      <path d="M12 3l6.5 6.5L12 21 5.5 9.5z" />
      <circle cx="12" cy="11" r="1.8" />
      <path d="M12 3v6.2" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="M3 9h18M9 9v11" />
    </>
  ),
  cursor: <path d="M5 3.5l13.5 6.8-5.8 1.9-2 5.8z" />,
  palette: (
    <>
      <path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.7 1.6-1.5 0-1.2-1-1.5-1-2.6s.8-1.9 2-1.9H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="10" cy="7" r="1" />
      <circle cx="15" cy="7.5" r="1" />
    </>
  ),
  sparkle: <path d="M12 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  flag: <path d="M5.5 21V4M5.5 4.5h11l-2 4 2 4h-11" />,
  graduation: (
    <>
      <path d="M2.5 9.5L12 5l9.5 4.5L12 14z" />
      <path d="M6.5 11.5v4.3c3 2 8 2 11 0v-4.3M21.5 9.5v5" />
    </>
  ),
  briefcase: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 4h8v5a4 4 0 0 1-8 0z" />
      <path d="M8 5.5H5a3 3 0 0 0 3 4.5M16 5.5h3a3 3 0 0 1-3 4.5M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 3.5l9.5 16.5h-19z" />
      <path d="M12 10v4.5M12 17.2v.1" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

/** Contour en dégradé, comme les icônes de la planche « style graphique » */
export type IconGradient = "warm" | "cool" | "violet" | "sunset";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Si renseigné, l'icône est annoncée ; sinon elle est décorative */
  title?: string;
  gradient?: IconGradient;
}

export function Icon({ name, size = 24, className, title, gradient }: IconProps) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={[gradient && `icon--${gradient}`, className].filter(Boolean).join(" ") || undefined}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={gradient ? `url(#${id})` : "currentColor"}
      strokeWidth={gradient ? 2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      focusable="false"
    >
      {title && <title>{title}</title>}
      {gradient && (
        <defs>
          <linearGradient id={id} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" className="icon__stop-a" />
            <stop offset="1" className="icon__stop-b" />
          </linearGradient>
        </defs>
      )}
      {ICONS[name]}
    </svg>
  );
}
