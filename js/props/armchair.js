import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { std } from "../core/materials.js";

// Fauteuil cabriolet : dossier et accoudoirs d'un seul tenant (arc arrondi), socle et coussin
// d'assise épousant la même forme, pieds fuselés en bois, coussin et plaid plié sur l'accoudoir.
// Avant = -z local (le fauteuil « regarde » vers -z).

const R = 0.42;     // rayon extérieur du dossier
const W = 0.13;     // épaisseur du dossier / des accoudoirs (hors arrondi)
const ARM = 0.2;    // longueur des accoudoirs devant le centre
const BEVEL = 0.045;

// Forme vue de dessus (x, y du tracé = x, z du fauteuil) : un « U » ouvert vers l'avant
function shellShape() {
    const r = R - W;
    const s = new THREE.Shape();
    s.moveTo(R, -ARM);
    s.lineTo(R, 0);
    s.absarc(0, 0, R, 0, Math.PI, false);
    s.lineTo(-R, -ARM);
    s.lineTo(-r, -ARM);
    s.lineTo(-r, 0);
    s.absarc(0, 0, r, Math.PI, 0, true);
    s.lineTo(r, -ARM);
    s.closePath();
    return s;
}

// Forme pleine en « D » (socle, coussin d'assise)
function seatShape(radius, front) {
    const s = new THREE.Shape();
    s.moveTo(radius, -front);
    s.lineTo(radius, 0);
    s.absarc(0, 0, radius, 0, Math.PI, false);
    s.lineTo(-radius, -front);
    s.closePath();
    return s;
}

// Extrusion verticale arrondie, de y0 à y1 (forme tracée dans le plan xz)
function slab(shape, y0, y1, bevel = BEVEL) {
    const depth = Math.max(y1 - y0 - bevel * 2, 0.01);
    const g = new THREE.ExtrudeGeometry(shape, {
        depth, curveSegments: 40,
        bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 5
    });
    // tracé (x, y) → plan (x, z) ; extrusion vers le bas puis remise à hauteur
    g.rotateX(Math.PI / 2);
    g.translate(0, y1 - bevel, 0);
    g.computeVertexNormals();
    return g;
}

export function createArmchair(position, rotationY, { fabric = 0x8a5250, plaid = 0xc8a888 } = {}) {
    const g = new THREE.Group();
    const fab = std(fabric, { roughness: 1 });
    const fabLight = std(new THREE.Color(fabric).lerp(new THREE.Color(0xd8b8a0), 0.18), { roughness: 1 });
    const wood = std(0x4a2c20, { roughness: 0.55 });
    const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
        return m;
    };

    // socle, dossier-accoudoirs, coussin d'assise
    add(slab(seatShape(R, ARM), 0.16, 0.38), fab);
    add(slab(shellShape(), 0.36, 0.78), fab);
    add(slab(seatShape(R - W - 0.03, ARM + 0.02), 0.37, 0.5, 0.05), fabLight);

    // pieds fuselés légèrement écartés
    for (const [x, z] of [[-0.3, -0.12], [0.3, -0.12], [-0.27, 0.27], [0.27, 0.27]]) {
        const leg = add(new THREE.CylinderGeometry(0.022, 0.014, 0.18, 10), wood, x * 1.05, 0.085, z * 1.05);
        leg.rotation.set(z > 0 ? 0.12 : -0.12, 0, x > 0 ? -0.1 : 0.1);
    }

    // coussin appuyé contre le dossier
    add(new RoundedBoxGeometry(0.34, 0.26, 0.11, 4, 0.05), std(0xd8c0a0, { roughness: 1 }), 0.04, 0.6, 0.1, -0.28, 0.12, 0.05);

    // plaid plié sur l'accoudoir droit : dessus + rabat qui retombe à l'extérieur
    const plaidMat = std(plaid, { roughness: 1 });
    const ax = R - W / 2;
    add(new RoundedBoxGeometry(W + 0.14, 0.03, 0.4, 3, 0.012), plaidMat, ax, 0.795, -0.06);
    add(new RoundedBoxGeometry(0.03, 0.34, 0.4, 3, 0.012), plaidMat, ax + W / 2 + 0.075, 0.64, -0.06, 0, 0, -0.06);
    // liseré bordeaux du plaid
    add(new RoundedBoxGeometry(0.032, 0.035, 0.405, 2, 0.01), std(0x7a2e3a, { roughness: 1 }), ax + W / 2 + 0.083, 0.48, -0.06, 0, 0, -0.06);

    g.position.copy(position);
    g.rotation.y = rotationY;
    scene.add(g);
    return g;
}
