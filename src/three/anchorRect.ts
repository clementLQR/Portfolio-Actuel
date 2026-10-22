// Position à l'écran des ancres de la mascotte, sans forcer une mise en page à chaque image.
// getBoundingClientRect() recalcule la mise en page si quelque chose a changé : appelé à
// chaque image pendant le défilement, il pesait lourd sur mobile. Ici on mesure au plus
// quelques fois par seconde, et entre deux mesures on décale du défilement parcouru
// La position de défilement est mémorisée à chaque événement « scroll » : la relire à chaque
// image forcerait elle aussi une mise en page, dès qu'un style vient d'être modifié.

export interface AnchorRect {
  left: number;
  top: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface Entry {
  rect: AnchorRect;
  scrollX: number;
  scrollY: number;
  at: number;
  /** Ancre en position fixe : elle ne bouge pas avec le défilement */
  fixed: boolean;
}

/** Durée de validité d'une mesure (ms) */
const MAX_AGE = 200;

const cache = new WeakMap<HTMLElement, Entry>();
let generation = 0;
let measuredGeneration = new WeakMap<HTMLElement, number>();

let scrollX = 0;
let scrollY = 0;
let viewportW = 0;
let viewportH = 0;

/** Taille du viewport, mémorisée au redimensionnement (sa lecture peut forcer une mise en page) */
export function viewportSize(): { width: number; height: number } {
  return { width: viewportW, height: viewportH };
}

// Redimensionnement : toutes les mesures sont à refaire
if (typeof window !== "undefined") {
  scrollX = window.scrollX;
  scrollY = window.scrollY;
  viewportW = window.innerWidth;
  viewportH = window.innerHeight;
  window.addEventListener(
    "scroll",
    () => {
      scrollX = window.scrollX;
      scrollY = window.scrollY;
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    generation += 1;
    measuredGeneration = new WeakMap();
  });
}

function isFixed(el: HTMLElement): boolean {
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).position === "fixed") return true;
  }
  return false;
}

function measure(el: HTMLElement, now: number): Entry {
  const r = el.getBoundingClientRect();
  // La mise en page est à jour juste après getBoundingClientRect : lecture sans surcoût
  scrollX = window.scrollX;
  scrollY = window.scrollY;
  const previous = cache.get(el);
  const entry: Entry = {
    rect: { left: r.left, top: r.top, width: r.width, height: r.height, bottom: r.bottom, right: r.right },
    scrollX,
    scrollY,
    at: now,
    fixed: previous?.fixed ?? isFixed(el),
  };
  cache.set(el, entry);
  measuredGeneration.set(el, generation);
  return entry;
}

/**
 * Position de l'ancre dans le viewport.
 * `live` : mesure à chaque appel (ancre animée, comme la poignée du tiroir tirée par la mascotte).
 */
export function anchorRect(el: HTMLElement, live = false): AnchorRect {
  const now = performance.now();
  let entry = cache.get(el);
  if (live || !entry || now - entry.at > MAX_AGE || measuredGeneration.get(el) !== generation) {
    entry = measure(el, now);
  }
  if (entry.fixed) return entry.rect;
  const dx = scrollX - entry.scrollX;
  const dy = scrollY - entry.scrollY;
  const { left, top, width, height } = entry.rect;
  return { left: left - dx, top: top - dy, width, height, right: left - dx + width, bottom: top - dy + height };
}
