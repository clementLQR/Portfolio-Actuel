import * as THREE from "three";
import { scene } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { neonViolet } from "../core/materials.js";
import { GROUND_Y } from "../config/layout.js";
import { makeBuildingMaterial, STYLE } from "./buildingMaterial.js";
import { GEO, MergeKit, Batch, cityGlow, makeBlinkMaterial, metalMat, darkMetalMat } from "./kit.js";
import { holoMaterial, holoHalo } from "./holograms.js";
import { addTree, addBush } from "./vegetation.js";

// Tour toute proche, à droite de la vue : façade gauche vue en enfilade avec balcons
// filants et plantes, écran géant (portrait), terrasse arborée au pied de la vue,
// couronne lumineuse.

const X0 = 7, X1 = 33, Z0 = -56, Z1 = -28;   // emprise du fût principal
const TOP = 135;

// image du panneau publicitaire (assets/billboard-portrait.png), affichée avec l'effet d'écran
function loadBillboard() {
    const tex = new THREE.TextureLoader().load("assets/billboard-portrait.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
}

export function createNearTower() {
    const { r, rr } = seeded(3141);
    const kit = new MergeKit();
    const nearMat = makeBuildingMaterial(0x221c3a, STYLE.RESIDENTIAL, { lit: 0.5 });
    const crownMat = makeBuildingMaterial(0x1d1a34, STYLE.TOWER, { neon: 0xb060ff });

    // fût, retrait et couronne
    kit.box(nearMat, X0, X1, GROUND_Y, 70, Z0, Z1);
    kit.box(nearMat, X0 + 3, X1, 70, 112, Z0, Z1 - 2);
    kit.box(crownMat, X0 + 6, X1 - 2, 112, TOP, Z0 + 3, Z1 - 5);
    kit.box(cityGlow(0xb060ff, 2.2), X0 + 2.6, X1 + 0.4, 69.4, 70, Z0 - 0.4, Z1 - 1.6);
    kit.box(cityGlow(0xff4fb0, 2.2), X0 + 5.6, X1 - 1.6, 111.4, 112, Z0 + 2.6, Z1 - 4.6);

    // balcons filants sur la façade gauche (en enfilade depuis l'appartement)
    const rail = cityGlow(0xffa070, 1.1);
    for (let y = -16; y < 66; y += 3.2) {
        kit.box(metalMat, X0 - 1.8, X0, y, y + 0.28, Z0 + 0.5, Z1 - 0.5);
        kit.box(darkMetalMat, X0 - 1.85, X0 - 1.75, y + 0.28, y + 1.25, Z0 + 0.5, Z1 - 0.5);
        if (r() < 0.35) kit.box(rail, X0 - 1.88, X0 - 1.82, y + 1.2, y + 1.28, Z0 + 0.5, Z1 - 0.5);
        // jardinières et plantes sur certains balcons
        for (let z = Z1 - 1.5; z > Z0 + 1; z -= rr(2, 5)) {
            if (r() < 0.45) addBush(X0 - 0.9, y + 0.28, z, rr(0.5, 0.9), r);
        }
    }
    // retombées de lierre devant quelques balcons
    for (let i = 0; i < 14; i++) {
        const y = -16 + Math.floor(rr(1, 25)) * 3.2;
        const z = rr(Z0 + 2, Z1 - 2);
        const l = rr(1.5, 4.5);
        for (let k = 0; k < l; k += 0.6) addBush(X0 - 1.95, y - k, z + rr(-0.3, 0.3), rr(0.2, 0.35), r);
    }
    // bandes lumineuses sur l'arête avant gauche (reprend les tirets d'origine)
    for (let y = -20; y < 66; y += 7) {
        kit.box(neonViolet, X0 - 0.3, X0 + 0.3, y, y + 0.4, Z1 - 0.3, Z1 + 0.3);
    }
    kit.box(cityGlow(0x50d0ff, 1.6), X1 - 0.3, X1 + 0.3, -10, 68, Z1 - 0.3, Z1 + 0.3);

    // écran géant : cadre + portrait holographique
    kit.box(darkMetalMat, 7.6, 15.4, -1.15, 9.15, Z1 + 0.05, Z1 + 0.5);
    const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(7.4, 7.4 * 1447 / 1087),   // proportions de l'image (3:4)
        holoMaterial(loadBillboard(), { additive: false, opacity: 1, intensity: 0.85, lines: 60 })
    );
    // image retournée en miroir (gauche ↔ droite)
    const uv = screen.geometry.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
    screen.position.set(11.5, 4, Z1 + 0.55);
    scene.add(screen);
    const halo = holoHalo(20, 22, 0x9a70ff, 0.18);
    halo.position.set(11.5, 4, Z1 + 0.6);
    scene.add(halo);

    // climatiseurs et conduits sur la façade gauche
    for (let i = 0; i < 18; i++) {
        const y = rr(-14, 64), z = rr(Z0 + 2, Z1 - 2);
        kit.box(darkMetalMat, X0 - 0.9, X0, y + 1.3, y + 2.1, z, z + 1.1);
    }
    kit.box(darkMetalMat, X0 - 0.7, X0, -20, 66, Z1 - 3.2, Z1 - 2.6);

    // terrasse arborée au pied de la vue (les cimes dépassent de l'appui de la baie)
    kit.box(nearMat, -1, 13, GROUND_Y, -6.5, -32, -21);
    kit.box(darkMetalMat, -1.1, 13, -6.5, -5.4, -21.1, -20.95);
    kit.box(cityGlow(0xffa070, 1.4), -1.1, 13, -5.45, -5.35, -21.15, -20.9);
    for (let i = 0; i < 8; i++) {
        addTree(rr(0, 12), -6.5, rr(-31, -23), rr(3.5, 6), r);
    }
    for (let i = 0; i < 10; i++) addBush(rr(0, 12.5), -6.5, rr(-31.5, -21.5), rr(0.8, 1.6), r);
    for (const x of [1.5, 11]) {
        kit.box(darkMetalMat, x - 0.08, x + 0.08, -6.5, -2.4, -21.6, -21.4);
        kit.add(GEO.sphere, cityGlow(0xffc080, 2.0), x, -2.3, -21.5, 0.22, 0.22, 0.22);
    }

    // antenne
    kit.add(GEO.mast, darkMetalMat, 20, TOP, -40, 1.4, 22, 1.4);
    const beacon = new Batch().add(20, TOP + 23, -40, 1.2, 1.2, 1.2);
    beacon.build(GEO.light, makeBlinkMaterial(0xff3030, 0.42, 0.3));

    kit.build();
}
