import * as THREE from "three";
import { scene } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { std, neonCyan, neonPink } from "../core/materials.js";
import { onFrame } from "../core/animated.js";
import { GEO, MergeKit, PathSampler, cityGlow, makeBlinkMaterial } from "./kit.js";
import { comMat } from "./buildingMaterial.js";

// Gros véhicules, beaucoup moins nombreux que la petite circulation : navettes
// (le modèle d'origine), bus aériens, taxis, cargos. Lents, sur leurs propres trajectoires,
// feux de navigation clignotants. Ils donnent l'échelle des tours.

const v = (x, y, z) => new THREE.Vector3(x, y, z);

export const ROUTES = [
    { type: "cargo", pts: [v(-900, 90, -515), v(0, 96, -515), v(900, 100, -515)], speed: 7, t: 0.35 },
    { type: "shuttle", pts: [v(900, 140, -900), v(0, 146, -890), v(-900, 150, -880)], speed: 10, t: 0.55 },
    { type: "bus", pts: [v(-500, 55, -180), v(0, 60, -190), v(500, 65, -200)], speed: 12, t: 0.3 },
    { type: "taxi", pts: [v(300, 25, -60), v(20, 40, -250), v(-10, 80, -700), v(-30, 140, -1400)], speed: 16, t: 0.2 },
    { type: "cargo", pts: [v(800, 220, -1300), v(0, 215, -1250), v(-800, 210, -1200)], speed: 9, t: 0.6 },
    { type: "shuttle", pts: [v(-700, 60, -575), v(0, 65, -585), v(700, 70, -610)], speed: 11, t: 0.75 },
    { type: "bus", pts: [v(700, 95, -700), v(0, 92, -705), v(-700, 88, -700)], speed: 13, t: 0.45 }
];

const hullMat = std(0x2c2a3c, { metalness: 0.6, roughness: 0.4 });
const blink = makeBlinkMaterial(0xff4040, 0.9, 0.25);

// navette d'origine : coque ellipsoïde, pont, trois feux
function shuttle(kit, r, i) {
    kit.add(GEO.sphere, hullMat, 0, 0, 0, 1.3 * 4, 0.55 * 4, 3.2 * 4);
    kit.add(new THREE.CylinderGeometry(1, 1.4, 0.6, 16), hullMat, 0, 1.6, 0, 4, 4, 4);
    for (const sz of [-2.2, 0, 2.2]) kit.add(GEO.sphere, i % 2 ? neonCyan : neonPink, 0, -1.8, sz * 4, 0.9, 0.9, 0.9);
    kit.add(GEO.sphere, blink, 5.2, 0, 0, 0.7, 0.7, 0.7);
    kit.add(GEO.sphere, blink, -5.2, 0, 0, 0.7, 0.7, 0.7);
}

// bus aérien : long fuselage, bande de hublots éclairés
function bus(kit) {
    kit.add(GEO.box, hullMat, 0, -2, 0, 5, 4, 26);
    kit.add(GEO.sphere, hullMat, 0, 0, 13, 2.5, 2, 3.5);
    kit.add(GEO.sphere, hullMat, 0, 0, -13, 2.5, 2, 3.5);
    kit.add(GEO.box, cityGlow(0xffd090, 1.6), 0, 0.2, 0, 5.1, 1.0, 22);
    kit.add(GEO.box, cityGlow(0x50d0ff, 1.8), 0, -2.1, 0, 5.2, 0.25, 26);
    kit.add(GEO.box, hullMat, 0, -1, -6, 14, 0.4, 3);
    kit.add(GEO.sphere, blink, 7, -1, -6, 0.5, 0.5, 0.5);
    kit.add(GEO.sphere, blink, -7, -1, -6, 0.5, 0.5, 0.5);
}

// taxi : compact, liseré jaune
function taxi(kit) {
    kit.add(GEO.sphere, hullMat, 0, 0, 0, 2.4, 1.2, 5);
    kit.add(GEO.sphere, comMat, 0, 0.7, -0.6, 1.6, 0.9, 2.6);
    kit.add(GEO.box, cityGlow(0xffc040, 2.0), 0, -0.1, 0, 4.9, 0.2, 9);
    kit.add(GEO.box, cityGlow(0xfff0d0, 2.6), 0, 0, 4.9, 2.4, 0.3, 0.2);
    kit.add(GEO.box, cityGlow(0xff3040, 2.4), 0, 0, -4.9, 2.6, 0.3, 0.2);
}

// cargo : poutre centrale, conteneurs, réacteurs
function cargo(kit, r) {
    kit.add(GEO.box, hullMat, 0, -1, 0, 4, 3, 46);
    kit.add(GEO.box, hullMat, 0, 0, 22, 9, 5, 8);
    const cols = [0x8a3a3a, 0x3a5a8a, 0x8a6a2a, 0x4a3a6a];
    for (let z = -18; z < 16; z += 6.5) {
        for (const x of [-3.2, 3.2]) kit.add(GEO.box, std(cols[Math.floor(r() * cols.length)], { roughness: 0.8 }), x, -3.5, z, 3, 3, 6);
    }
    for (const x of [-4, 4]) {
        kit.add(GEO.cyl, hullMat, x, 0, -24, 2.6, 4, 2.6, 0, Math.PI / 2);
        kit.add(GEO.disc, cityGlow(0x70c0ff, 2.2), x, 0, -24.2, 1.1, 0.3, 1.1, 0, Math.PI / 2);
    }
    kit.add(GEO.sphere, blink, 0, 2.6, 22, 0.8, 0.8, 0.8);
    kit.add(GEO.sphere, blink, 0, -1, -23, 0.8, 0.8, 0.8);
}

const BUILD = { shuttle, bus, taxi, cargo };

export function createShips() {
    const { r } = seeded(1601);
    const ships = ROUTES.map((route, i) => {
        const g = new THREE.Group();
        const kit = new MergeKit();
        BUILD[route.type](kit, r, i);
        kit.build(g);
        scene.add(g);
        return { g, route, sampler: new PathSampler(new THREE.CatmullRomCurve3(route.pts), 300), t: route.t, bob: i * 1.7 };
    });

    const p = new THREE.Vector3(), tan = new THREE.Vector3();
    onFrame((dt, time) => {
        for (const s of ships) {
            s.t = (s.t + (s.route.speed * dt) / s.sampler.length) % 1;
            s.sampler.at(s.t, p);
            s.sampler.tangent(s.t, tan);
            p.y += Math.sin(time * 0.5 + s.bob) * 0.6;
            s.g.position.copy(p);
            s.g.lookAt(p.add(tan));
        }
    });
}
