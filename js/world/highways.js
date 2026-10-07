import * as THREE from "three";
import { seeded } from "../core/random.js";
import { unitBox } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";
import { GROUND_Y } from "../config/layout.js";
import { Batch, MergeKit, PathSampler, ribbonGeometry, cityGlow, instGlow, metalMat, darkMetalMat } from "./kit.js";
import { HIGHWAYS, BRIDGE, waterDist } from "./zones.js";

// Voies rapides suspendues (tracés dans zones.js) : tablier, bordures lumineuses, piliers,
// et circulation dans les deux sens — phares blancs vers la caméra, feux rouges qui s'éloignent.
// Le pont droit de bridges.js reçoit aussi sa circulation.

const tmp = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);

export function createHighways() {
    const { r, rr } = seeded(6060);
    const kit = new MergeKit();
    const pillars = new Batch();
    const lanes = [];

    for (const hw of HIGHWAYS) {
        const { curve, width, color } = hw;
        kit.addMatrix(ribbonGeometry(curve, width, 1.6, 240), metalMat, new THREE.Matrix4());
        // parapets et bordures lumineuses
        for (const s of [-1, 1]) {
            kit.addMatrix(ribbonGeometry(curve, 0.4, 1.1, 240, s * (width / 2 - 0.2)), darkMetalMat, new THREE.Matrix4().makeTranslation(0, 1.1, 0));
            kit.addMatrix(ribbonGeometry(curve, 0.18, 0.18, 240, s * (width / 2 + 0.05)), cityGlow(color, 1.8), new THREE.Matrix4().makeTranslation(0, -0.6, 0));
        }
        // piliers en T
        const n = Math.floor(curve.getLength() / 32);
        for (let k = 0; k <= n; k++) {
            const p = curve.getPointAt(k / n);
            if (waterDist(p.x, p.z) < 0) continue;
            curve.getTangentAt(k / n, tan);
            pillars.add(p.x, GROUND_Y, p.z, 2.4, p.y - 1.6 - GROUND_Y, 2.4);
            pillars.add(p.x, p.y - 3.2, p.z, width * 0.8, 1.6, 2.4, Math.atan2(tan.x, tan.z));
        }
        const sampler = new PathSampler(curve, 800);
        for (const dir of [1, -1]) {
            for (const off of [1.8, 4.6]) lanes.push({ sampler, dir, off: dir * off, y: 0.7 });
        }
    }

    // pont droit : une voie dans chaque sens
    const bridgeCurve = new THREE.LineCurve3(
        new THREE.Vector3(BRIDGE.x0, BRIDGE.y, BRIDGE.z), new THREE.Vector3(BRIDGE.x1, BRIDGE.y, BRIDGE.z)
    );
    const bs = new PathSampler(bridgeCurve, 10);
    lanes.push({ sampler: bs, dir: 1, off: 1.4, y: 0.6 }, { sampler: bs, dir: -1, off: -1.4, y: 0.6 });

    kit.build();
    pillars.build(unitBox, metalMat);

    // circulation
    const cars = [];
    const lights = new Batch();
    for (const lane of lanes) {
        const n = Math.floor(lane.sampler.length / rr(28, 55));
        for (let i = 0; i < n; i++) {
            cars.push({ lane, t: r(), v: rr(22, 34) });
            // phares si la voie se rapproche de la caméra (+z), feux arrière sinon
            const pts = lane.sampler.pts;
            const dz = pts[pts.length - 1].z - pts[0].z;
            const toward = Math.abs(dz) < 1 ? lane.dir > 0 : lane.dir * dz > 0;
            lights.add(0, 0, 0, 1, 1, 1, 0, toward ? new THREE.Color(2.4, 2.1, 1.7) : new THREE.Color(2.2, 0.15, 0.1));
        }
    }
    const geo = new THREE.BoxGeometry(1.8, 0.6, 3.6);
    const mesh = lights.build(geo, instGlow);
    mesh.frustumCulled = false;
    const m = new THREE.Matrix4(), look = new THREE.Vector3();

    function update(dt) {
        cars.forEach((c, i) => {
            const s = c.lane.sampler;
            c.t = (c.t + (c.lane.dir * c.v * dt) / s.length + 1) % 1;
            s.at(c.t, tmp);
            s.tangent(c.t, tan);
            side.crossVectors(tan, UP).normalize();
            tmp.addScaledVector(side, c.lane.off);
            tmp.y += c.lane.y;
            m.lookAt(tmp, look.copy(tmp).add(tan), UP).setPosition(tmp);
            mesh.setMatrixAt(i, m);
        });
        mesh.instanceMatrix.needsUpdate = true;
    }
    update(0);
    onFrame((dt) => update(dt));
}
