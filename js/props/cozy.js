import * as THREE from "three";
import { scene } from "../core/scene.js";
import { std, glow, dimLight, lampGlow } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";

// Petits objets qui rendent la pièce habitée : tasse fumante, livre ouvert, lampe de table
// en céramique, lanterne en papier, guirlande lumineuse, guéridon.
// Lumières volontairement faibles et chaudes. Aucun tirage aléatoire.

// --- tasse et vapeur ------------------------------------------------------------

let steamTex;
function getSteamTexture() {
    steamTex ??= canvasTexture(64, 64, (g, w, h) => {
        const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        grd.addColorStop(0, "rgba(255,240,230,1)");
        grd.addColorStop(1, "rgba(255,240,230,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, w, h);
    });
    return steamTex;
}

const steamPuffs = [];
onFrame((dt, t) => {
    for (const s of steamPuffs) {
        const u = s.userData;
        const p = (t * 0.22 + u.phase) % 1;
        s.position.set(u.x + Math.sin(t * 1.3 + u.phase * 9) * 0.012 * p, u.y + p * 0.26, u.z + Math.cos(t + u.phase * 5) * 0.01 * p);
        s.material.opacity = Math.sin(p * Math.PI) * 0.1;
        s.scale.setScalar(0.04 + p * 0.1);
    }
});

// Tasse en céramique, café chaud et un filet de vapeur
export function createMug(position, color = 0xc8a890, { steam = true, rotationY = 0 } = {}) {
    const g = new THREE.Group();
    const ceramic = std(color, { roughness: 0.45 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.1, 20, 1, true), ceramic);
    body.material.side = THREE.DoubleSide;
    body.position.y = 0.05;
    g.add(body);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.04, 20), ceramic);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.002;
    g.add(bottom);
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.042, 20), std(0x2a1610, { roughness: 0.2 }));
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.y = 0.085;
    g.add(coffee);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 16, Math.PI), ceramic);
    handle.rotation.z = -Math.PI / 2;
    handle.position.set(0.045, 0.05, 0);
    g.add(handle);
    g.position.copy(position);
    g.rotation.y = rotationY;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);

    if (steam) {
        for (let i = 0; i < 5; i++) {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getSteamTexture(), transparent: true, depthWrite: false, opacity: 0, fog: false }));
            s.userData = { x: position.x, y: position.y + 0.1, z: position.z, phase: i / 5 };
            scene.add(s);
            steamPuffs.push(s);
        }
    }
    return g;
}

// --- pot à crayons ----------------------------------------------------------------

export function createPenHolder(position, color = 0x5a4a40) {
    const g = new THREE.Group();
    const mat = std(color, { roughness: 0.6, side: THREE.DoubleSide });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.032, 0.1, 20, 1, true), mat);
    cup.position.y = 0.05;
    g.add(cup);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.032, 20), mat);
    bottom.rotation.x = -Math.PI / 2;
    bottom.position.y = 0.002;
    g.add(bottom);
    // crayons et stylos, légèrement inclinés
    const pens = [
        [0x2a2a30, 0.012, 0.008, 0.16, 0.12, 0.1],
        [0xd8a040, -0.01, 0.012, 0.17, -0.15, 0.05],
        [0x7a2e3a, 0.008, -0.012, 0.15, 0.06, -0.16],
        [0xe8e0d0, -0.012, -0.006, 0.14, -0.1, -0.12]
    ];
    for (const [c, x, z, len, rx, rz] of pens) {
        const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.0045, 0.0045, len, 6), std(c, { roughness: 0.5 }));
        pen.position.set(x, 0.01 + len / 2, z);
        pen.rotation.set(rx, 0, rz);
        g.add(pen);
    }
    g.position.copy(position);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    scene.add(g);
    return g;
}

// --- livre ouvert ---------------------------------------------------------------

let pageTex;
function getPageTexture() {
    pageTex ??= canvasTexture(128, 160, (g, w, h) => {
        g.fillStyle = "#e8dcc4";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(60,40,40,0.35)";
        for (let y = 18; y < h - 14; y += 7) g.fillRect(12, y, w - 24 - ((y * 7) % 23), 2);
    });
    return pageTex;
}

export function createOpenBook(position, rotationY = 0, coverColor = 0x6a2e34) {
    const g = new THREE.Group();
    const cover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.008, 0.21), std(coverColor, { roughness: 0.8 }));
    cover.position.y = 0.004;
    g.add(cover);
    const pageMat = std(0xffffff, { map: getPageTexture(), roughness: 0.9 });
    for (const s of [-1, 1]) {
        const page = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.016, 0.2), pageMat);
        page.position.set(s * 0.073, 0.016, 0);
        page.rotation.z = -s * 0.07;
        g.add(page);
    }
    g.position.copy(position);
    g.rotation.y = rotationY;
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(g);
    return g;
}

// --- lumières d'appoint -----------------------------------------------------------

// Lampe de table : pied en céramique, abat-jour en tissu qui laisse filtrer la lumière
export function createTableLamp(position, { color = 0xb8704a, intensity = 0.9, distance = 3.2 } = {}) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 14), std(color, { roughness: 0.5 }));
    base.scale.set(1, 1.15, 1);
    base.position.y = 0.085;
    g.add(base);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), std(0x2a2020, { metalness: 0.5, roughness: 0.4 }));
    stem.position.y = 0.22;
    g.add(stem);
    const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.085, 0.12, 0.15, 24, 1, true),
        new THREE.MeshStandardMaterial({ color: 0xe8d4b8, emissive: 0xffa868, emissiveIntensity: 0.55, roughness: 1, side: THREE.DoubleSide })
    );
    shade.position.y = 0.32;
    g.add(shade);
    const light = dimLight(new THREE.PointLight(0xffa868, intensity, distance, 2));
    light.position.y = 0.3;
    g.add(light);
    g.position.copy(position);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    shade.castShadow = false;
    scene.add(g);
    return { lamp: g, light };
}

// Lanterne en papier posée au sol, lueur douce
export function createPaperLantern(position, size = 0.22, intensity = 0.8) {
    const g = new THREE.Group();
    const paper = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 16), lampGlow(0xffd2a0, 0.75));
    paper.position.y = size;
    g.add(paper);
    for (let k = -2; k <= 2; k++) {
        const rib = new THREE.Mesh(new THREE.TorusGeometry(size * Math.cos(k * 0.45) * 1.002, 0.0025, 4, 32), std(0x8a6a50));
        rib.rotation.x = Math.PI / 2;
        rib.position.y = size + Math.sin(k * 0.45) * size;
        g.add(rib);
    }
    const light = dimLight(new THREE.PointLight(0xffb070, intensity, 3.5, 2));
    light.position.y = size * 1.3;
    g.add(light);
    g.position.copy(position);
    scene.add(g);
    return { lantern: g, light };
}

// Guirlande d'ampoules entre deux points, légère respiration de la lumière
export function createStringLights(a, b, sag = 0.15, count = 18) {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
        const f = i / 24;
        const p = new THREE.Vector3().lerpVectors(a, b, f);
        p.y -= sag * 4 * f * (1 - f);
        pts.push(p);
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.003, 4), std(0x201818)));
    const bulbMat = lampGlow(0xffc888, 1.0);
    const base = bulbMat.color.clone();
    const bulbGeo = new THREE.SphereGeometry(0.014, 8, 6);
    for (let i = 1; i < count; i++) {
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.copy(curve.getPointAt(i / count)).add(new THREE.Vector3(0, -0.018, 0));
        scene.add(bulb);
    }
    onFrame((dt, t) => { bulbMat.color.copy(base).multiplyScalar(0.85 + 0.15 * Math.sin(t * 0.6)); });
}

// Guéridon rond en bois
export function createSideTable(position, height = 0.5, radius = 0.24) {
    const wood = std(0x5a3424, { roughness: 0.6 });
    const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.03, 32), wood);
    top.position.set(position.x, position.y + height - 0.015, position.z);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, height - 0.03, 12), wood);
    leg.position.set(position.x, position.y + (height - 0.03) / 2, position.z);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.6, radius * 0.65, 0.02, 24), wood);
    foot.position.set(position.x, position.y + 0.01, position.z);
    for (const m of [top, leg, foot]) {
        m.castShadow = m.receiveShadow = true;
        scene.add(m);
    }
    return position.y + height;
}
