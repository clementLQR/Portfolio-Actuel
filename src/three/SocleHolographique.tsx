import { useEffect, useMemo, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, NormalBlending, ShaderMaterial } from "three";
import type { Theme } from "../store/useThemeStore";
import { SOCLE_TILT } from "./constants";
import { cssColor } from "./cssColor";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Deux anneaux nets + un halo doux, dégradé cyan → violet qui tourne lentement
const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    float angle = atan(p.y, p.x);

    float ring = smoothstep(0.06, 0.0, abs(r - 0.84));
    float ringInner = smoothstep(0.03, 0.0, abs(r - 0.62)) * 0.55;
    float halo = smoothstep(0.95, 0.0, r) * 0.28;
    float pulse = 0.78 + 0.22 * sin(uTime * 1.8);

    vec3 color = mix(uColorA, uColorB, 0.5 + 0.5 * sin(angle + uTime * 0.5));
    float alpha = (ring + ringInner + halo) * pulse * uIntensity * uOpacity;
    gl_FragColor = vec4(color * alpha, alpha);
    #include <colorspace_fragment>
  }
`;

interface SocleProps {
  /** Opacité pilotée par la scène (0 = caché), lue à chaque image */
  opacity: RefObject<number>;
  theme: Theme;
  animated: boolean;
}

/** Anneau lumineux additif sous les pieds de la mascotte, dans le hero */
export function SocleHolographique({ opacity, theme, animated }: SocleProps) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uColorA: { value: cssColor("--accent") },
          uColorB: { value: cssColor("--accent-2") },
          uTime: { value: 0 },
          uIntensity: { value: 1 },
          uOpacity: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
      }),
    [],
  );

  // Couleurs et intensité suivent le thème (socle moins lumineux en clair)
  useEffect(() => {
    material.uniforms.uColorA!.value = cssColor("--accent");
    material.uniforms.uColorB!.value = cssColor("--accent-2");
    material.uniforms.uIntensity!.value = theme === "light" ? 0.6 : 1.15;
    // Un mélange additif ne se voit pas sur fond clair : on passe en mélange normal (alpha prémultiplié)
    material.blending = theme === "light" ? NormalBlending : AdditiveBlending;
    material.premultipliedAlpha = theme === "light";
    material.needsUpdate = true;
  }, [material, theme]);

  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    if (animated) material.uniforms.uTime!.value += delta;
    material.uniforms.uOpacity!.value = opacity.current ?? 0;
  });

  return (
    <mesh rotation={[-Math.PI / 2 + SOCLE_TILT, 0, 0]} position={[0, 0.02, 0]} material={material} renderOrder={-1}>
      <planeGeometry args={[2.8, 2.8]} />
    </mesh>
  );
}
