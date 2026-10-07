import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded } from "../core/random.js";
import { onFrame } from "../core/animated.js";
import { Batch, PathSampler } from "./kit.js";

// Circulation aérienne : petits véhicules volants sur des voies invisibles.
// Voies proches et lointaines, horizontales ou inclinées, qui passent entre les tours,
// s'éloignent vers l'horizon ou s'approchent de la caméra, dans les deux sens.
// Tous les véhicules = un InstancedMesh (couleurs dans les sommets : coque sombre, phares,
// feux arrière) ; les plus rapides laissent une traînée lumineuse discrète.

const v = (x, y, z) => new THREE.Vector3(x, y, z);

// pts : points de passage ; n : nombre de véhicules ; speed : [min, max] m/s ;
// dir : 1 = dans le sens des points, -1 = sens inverse, 0 = les deux ; scale : taille
export const LANES = [
    { pts: [v(-700, 18, -95), v(-200, 22, -100), v(200, 26, -110), v(700, 30, -120)], n: 7, speed: [30, 46], dir: 1, scale: 1.2 },
    { pts: [v(700, 34, -150), v(250, 30, -140), v(-250, 36, -135), v(-700, 40, -150)], n: 7, speed: [28, 42], dir: 1, scale: 1.2 },
    { pts: [v(150, 6, -40), v(40, 12, -130), v(10, 22, -220), v(-15, 45, -450), v(-30, 70, -800), v(-40, 90, -1300)], n: 9, speed: [26, 40], dir: 1, scale: 1.1 },
    { pts: [v(-60, 110, -1300), v(-50, 80, -800), v(-35, 48, -400), v(-30, 32, -180), v(-80, 32, -90), v(-400, 30, -60)], n: 9, speed: [24, 38], dir: 1, scale: 1.1 },
    { pts: [v(-900, 60, -320), v(-300, 64, -300), v(300, 70, -330), v(900, 75, -360)], n: 10, speed: [26, 44], dir: 1, scale: 1.3 },
    { pts: [v(900, 48, -420), v(300, 44, -430), v(-300, 50, -410), v(-900, 56, -440)], n: 10, speed: [24, 40], dir: 1, scale: 1.3 },
    { pts: [v(-1000, 110, -690), v(-300, 115, -720), v(200, 125, -700), v(1000, 130, -660)], n: 14, speed: [22, 36], dir: 0, scale: 1.7 },
    { pts: [v(1000, 170, -1000), v(300, 165, -955), v(-300, 160, -900), v(-1000, 150, -850)], n: 14, speed: [20, 34], dir: 0, scale: 2.0 },
    { pts: [v(-1200, 220, -1250), v(0, 240, -1300), v(1200, 250, -1250)], n: 16, speed: [20, 30], dir: 0, scale: 2.4 },
    { pts: [v(-600, 30, -200), v(-300, 55, -330), v(-30, 95, -560), v(250, 140, -760), v(1100, 200, -1050)], n: 9, speed: [28, 40], dir: 0, scale: 1.4 },
    { pts: [v(-400, 40, -260), v(-150, 45, -285), v(0, 50, -330), v(110, 55, -320), v(250, 60, -290), v(600, 70, -250)], n: 6, speed: [30, 45], dir: 0, scale: 1.2 },
    { pts: [v(-300, 30, -45), v(-40, 28, -58), v(0, 30, -90), v(200, 34, -110), v(600, 40, -120)], n: 3, speed: [18, 26], dir: -1, scale: 0.8 }
];

// véhicule : coque effilée, verrière, phares, feux arrière (avant = +z, longueur ~4,6 m)
function vehicleGeometry() {
    const parts = [];
    const add = (geo, rgb, x, y, z, sx, sy, sz) => {
        const g = geo.clone().scale(sx, sy, sz).translate(x, y, z).toNonIndexed();
        const c = new Float32Array(g.attributes.position.count * 3);
        for (let i = 0; i < c.length; i += 3) c.set(rgb, i);
        g.setAttribute("color", new THREE.BufferAttribute(c, 3));
        parts.push(g);
    };
    const sphere = new THREE.SphereGeometry(1, 10, 6);
    const box = new THREE.BoxGeometry(1, 1, 1);
    add(sphere, [0.05, 0.045, 0.075], 0, 0, 0, 1.0, 0.38, 2.3);
    add(sphere, [0.09, 0.11, 0.17], 0, 0.25, -0.25, 0.62, 0.3, 1.05);
    add(box, [0.04, 0.035, 0.06], 0, -0.1, -1.4, 2.4, 0.12, 0.6);         // ailerons
    add(box, [3.2, 2.9, 2.4], -0.55, 0.0, 2.15, 0.35, 0.12, 0.12);         // phares
    add(box, [3.2, 2.9, 2.4], 0.55, 0.0, 2.15, 0.35, 0.12, 0.12);
    add(box, [2.8, 0.25, 0.35], 0, 0.02, -2.28, 1.3, 0.12, 0.08);           // feu arrière
    add(box, [0.6, 1.8, 2.6], 0, -0.36, 0, 0.9, 0.05, 2.6);                // lueur sous la coque
    add(box, [0.5, 2.0, 2.6], -0.98, -0.05, 0.3, 0.06, 0.08, 2.4);        // feux latéraux
    add(box, [0.5, 2.0, 2.6], 0.98, -0.05, 0.3, 0.06, 0.08, 2.4);
    add(box, [3.0, 0.4, 2.2], -1.2, -0.1, -1.55, 0.12, 0.12, 0.12);        // feux de position
    add(box, [3.0, 0.4, 2.2], 1.2, -0.1, -1.55, 0.12, 0.12, 0.12);
    return mergeGeometries(parts);
}

// traînée : deux plans croisés, lumineux à l'avant, éteints à l'arrière (longueur 1 vers -z)
function trailGeometry() {
    const a = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2).translate(0, 0, -0.5);
    const b = new THREE.PlaneGeometry(1, 1).rotateY(Math.PI / 2).rotateZ(Math.PI / 2).translate(0, 0, -0.5);
    const g = mergeGeometries([a.toNonIndexed(), b.toNonIndexed()]);
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
        const k = Math.pow(1 + p.getZ(i), 2);
        c.set([k, k, k], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    return g;
}

const TINTS = [[1, 1, 1], [0.75, 1.0, 1.25], [1.25, 0.75, 1.05], [1.15, 0.95, 0.75]];
const TRAIL_COLORS = [[0.9, 0.45, 1.0], [0.35, 0.8, 1.0], [1.0, 0.45, 0.7], [1.0, 0.7, 0.4]];

export function createAirTraffic() {
    const { r, rr, pick } = seeded(2718);
    const ships = [];
    const bodies = new Batch(), trails = new Batch();

    for (const lane of LANES) {
        const sampler = new PathSampler(new THREE.CatmullRomCurve3(lane.pts), 500);
        for (let i = 0; i < lane.n; i++) {
            const dir = lane.dir || (r() < 0.5 ? 1 : -1);
            const speed = rr(...lane.speed);
            const s = lane.scale * rr(0.85, 1.15);
            const ship = { sampler, t: (i + r() * 0.6) / lane.n, dir, speed, s, bob: r() * 10, alt: rr(-4, 4) * lane.scale, trail: -1 };
            bodies.add(0, 0, 0, 1, 1, 1, 0, new THREE.Color(...pick(TINTS)));
            if (speed > lane.speed[0] + (lane.speed[1] - lane.speed[0]) * 0.55) {
                ship.trail = trails.count;
                trails.add(0, 0, 0, 1, 1, 1, 0, new THREE.Color(...pick(TRAIL_COLORS)).multiplyScalar(0.45));
            }
            ships.push(ship);
        }
    }

    const bodyMesh = bodies.build(vehicleGeometry(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: true }));
    const trailMesh = trails.build(trailGeometry(), new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, fog: false
    }));
    bodyMesh.frustumCulled = false;
    if (trailMesh) trailMesh.frustumCulled = false;

    const p = new THREE.Vector3(), tan = new THREE.Vector3(), look = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const m = new THREE.Matrix4(), sc = new THREE.Matrix4();

    function update(dt, time) {
        ships.forEach((sh, i) => {
            sh.t = (sh.t + (sh.dir * sh.speed * dt) / sh.sampler.length + 1) % 1;
            sh.sampler.at(sh.t, p);
            sh.sampler.tangent(sh.t, tan).multiplyScalar(sh.dir);
            p.y += sh.alt + Math.sin(time * 0.7 + sh.bob) * 0.4;
            m.lookAt(look.copy(p).add(tan), p, up);
            m.multiply(sc.makeScale(sh.s, sh.s, sh.s)).setPosition(p);
            bodyMesh.setMatrixAt(i, m);
            if (sh.trail >= 0) {
                m.multiply(sc.makeScale(0.5, 0.5, sh.speed * 0.45));
                trailMesh.setMatrixAt(sh.trail, m.setPosition(p));
            }
        });
        bodyMesh.instanceMatrix.needsUpdate = true;
        if (trailMesh) trailMesh.instanceMatrix.needsUpdate = true;
    }
    update(0, 0);
    onFrame(update);
}
