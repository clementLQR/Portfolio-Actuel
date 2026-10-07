import * as THREE from "three";
import { scene } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { GROUND_Y } from "../config/layout.js";
import { GEO, MergeKit, Batch, cityGlow, makeBlinkMaterial, metalMat, darkMetalMat } from "./kit.js";
import { comMat, resMat, towerMat, towerCyanMat, towerPinkMat } from "./buildingMaterial.js";
import { HEROES, hero } from "./zones.js";
import { addTree } from "./vegetation.js";

// Grandes tours qui dominent la skyline (implantation : zones.js).
// Cinq silhouettes : flèche à anneaux, gradins commerciaux, tour à arêtes LED,
// tours jumelles reliées, tour colossale à anneau. Chaque tour est fusionnée en
// un mesh par matériau. Passerelles entre certaines tours, balises clignotantes.

const towerMatFor = { 0xb060ff: towerMat, 0x50d0ff: towerCyanMat, 0xff4fb0: towerPinkMat };
const neonMat = (hex, k = 2.0) => cityGlow(hex, k);

const beacons = new Batch();
const padLights = new Batch();

// --- éléments communs (coordonnées locales, base de la tour en y = 0) ----------

function shaft(kit, geo, mat, w, d, y0, y1, x = 0, z = 0) {
    kit.add(geo, mat, x, y0, z, w, y1 - y0, d);
}

// collerette : plateau débordant + anneau lumineux dessous
function collar(kit, geo, w, y, neon, over = 1.12) {
    kit.add(geo, darkMetalMat, 0, y, 0, w * over, 1.4, w * over);
    kit.add(geo, neonMat(neon), 0, y - 0.6, 0, w * over * 0.99, 0.5, w * over * 0.99);
}

// bandes LED verticales au milieu de chaque face
function faceStrips(kit, w, d, y0, y1, neon, off = 0.7, faces = [0, 1, 2, 3]) {
    const m = neonMat(neon, 1.7);
    const spots = [[0, d / 2 + off], [w / 2 + off, 0], [0, -d / 2 - off], [-w / 2 - off, 0]];
    for (const f of faces) {
        const [x, z] = spots[f];
        kit.add(GEO.box, m, x, y0, z, f % 2 ? 0.6 : 0.8, y1 - y0, f % 2 ? 0.8 : 0.6);
    }
}

// mât avec barres transversales ; balise au sommet
function antenna(kit, x, y, z, h, ox, oz, ry) {
    kit.add(GEO.mast, darkMetalMat, x, y, z, 1.6, h, 1.6);
    for (const f of [0.35, 0.6]) {
        kit.add(GEO.box, darkMetalMat, x, y + h * f, z, 7, 0.4, 0.4);
        kit.add(GEO.box, darkMetalMat, x, y + h * f, z, 0.4, 0.4, 7);
    }
    const c = Math.cos(ry), s = Math.sin(ry);
    beacons.add(ox + x * c + z * s, GROUND_Y + y + h + 1, oz - x * s + z * c, 2.2, 2.2, 2.2);
}

// plateforme d'atterrissage en porte-à-faux sur la face avant
function pad(kit, x, y, z, R, neon, world) {
    kit.add(GEO.box, darkMetalMat, x, y - 2.2, z - R, 3, 2, R * 1.6);
    kit.add(GEO.disc, metalMat, x, y, z, R, 1.0, R);
    kit.add(GEO.ring, neonMat(neon, 2.4), x, y + 0.05, z, R * 0.97, 8, R * 0.97);
    const p = world(x, y, z);
    for (let a = 0; a < 8; a++) {
        const t = (a / 8) * Math.PI * 2;
        padLights.add(p.x + Math.cos(t) * R * 0.8, p.y + 0.4, p.z + Math.sin(t) * R * 0.8, 0.8, 0.8, 0.8);
    }
}

// --- silhouettes ---------------------------------------------------------------

function spire(kit, t, mat, rr, world) {
    const { h, w, neon } = t;
    shaft(kit, GEO.oct, mat, w, w, 0, h * 0.38);
    collar(kit, GEO.oct, w, h * 0.38, neon);
    shaft(kit, GEO.oct, mat, w * 0.82, w * 0.82, h * 0.38, h * 0.66);
    // partie renflée
    shaft(kit, GEO.oct, mat, w * 0.98, w * 0.98, h * 0.5, h * 0.54);
    collar(kit, GEO.oct, w * 0.98, h * 0.5, neon, 1.06);
    collar(kit, GEO.oct, w * 0.82, h * 0.66, neon);
    shaft(kit, GEO.oct, mat, w * 0.6, w * 0.6, h * 0.66, h * 0.86);
    collar(kit, GEO.oct, w * 0.6, h * 0.86, neon, 1.2);
    shaft(kit, GEO.taper, mat, w * 0.48, w * 0.48, h * 0.86, h * 0.96);
    faceStrips(kit, w, w, h * 0.04, h * 0.37, neon);
    faceStrips(kit, w * 0.82, w * 0.82, h * 0.39, h * 0.49, neon, 0.7, [0]);
    // anneaux autour du fût
    for (const f of [0.2, 0.3]) kit.add(GEO.ring, neonMat(neon, 2.2), 0, h * f, 0, w * 0.68, 14, w * 0.68);
    pad(kit, 0, h * 0.62, w * 0.41 + w * 0.3, w * 0.3, neon, world);
    antenna(kit, 0, h * 0.96, 0, h * 0.2, t.x, t.z, t.ry);
}

function block(kit, t, mat, rr, world, r) {
    const { h, w, neon } = t;
    const glassMat = comMat;
    shaft(kit, GEO.box, glassMat, w, w * 0.8, 0, h * 0.5);
    shaft(kit, GEO.box, glassMat, w * 0.78, w * 0.66, h * 0.5, h * 0.75, -w * 0.06, -w * 0.04);
    shaft(kit, GEO.box, mat, w * 0.55, w * 0.5, h * 0.75, h * 0.92, w * 0.04, -w * 0.06);
    // lignes LED au bord de chaque gradin
    kit.add(GEO.box, neonMat(neon, 2.2), 0, h * 0.5 - 0.8, 0, w + 1.0, 0.6, w * 0.8 + 1.0);
    kit.add(GEO.box, neonMat(neon, 2.2), -w * 0.06, h * 0.75 - 0.8, -w * 0.04, w * 0.78 + 1.0, 0.6, w * 0.66 + 1.0);
    // ailettes verticales sur la façade avant du socle
    for (let x = -w / 2 + 1.5; x < w / 2; x += 3.2) {
        kit.add(GEO.box, darkMetalMat, x, 0, w * 0.4 + 0.35, 0.35, h * 0.49, 0.9);
    }
    // couronne en treillis ouvert
    const cx = w * 0.04, cz = -w * 0.06, cw = w * 0.55, cd = w * 0.5, y0 = h * 0.92;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        kit.add(GEO.box, darkMetalMat, cx + sx * cw / 2, y0, cz + sz * cd / 2, 0.9, h * 0.08, 0.9);
    }
    for (const y of [y0 + h * 0.04, y0 + h * 0.08]) {
        kit.add(GEO.box, neonMat(neon, 1.8), cx, y, cz + cd / 2, cw, 0.5, 0.5);
        kit.add(GEO.box, darkMetalMat, cx, y, cz - cd / 2, cw, 0.5, 0.5);
    }
    pad(kit, w * 0.2, h * 0.62, w * 0.33 + w * 0.22, w * 0.22, neon, world);
    // jardins sur les gradins
    for (let x = -w * 0.45; x < w * 0.45; x += rr(2.5, 4)) {
        const p = world(x, h * 0.5, w * 0.37);
        addTree(p.x, p.y, p.z, rr(3, 5), r);
    }
    for (let x = -w * 0.4; x < w * 0.25; x += rr(2.5, 4)) {
        const p = world(x, h * 0.75, w * 0.26);
        addTree(p.x, p.y, p.z, rr(2.5, 4.5), r);
    }
    antenna(kit, cx, h, cz, h * 0.12, t.x, t.z, t.ry);
}

function led(kit, t, mat, rr, world) {
    const { h, w, neon } = t;
    shaft(kit, GEO.hex, mat, w, w, 0, h * 0.9);
    shaft(kit, GEO.hex, mat, w * 1.08, w * 1.08, 0, h * 0.08);
    // arêtes LED aux six sommets
    const rad = 0.5 / Math.cos(Math.PI / 6) * w + 0.5;
    for (let k = 0; k < 6; k++) {
        const a = Math.PI / 6 + (k * Math.PI) / 3;
        kit.add(GEO.box, neonMat(neon, 1.6), Math.sin(a) * rad, h * 0.08, Math.cos(a) * rad, 0.6, h * 0.8, 0.6, a);
    }
    // anneaux horizontaux
    for (let y = h * 0.14; y < h * 0.88; y += h * 0.12) {
        kit.add(GEO.hex, neonMat(neon, 2.0), 0, y, 0, w + 1.4, 0.5, w + 1.4);
    }
    shaft(kit, GEO.taper, mat, w * 0.7, w * 0.7, h * 0.9, h * 0.98);
    collar(kit, GEO.hex, w, h * 0.9, neon, 1.1);
    antenna(kit, 0, h * 0.98, 0, h * 0.14, t.x, t.z, t.ry);
}

function twin(kit, t, mat, rr, world) {
    const { h, w, neon } = t;
    const sw = w * 0.42, sd = w * 0.7, gx = w * 0.3;
    shaft(kit, GEO.box, comMat, sw, sd, 0, h, -gx);
    shaft(kit, GEO.box, mat, sw, sd, 0, h * 0.84, gx);
    // couronne inclinée sur le fût le plus haut
    kit.add(GEO.box, mat, -gx, h - 2, 0, sw * 0.98, h * 0.06, sd * 0.98, 0, 0.32);
    kit.add(GEO.box, neonMat(neon, 2.2), -gx, h * 0.84 - 1, 0, sw + 1, 0.6, sd + 1);
    kit.add(GEO.box, neonMat(neon, 2.2), gx, h * 0.84 - 1.2, 0, sw + 1, 0.6, sd + 1);
    // passerelles entre les deux fûts
    for (let y = h * 0.18; y < h * 0.8; y += h * 0.16) {
        kit.add(GEO.box, comMat, 0, y, 0, gx * 2 - sw + 2, 4, sd * 0.35);
        kit.add(GEO.box, neonMat(neon, 2.0), 0, y - 0.4, sd * 0.18 + 0.3, gx * 2 - sw + 2, 0.4, 0.4);
    }
    faceStrips(kit, sw, sd, h * 0.02, h * 0.82, neon, 0.6, [1]);
    kit.add(GEO.box, neonMat(neon, 1.7), gx + sw / 2 + 0.6, h * 0.02, 0, 0.6, h * 0.8, 0.8);
    antenna(kit, gx, h * 0.84, 0, h * 0.1, t.x, t.z, t.ry);
}

function mega(kit, t, mat, rr, world, r) {
    const { h, w, neon } = t;
    // socle végétalisé
    shaft(kit, GEO.oct, comMat, w * 1.5, w * 1.5, 0, h * 0.05);
    for (let a = 0; a < 26; a++) {
        const th = (a / 26) * Math.PI * 2;
        const p = world(Math.cos(th) * w * 0.62, h * 0.05, Math.sin(th) * w * 0.62);
        addTree(p.x, p.y, p.z, rr(5, 8), r);
    }
    shaft(kit, GEO.oct, mat, w, w, h * 0.05, h * 0.42);
    collar(kit, GEO.oct, w, h * 0.2, neon, 1.08);
    // lobby suspendu, plus large
    shaft(kit, GEO.oct, comMat, w * 1.25, w * 1.25, h * 0.42, h * 0.47);
    collar(kit, GEO.oct, w * 1.25, h * 0.42, neon, 1.05);
    collar(kit, GEO.oct, w * 1.25, h * 0.47 + 0.7, neon, 1.05);
    shaft(kit, GEO.oct, mat, w * 0.8, w * 0.8, h * 0.47, h * 0.72);
    // anneau géant et ses rayons
    const R = w * 1.2;
    kit.add(GEO.ring, darkMetalMat, 0, h * 0.6, 0, R, 60, R);
    kit.add(GEO.ring, neonMat(neon, 2.4), 0, h * 0.6 - 2.2, 0, R, 20, R);
    for (let k = 0; k < 4; k++) {
        const a = (k * Math.PI) / 2 + Math.PI / 4;
        kit.add(GEO.box, darkMetalMat, Math.sin(a) * R * 0.7, h * 0.6 - 1, Math.cos(a) * R * 0.7, 2, 2, R * 0.65, a);
    }
    collar(kit, GEO.oct, w * 0.8, h * 0.72, neon, 1.15);
    shaft(kit, GEO.oct, mat, w * 0.55, w * 0.55, h * 0.72, h * 0.9);
    collar(kit, GEO.oct, w * 0.55, h * 0.9, neon, 1.2);
    shaft(kit, GEO.taper, mat, w * 0.42, w * 0.42, h * 0.9, h * 0.99);
    faceStrips(kit, w, w, h * 0.06, h * 0.41, neon, 1.2);
    faceStrips(kit, w * 0.8, w * 0.8, h * 0.48, h * 0.71, neon, 1.2, [0, 2]);
    pad(kit, 0, h * 0.3, w * 0.5 + w * 0.32, w * 0.32, neon, world);
    pad(kit, w * 0.15, h * 0.5, w * 0.5 + w * 0.28, w * 0.26, neon, world);
    antenna(kit, 0, h * 0.99, 0, h * 0.12, t.x, t.z, t.ry);
}

const BUILDERS = { spire, block, led, twin, mega };

// passerelle couverte entre deux tours, à l'altitude y (au-dessus du sol)
function skyBridge(a, b, y, neon) {
    const kit = new MergeKit();
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const ry = Math.atan2(dx, dz);
    const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
    kit.add(GEO.box, comMat, mx, GROUND_Y + y, mz, 6, 4.5, len, ry);
    kit.add(GEO.box, darkMetalMat, mx, GROUND_Y + y - 1.2, mz, 8, 1.2, len, ry);
    kit.add(GEO.box, neonMat(neon, 2.2), mx, GROUND_Y + y - 1.5, mz, 8.4, 0.35, len, ry);
    kit.build();
}

export function createTowers() {
    const { r, rr } = seeded(4242);

    for (const t of HEROES) {
        t.ry = t.ry ?? (["T3", "T4", "M2", "T7"].includes(t.id) ? 0 : rr(-0.35, 0.35));
        const g = new THREE.Group();
        g.position.set(t.x, GROUND_Y, t.z);
        g.rotation.y = t.ry;
        g.updateMatrixWorld();
        scene.add(g);
        const world = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(g.matrixWorld);

        const mat = t.kind === "block" ? resMat : towerMatFor[t.neon] ?? towerMat;
        const kit = new MergeKit();
        BUILDERS[t.kind](kit, t, mat, rr, world, r);
        kit.build(g);
    }

    skyBridge(hero("T1"), hero("T2"), 82, 0xb060ff);
    skyBridge(hero("T1"), hero("T2"), 124, 0xff4fb0);
    skyBridge(hero("M1"), hero("T6"), 140, 0x50d0ff);
    skyBridge(hero("T4"), hero("T5"), 96, 0xb060ff);

    beacons.build(GEO.light, makeBlinkMaterial(0xff3030, 0.42, 0.3));
    padLights.build(GEO.light, makeBlinkMaterial(0xffc070, 0.8, 0.5));
}
