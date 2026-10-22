import { useEffect } from "react";
import { MathUtils } from "three";
import { LOOK_DEPTH_PX, LOOK_MAX_PITCH, LOOK_MAX_YAW } from "./constants";

/** Dernière position connue de la souris, lue à chaque image par la scène */
export const pointer = {
  x: 0,
  y: 0,
  lastMove: 0,
  active: false,
};

/** Suit la souris (pas le tactile) tant que `enabled` est vrai */
export function useLookAt(enabled: boolean): void {
  useEffect(() => {
    pointer.active = false;
    if (!enabled) return;

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastMove = performance.now();
      pointer.active = true;
    };
    const onLeave = () => {
      pointer.active = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      pointer.active = false;
    };
  }, [enabled]);
}

/**
 * Angles de tête (radians) pour regarder un point de l'écran depuis la tête.
 * Lacet positif = vers la droite de l'écran, tangage positif = vers le bas.
 */
export function lookAngles(fromX: number, fromY: number, toX: number, toY: number): { yaw: number; pitch: number } {
  return {
    yaw: MathUtils.clamp(Math.atan2(toX - fromX, LOOK_DEPTH_PX), -LOOK_MAX_YAW, LOOK_MAX_YAW),
    pitch: MathUtils.clamp(Math.atan2(toY - fromY, LOOK_DEPTH_PX), -LOOK_MAX_PITCH, LOOK_MAX_PITCH),
  };
}
