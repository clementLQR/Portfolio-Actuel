import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "./useMediaQuery";

gsap.registerPlugin(ScrollTrigger);

/**
 * Apparition douce des éléments [data-reveal] au scroll.
 * Relancé à chaque changement de page (clé = pathname).
 */
export function useReveal(key: string): void {
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return;
    const items = gsap.utils.toArray<HTMLElement>("[data-reveal]");
    if (items.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.set(items, { autoAlpha: 0, y: 28 });
      ScrollTrigger.batch(items, {
        start: "top 90%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.08,
            clearProps: "transform",
          }),
      });
    });

    // Les images et polices peuvent décaler la mise en page après le montage
    const refresh = window.setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      window.clearTimeout(refresh);
      ctx.revert();
    };
  }, [key]);
}
