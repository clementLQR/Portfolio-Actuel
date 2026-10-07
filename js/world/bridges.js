import * as THREE from "three";
import { scene } from "../core/scene.js";
import { addBox } from "../core/helpers.js";
import { std, neonCyan, neonViolet } from "../core/materials.js";
import { onFrame } from "../core/animated.js";
import { GROUND_Y, WATER_Y, RIVER_HALF } from "../config/layout.js";
import { GEO, MergeKit, Batch, PathSampler, cityGlow, instGlow, darkMetalMat } from "./kit.js";
import { BRIDGE, MONORAIL, riverX } from "./zones.js";
import { comMat } from "./buildingMaterial.js";

// Pont droit sur piliers, monorail courbe éclairé et ses rames,
// passerelle en arc et pont à haubans au-dessus du fleuve.

export function createBridges() {
    const bridgeMat = std(0x2a2440, { roughness: 0.7 });
    const { z, x0, x1, y } = BRIDGE;
    addBox(x0, x1, y - 2, y, z - 3, z + 3, bridgeMat, scene, false);
    addBox(x0, x1, y - 2.3, y - 2, z - 1, z + 1, neonCyan, scene, false);
    const kit = new MergeKit();
    for (let x = x0 + 20; x <= x1 - 20; x += 40) {
        kit.box(bridgeMat, x - 1, x + 1, GROUND_Y, y - 2, z - 1, z + 1);
    }
    // garde-corps lumineux et réverbères
    kit.box(cityGlow(0xffb070, 1.4), x0, x1, y + 0.9, y + 1.05, z + 2.9, z + 3.05);
    kit.box(cityGlow(0xffb070, 1.4), x0, x1, y + 0.9, y + 1.05, z - 3.05, z - 2.9);

    // monorail
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(MONORAIL, 200, 1.6, 8), bridgeMat));
    const rail = new THREE.Mesh(new THREE.TubeGeometry(MONORAIL, 200, 0.35, 6), neonViolet);
    rail.position.y = -1.6;
    scene.add(rail);
    // pylônes du monorail
    for (const p of MONORAIL.getSpacedPoints(16).slice(1, -1)) {
        kit.box(bridgeMat, p.x - 0.9, p.x + 0.9, GROUND_Y, p.y - 1.4, p.z - 0.9, p.z + 0.9);
    }

    // passerelle en arc au-dessus du fleuve
    const az = -520, ax = riverX(az), span = RIVER_HALF + 14;
    const arc = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(ax - span, WATER_Y + 3, az), new THREE.Vector3(ax, WATER_Y + 34, az), new THREE.Vector3(ax + span, WATER_Y + 3, az)
    );
    kit.addMatrix(new THREE.TubeGeometry(arc, 40, 0.9, 6), darkMetalMat, new THREE.Matrix4());
    kit.addMatrix(new THREE.TubeGeometry(arc, 40, 0.18, 4), cityGlow(0xff7ac0, 2.0), new THREE.Matrix4().makeTranslation(0, -1.0, 0.9));
    kit.box(comMat, ax - span, ax + span, WATER_Y + 7, WATER_Y + 8.4, az - 2, az + 2);
    for (let x = ax - span + 4; x < ax + span; x += 4) {
        const f = (x - ax + span) / (2 * span);
        const top = WATER_Y + 3 + 2 * f * (1 - f) * 31;   // hauteur de l'arc (Bézier quadratique)
        if (top > WATER_Y + 9) kit.box(darkMetalMat, x - 0.08, x + 0.08, WATER_Y + 8.4, top, az - 0.08, az + 0.08);
    }

    // pont à haubans
    const hz = -900, hx = riverX(hz), hs = RIVER_HALF + 18;
    kit.box(darkMetalMat, hx - hs, hx + hs, WATER_Y + 9, WATER_Y + 11, hz - 5, hz + 5);
    kit.box(cityGlow(0x50d0ff, 1.8), hx - hs, hx + hs, WATER_Y + 8.7, WATER_Y + 9, hz - 0.4, hz + 0.4);
    kit.box(darkMetalMat, hx - 1.2, hx + 1.2, GROUND_Y, WATER_Y + 62, hz - 1.2, hz + 1.2);
    for (let k = 1; k <= 7; k++) {
        for (const s of [-1, 1]) {
            const a = new THREE.Vector3(hx, WATER_Y + 60 - k * 3, hz);
            const b = new THREE.Vector3(hx + s * k * 7, WATER_Y + 11, hz);
            kit.addMatrix(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 0.12, 3), darkMetalMat, new THREE.Matrix4());
        }
    }
    new Batch().add(hx, WATER_Y + 63, hz, 1.4, 1.4, 1.4).build(GEO.light, cityGlow(0xff3030, 2.2));
    kit.build();

    // rames du monorail : deux trains en sens inverse
    const sampler = new PathSampler(MONORAIL, 600);
    const CARS = 5, CAR_LEN = 11;
    const trains = [{ t: 0.1, v: 16 }, { t: 0.65, v: -13 }];
    const bodies = new Batch(), windows = new Batch();
    for (let i = 0; i < trains.length * CARS; i++) {
        bodies.add(0, 0, 0, 1, 1, 1);
        windows.add(0, 0, 0, 1, 1, 1, 0, new THREE.Color(2.0, 1.4, 0.8));
    }
    const bodyGeo = new THREE.BoxGeometry(2.8, 2.6, CAR_LEN - 0.6).translate(0, 1.3, 0);
    const winGeo = new THREE.BoxGeometry(2.9, 0.7, CAR_LEN - 1.6).translate(0, 1.7, 0);
    const bodyMesh = bodies.build(bodyGeo, std(0xb8b0c8, { roughness: 0.4, metalness: 0.5 }));
    const winMesh = windows.build(winGeo, instGlow);
    bodyMesh.frustumCulled = winMesh.frustumCulled = false;

    const p = new THREE.Vector3(), tan = new THREE.Vector3(), m = new THREE.Matrix4(), look = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    onFrame((dt) => {
        let k = 0;
        for (const tr of trains) {
            tr.t = (tr.t + (tr.v * dt) / sampler.length + 1) % 1;
            for (let c = 0; c < CARS; c++) {
                const tc = (tr.t - Math.sign(tr.v) * (c * CAR_LEN) / sampler.length + 1) % 1;
                sampler.at(tc, p);
                sampler.tangent(tc, tan);
                p.y += 1.6;
                m.lookAt(p, look.copy(p).add(tan), up).setPosition(p);
                bodyMesh.setMatrixAt(k, m);
                winMesh.setMatrixAt(k, m);
                k++;
            }
        }
        bodyMesh.instanceMatrix.needsUpdate = true;
        winMesh.instanceMatrix.needsUpdate = true;
    });
}
