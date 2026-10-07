import * as THREE from "three";

export function std(color, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra });
}

// Matériau lumineux non éclairé (néons, ampoules, écrans) ; intensity > 1 déclenche le bloom
export function glow(color, intensity = 1) {
    const m = new THREE.MeshBasicMaterial({ color, fog: false });
    m.color.multiplyScalar(intensity);
    return m;
}

// Matériaux partagés de l'appartement
export const wallMat = std(0x7a6472, { roughness: 0.95 });
export const frameMat = std(0x2a1d22, { roughness: 0.6 });
export const woodMat = std(0x6a4630, { roughness: 0.55 });
export const darkWood = std(0x3a2a24, { roughness: 0.6 });
export const ceilingMat = std(0x3a2c38);

// Néons de la ville
export const neonViolet = glow(0xb060ff, 1.2);
export const neonPink = glow(0xff4fb0, 1.2);
export const neonCyan = glow(0x50d0ff, 1.0);
export const redLight = glow(0xff3030, 1.5);

// Lampes de l'appartement : elles s'éteignent en plein jour (setLampLevel, appelé par lighting.js).
// dimLight() enveloppe une lumière : son intensité réelle = intensité demandée × niveau des lampes,
// ce qui laisse intactes les animations qui la règlent chaque image (scintillement…).
let lampLevel = 1;
const lampGlows = [];

export function dimLight(light) {
    let base = light.intensity;
    Object.defineProperty(light, "intensity", { get: () => base * lampLevel, set: (v) => { base = v; }, configurable: true });
    return light;
}

// Ampoule, abat-jour ou bande LED : s'assombrit quand la lampe s'éteint
export function lampGlow(color, intensity = 1) {
    const mat = glow(color, intensity);
    lampGlows.push({ mat, base: mat.color.clone() });
    return mat;
}

export function setLampLevel(k) {
    lampLevel = k;
    for (const { mat, base } of lampGlows) mat.color.copy(base).multiplyScalar(0.2 + 0.8 * k);
}
