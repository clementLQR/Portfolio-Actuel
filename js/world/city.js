import * as THREE from "three";
import { seeded } from "../core/random.js";
import { GROUND_Y } from "../config/layout.js";
import { GEO, Batch, instGlow, makeBlinkMaterial, metalMat, darkMetalMat } from "./kit.js";
import { resMat, resWarmMat, comMat, towerMat, towerCyanMat, towerPinkMat, industrialMat } from "./buildingMaterial.js";
import { isFree, riverX } from "./zones.js";
import { addTree, addBush, addGreenWall } from "./vegetation.js";
import { LANES } from "./traffic.js";
import { ROUTES } from "./ships.js";

// Ville instanciée : plusieurs milliers d'immeubles posés sur une grille d'îlots
// (avenues tous les 4 îlots, rues transversales tous les 5), regroupés par forme et
// par famille de façade — un InstancedMesh par couple (forme, matériau).
// Quartiers d'affaires plus hauts autour de quelques centres, premier plan bas pour
// dégager la vue, puis une ligne de silhouettes à l'horizon.
// Détails instanciés : édicules et antennes sur les toits, balises, couronnes et bandes LED,
// balcons filants, jardins sur les toits et les gradins, murs végétaux, petits parcs.

export const CELL = 17;
export const CITY_X0 = -1020, CITY_Z0 = -60;
export const AVENUE_EVERY = 4, STREET_EVERY = 5;
const CAM_X = 0.5, CAM_Z = -8;

// centres des quartiers d'affaires : poids et rayon
const CLUSTERS = [
    { x: -120, z: -560, r: 260, s: 1.0 },
    { x: 170, z: -700, r: 280, s: 0.9 },
    { x: -380, z: -880, r: 300, s: 0.85 },
    { x: 420, z: -950, r: 300, s: 0.7 },
    { x: -40, z: -1180, r: 360, s: 0.8 },
    { x: -560, z: -420, r: 220, s: 0.6 },
    { x: 480, z: -420, r: 200, s: 0.5 }
];

function density(x, z) {
    let d = 0;
    for (const c of CLUSTERS) {
        const q = Math.hypot(x - c.x, z - c.z) / c.r;
        d = Math.max(d, c.s * Math.exp(-q * q));
    }
    return d;
}

// Couloirs aériens : sous une voie de circulation, les immeubles restent 12 m plus bas
const AIR = new Map();
const AIR_CELL = 20;
for (const route of [...LANES, ...ROUTES]) {
    for (const p of new THREE.CatmullRomCurve3(route.pts).getSpacedPoints(400)) {
        const cx = Math.floor(p.x / AIR_CELL), cz = Math.floor(p.z / AIR_CELL);
        for (let i = -1; i <= 1; i++) for (let k = -1; k <= 1; k++) {
            const key = (cx + i) + "," + (cz + k);
            AIR.set(key, Math.min(AIR.get(key) ?? Infinity, p.y - 12 - GROUND_Y));
        }
    }
}
const airCeiling = (x, z) => AIR.get(Math.floor(x / AIR_CELL) + "," + Math.floor(z / AIR_CELL)) ?? Infinity;

const NEONS = [0xb060ff, 0xff4fb0, 0x50d0ff, 0xff8a40, 0xb060ff];
const color = new THREE.Color();
const neon = (pick, k = 2.2) => color.set(pick(NEONS)).multiplyScalar(k).clone();

export function createCity() {
    const { r, rr, pick } = seeded(7310);

    const batches = new Map();
    const batch = (geo, mat) => {
        const key = geo.uuid + mat.uuid;
        if (!batches.has(key)) batches.set(key, { geo, mat, b: new Batch() });
        return batches.get(key).b;
    };

    const roofUnits = new Batch();
    const masts = new Batch();
    const beacons = new Batch();
    const bandsBox = new Batch();
    const bandsOct = new Batch();
    const strips = new Batch();
    const ledges = new Batch();

    // rotation d'un décalage local (lx, lz) par ry
    const rot = (lx, lz, ry) => [lx * Math.cos(ry) + lz * Math.sin(ry), -lx * Math.sin(ry) + lz * Math.cos(ry)];

    function placeBuilding(bx, bz, h, w, dpt, tall, d) {
        let geo, mat;
        const u = r();
        if (!tall && h < 34) {
            geo = u < 0.78 ? GEO.box : u < 0.9 ? GEO.podium : GEO.hex;
            mat = geo === GEO.podium ? comMat : r() < 0.35 ? resWarmMat : resMat;
        } else if (u < 0.22) {
            geo = GEO.box; mat = r() < 0.5 ? resMat : comMat;
        } else if (u < 0.42) {
            geo = GEO.setback; mat = comMat;
        } else if (u < 0.58) {
            geo = GEO.oct; mat = pick([towerMat, towerCyanMat, towerPinkMat]);
        } else if (u < 0.72) {
            geo = GEO.taper; mat = pick([towerMat, comMat]);
        } else if (u < 0.84) {
            geo = GEO.twin; mat = pick([resMat, comMat]);
        } else {
            geo = GEO.hex; mat = pick([towerCyanMat, comMat, towerMat]);
        }
        const round = geo === GEO.oct || geo === GEO.hex;
        if (round) w = dpt = Math.min(w, dpt);
        const ry = r() < 0.18 ? rr(-0.4, 0.4) : 0;
        batch(geo, mat).add(bx, GROUND_Y, bz, w, h, dpt, ry);

        const top = GROUND_Y + h;
        if (d > 950) return;

        // largeur du toit selon la forme
        const tw = geo === GEO.setback ? 0.56 : geo === GEO.taper ? 0.62 : geo === GEO.podium ? 0.55 : 1;
        const isBoxy = geo === GEO.box || geo === GEO.setback;

        // édicules techniques
        if (geo !== GEO.taper && geo !== GEO.twin && r() < 0.75) {
            const n = 1 + Math.floor(r() * 3);
            for (let i = 0; i < n; i++) {
                const [ox, oz] = rot(rr(-0.3, 0.3) * w * tw, rr(-0.3, 0.3) * dpt * tw, ry);
                const px = geo === GEO.podium ? -0.15 * w : 0, pz = geo === GEO.podium ? -0.15 * dpt : 0;
                roofUnits.add(bx + ox + px, top, bz + oz + pz, rr(2, 4.5), rr(1.2, 3.5), rr(2, 4), ry);
            }
        }

        // antennes et balises
        if (tall && geo !== GEO.twin && r() < 0.6) {
            const mh = rr(8, 26) + h * 0.07;
            if (h + mh + 4 < airCeiling(bx, bz)) {
                masts.add(bx, top, bz, 1 + h / 200, mh, 1 + h / 200);
                const s = 1.2 + d / 400;
                beacons.add(bx, top + mh, bz, s, s, s);
            }
        }

        // couronne lumineuse
        if (tall && d < 760 && r() < 0.35) {
            const y = top - rr(1.5, 5);
            if (isBoxy) bandsBox.add(bx, y, bz, w * tw + 0.8, 0.7, dpt * tw + 0.8, ry, neon(pick));
            else if (round) bandsOct.add(bx, y, bz, w + 0.8, 0.7, dpt + 0.8, ry, neon(pick));
        }

        // bandes LED verticales aux angles
        if (tall && isBoxy && d < 700 && r() < 0.3) {
            const len = h * (geo === GEO.setback ? 0.5 : 0.85);
            const c = neon(pick, 1.8);
            for (const sx of [-1, 1]) {
                const [ox, oz] = rot(sx * (w / 2 + 0.3), dpt / 2 + 0.3, ry);
                strips.add(bx + ox, GROUND_Y + h * 0.06, bz + oz, 0.45, len, 0.45, ry, c);
            }
        }

        // balcons filants sur les immeubles d'habitation proches
        if ((mat === resMat || mat === resWarmMat) && geo === GEO.box && d < 480 && h > 14) {
            const step = rr(6.2, 9.3);
            for (let y = 6; y < h - 3; y += step) {
                ledges.add(bx, GROUND_Y + y, bz, w + 1.4, 0.32, dpt + 1.4, ry);
            }
        }

        // mur végétal sur la façade tournée vers la caméra
        if ((mat === resMat || mat === resWarmMat) && geo === GEO.box && ry === 0 && d < 520 && r() < 0.16) {
            addGreenWall(bx - w * 0.35, bx + w * rr(-0.1, 0.3), GROUND_Y + 3, GROUND_Y + h * rr(0.4, 0.9), bz + dpt / 2, r, 1, 0.65);
        }

        // jardins : toits bas, gradins, socles
        if (d < 720) {
            if (!tall && h < 36 && geo === GEO.box && r() < 0.4) {
                const n = 2 + Math.floor(r() * 4);
                for (let i = 0; i < n; i++) {
                    const [ox, oz] = rot(rr(-0.35, 0.35) * w, rr(-0.35, 0.35) * dpt, ry);
                    if (r() < 0.6) addTree(bx + ox, top, bz + oz, rr(3, 6.5), r);
                    else addBush(bx + ox, top, bz + oz, rr(1.2, 2.2), r);
                }
            }
            if (geo === GEO.setback && r() < 0.6) {
                for (const [lv, wa, wb] of [[0.58, 1, 0.8], [0.85, 0.8, 0.56]]) {
                    const z = (wa + wb) / 4 * dpt;
                    for (let x = -wa / 2 + 0.1; x < wa / 2 - 0.1; x += rr(0.12, 0.25)) {
                        const [ox, oz] = rot(x * w, z, ry);
                        addTree(bx + ox, GROUND_Y + h * lv, bz + oz, rr(3, 5.5), r);
                    }
                }
            }
            if (geo === GEO.podium && r() < 0.7) {
                for (let i = 0; i < 4; i++) {
                    const [ox, oz] = rot(rr(-0.4, 0.4) * w, rr(0.2, 0.42) * dpt, ry);
                    addTree(bx + ox, GROUND_Y + h * 0.18, bz + oz, rr(3, 6), r);
                }
            }
        }
    }

    // --- grille d'îlots ---
    for (let j = 0; ; j++) {
        const z = CITY_Z0 - CELL * j;
        if (z < -1420) break;
        for (let i = 0; ; i++) {
            const x = CITY_X0 + CELL * i;
            if (x > 1020) break;
            if (i % AVENUE_EVERY === 0 || j % STREET_EVERY === 0) continue;

            const bx = x + rr(-2.5, 2.5), bz = z + rr(-2.5, 2.5);
            const dx = bx - CAM_X, dz = bz - CAM_Z;
            if (Math.abs(dx) > -dz * 1.5 + 80) continue;            // hors champ
            const d = Math.hypot(dx, dz);

            const dens = density(bx, bz);
            const tall = r() < 0.04 + dens * 0.3;
            let h = tall ? rr(45, 95) + dens * rr(20, 170) : rr(8, 26) + dens * rr(0, 30);
            let w = tall ? rr(9, 14) : rr(10, 15.5);
            let dpt = tall ? rr(9, 14) : rr(10, 15.5);

            // premier plan bas pour dégager la vue (sauf sur les bords du cadre)
            if (d < 180) h = Math.min(h, Math.abs(dx) > 70 ? rr(15, 48) : rr(6, 17));
            h = Math.max(Math.min(h, airCeiling(bx, bz) - 15), 6);   // marge pour antennes et couronnes

            if (!isFree(bx, bz, Math.max(w, dpt) * 0.6)) continue;

            // petit parc
            if (!tall && d < 1000 && r() < 0.05) {
                const n = 4 + Math.floor(r() * 6);
                for (let k = 0; k < n; k++) addTree(bx + rr(-6, 6), GROUND_Y, bz + rr(-6, 6), rr(4, 8), r);
                continue;
            }

            placeBuilding(bx, bz, h, w, dpt, tall && d >= 180, d);
        }
    }

    // --- silhouettes à l'horizon (le couloir du soleil reste dégagé) ---
    for (let k = 0; k < 190; k++) {
        const z = rr(-1440, -1880);
        const x = rr(-1.35, 1.35) * -z;
        if (Math.abs(x - riverX(z)) < 140) continue;
        if (!isFree(x, z, 20)) continue;
        const h = rr(70, 240) * (r() < 0.2 ? 2.1 : 1);
        const w = rr(18, 42);
        const geo = pick([GEO.oct, GEO.taper, GEO.box, GEO.setback, GEO.hex]);
        batch(geo, pick([towerMat, towerCyanMat, comMat])).add(x, GROUND_Y, z, w, h, w * rr(0.7, 1), 0);
        if (h > 300) beacons.add(x, GROUND_Y + h + 4, z, 5, 5, 5);
    }

    for (const { geo, mat, b } of batches.values()) b.build(geo, mat);
    roofUnits.build(GEO.box, industrialMat);
    masts.build(GEO.mast, darkMetalMat);
    beacons.build(GEO.light, makeBlinkMaterial(0xff3030, 0.45, 0.3));
    bandsBox.build(GEO.box, instGlow);
    bandsOct.build(GEO.oct, instGlow);
    strips.build(GEO.box, instGlow);
    ledges.build(GEO.box, metalMat);
}
