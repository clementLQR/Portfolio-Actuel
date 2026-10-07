import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { rand, rr, pick } from "../core/random.js";
import { addBox, makeDrape } from "../core/helpers.js";
import { std, glow, wallMat, frameMat, woodMat, darkWood, ceilingMat, dimLight, lampGlow } from "../core/materials.js";
import { makeSalonRugTexture } from "../core/textures.js";
import { createTvScreen } from "../props/tvScreen.js";
import { flicker } from "../core/animated.js";
import { registerClickable } from "../core/interactive.js";
import { vine, bush, pot } from "../props/foliage.js";
import { createLavaLamp } from "../props/lavaLamp.js";
import { bigPoster, smallPoster, poster, imagePoster } from "../props/posters.js";
import { createOffice } from "./office.js";
import { createArmchair } from "../props/armchair.js";
import { createFigurine } from "../props/figurine.js";
import { createLetterToy } from "../props/letterToy.js";
import { createArcade } from "../props/arcade.js";
import { createBreakoutScreen } from "../props/breakout.js";
import { createTurntable, createSpeaker, createRecordSleeves, createFloorSpeaker } from "../props/music.js";
import { createMug, createOpenBook, createTableLamp, createPaperLantern, createSideTable } from "../props/cozy.js";
import { BZ, T, SF, SX0, SX1, SH, SZ1, FWX0, FWX1, FWY0, FWY1, ARCADE_POS, ARCADE2_POS } from "../config/layout.js";

// Salon en contrebas : baie vitrée sur tout le mur du fond, canapé d'angle,
// télé, lampe à lave, bibliothèques, porte vers le bureau (mur de gauche)

const SZ0 = BZ - T;

function createShell(salonWood, rugTex) {
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(SX1 - SX0, SZ0 - SZ1),
        new THREE.MeshStandardMaterial({ map: salonWood, color: 0xa07a66, roughness: 0.5, metalness: 0.02 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((SX0 + SX1) / 2, SF, (SZ0 + SZ1) / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // mur de gauche percé d'une porte vers le bureau
    const DZ0 = -11.7, DZ1 = -10.2, DY = SF + 2.4;
    addBox(SX0 - 0.3, SX0, SF, SH, DZ1, SZ0, wallMat);
    addBox(SX0 - 0.3, SX0, SF, SH, SZ1, DZ0, wallMat);
    addBox(SX0 - 0.3, SX0, DY, SH, DZ0, DZ1, wallMat);
    addBox(SX1, SX1 + 0.3, SF, SH, SZ1, SZ0, wallMat);
    addBox(SX0 - 0.3, SX1 + 0.3, SH, SH + 0.3, SZ1 - 0.35, SZ0, ceilingMat);

    // habillage dans l'épaisseur du mur + seuil (évite le z-fighting et le trou au sol)
    addBox(SX0 - 0.3, SX0, SF, DY, DZ1 - 0.07, DZ1, frameMat);
    addBox(SX0 - 0.3, SX0, SF, DY, DZ0, DZ0 + 0.07, frameMat);
    addBox(SX0 - 0.3, SX0, DY - 0.07, DY, DZ0 + 0.07, DZ1 - 0.07, frameMat);
    addBox(SX0 - 0.3, SX0, SF - 0.05, SF + 0.008, DZ0 + 0.07, DZ1 - 0.07, woodMat);

    createOffice({ salonWood, rugTex });

    // baie vitrée sur tout le mur du fond
    addBox(SX0 - 0.3, SX1 + 0.3, FWY1, SH, SZ1 - 0.35, SZ1, wallMat);
    addBox(SX0 - 0.3, SX1 + 0.3, SF, FWY0, SZ1 - 0.35, SZ1, wallMat);
    // poteaux d'angle : ferment les coins entre murs latéraux et baie
    addBox(SX0 - 0.3, SX0 + 0.08, FWY0, FWY1, SZ1 - 0.35, SZ1, frameMat);
    addBox(SX1 - 0.08, SX1 + 0.3, FWY0, FWY1, SZ1 - 0.35, SZ1, frameMat);
    const panes = 5;
    for (let i = 1; i < panes; i++) {
        const x = FWX0 + (FWX1 - FWX0) * i / panes;
        addBox(x - 0.06, x + 0.06, FWY0, FWY1, SZ1 - 0.3, SZ1 - 0.15, frameMat);
    }
    addBox(FWX0, FWX1, FWY1 - 0.1, FWY1, SZ1 - 0.3, SZ1 - 0.15, frameMat);
    addBox(FWX0, FWX1, FWY0, FWY0 + 0.1, SZ1 - 0.3, SZ1 - 0.05, frameMat);
    addBox(FWX0, FWX1, 2.9, 2.96, SZ1 - 0.28, SZ1 - 0.17, frameMat);

    // poutres apparentes
    for (let z = SZ0 - 1.2; z > SZ1; z -= 1.7) {
        addBox(SX0, SX1, SH - 0.28, SH, z - 0.12, z + 0.12, darkWood);
    }

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 6.6), std(0xffffff, { map: makeSalonRugTexture(), roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0.5, SF + 0.006, -8.7);
    rug.receiveShadow = true;
    scene.add(rug);
}

// Canapé d'angle : partie longue face à la télé + méridienne au premier plan
const SOX = -2.9;

function createSofa() {
    const sofaMat = std(0x4a3640, { roughness: 1 });
    const SOZ0 = -6.3, SOZ1 = -9.9, CHX1 = -0.8, CHZ0 = -5.2;
    addBox(SOX, SOX + 1.05, SF, SF + 0.3, SOZ1, SOZ0, sofaMat);
    addBox(SOX, CHX1, SF, SF + 0.3, SOZ0, CHZ0, sofaMat);

    const seatGeo = new RoundedBoxGeometry(0.95, 0.2, 1.15, 4, 0.08);
    for (let i = 0; i < 3; i++) {
        const c = new THREE.Mesh(seatGeo, sofaMat);
        c.position.set(SOX + 0.55, SF + 0.4, SOZ0 - 0.1 - 0.58 - i * 1.17);
        c.castShadow = c.receiveShadow = true;
        scene.add(c);
    }
    const chaise = new THREE.Mesh(new RoundedBoxGeometry(CHX1 - SOX - 0.05, 0.22, CHZ0 - SOZ0 - 0.05, 4, 0.09), sofaMat);
    chaise.position.set((SOX + CHX1) / 2, SF + 0.41, (SOZ0 + CHZ0) / 2);
    chaise.castShadow = chaise.receiveShadow = true;
    scene.add(chaise);
    const back = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.8, SOZ0 - SOZ1 + 1.1, 4, 0.1), sofaMat);
    back.position.set(SOX + 0.15, SF + 0.68, (CHZ0 + SOZ1) / 2);
    back.castShadow = back.receiveShadow = true;
    scene.add(back);
    const arm = new THREE.Mesh(new RoundedBoxGeometry(1.05, 0.62, 0.25, 4, 0.1), sofaMat);
    arm.position.set(SOX + 0.525, SF + 0.31, SOZ1);
    arm.castShadow = arm.receiveShadow = true;
    scene.add(arm);

    const cushGeo = new RoundedBoxGeometry(0.2, 0.5, 0.55, 4, 0.09);
    [[0x6a4a5a, -5.7], [0xc0a088, -6.6], [0x9a4a3a, -7.4], [0x4a3a52, -8.3], [0x7a2e3a, -9.3]].forEach(([c, z]) => {
        const p = new THREE.Mesh(cushGeo, std(c, { roughness: 1 }));
        p.position.set(SOX + 0.48, SF + 0.77, z);
        p.rotation.set(rr(-0.15, 0.15), rr(-0.2, 0.2), 0.28);   // appuyés contre le dossier
        p.castShadow = p.receiveShadow = true;
        scene.add(p);
    });

    const plaid = new THREE.Mesh(
        // plat sur le dessus, l'arrondi du drapé (0,1) épouse le bord du coussin de la méridienne
        makeDrape(0.22, (CHZ0 - SOZ0) / 2 - 0.07, SF + 0.545, 0.3, 30, 0.005, true),   // au-dessus du coussin, pans hors du socle
        std(0x7a2c3c, { roughness: 1, side: THREE.DoubleSide })
    );
    plaid.position.set(-1.35, 0, (SOZ0 + CHZ0) / 2);
    plaid.rotation.y = 0.04;
    plaid.castShadow = true;
    scene.add(plaid);

    // pouf
    const beanbag = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), std(0x6a4448, { roughness: 1 }));
    beanbag.scale.set(0.6, 0.38, 0.6);
    beanbag.position.set(3.0, SF + 0.3, -6.4);
    beanbag.castShadow = beanbag.receiveShadow = true;
    scene.add(beanbag);
}

function createCoffeeTable() {
    const TX0 = -1.3, TX1 = 0.0, TZ0 = -7.0, TZ1 = -8.8, TY = SF + 0.42;
    addBox(TX0, TX1, TY - 0.06, TY, TZ1, TZ0, woodMat);
    addBox(TX0 + 0.05, TX1 - 0.05, SF + 0.12, SF + 0.15, TZ1 + 0.05, TZ0 - 0.05, woodMat);
    for (const [x, z] of [[TX0 + 0.05, TZ0 - 0.05], [TX1 - 0.05, TZ0 - 0.05], [TX0 + 0.05, TZ1 + 0.05], [TX1 - 0.05, TZ1 + 0.05]]) {
        addBox(x - 0.03, x + 0.03, SF, TY - 0.06, z - 0.03, z + 0.03, darkWood);
    }
    addBox(TX0 + 0.2, TX1 - 0.3, SF + 0.15, SF + 0.27, TZ1 + 0.3, TZ1 + 0.8, std(0x5a3a5a));
    createMug(new THREE.Vector3(-0.9, TY, -7.6), 0x8a5a58, { rotationY: 2.2 });
    createOpenBook(new THREE.Vector3(-0.8, TY, -8.45), 0.3);
    addBox(-0.6, -0.42, TY, TY + 0.03, -8.2, -8.05, std(0x18161c));
    const lamp = addBox(-0.25, -0.12, TY, TY + 0.16, -7.35, -7.22, lampGlow(0xffb070, 0.9), scene, false);
    const lampLight = dimLight(new THREE.PointLight(0xffa860, 0.7, 3.5, 2));
    lampLight.position.copy(lamp.position).add(new THREE.Vector3(0, 0.15, 0));
    scene.add(lampLight);
}

function createTvCorner() {
    const screen = createTvScreen();   // chaînes animées qui bouclent (props/tvScreen.js)
    const tvTex = screen.tex;
    addBox(SX1 - 0.55, SX1, SF, SF + 0.55, -10.0, -6.8, woodMat);
    addBox(SX1 - 0.56, SX1 - 0.55, SF + 0.25, SF + 0.27, -9.9, -6.9, darkWood);
    addBox(SX1 - 0.4, SX1 - 0.15, SF + 0.55, SF + 0.6, -8.8, -8.0, std(0x16141a));
    addBox(SX1 - 0.07, SX1, SF + 0.9, SF + 2.2, -9.6, -7.2, std(0x0c0a10));
    const tv = new THREE.Mesh(
        new THREE.PlaneGeometry(2.3, 1.22),
        new THREE.MeshBasicMaterial({ map: tvTex, color: new THREE.Color(0.42, 0.4, 0.42), fog: false })
    );
    tv.position.set(SX1 - 0.075, SF + 1.55, -8.4);
    tv.rotation.y = -Math.PI / 2;
    scene.add(tv);
    registerClickable(tv, "tv");   // clic : on s'installe dans le canapé (navigation.js)
    const tvLight = new THREE.PointLight(0x9080c8, 0.5, 4, 2);
    tvLight.position.set(SX1 - 0.8, SF + 1.5, -8.4);
    scene.add(tvLight);
    flicker(tvLight, 0.5, 0.06);

    createLavaLamp({
        position: new THREE.Vector3(SX1 - 0.28, SF + 0.55, -9.75),
        scale: 1.4,
        blobCount: 5,
        palette: "rose",
        light: { intensity: 0.8, distance: 4, position: new THREE.Vector3(0, 0.4, 0) }
    });
    return screen;
}

// gap : place laissée libre sur une tablette { level, from, to } (les tirages restent identiques)
function bookcase(x0, x1, z0, z1, alongZ, gap = null) {
    const bookColors = [0x2a3a6a, 0x6a2a3a, 0xd8c8a8, 0x3a5a4a, 0x8a5a2a, 0x2a2a2a, 0x7a3a7a, 0xc8a050];
    const depth = alongZ ? x1 - x0 : z1 - z0;
    addBox(x0, x1, SF, SF + 0.04, z0, z1, woodMat);
    const levels = [0.0, 0.55, 1.1, 1.65, 2.2, 2.75];
    for (const y of levels) addBox(x0, x1, SF + y, SF + y + 0.04, z0, z1, woodMat);
    if (alongZ) {
        addBox(x0, x1, SF, SF + 2.8, z0, z0 + 0.04, woodMat);
        addBox(x0, x1, SF, SF + 2.8, z1 - 0.04, z1, woodMat);
    }
    for (const y of levels.slice(0, -1)) {
        const free = gap && gap.level === y ? gap : null;
        let p = (alongZ ? z0 : x0) + 0.06;
        const end = (alongZ ? z1 : x1) - 0.1;
        while (p < end) {
            const bw = rr(0.03, 0.075), bh = rr(0.22, 0.42);
            if (rand() < 0.07) { p += 0.2; continue; }
            const d = depth * rr(0.6, 0.85);
            const mat = std(pick(bookColors), { roughness: 0.7 });
            if (!(free && p + bw > free.from && p < free.to)) {
                if (alongZ) addBox(x0 + 0.03, x0 + d, SF + y + 0.04, SF + y + 0.04 + bh, p, p + bw, mat);
                else addBox(p, p + bw, SF + y + 0.04, SF + y + 0.04 + bh, z0 + 0.03, z0 + d, mat);
            }
            p += bw + 0.004;
        }
    }
}

// Lampadaire en arc au-dessus du canapé
function createArcLamp() {
    const lampMat = std(0x18161c, { metalness: 0.6, roughness: 0.4 });
    const arcCurve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(SX0 + 0.55, SF, -6.25),     // pied devant la bibliothèque, à côté de la borne
        new THREE.Vector3(SX0 + 0.6, SF + 2.9, -6.35),
        new THREE.Vector3(SOX + 1.0, SF + 2.2, -6.6)
    );
    const arc = new THREE.Mesh(new THREE.TubeGeometry(arcCurve, 30, 0.02, 6), lampMat);
    arc.castShadow = true;
    scene.add(arc);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 24, 1, true), std(0x221c24, { side: THREE.DoubleSide }));
    shade.position.set(SOX + 1.0, SF + 2.1, -6.6);
    scene.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), lampGlow(0xffc080, 1.4));
    bulb.position.set(SOX + 1.0, SF + 2.0, -6.6);
    scene.add(bulb);
    const light = dimLight(new THREE.PointLight(0xffa860, 2.5, 7, 1.6));
    light.position.set(SOX + 1.0, SF + 1.9, -6.6);
    scene.add(light);
}

function createDecor() {
    registerClickable(poster(imagePoster("assets/poster-autoportrait.jpg"), 1.35 * 989 / 1400, 1.35, -7.65, SF + 3.55, SX0, { frame: 0x111014 }), "poster2");   // autoportrait (A4), cadre noir
    // deux affiches carrées (images de assets/) en haut, petits posters peints en dessous
    const images = { 0: imagePoster("assets/poster-banshee.jpg"), 2: imagePoster("assets/poster-ruines.jpg") };
    const POSTER_SPOTS = ["poster1", "poster1", "poster3", "poster3"];   // les deux premiers et les deux suivants se regardent ensemble
    [[-6.5, SF + 3.72, 0.6, 0.6], [-6.45, SF + 3.12, 0.38, 0.5], [-8.85, SF + 3.72, 0.6, 0.6], [-8.8, SF + 3.12, 0.4, 0.52], [-12.0, SF + 2.8, 0.38, 0.5]]
        .forEach(([z, y, w, h], i) => {
            const p = poster(images[i] ?? smallPoster(500 + i * 13), w, h, z, y, SX0, { frame: images[i] ? 0xe8e2da : null });
            if (POSTER_SPOTS[i]) registerClickable(p, POSTER_SPOTS[i]);
        });   // cadre blanc

    // plantes près de la fenêtre, sur la table, suspensions
    let ph = pot(-3.9, SZ1 + 0.6, 0.25, 0.45, 0x7a4a30, SF);
    bush(-3.9, ph, SZ1 + 0.6, 90, 0.6, 1.1);
    ph = pot(2.9, SZ1 + 0.7, 0.22, 0.4, 0xe0d8d0, SF);
    bush(2.9, ph, SZ1 + 0.7, 80, 0.5, 1.2);
    ph = pot(-1.6, SZ1 + 0.55, 0.18, 0.7, 0x3a3a3a, SF);
    bush(-1.6, ph, SZ1 + 0.55, 60, 0.45, 1.0);
    ph = pot(-0.3, -8.5, 0.07, 0.12, 0xd8d0c8, SF + 0.42);
    bush(-0.3, ph, -8.5, 18, 0.13, 1.3);
    for (const [x, z, len] of [[-3.6, SZ1 + 0.5, 2.2], [3.4, SZ1 + 0.5, 1.8], [-3.2, -4.5, 1.6], [SX1 - 0.2, -10.6, 2.4]]) {
        vine(x, SH - 0.3, z, len, Math.floor(x * 100 + z * 10));
        const hangingPot = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.16, 16), std(0xd8d0c8));
        hangingPot.position.set(x, SH - 0.38, z);
        scene.add(hangingPot);
    }
    for (let i = 0; i < 6; i++) {
        vine(SX0 + 0.3 * rand() + 0.05, SF + 2.84, rr(-9.2, -6.1), rr(0.6, 1.8), 700 + i);
        vine(SX1 - 0.05 - 0.3 * rand(), SF + 2.84, rr(-11.7, -10.3), rr(0.6, 1.8), 800 + i);
    }

    const windowGlow = dimLight(new THREE.PointLight(0xff8a78, 2.4, 12, 1.4));
    windowGlow.position.set(1.0, 2.0, SZ1 + 0.8);
    scene.add(windowGlow);
}

// Coin lecture face à la ville, coin musique sur le meuble TV, lumières indirectes.
// N'utilise pas le flux aléatoire global (appelé en dernier, ne décale rien).
function createCozyCorner() {
    // borne d'arcade dans le coin, contre le mur de gauche (clic : on vient y jouer)
    const arcade = createArcade(ARCADE_POS, Math.PI / 2);
    registerClickable(arcade.group, "arcade");
    // sa voisine : un casse-briques, caisse bleu nuit
    const arcade2 = createArcade(ARCADE2_POS, Math.PI / 2, { screen: createBreakoutScreen, marquee: ["衝撃", "BREAKER"], body: 0x161e34, edge: 0x7ae0ff });
    registerClickable(arcade2.group, "arcade2");

    // fauteuil tourné vers la baie, guéridon avec lampe, thé et livre laissé ouvert
    createArmchair(new THREE.Vector3(2.35, SF, -10.95), 0.35);
    createOpenBook(new THREE.Vector3(2.37, SF + 0.5, -11.0), 0.9, 0x4a5a50);
    const top = createSideTable(new THREE.Vector3(3.3, SF, -10.2));
    createTableLamp(new THREE.Vector3(3.36, top, -10.28), { intensity: 0.8 });
    createMug(new THREE.Vector3(3.2, top, -10.07), 0xd8c8b0, { rotationY: 1.2 });

    // lanterne en papier au pied de la baie
    createPaperLantern(new THREE.Vector3(-2.75, SF, -12.0), 0.2, 0.6);

    // platine, enceinte et pochettes sur / contre le meuble TV
    const turntable = createTurntable(new THREE.Vector3(SX1 - 0.27, SF + 0.55, -7.3), -Math.PI / 2);
    registerClickable(turntable, "turntable");   // clic : on s'installe devant pour choisir un disque (vinyl.js)
    createSpeaker(new THREE.Vector3(SX1 - 0.28, SF + 0.55, -7.72), -Math.PI / 2);
    const sleeves = createRecordSleeves(SX1 - 0.56, SF, -7.15);
    sleeves.forEach((sleeve, i) => registerClickable(sleeve, "sleeve" + i));   // une pochette = un disque (vinyl.js)

    // enceintes colonnes au sol, aux deux extrémités du meuble TV (côté bibliothèque, il ne reste que 20 cm)
    const speakers = [-10.085, -6.715].map((z) => createFloorSpeaker(new THREE.Vector3(SX1 - 0.14, SF, z), -Math.PI / 2));

    // lumière indirecte derrière le meuble TV
    addBox(SX1 - 0.02, SX1 - 0.005, SF + 0.5, SF + 0.53, -9.9, -6.9, lampGlow(0xffa060, 0.7), scene, false);
    const tvWash = dimLight(new THREE.PointLight(0xff9a58, 0.7, 2.8, 2));
    tvWash.position.set(SX1 - 0.2, SF + 0.75, -8.4);
    scene.add(tvWash);

    // réglette chaude sous une tablette de la bibliothèque
    addBox(SX0 + 0.3, SX0 + 0.34, SF + 2.185, SF + 2.2, -9.2, -6.1, lampGlow(0xffb070, 0.6), scene, false);
    // assez loin des livres pour une lumière diffuse (trop près, ils semblaient lumineux)
    const shelfGlow = dimLight(new THREE.PointLight(0xffa860, 0.4, 3.2, 1.6));
    shelfGlow.position.set(SX0 + 0.95, SF + 2.1, -7.65);
    scene.add(shelfGlow);

    return { arcade, arcade2, turntable, speakers, sleeves };
}

export function createSalon({ woodTex, rugTex }) {
    const salonWood = woodTex.clone();
    salonWood.needsUpdate = true;
    salonWood.repeat.set(2.6, 2.4);

    createShell(salonWood, rugTex);
    createSofa();
    createCoffeeTable();
    const tvScreen = createTvCorner();
    bookcase(SX0, SX0 + 0.38, -9.3, -6.0, true, { level: 2.2, from: -9.27, to: -8.58 });
    // figurines sur la tablette du haut, à droite (côté baie), tournées vers la pièce
    registerClickable(createFigurine(new THREE.Vector3(SX0 + 0.2, SF + 2.24, -9.12), Math.PI / 2, 1.1), "figurines");
    registerClickable(createLetterToy(new THREE.Vector3(SX0 + 0.2, SF + 2.24, -8.72), Math.PI / 2 - 0.2, 1.3), "figurines");
    const figurineHit = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 1.0), new THREE.MeshBasicMaterial({ visible: false }));   // plus avancée que celle de l'étage : elle est visée en premier
    figurineHit.position.set(SX0 + 0.2, SF + 2.5, -8.92);
    scene.add(figurineHit);
    registerClickable(figurineHit, "figurines");
    // toute la bibliothèque : vue d'ensemble avec ses étages, les figurines et les posters
    const topShelfHit = new THREE.Mesh(new THREE.BoxGeometry(0.38, 2.8, 3.3), new THREE.MeshBasicMaterial({ visible: false }));
    topShelfHit.position.set(SX0 + 0.19, SF + 1.4, -7.65);
    scene.add(topShelfHit);
    registerClickable(topShelfHit, "etage");
    bookcase(SX1 - 0.38, SX1, -11.8, -10.2, true);
    createArcLamp();
    createDecor();
    // la baie vitrée entière est cliquable : on s'en approche pour contempler la ville
    const windowHit = new THREE.Mesh(new THREE.PlaneGeometry(FWX1 - FWX0, FWY1 - FWY0), new THREE.MeshBasicMaterial({ visible: false }));
    windowHit.position.set((FWX0 + FWX1) / 2, (FWY0 + FWY1) / 2, SZ1 + 0.1);
    scene.add(windowHit);
    registerClickable(windowHit, "window");
    const corner = createCozyCorner();
    return { arcades: { arcade: corner.arcade, arcade2: corner.arcade2 }, turntable: corner.turntable, speakers: corner.speakers, sleeves: corner.sleeves, tv: tvScreen };
}
