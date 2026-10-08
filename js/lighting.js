import * as THREE from "three";
import { scene, REFLECT_LAYER } from "./core/scene.js";
import { onFrame } from "./core/animated.js";
import { dimLight, setLampLevel } from "./core/materials.js";
import { RX0, BZ, SF, SZ1 } from "./config/layout.js";
import { QUALITY } from "./core/quality.js";

// Éclairage global : ambiance prune douce, soleil couchant avec ombres, lueurs d'appoint,
// reflets colorés de la ville qui passent par les fenêtres.
// Les lampes propres à chaque pièce sont créées dans les modules des pièces.

// Reflet de la ville par une fenêtre : teinte qui glisse très lentement (violet, cyan doux, rose)
// et, de temps en temps, la brève lueur d'un véhicule qui passe devant la vitre.
// Passage au plein jour (daylight.js) : 0 = coucher de soleil, 1 = jour
let dayK = 0;
const daylight = [];   // fonctions (k) appelées à chaque changement

const CITY_TINTS = [new THREE.Color(0x8a6ad8), new THREE.Color(0x6aa8c8), new THREE.Color(0xc070a8)];

function cityTint(position, intensity, phase) {
    const light = new THREE.PointLight(CITY_TINTS[0], intensity, 7, 1.8);
    light.position.copy(position);
    scene.add(light);
    onFrame((dt, t) => {
        const k = ((t * 0.025 + phase) % 1) * CITY_TINTS.length;
        const i = Math.floor(k), f = k - i;
        light.color.copy(CITY_TINTS[i]).lerp(CITY_TINTS[(i + 1) % CITY_TINTS.length], f * f * (3 - 2 * f));
        const pass = Math.pow(Math.max(0, Math.sin(t * 0.45 + phase * 7)), 40);
        light.intensity = intensity * (0.85 + 0.15 * Math.sin(t * 0.3 + phase) + pass * 1.2) * (1 - 0.7 * dayK);
    });
}

export function createLights() {
    const hemi = new THREE.HemisphereLight(0x5e4a8a, 0x4a2c24, 1.4);
    hemi.layers.enable(REFLECT_LAYER);
    scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xff9a58, 1.15);
    const sunTarget = new THREE.Object3D();
    sunTarget.position.set(1, 0, -4);
    scene.add(sunTarget);
    sun.target = sunTarget;
    sun.position.copy(sunTarget.position).add(new THREE.Vector3(0.18, 0.2, -1).normalize().multiplyScalar(35));
    sun.castShadow = true;
    sun.shadow.mapSize.set(QUALITY.shadowSize, QUALITY.shadowSize);
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 9, bottom: -9, near: 1, far: 80 });
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.layers.enable(REFLECT_LAYER);   // éclaire aussi la ville dans le reflet du fleuve
    scene.add(sun);

    // lueur rosée qui remonte de l'ouverture vers la chambre
    const openingGlow = new THREE.PointLight(0xff8a70, 1.6, 9, 1.4);
    openingGlow.position.set(1.0, 1.6, BZ + 0.4);
    scene.add(openingGlow);

    const violetFill = new THREE.PointLight(0x8a6aa8, 1.6, 14, 1.4);
    violetFill.position.set(0.5, 3.0, 2.5);
    scene.add(violetFill);

    // bande LED derrière la tête de lit
    const ledLight = dimLight(new THREE.PointLight(0xff8a50, 0.6, 3.5, 2));
    ledLight.position.set(RX0 + 0.25, 1.5, -0.35);
    scene.add(ledLight);

    // jour : ciel bleu clair, soleil haut et blanc, lueurs des fenêtres plus froides
    const lerpers = [
        [hemi.color, 0x5e4a8a, 0xb8d0ee], [hemi.groundColor, 0x4a2c24, 0x9a8470],
        [sun.color, 0xff9a58, 0xfff2dc], [openingGlow.color, 0xff8a70, 0xe6eeff], [violetFill.color, 0x8a6aa8, 0xc4d2ec]
    ].map(([c, a, b]) => [c, new THREE.Color(a), new THREE.Color(b)]);
    const sunDirSunset = new THREE.Vector3(0.18, 0.2, -1).normalize(), sunDirDay = new THREE.Vector3(-0.35, 1.3, -0.7).normalize();
    const dir = new THREE.Vector3();
    daylight.push((k) => {
        for (const [c, a, b] of lerpers) c.lerpColors(a, b, k);
        hemi.intensity = 1.4 + 2.2 * k;
        sun.intensity = 1.15 + 2.6 * k;
        openingGlow.intensity = 1.6 + 1.6 * k;
        violetFill.intensity = 1.6 + 1.4 * k;
        dir.lerpVectors(sunDirSunset, sunDirDay, k).normalize();
        sun.position.copy(sunTarget.position).addScaledVector(dir, 35);
    });

    cityTint(new THREE.Vector3(0.5, 2.6, SZ1 + 1.0), 0.6, 0.0);       // baie du salon
    cityTint(new THREE.Vector3(-6.85, SF + 1.7, SZ1 + 0.8), 0.4, 0.37); // fenêtre du bureau
}

export function setDaylight(k) {
    dayK = k;
    setLampLevel(1 - Math.min(1, k * 1.5));   // les lampes s'éteignent dans la première partie du lever du jour
    for (const fn of daylight) fn(k);
}
