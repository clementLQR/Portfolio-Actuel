import * as THREE from "three";
import { RIVER_ORIGIN, RIVER_DIR, RIVER_HALF, RIVER_START, RIVER_END } from "../config/layout.js";

// Implantation de la ville : fleuve et lagune, grandes tours, tracés des voies suspendues,
// zones réservées. La ville instanciée (city.js) évite tout ce qui est déclaré ici.
//
// Repère : la caméra est vers (0, 1, -8) et regarde vers -z. La baie vitrée du salon cadre
// environ ±30° à l'horizontale, de -9° à +24° à la verticale : le sol n'est visible qu'au-delà
// de ~160 m, et une tour doit dépasser ~300 m à 600 m de distance pour sortir du cadre.

const v = (x, y, z) => new THREE.Vector3(x, y, z);

// --- fleuve -------------------------------------------------------------------

export function riverX(z) {
    return RIVER_ORIGIN.x + (z - RIVER_ORIGIN.y) * RIVER_DIR.x / RIVER_DIR.y;
}

const endPoint = RIVER_ORIGIN.clone().addScaledVector(RIVER_DIR, RIVER_END);
export const LAGOON = { x: endPoint.x, z: endPoint.y, r: 190 };

// distance au plan d'eau (négative dedans)
export function waterDist(x, z) {
    const px = x - RIVER_ORIGIN.x, pz = z - RIVER_ORIGIN.y;
    const t = THREE.MathUtils.clamp(px * RIVER_DIR.x + pz * RIVER_DIR.y, RIVER_START, RIVER_END);
    const river = Math.hypot(px - RIVER_DIR.x * t, pz - RIVER_DIR.y * t) - RIVER_HALF;
    const lagoon = Math.hypot(x - LAGOON.x, z - LAGOON.z) - LAGOON.r;
    return Math.min(river, lagoon);
}

// --- grandes tours ------------------------------------------------------------
// kind : spire (flèche à anneaux), block (gradins commerciaux), led (tour à bandes LED),
//        twin (deux fûts reliés), mega (tour colossale)

export const HEROES = [
    { id: "T1", x: -80, z: -230, h: 270, w: 22, kind: "spire", neon: 0xb060ff },
    { id: "T2", x: -130, z: -340, h: 210, w: 26, kind: "block", neon: 0xff4fb0 },
    { id: "T3", x: 82, z: -265, h: 240, w: 20, kind: "led", neon: 0x50d0ff },
    { id: "T4", x: 150, z: -390, h: 330, w: 26, kind: "twin", neon: 0xb060ff },
    { id: "T5", x: 60, z: -470, h: 160, w: 16, kind: "led", neon: 0xff4fb0 },
    { id: "T6", x: -170, z: -480, h: 175, w: 18, kind: "spire", neon: 0x50d0ff },
    { id: "T7", x: 230, z: -560, h: 190, w: 20, kind: "block", neon: 0x50d0ff },
    { id: "M1", x: -100, z: -640, h: 720, w: 46, kind: "mega", neon: 0xb060ff },
    { id: "T8", x: 420, z: -760, h: 220, w: 22, kind: "led", neon: 0xb060ff },
    { id: "T9", x: -440, z: -780, h: 240, w: 22, kind: "spire", neon: 0x50d0ff },
    { id: "M2", x: 100, z: -840, h: 540, w: 36, kind: "twin", neon: 0x50d0ff },
    { id: "M3", x: -380, z: -950, h: 460, w: 32, kind: "spire", neon: 0xff4fb0 },
    { id: "M4", x: 330, z: -1040, h: 430, w: 30, kind: "block", neon: 0x50d0ff },
    { id: "T10", x: -190, z: -1080, h: 380, w: 28, kind: "led", neon: 0xb060ff }
];

export const hero = (id) => HEROES.find((h) => h.id === id);

// --- voies suspendues ---------------------------------------------------------

export const HIGHWAYS = [
    // basse et proche : traverse la vue de gauche à droite, sous l'horizon
    {
        width: 14, color: 0xffb070,
        curve: new THREE.CatmullRomCurve3([
            v(-760, -12, -175), v(-380, -10, -200), v(-150, -8, -252), v(20, -7, -292),
            v(200, -6, -330), v(460, -5, -372), v(820, -4, -410)
        ])
    },
    // haute et lointaine : barre la skyline
    {
        width: 12, color: 0x50d0ff,
        curve: new THREE.CatmullRomCurve3([
            v(-950, 24, -590), v(-500, 30, -610), v(-150, 36, -700), v(80, 40, -740),
            v(380, 44, -690), v(950, 50, -620)
        ])
    },
    // file vers l'horizon sur la gauche (lignes de fuite), passe au-dessus de la première
    {
        width: 12, color: 0xff7aa0,
        curve: new THREE.CatmullRomCurve3([
            v(-310, -6, -1250), v(-268, -6, -760), v(-236, -4, -470), v(-220, -1, -300),
            v(-290, 0, -170), v(-650, -8, -70)
        ])
    }
];

// pont droit et monorail (bridges.js)
export const BRIDGE = { z: -149, x0: -400, x1: 400, y: -11 };
export const MONORAIL = new THREE.CatmullRomCurve3([
    v(-300, -6, -95), v(-80, -4, -130), v(30, -5, -200), v(160, -7, -230), v(400, -8, -260)
]);

// --- zones réservées ----------------------------------------------------------

export const RESERVED = [
    { x0: 4, x1: 62, z0: -82, z1: -18 },          // tour proche
    { x0: -62, x1: -4, z0: -98, z1: -22 },        // premier plan (foreground.js)
    { x0: 220, x1: 470, z0: -1340, z1: -1095 },   // zone industrielle (industry.js)
    { x0: -2000, x1: 2000, z0: -157, z1: -141 }   // pont droit
];

// échantillons des tracés pour les tests de collision
const curveSamples = [...HIGHWAYS.map((h) => ({ pts: h.curve.getSpacedPoints(160), r: h.width / 2 + 5 })),
    { pts: MONORAIL.getSpacedPoints(120), r: 7 }];

// Un bâtiment de rayon r peut-il être posé en (x, z) ?
export function isFree(x, z, r = 8) {
    if (waterDist(x, z) < r + 10) return false;
    for (const q of RESERVED) {
        if (x > q.x0 - r && x < q.x1 + r && z > q.z0 - r && z < q.z1 + r) return false;
    }
    for (const t of HEROES) {
        if (Math.hypot(x - t.x, z - t.z) < t.w * 0.75 + r + 8) return false;
    }
    for (const c of curveSamples) {
        for (const p of c.pts) {
            if (Math.abs(p.x - x) < c.r + r && Math.abs(p.z - z) < c.r + r) return false;
        }
    }
    return true;
}
