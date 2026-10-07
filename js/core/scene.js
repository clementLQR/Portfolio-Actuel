import * as THREE from "three";

// Scène unique partagée par tous les modules + ambiance globale (brouillard, soleil)

export const scene = new THREE.Scene();

export const SUN_DIR = new THREE.Vector3(-0.02, 0.04, -1).normalize();
export const FOG_COLOR = new THREE.Color(0x6e3474);
export const FOG_DENSITY = 0.0013;

// Palette du coucher de soleil, partagée par le ciel, la brume, les reflets et les façades
export const SKY = {
    zenith: new THREE.Color(0x10154e),
    high: new THREE.Color(0x3a2484),
    pink: new THREE.Color(0xb23e82),
    horizon: new THREE.Color(0xff6a3a),
    glow: new THREE.Color(0xffb27a),
    sun: new THREE.Color(0xffe4b0),
    fogSun: new THREE.Color(0xd86a6c)
};

// Palette de plein jour (bouton jour / coucher de soleil, voir daylight.js)
export const SKY_DAY = {
    zenith: new THREE.Color(0x1f5fd0),
    high: new THREE.Color(0x3f8ae8),
    pink: new THREE.Color(0x74b2f0),
    horizon: new THREE.Color(0xb0d6f4),
    glow: new THREE.Color(0xe8f2f8),
    sun: new THREE.Color(0xfffbee),
    fogSun: new THREE.Color(0xdce8f2)
};
export const SUN_DIR_DAY = new THREE.Vector3(-0.3, 0.78, -0.55).normalize();
export const FOG_COLOR_SUNSET = FOG_COLOR.clone();
export const FOG_COLOR_DAY = new THREE.Color(0xa6c6e6);

// Calque des objets de la ville vus dans les reflets du fleuve (les pièces n'y sont pas)
export const REFLECT_LAYER = 1;

scene.fog = new THREE.FogExp2(FOG_COLOR, FOG_DENSITY);
scene.background = new THREE.Color(0x1a1030);

// uniforms communs aux shaders maison (ciel, immeubles, fleuve, post-traitement)
export const shared = {
    uTime: { value: 0 },
    uFogColor: { value: FOG_COLOR },
    uFogDensity: { value: FOG_DENSITY },
    uSunDir: { value: SUN_DIR },
    uDay: { value: 0 }          // 0 = coucher de soleil, 1 = plein jour
};
