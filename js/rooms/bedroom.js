import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { rand, rr, pick } from "../core/random.js";
import { addBox, makeDrape } from "../core/helpers.js";
import { std, glow, wallMat, frameMat, woodMat, darkWood, ceilingMat, dimLight, lampGlow } from "../core/materials.js";
import { makeWoodTexture, makeRugTexture } from "../core/textures.js";
import { onFrame } from "../core/animated.js";
import { addLeaf, vine, bush, pot } from "../props/foliage.js";
import { createLavaLamp } from "../props/lavaLamp.js";
import { bigPoster, smallPoster, poster } from "../props/posters.js";
import { createHeadphones } from "../props/music.js";
import { createMug, createOpenBook, createStringLights } from "../props/cozy.js";
import { RX0, RX1, BZ, FZ, H, T, WX0, WX1, WY1, SF, SX0, SX1, SH } from "../config/layout.js";

// Chambre : lit, lampe à lave, posters, étagère, mur végétal, ouverture + marches vers le salon

function createShell(woodTex, rugTex) {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(RX1 - RX0, FZ - BZ),
        new THREE.MeshStandardMaterial({ map: woodTex, color: 0xb08870, roughness: 0.55, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, (BZ + FZ) / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    const wallPlane = (w, h, x, y, z, ry) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
        m.position.set(x, y, z);
        m.rotation.y = ry;
        m.receiveShadow = true;
        scene.add(m);
    };
    wallPlane(FZ - BZ, H, RX0, H / 2, (BZ + FZ) / 2, Math.PI / 2);
    wallPlane(FZ - BZ, H, RX1, H / 2, (BZ + FZ) / 2, -Math.PI / 2);
    wallPlane(RX1 - RX0, H, 0, H / 2, FZ, Math.PI);

    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(RX1 - RX0, FZ - BZ), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, (BZ + FZ) / 2);
    ceiling.castShadow = true;
    scene.add(ceiling);

    // mur du fond percé d'une ouverture qui donne sur le salon, en contrebas
    addBox(SX0, WX0, SF, SH, BZ - T, BZ, wallMat);
    addBox(WX1, SX1, SF, SH, BZ - T, BZ, wallMat);
    addBox(WX0, WX1, WY1, SH, BZ - T, BZ, wallMat);

    // habillage dans l'épaisseur du mur (ne déborde pas sur les murs voisins)
    addBox(WX0, WX0 + 0.08, 0, WY1, BZ - T, BZ, frameMat);
    addBox(WX1 - 0.08, WX1, 0, WY1, BZ - T, BZ, frameMat);
    addBox(WX0, WX1, WY1 - 0.08, WY1, BZ - T, BZ, frameMat);

    // palier + 3 marches éclairées qui descendent vers le salon
    addBox(WX0, WX1, SF, 0, BZ - T, BZ, woodMat);
    const STEP_RUN = 0.32;
    const stepGlow = lampGlow(0xffa060, 0.6);
    for (let i = 0; i < 3; i++) {
        const top = -(i + 1) * (-SF / 4);
        const z1 = BZ - T - i * STEP_RUN;
        addBox(WX0, WX1, SF, top, z1 - STEP_RUN, z1, woodMat);
        addBox(WX0, WX1, top - 0.025, top, z1 - STEP_RUN - 0.03, z1 - STEP_RUN, darkWood);
        addBox(WX0 + 0.05, WX1 - 0.05, top - 0.05, top - 0.035, z1 - STEP_RUN - 0.02, z1 - STEP_RUN, stepGlow, scene, false);
    }

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.6), std(0xffffff, { map: rugTex, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.9, 0.006, 0.3);
    rug.receiveShadow = true;
    scene.add(rug);
}

function createBed() {
    const BX0 = RX0, BX1 = -0.7, BZ0 = -1.5, BZ1 = 0.8;
    const cz = (BZ0 + BZ1) / 2;

    addBox(BX0 + 0.15, BX1, 0, 0.32, BZ0, BZ1, darkWood);
    addBox(BX0 + 0.15, BX1 - 0.05, 0.32, 0.6, BZ0 + 0.05, BZ1 - 0.05, std(0xc8c0d0));

    // tête de lit capitonnée + bande LED derrière
    const head = new THREE.Mesh(new RoundedBoxGeometry(0.18, 1.2, BZ1 - BZ0 + 0.1, 4, 0.06), std(0x3a3044, { roughness: 1 }));
    head.position.set(RX0 + 0.1, 0.75, cz);
    head.castShadow = head.receiveShadow = true;
    scene.add(head);
    addBox(RX0 + 0.005, RX0 + 0.03, 1.38, 1.42, BZ0 - 0.1, BZ1 + 0.1, lampGlow(0xff9a58, 0.8), scene, false);

    // couette + repli
    const duvetMat = std(0x4a3a5a, { roughness: 0.95, side: THREE.DoubleSide });
    const duvetHX = 1.25;
    const duvet = new THREE.Mesh(makeDrape(duvetHX, (BZ1 - BZ0) / 2 + 0.02, 0.78, 0.45, 90, 0.035), duvetMat);
    duvet.position.set(BX1 - duvetHX - 0.02, 0, cz);
    duvet.castShadow = duvet.receiveShadow = true;
    scene.add(duvet);

    const fold = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.14, BZ1 - BZ0 + 0.1, 4, 0.06), duvetMat);
    fold.position.set(BX1 - duvetHX * 2 - 0.05, 0.76, cz);
    fold.castShadow = fold.receiveShadow = true;
    scene.add(fold);

    // plaid rouge au pied du lit
    const plaid = new THREE.Mesh(
        makeDrape(0.32, (BZ1 - BZ0) / 2 + 0.06, 0.83, 0.5, 40, 0.02),
        std(0x8a2c3c, { roughness: 1, side: THREE.DoubleSide })
    );
    plaid.position.set(BX1 - 0.45, 0, cz);
    plaid.rotation.y = 0.04;
    plaid.castShadow = plaid.receiveShadow = true;
    scene.add(plaid);

    // oreillers
    const pillowGeo = new RoundedBoxGeometry(0.42, 0.24, 0.85, 5, 0.11);
    [[cz - 0.48, 0x5a4458, 0.0], [cz + 0.46, 0xa85a42, 0.0], [cz + 0.05, 0xc8b0a0, 0.25]].forEach(([z, c, lean], i) => {
        const p = new THREE.Mesh(pillowGeo, std(c, { roughness: 1 }));
        p.position.set(RX0 + 0.5 + i * 0.12, 0.78 + lean * 0.3, z);
        p.rotation.set(rr(-0.08, 0.08), rr(-0.2, 0.2), -0.35 - lean);
        p.castShadow = p.receiveShadow = true;
        scene.add(p);
    });

    // casque audio
    const metal = std(0x1a1a1e, { metalness: 0.5, roughness: 0.4 });
    createHeadphones(new THREE.Vector3(-2.4, 0.83, -0.7), 0.5);

    // téléphone
    const phone = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.008, 0.16), metal);
    phone.position.set(-1.65, 0.82, -0.3);
    phone.rotation.set(0.03, -0.4, 0.04);
    scene.add(phone);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.145), glow(0x9a7ab0, 0.7));
    scr.rotation.x = -Math.PI / 2;
    scr.position.y = 0.0045;
    phone.add(scr);
}

// Table de nuit au bout du lit côté entrée, lampe à lave (premier plan de l'arrivée)
function createNightstand() {
    const NX = RX0 + 0.05, NZ = 0.9;
    addBox(NX, NX + 0.65, 0, 0.58, NZ, NZ + 0.6, woodMat);
    addBox(NX + 0.65, NX + 0.66, 0.25, 0.27, NZ + 0.03, NZ + 0.57, darkWood);

    const { light } = createLavaLamp({
        position: new THREE.Vector3(NX + 0.42, 0.58, NZ + 0.3),
        scale: 1.5,
        blobCount: 6,
        light: { intensity: 1.6, distance: 6, position: new THREE.Vector3(0, 0.4, 0.12) }
    });
    onFrame((dt, t) => { light.intensity = 1.5 + Math.sin(t * 1.7) * 0.15; });
}

function createPosters() {
    poster(bigPoster, 0.95, 1.42, 0.4, 2.35, RX0);
    [
        [-0.95, 2.75, 0.42, 0.56], [-0.85, 2.05, 0.38, 0.5], [-1.6, 2.5, 0.45, 0.6],
        [-2.3, 2.8, 0.4, 0.52], [-2.25, 2.05, 0.42, 0.55], [-2.95, 2.45, 0.38, 0.5],
        [1.6, 2.95, 0.44, 0.58], [1.55, 2.2, 0.4, 0.52], [2.25, 2.6, 0.46, 0.6],
        [2.9, 2.15, 0.4, 0.5], [2.95, 2.85, 0.38, 0.5], [1.15, 1.6, 0.3, 0.4]
    ].forEach(([z, y, w, h], i) => poster(smallPoster(100 + i * 17), w, h, z, y, RX0));
}

// Étagère contre le mur du fond, livres, lampe ronde, plantes et lierre
function createShelf() {
    const SX0 = -3.55, SX1 = -2.15, SZ0 = BZ, SZ1 = BZ + 0.38, SH = 3.15;
    addBox(SX0, SX0 + 0.04, 0, SH, SZ0, SZ1, woodMat);
    addBox(SX1 - 0.04, SX1, 0, SH, SZ0, SZ1, woodMat);
    const shelves = [0.1, 0.65, 1.2, 1.75, 2.3, 2.85, SH - 0.04];
    shelves.forEach(y => addBox(SX0, SX1, y, y + 0.04, SZ0, SZ1, woodMat));

    const bookColors = [0x2a3a6a, 0x6a2a3a, 0xd8c8a8, 0x3a5a4a, 0x8a5a2a, 0x2a2a2a, 0x7a3a7a, 0xc8a050, 0x4a4a6a];
    for (let s = 0; s < shelves.length - 1; s++) {
        const y = shelves[s] + 0.04;
        let x = SX0 + 0.06;
        const lampShelf = s === 3;
        while (x < SX1 - 0.1) {
            if (lampShelf && x > SX0 + 0.55 && x < SX0 + 1.0) { x += 0.05; continue; }
            if (s === 1 && x > SX0 + 0.8) break;
            const bw = rr(0.03, 0.075);
            // hauteur ramenée à la place sous la tablette du dessus (dernier niveau plus bas)
            const room = shelves[s + 1] - y - 0.025;
            const bh = Math.min(0.2, room * 0.6) + (rr(0.2, 0.42) - 0.2) / 0.22 * (Math.min(0.42, room) - Math.min(0.2, room * 0.6));
            const b = addBox(x, x + bw, y, y + bh, SZ0 + 0.04, SZ0 + rr(0.24, 0.32), std(pick(bookColors), { roughness: 0.7 }));
            if (rand() < 0.08) { b.rotation.z = 0.25; b.position.x += 0.04; x += 0.05; }
            x += bw + 0.004;
            if (rand() < 0.06) x += 0.15;
        }
    }

    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 32, 16), lampGlow(0xffc070, 1.1));
    orb.position.set(SX0 + 0.78, shelves[3] + 0.2, SZ0 + 0.2);
    scene.add(orb);
    const orbLight = dimLight(new THREE.PointLight(0xffa850, 1.2, 5, 2));
    orbLight.position.copy(orb.position).add(new THREE.Vector3(0, 0, 0.25));
    scene.add(orbLight);

    const potMat = std(0xd8d0c8, { roughness: 0.5 });
    for (const [px, sy] of [[SX0 + 1.0, shelves[1]], [SX0 + 0.3, shelves[5]]]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.13, 16), potMat);
        p.position.set(px, sy + 0.04 + 0.065, SZ0 + 0.2);
        scene.add(p);
        bush(px, sy + 0.17, SZ0 + 0.2, 26, 0.14, 1.3);
    }

    for (let i = 0; i < 7; i++) {
        vine(SX0 + rr(0.05, 1.35), SH + 0.02, SZ1 - rr(0, 0.05), rr(0.6, 2.4), 300 + i);
    }
    vine(SX1 + 0.04, SH - 0.1, SZ1 + 0.02, 2.6, 401);
    vine(SX1 + 0.08, SH - 0.2, SZ1 - 0.1, 2.1, 402);
    vine(SX0 + 0.7, shelves[5] + 0.2, SZ1, 1.4, 403);
    vine(RX0 + 0.08, H - 0.05, BZ + 0.6, 1.4, 404);
    vine(WX0 - 0.1, H - 0.05, BZ + 0.1, 0.9, 405);
}

// Mur végétal sur tout le mur de droite
function createGreenWall() {
    const GX = RX1, GZ0 = BZ + 0.15, GZ1 = FZ - 0.5, GY0 = 0.12, GY1 = H - 0.25;

    addBox(GX - 0.06, GX, GY0, GY1, GZ0, GZ1, std(0x1a2618, { roughness: 1 }));
    addBox(GX - 0.1, GX, GY0 - 0.06, GY0, GZ0 - 0.06, GZ1 + 0.06, darkWood);
    addBox(GX - 0.1, GX, GY1, GY1 + 0.06, GZ0 - 0.06, GZ1 + 0.06, darkWood);
    addBox(GX - 0.1, GX, GY0, GY1, GZ0 - 0.06, GZ0, darkWood);
    addBox(GX - 0.1, GX, GY0, GY1, GZ1, GZ1 + 0.06, darkWood);

    // feuillage dense, quelques touffes qui dépassent
    for (let z = GZ0 + 0.03; z < GZ1 - 0.02; z += 0.075) {
        for (let y = GY0 + 0.03; y < GY1 - 0.02; y += 0.075) {
            for (let k = 0; k < 2; k++) {
                addLeaf(
                    GX - 0.07 - rand() * 0.1,
                    y + rr(-0.04, 0.04),
                    z + rr(-0.04, 0.04),
                    rr(0.07, 0.15),
                    rr(-0.5, 0.5), -Math.PI / 2 + rr(-0.6, 0.6), rand() * Math.PI * 2
                );
            }
        }
    }
    for (let i = 0; i < 40; i++) {
        bush(GX - 0.08, rr(GY0 + 0.2, GY1 - 0.2), rr(GZ0 + 0.2, GZ1 - 0.2), 10, rr(0.14, 0.24), 1.4);
    }
    for (let i = 0; i < 6; i++) vine(GX - 0.12, GY0 + rr(0.2, 0.6), rr(GZ0 + 0.3, GZ1 - 0.3), rr(0.2, 0.5), 1500 + i);

    // réglette LED chaude au-dessus
    addBox(GX - 0.18, GX - 0.1, GY1 + 0.06, GY1 + 0.09, GZ0, GZ1, std(0x1a1618));
    addBox(GX - 0.17, GX - 0.11, GY1 + 0.05, GY1 + 0.06, GZ0 + 0.05, GZ1 - 0.05, lampGlow(0xffc080, 0.8), scene, false);
    for (const z of [GZ0 + (GZ1 - GZ0) * 0.25, GZ0 + (GZ1 - GZ0) * 0.75]) {
        const l = dimLight(new THREE.PointLight(0xffc888, 1.3, 3.5, 1.8));
        l.position.set(GX - 0.5, GY1 - 0.3, z);
        scene.add(l);
    }

    // plante au sol près de l'ouverture
    const h1 = pot(WX1 - 0.4, BZ + 0.9, 0.17, 0.32);
    bush(WX1 - 0.4, h1, BZ + 0.9, 60, 0.32, 1.25);
}

function createPlants() {
    const h = pot(RX0 + 0.45, -1.75, 0.2, 0.42, 0x4a3a34);
    bush(RX0 + 0.45, h, -1.75, 80, 0.5, 1.3);
    // petite plante en pot dans le coin arrière de la table de nuit, à côté de la lampe à lave
    const nh = pot(RX0 + 0.19, 1.4, 0.075, 0.12, 0xa0583a, 0.58);
    bush(RX0 + 0.19, nh, 1.4, 30, 0.18, 1.15);
}

// Traces de présence : tasse encore chaude, livre laissé ouvert, guirlande au-dessus des posters.
// N'utilise pas le flux aléatoire global (appelé en dernier, ne décale rien).
function createLivedIn() {
    createMug(new THREE.Vector3(RX0 + 0.18, 0.58, 0.99), 0xc8a890, { rotationY: 0.8 });
    createOpenBook(new THREE.Vector3(-1.85, 0.815, 0.3), 0.35, 0x3a4a48);
    for (const [z0, z1] of [[-3.2, -1.6], [-1.6, 0.0], [0.0, 1.6]]) {
        createStringLights(new THREE.Vector3(RX0 + 0.04, 3.58, z0), new THREE.Vector3(RX0 + 0.04, 3.58, z1), 0.14, 9);
    }
}

export function createBedroom() {
    const woodTex = makeWoodTexture();
    const rugTex = makeRugTexture();

    createShell(woodTex, rugTex);
    createBed();
    createNightstand();
    createPosters();
    createShelf();
    createGreenWall();
    createPlants();
    createLivedIn();

    return { woodTex, rugTex };
}
