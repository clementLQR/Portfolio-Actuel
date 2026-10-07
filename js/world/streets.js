import * as THREE from "three";
import { scene } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { canvasTexture, unitBox } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";
import { GROUND_Y, RIVER_DIR, RIVER_HALF, RIVER_ORIGIN, WATER_Y } from "../config/layout.js";
import { Batch, instGlow } from "./kit.js";
import { CELL, CITY_X0, CITY_Z0, AVENUE_EVERY, STREET_EVERY } from "./city.js";
import { waterDist, riverX, RESERVED } from "./zones.js";

// Niveau du sol : réseau de rues peint dans une texture répétée et calée sur la grille
// d'îlots de city.js, voitures (simples points lumineux) qui circulent sur les avenues
// et le long des quais, réverbères.

const TILE_X = CELL * AVENUE_EVERY, TILE_Z = CELL * STREET_EVERY;
const PX = 4; // pixels par mètre

function roadTextures() {
    const w = TILE_X * PX, h = TILE_Z * PX;
    const paint = (emissive) => (g) => {
        g.fillStyle = emissive ? "#000" : "#17101d";
        g.fillRect(0, 0, w, h);
        // une rue centrée sur chaque bord de la tuile (la répétition recolle les moitiés)
        const road = (horizontal) => {
            for (const edge of [0, horizontal ? h : w]) {
                const band = (half, style) => {
                    g.fillStyle = style;
                    if (horizontal) g.fillRect(0, edge - half * PX, w, half * 2 * PX);
                    else g.fillRect(edge - half * PX, 0, half * 2 * PX, h);
                };
                if (emissive) {
                    band(7.6, "rgba(255,150,80,0.10)");
                    band(6.2, "#000");
                } else {
                    band(7.6, "#2b2232");
                    band(6.2, "#0d0a12");
                }
            }
            // pointillés centraux
            g.fillStyle = emissive ? "rgba(255,190,120,0.35)" : "#5a4636";
            const len = horizontal ? w : h;
            for (let p = 0; p < len; p += 6 * PX) {
                for (const edge of [0, horizontal ? h : w]) {
                    if (horizontal) g.fillRect(p, edge - 1, 3 * PX, 2);
                    else g.fillRect(edge - 1, p, 2, 3 * PX);
                }
            }
        };
        road(false);
        road(true);
    };
    const make = (emissive) => {
        const t = canvasTexture(w, h, paint(emissive));
        t.wrapS = t.wrapT = THREE.RepeatWrapping;
        t.repeat.set(4000 / TILE_X, 4000 / TILE_Z);
        // aligne les bords de tuile sur les avenues (x = CITY_X0 + k·TILE_X) et les rues (z = CITY_Z0 - k·TILE_Z)
        const fx = (2000 + CITY_X0) / TILE_X, fz = (2000 - CITY_Z0) / TILE_Z;
        t.offset.set(-(fx - Math.floor(fx)), -(fz - Math.floor(fz)));
        return t;
    };
    return { map: make(false), emissiveMap: make(true) };
}

function inReserved(x, z) {
    return RESERVED.some((q) => x > q.x0 && x < q.x1 && z > q.z0 && z < q.z1);
}

export function createStreets() {
    const { r, rr } = seeded(5531);

    const { map, emissiveMap } = roadTextures();
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshStandardMaterial({ map, emissiveMap, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = GROUND_Y;
    scene.add(ground);

    // --- voies de circulation au sol ---
    const lanes = [];
    for (let k = 0; ; k++) {
        const x = CITY_X0 + TILE_X * k;
        if (x > 1020) break;
        if (Math.abs(x) > 760) continue;
        if (Math.abs(x - riverX(-700)) < RIVER_HALF + 30) continue;
        for (const dir of [1, -1]) {
            lanes.push({
                o: new THREE.Vector3(x + dir * 2.6, GROUND_Y + 0.7, dir > 0 ? -1420 : -150),
                d: new THREE.Vector3(0, 0, dir),
                len: 1270, dir
            });
        }
    }
    // quais du fleuve
    const rd = new THREE.Vector3(RIVER_DIR.x, 0, RIVER_DIR.y);
    const side = new THREE.Vector3(-RIVER_DIR.y, 0, RIVER_DIR.x);
    for (const s of [-1, 1]) {
        for (const dir of [1, -1]) {
            const off = s * (RIVER_HALF + 6 + dir * 2.2);
            const start = new THREE.Vector3(RIVER_ORIGIN.x, WATER_Y + 1.6, RIVER_ORIGIN.y)
                .addScaledVector(side, off).addScaledVector(rd, dir > 0 ? 160 : 1230);
            lanes.push({ o: start, d: rd.clone().multiplyScalar(dir), len: 1070, dir: -dir });
        }
    }

    const cars = [];
    const carColors = new Batch();
    for (const lane of lanes) {
        const n = Math.floor(lane.len / rr(40, 70));
        for (let i = 0; i < n; i++) {
            cars.push({ lane, t: r() * lane.len, v: rr(9, 16) });
            // vers la caméra : phares ; s'éloignant : feux arrière
            const c = lane.dir > 0 ? new THREE.Color(2.2, 1.9, 1.5) : new THREE.Color(2.0, 0.18, 0.12);
            carColors.add(0, 0, 0, 2.2, 0.7, 1.2, 0, c);
        }
    }
    const carMesh = carColors.build(unitBox, instGlow);
    carMesh.frustumCulled = false;
    const arr = carMesh.instanceMatrix.array;
    const p = new THREE.Vector3();

    function placeCars(dt) {
        cars.forEach((c, i) => {
            c.t = (c.t + c.v * dt) % c.lane.len;
            p.copy(c.lane.o).addScaledVector(c.lane.d, c.t);
            const hidden = waterDist(p.x, p.z) < 2 || inReserved(p.x, p.z);
            arr[i * 16 + 12] = p.x;
            arr[i * 16 + 13] = hidden ? -1000 : p.y;
            arr[i * 16 + 14] = p.z;
        });
        carMesh.instanceMatrix.needsUpdate = true;
    }
    placeCars(0);
    onFrame((dt) => placeCars(dt));

    // --- réverbères ---
    const lamps = new Batch();
    const warm = new THREE.Color(2.0, 1.15, 0.55);
    for (let k = 0; ; k++) {
        const x = CITY_X0 + TILE_X * k;
        if (x > 1020) break;
        if (Math.abs(x) > 760) continue;
        for (let z = -170; z > -1420; z -= 24) {
            for (const s of [-1, 1]) {
                if (waterDist(x + s * 7.5, z) < 3 || inReserved(x, z)) continue;
                lamps.add(x + s * 7.5, GROUND_Y + 6, z, 0.6, 0.35, 0.6, 0, warm);
            }
        }
    }
    for (let j = 1; ; j++) {
        const z = CITY_Z0 - TILE_Z * j;
        if (z < -1420) break;
        for (let x = -700; x < 700; x += 26) {
            if (Math.abs(x - 0.5) > -z * 1.2 || waterDist(x, z + 7.5) < 3 || inReserved(x, z)) continue;
            lamps.add(x, GROUND_Y + 6, z + 7.5, 0.6, 0.35, 0.6, 0, warm);
        }
    }
    // quais : lampadaires serrés, qui se reflètent dans l'eau
    for (let t = 150; t < 1240; t += 14) {
        for (const s of [-1, 1]) {
            const q = new THREE.Vector3(RIVER_ORIGIN.x, WATER_Y + 4.5, RIVER_ORIGIN.y)
                .addScaledVector(rd, t).addScaledVector(side, s * (RIVER_HALF + 1.6));
            lamps.add(q.x, q.y, q.z, 0.7, 0.45, 0.7, 0, warm);
        }
    }
    lamps.build(unitBox, instGlow);
}
