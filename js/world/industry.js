import * as THREE from "three";
import { seeded } from "../core/random.js";
import { GROUND_Y } from "../config/layout.js";
import { GEO, MergeKit, Batch, cityGlow, makeBlinkMaterial, metalMat, darkMetalMat } from "./kit.js";
import { industrialMat } from "./buildingMaterial.js";

// Zone industrielle au loin, à droite du soleil (zone réservée dans zones.js) :
// tours de refroidissement, réservoirs, cheminées à balises, centrale, conduits,
// pylône de télécommunication en treillis. Silhouettes techniques dans la brume.

const CX = 340, CZ = -1215;

// tour de refroidissement : hyperboloïde de révolution
const coolingGeo = (() => {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
        const y = i / 12;
        pts.push(new THREE.Vector2(0.5 - 0.22 * Math.sin(y * Math.PI * 0.85), y));
    }
    return new THREE.LatheGeometry(pts, 24);
})();

export function createIndustry() {
    const { r, rr } = seeded(1234);
    const kit = new MergeKit();
    const lamps = new Batch();
    const beacons = new Batch();
    const amber = new THREE.Color(2.0, 1.1, 0.45);

    // centrale
    kit.box(industrialMat, CX - 50, CX + 30, GROUND_Y, GROUND_Y + 38, CZ - 30, CZ + 20);
    kit.box(industrialMat, CX - 40, CX + 10, GROUND_Y + 38, GROUND_Y + 52, CZ - 20, CZ + 8);
    kit.box(cityGlow(0xff9040, 1.6), CX - 50.4, CX + 30.4, GROUND_Y + 30, GROUND_Y + 30.6, CZ - 30.4, CZ + 20.4);

    // tours de refroidissement
    for (const [x, z, h] of [[CX + 70, CZ - 40, 95], [CX + 70, CZ + 45, 80], [CX - 95, CZ + 40, 88]]) {
        kit.add(coolingGeo, metalMat, x, GROUND_Y, z, h * 0.75, h, h * 0.75);
        kit.add(GEO.ring, cityGlow(0xff6030, 1.6), x, GROUND_Y + h - 0.5, z, h * 0.3, 10, h * 0.3);
    }

    // cheminées
    for (const [x, z, h] of [[CX - 20, CZ - 60, 150], [CX + 10, CZ - 64, 130]]) {
        kit.add(GEO.cyl, darkMetalMat, x, GROUND_Y, z, 7, h, 7);
        for (const f of [0.33, 0.66, 0.97]) {
            kit.add(GEO.cyl, cityGlow(0xff3030, 1.4), x, GROUND_Y + h * f, z, 7.4, 1.2, 7.4);
        }
        beacons.add(x, GROUND_Y + h + 2, z, 3, 3, 3);
    }

    // réservoirs
    for (let i = 0; i < 9; i++) {
        const x = CX - 100 + (i % 3) * 22 + rr(-3, 3), z = CZ - 80 + Math.floor(i / 3) * 24;
        const rad = rr(7, 10);
        kit.add(GEO.cyl, industrialMat, x, GROUND_Y, z, rad * 2, rr(10, 20), rad * 2);
        lamps.add(x, GROUND_Y + 22, z, 1.2, 1.2, 1.2, 0, amber);
    }

    // conduits entre les bâtiments
    const pipe = (a, b) => kit.addMatrix(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 1.4, 6), metalMat, new THREE.Matrix4());
    pipe(new THREE.Vector3(CX - 50, GROUND_Y + 14, CZ - 10), new THREE.Vector3(CX - 95, GROUND_Y + 14, CZ - 10));
    pipe(new THREE.Vector3(CX + 30, GROUND_Y + 18, CZ - 5), new THREE.Vector3(CX + 70, GROUND_Y + 18, CZ - 5));
    pipe(new THREE.Vector3(CX - 95, GROUND_Y + 14, CZ - 10), new THREE.Vector3(CX - 95, GROUND_Y + 14, CZ + 30));

    // pylône en treillis
    const px = CX - 70, pz = CZ + 80, ph = 210;
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const base = new THREE.Vector3(px + sx * 9, GROUND_Y, pz + sz * 9);
        const top = new THREE.Vector3(px + sx * 1.5, GROUND_Y + ph, pz + sz * 1.5);
        kit.addMatrix(new THREE.TubeGeometry(new THREE.LineCurve3(base, top), 1, 0.6, 4), darkMetalMat, new THREE.Matrix4());
    }
    for (let y = 18; y < ph; y += 18) {
        const w = 18 * (1 - y / ph) + 3;
        kit.add(GEO.box, darkMetalMat, px, GROUND_Y + y, pz, w, 0.5, w);
        if (r() < 0.5) lamps.add(px + w / 2, GROUND_Y + y + 1, pz + w / 2, 0.8, 0.8, 0.8, 0, amber);
    }
    kit.add(GEO.mast, darkMetalMat, px, GROUND_Y + ph, pz, 1.2, 30, 1.2);
    beacons.add(px, GROUND_Y + ph + 31, pz, 3, 3, 3);

    kit.build();
    lamps.build(GEO.light, cityGlow(0xffffff, 1));
    beacons.build(GEO.light, makeBlinkMaterial(0xff3030, 0.5, 0.3));
}
