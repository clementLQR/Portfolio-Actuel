import { Suspense, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import { COARSE_POINTER_QUERY, MOBILE_QUERY, useMediaQuery, usePrefersReducedMotion } from "../hooks/useMediaQuery";
import { useThemeStore, type Theme } from "../store/useThemeStore";
import { EASTER_EGG_CLICKS, EASTER_EGG_GAP_MS, FAST_SCROLL_PX_PER_S, SLEEP_AFTER_MS } from "./constants";
import { cssColor } from "./cssColor";
import { Mascotte } from "./Mascotte";
import { MascotteSymbols } from "./MascotteSymbols";
import { useAnchors } from "./useAnchors";
import { useLookAt } from "./useLookAt";
import { mascotScreen, useMascotteStore } from "./useMascotteStore";
import "./MascotteCanvas.scss";

/** Lumière douce de face, contre-jours orange et cyan (plus doux en thème clair) */
function Lights({ theme }: { theme: Theme }) {
  // Les tokens changent avec le thème : on les relit à chaque bascule
  const colors = useMemo(() => ({ theme, warm: cssColor("--accent-warm"), cool: cssColor("--accent") }), [theme]);
  const rim = theme === "light" ? 1.6 : 3.2;
  return (
    <>
      <ambientLight intensity={theme === "light" ? 1.1 : 0.85} />
      <directionalLight position={[0.4, 1.2, 3]} intensity={2.4} />
      <directionalLight position={[-3, 1.4, -2]} intensity={rim} color={colors.warm} />
      <directionalLight position={[3, 1.4, -2]} intensity={rim} color={colors.cool} />
    </>
  );
}

/** Recolle un élément HTML sur la mascotte à chaque image */
function useFollowMascot(ref: RefObject<HTMLDivElement | null>, place: (el: HTMLDivElement) => void): void {
  useEffect(() => {
    let frame = 0;
    const loop = () => {
      const el = ref.current;
      if (el) {
        el.style.display = mascotScreen.visible ? "block" : "none";
        place(el);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [ref, place]);
}

function placeHitZone(el: HTMLDivElement): void {
  el.style.transform = `translate(${mascotScreen.x}px, ${mascotScreen.y}px)`;
  el.style.width = `${mascotScreen.width}px`;
  el.style.height = `${mascotScreen.height}px`;
}

function placeSymbols(el: HTMLDivElement): void {
  el.style.transform = `translate(${mascotScreen.x + mascotScreen.width / 2}px, ${mascotScreen.y}px)`;
}

/** Symboles et bulle au-dessus de la tête, en HTML stylé avec les tokens */
function SymbolsLayer() {
  const ref = useRef<HTMLDivElement>(null);
  useFollowMascot(ref, placeSymbols);
  return (
    <div ref={ref} className="mascot-symbols" aria-hidden="true">
      <MascotteSymbols />
    </div>
  );
}

/** Zone cliquable invisible collée à la mascotte (le canvas ignore les pointeurs) */
function HitZone() {
  const ref = useRef<HTMLDivElement>(null);
  const clicks = useRef<number[]>([]);
  useFollowMascot(ref, placeHitZone);

  const onClick = () => {
    const store = useMascotteStore.getState();
    if (store.dizzy) return;
    const now = performance.now();
    const last = clicks.current.at(-1) ?? 0;
    clicks.current = now - last < EASTER_EGG_GAP_MS ? [...clicks.current, now] : [now];

    if (clicks.current.length >= EASTER_EGG_CLICKS) {
      clicks.current = [];
      store.setDizzy(true);
      store.pulseMood("surprise", 2600);
      store.say("Tout tourne !", 2600);
      window.setTimeout(() => useMascotteStore.getState().setDizzy(false), 2600);
      return;
    }
    store.pulseMood("heureuse", 1200);
  };

  // Décoratif : aucune information ne passe uniquement par la mascotte
  return <div ref={ref} className="mascot-hit" aria-hidden="true" onClick={onClick} />;
}

/** Endormissement après 30 s d'inactivité, réveil au premier mouvement */
function useIdleSleep(): void {
  useEffect(() => {
    let last = performance.now();
    const onActivity = () => {
      last = performance.now();
      const store = useMascotteStore.getState();
      if (store.sleeping) {
        store.setSleeping(false);
        store.pulseMood("surprise", 900);
      }
    };
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    events.forEach((name) => window.addEventListener(name, onActivity, { passive: true }));
    const timer = window.setInterval(() => {
      if (!document.hidden && performance.now() - last > SLEEP_AFTER_MS) useMascotteStore.getState().setSleeping(true);
    }, 1000);
    return () => {
      events.forEach((name) => window.removeEventListener(name, onActivity));
      window.clearInterval(timer);
    };
  }, []);
}

/** Sursaut en cas de scroll très rapide */
function useScrollSurprise(): void {
  useEffect(() => {
    let lastY = window.scrollY;
    let lastT = performance.now();
    let cooldown = 0;
    const onScroll = () => {
      const now = performance.now();
      const speed = Math.abs(window.scrollY - lastY) / Math.max(now - lastT, 1) * 1000;
      lastY = window.scrollY;
      lastT = now;
      if (speed > FAST_SCROLL_PX_PER_S && now > cooldown) {
        cooldown = now + 3000;
        useMascotteStore.getState().pulseMood("surprise", 1100);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
}

const CURIOUS_SELECTOR = "main a, main button, main [tabindex='0'], .rail a";

/** Survol ou focus d'un lien / d'une carte : la mascotte devient curieuse et regarde l'élément */
function useCuriosity(): void {
  useEffect(() => {
    let current: Element | null = null;

    const enter = (event: Event) => {
      const target = (event.target as Element | null)?.closest?.(CURIOUS_SELECTOR) ?? null;
      if (!target || target === current) return;
      const store = useMascotteStore.getState();
      // On n'interrompt pas une humeur plus importante (succès, envoi en cours…)
      if (store.mood !== store.baseMood && store.mood !== "curieuse") return;
      current = target;
      const rect = target.getBoundingClientRect();
      store.setFocus({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      store.setMood("curieuse");
    };

    const leave = (event: Event) => {
      if (!current) return;
      const next = (event as PointerEvent | FocusEvent).relatedTarget as Node | null;
      if (next && current.contains(next)) return;
      current = null;
      const store = useMascotteStore.getState();
      store.setFocus(null);
      if (store.mood === "curieuse") store.resetMood();
    };

    document.addEventListener("pointerover", enter);
    document.addEventListener("pointerout", leave);
    document.addEventListener("focusin", enter);
    document.addEventListener("focusout", leave);
    return () => {
      document.removeEventListener("pointerover", enter);
      document.removeEventListener("pointerout", leave);
      document.removeEventListener("focusin", enter);
      document.removeEventListener("focusout", leave);
    };
  }, []);
}

/**
 * Le canvas unique du site : fixe, transparent, sans pointeurs, jamais démonté.
 * La mascotte se place sur les ancres HTML [data-mascot-anchor].
 */
export default function MascotteCanvas() {
  const reducedMotion = usePrefersReducedMotion();
  const mobile = useMediaQuery(MOBILE_QUERY);
  const coarse = useMediaQuery(COARSE_POINTER_QUERY);
  const theme = useThemeStore((s) => s.theme);
  const [tabVisible, setTabVisible] = useState(() => !document.hidden);
  const followPointer = !mobile && !coarse && !reducedMotion;

  useAnchors();
  useLookAt(followPointer);
  useIdleSleep();
  useScrollSurprise();
  useCuriosity();

  // Rendu en pause quand l'onglet est caché
  useEffect(() => {
    const onVisibility = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <>
      <div className="mascot-layer" aria-hidden="true">
        <Canvas
          style={{ pointerEvents: "none" }}
          orthographic
          dpr={[1, 1.75]}
          frameloop={tabVisible ? "always" : "never"}
          camera={{ zoom: 1, position: [0, 0, 1000], near: 1, far: 4000 }}
          gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.15;
            gl.outputColorSpace = SRGBColorSpace;
            gl.setClearColor(0x000000, 0);
          }}
        >
          <Lights theme={theme} />
          <Suspense fallback={null}>
            <Mascotte reducedMotion={reducedMotion} followPointer={followPointer} theme={theme} />
          </Suspense>
        </Canvas>
      </div>
      <SymbolsLayer />
      <HitZone />
    </>
  );
}
