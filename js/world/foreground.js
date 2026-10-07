import * as THREE from "three";
import { scene } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { GROUND_Y } from "../config/layout.js";
import { resMat, resWarmMat, comMat, makeBuildingMaterial, STYLE } from "./buildingMaterial.js";
import { GEO, MergeKit, Batch, cityGlow, makeBlinkMaterial, metalMat, darkMetalMat, ribbonGeometry, cableCurve, instGlow } from "./kit.js";
import { holoMaterial } from "./holograms.js";
import { addTree, addBush, addGreenWall } from "./vegetation.js";
import { canvasTexture } from "../core/helpers.js";

// Premier plan, entre l'appartement et la skyline : toit-jardin sous la baie (les arbres
// dépassent de l'appui), immeuble d'habitation sur la gauche avec balcons et enseigne,
// passerelle piétonne éclairée, câbles tendus, lampadaires, kiosque, véhicule garé.
// Zone réservée dans zones.js : x -62..-4, z -98..-22.

function signTexture() {
    return canvasTexture(96, 384, (g, w, h) => {
        g.fillStyle = "#120818";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = "#ff7a40";
        g.lineWidth = 6;
        g.strokeRect(6, 6, w - 12, h - 12);
        g.fillStyle = "#ffd0e8";
        g.textAlign = "center";
        g.font = "bold 66px 'Yu Gothic', 'Meiryo', 'Noto Sans JP', sans-serif";
        [..."ラーメン"].forEach((ch, i) => g.fillText(ch, w / 2, 82 + i * 86));
    });
}

// petit véhicule volant posé (même silhouette que la circulation aérienne)
function parkedCar(kit, x, y, z, ry) {
    const body = new THREE.Group();
    body.position.set(x, y, z);
    body.rotation.y = ry;
    body.updateMatrixWorld();
    const part = (geo, mat, px, py, pz, sx, sy, sz) => {
        const m = new THREE.Matrix4().compose(
            new THREE.Vector3(px, py, pz), new THREE.Quaternion(), new THREE.Vector3(sx, sy, sz)
        ).premultiply(body.matrixWorld);
        kit.addMatrix(geo, mat, m);
    };
    part(GEO.sphere, darkMetalMat, 0, 0.7, 0, 1.1, 0.45, 2.3);
    part(GEO.sphere, comMat, 0, 1.0, -0.3, 0.75, 0.35, 1.1);
    part(GEO.box, cityGlow(0xfff0d0, 2.4), 0, 0.6, 2.2, 1.4, 0.12, 0.1);
    part(GEO.box, cityGlow(0xff3050, 2.4), 0, 0.6, -2.25, 1.6, 0.12, 0.1);
    part(GEO.box, cityGlow(0x50d0ff, 1.6), 0, 0.28, 0, 1.6, 0.06, 3.6);
}

export function createForeground() {
    const { r, rr } = seeded(9090);
    const kit = new MergeKit();
    const lampHeads = new Batch();
    const warm = new THREE.Color(2.2, 1.4, 0.75);

    // --- toit-jardin sous la baie ---
    const T = { x0: -24, x1: -6, z0: -44, z1: -26, y: -5 };
    const terraceMat = makeBuildingMaterial(0x2e2440, STYLE.RESIDENTIAL, { lit: 0.55 });
    kit.box(terraceMat, T.x0, T.x1, GROUND_Y, T.y - 0.6, T.z0, T.z1);   // sous la dalle (pas de faces confondues)
    kit.box(metalMat, T.x0 - 0.4, T.x1 + 0.4, T.y - 0.6, T.y, T.z0 - 0.4, T.z1 + 0.4);
    // garde-corps : poteaux + main courante lumineuse
    for (let x = T.x0; x <= T.x1; x += 1.5) kit.box(darkMetalMat, x - 0.05, x + 0.05, T.y, T.y + 1.1, T.z1 + 0.15, T.z1 + 0.25);
    for (let z = T.z0; z <= T.z1; z += 1.5) kit.box(darkMetalMat, T.x1 + 0.15, T.x1 + 0.25, T.y, T.y + 1.1, z - 0.05, z + 0.05);
    kit.box(cityGlow(0xffa070, 1.5), T.x0, T.x1 + 0.3, T.y + 1.1, T.y + 1.2, T.z1 + 0.1, T.z1 + 0.3);
    kit.box(cityGlow(0xffa070, 1.5), T.x1 + 0.1, T.x1 + 0.3, T.y + 1.1, T.y + 1.2, T.z0, T.z1 + 0.3);
    // arbres et massifs
    for (let i = 0; i < 13; i++) addTree(rr(T.x0 + 1.5, T.x1 - 1.5), T.y, rr(T.z0 + 1.5, T.z1 - 1.5), rr(3.5, 6.5), r);
    for (let i = 0; i < 18; i++) addBush(rr(T.x0 + 1, T.x1 - 1), T.y, rr(T.z0 + 1, T.z1 - 1), rr(0.7, 1.5), r);
    // allée, kiosque, lampadaires, bancs
    kit.box(comMat, -21, -17.5, T.y, T.y + 2.6, -42, -39);
    kit.box(darkMetalMat, -21.4, -17.1, T.y + 2.6, T.y + 2.85, -42.4, -38.6);
    kit.box(cityGlow(0x50d0ff, 2.0), -21.2, -17.3, T.y + 2.45, T.y + 2.55, -38.95, -38.85);
    for (const [x, z] of [[-22, -28], [-14, -27.5], [-8, -35], [-12, -42]]) {
        kit.box(darkMetalMat, x - 0.06, x + 0.06, T.y, T.y + 3.4, z - 0.06, z + 0.06);
        lampHeads.add(x, T.y + 3.45, z, 0.35, 0.22, 0.35, 0, warm);
    }
    for (const [x, z] of [[-16, -30], [-10, -38]]) kit.box(metalMat, x - 0.9, x + 0.9, T.y, T.y + 0.45, z - 0.25, z + 0.25);
    parkedCar(kit, -11, T.y, -31, 0.6);

    // --- immeuble de gauche ---
    const L = { x0: -52, x1: -26, z0: -86, z1: -54, y: 1 };
    kit.box(resWarmMat, L.x0, L.x1, GROUND_Y, L.y, L.z0, L.z1);
    kit.box(resMat, L.x0 + 3, L.x1 - 4, L.y, L.y + 7, L.z0 + 4, L.z1 - 5);
    // balcons sur la façade droite (vue en enfilade) et jardinières
    for (let y = -14; y < L.y - 1; y += 3.1) {
        kit.box(metalMat, L.x1, L.x1 + 1.6, y, y + 0.26, L.z0 + 0.5, L.z1 - 0.5);
        kit.box(darkMetalMat, L.x1 + 1.5, L.x1 + 1.6, y + 0.26, y + 1.2, L.z0 + 0.5, L.z1 - 0.5);
        for (let z = L.z1 - 1; z > L.z0 + 1; z -= rr(2, 4.5)) {
            if (r() < 0.5) addBush(L.x1 + 0.8, y + 0.26, z, rr(0.45, 0.85), r);
        }
    }
    addGreenWall(L.x0 + 2, L.x0 + 14, GROUND_Y + 6, L.y - 2, L.z1, r, 1, 0.75);
    // enseigne verticale à l'angle avant droit, au-dessus du toit
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 9.6),
        holoMaterial(signTexture(), { additive: false, opacity: 1, intensity: 1.3, lines: 30 }));
    sign.position.set(L.x1 - 1.6, L.y + 3.5, L.z1 + 1.3);
    sign.rotation.y = -0.35;
    scene.add(sign);
    kit.box(darkMetalMat, L.x1 - 1.0, L.x1 - 0.6, L.y - 6, L.y + 8.5, L.z1, L.z1 + 1.0);
    // toit : arbres, réservoir, antenne
    for (let i = 0; i < 9; i++) addTree(rr(L.x0 + 2, L.x0 + 10), L.y, rr(L.z0 + 2, L.z1 - 2), rr(4, 7), r);
    kit.add(GEO.cyl, metalMat, L.x1 - 7, L.y + 7, L.z0 + 9, 4, 5, 4);
    kit.add(GEO.mast, darkMetalMat, L.x0 + 18, L.y + 7, L.z0 + 8, 1, 18, 1);
    new Batch().add(L.x0 + 18, L.y + 25.5, L.z0 + 8, 0.9, 0.9, 0.9).build(GEO.light, makeBlinkMaterial(0xff3030, 0.4, 0.3));

    // --- passerelle piétonne entre l'immeuble de gauche et la tour proche ---
    const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(L.x1, -4.5, -72), new THREE.Vector3(-10, -3.6, -64),
        new THREE.Vector3(-1, -3.9, -57), new THREE.Vector3(7, -4.6, -50)
    ]);
    kit.addMatrix(ribbonGeometry(path, 3.2, 0.7, 60), metalMat, new THREE.Matrix4());
    for (const off of [-1.55, 1.55]) {
        kit.addMatrix(ribbonGeometry(path, 0.1, 0.1, 60, off), cityGlow(0x7ae0ff, 1.6), new THREE.Matrix4().makeTranslation(0, 1.1, 0));
    }
    const pts = path.getSpacedPoints(14);
    for (const p of pts.slice(1, -1)) lampHeads.add(p.x, p.y + 0.15, p.z, 0.25, 0.12, 0.25, 0, new THREE.Color(1.4, 1.8, 2.2));

    // --- câbles tendus ---
    const cables = [
        [new THREE.Vector3(7, 58, -50), new THREE.Vector3(L.x1, L.y + 6, -60), 7],
        [new THREE.Vector3(7, 40, -36), new THREE.Vector3(L.x1 - 4, L.y + 7, -80), 9],
        [new THREE.Vector3(L.x0 + 18, L.y + 22, L.z0 + 8), new THREE.Vector3(-80 + 8, 120, -230 + 10), 30]
    ];
    for (const [a, b, sag] of cables) {
        const c = cableCurve(a, b, sag);
        kit.addMatrix(new THREE.TubeGeometry(c, 40, 0.07, 4), darkMetalMat, new THREE.Matrix4());
        for (const p of c.getSpacedPoints(8).slice(1, -1)) lampHeads.add(p.x, p.y - 0.2, p.z, 0.18, 0.18, 0.18, 0, new THREE.Color(2.2, 0.5, 1.4));
    }

    kit.build();
    lampHeads.build(GEO.sphere, instGlow);
}
