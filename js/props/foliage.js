import * as THREE from "three";
import { scene } from "../core/scene.js";
import { mulberry32, rand } from "../core/random.js";
import { dummy } from "../core/helpers.js";
import { std } from "../core/materials.js";

// Toutes les feuilles de l'appartement sont collectées ici puis dessinées
// en une seule InstancedMesh par buildLeaves() (une fois les pièces construites).

const leafShape = new THREE.Shape();
leafShape.moveTo(0, 0);
leafShape.quadraticCurveTo(0.5, 0.35, 0, 1);
leafShape.quadraticCurveTo(-0.5, 0.35, 0, 0);
const leafGeo = new THREE.ShapeGeometry(leafShape, 4);

const leafMatrices = [];
const leafColors = [];
const tmpColor = new THREE.Color();

// rng : générateur à utiliser (par défaut le flux global, voir README « Ordre de construction »)
export function addLeaf(x, y, z, s, rx, ry, rz, rng = rand) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    leafMatrices.push(dummy.matrix.clone());
    const r2 = (a, b) => a + (b - a) * rng();
    tmpColor.setHSL(r2(0.24, 0.32), r2(0.35, 0.55), r2(0.14, 0.26));
    leafColors.push(tmpColor.clone());
}

// Lierre qui retombe depuis (x0, y0, z0) sur une longueur len
export function vine(x0, y0, z0, len, seed) {
    const r = mulberry32(seed);
    for (let t = 0; t < len; t += 0.035) {
        const x = x0 + Math.sin(t * 6 + seed) * 0.05;
        const z = z0 + Math.cos(t * 4 + seed) * 0.05;
        addLeaf(x, y0 - t, z, 0.06 + r() * 0.05, r() * 6, r() * 6, r() * 6);
        if (r() < 0.4) addLeaf(x + (r() - 0.5) * 0.1, y0 - t, z + (r() - 0.5) * 0.1, 0.05 + r() * 0.04, r() * 6, r() * 6, r() * 6);
    }
}

// Touffe de feuilles qui rayonnent depuis un point (plante en pot)
export function bush(x, y, z, n, size, spread = 1.1, rng = rand) {
    const rr = (a, b) => a + (b - a) * rng();
    for (let i = 0; i < n; i++) {
        const ry = rng() * Math.PI * 2;
        const tilt = rr(0.15, spread);
        addLeaf(x, y, z, size * rr(0.6, 1.1), 0, ry, 0, rng);
        const m = leafMatrices[leafMatrices.length - 1];
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.quaternion.setFromEuler(new THREE.Euler(tilt, ry, rr(-0.3, 0.3), "YXZ"));
        const s = size * rr(0.6, 1.1);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        m.copy(dummy.matrix);
    }
}

// Pot posé à la hauteur y0 ; renvoie la hauteur du dessus du pot
export function pot(x, z, r, h, color = 0xe8e2dc, y0 = 0) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.8, h, 20), std(color, { roughness: 0.5 }));
    m.position.set(x, y0 + h / 2, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return y0 + h;
}

export function buildLeaves() {
    const leaves = new THREE.InstancedMesh(
        leafGeo,
        new THREE.MeshStandardMaterial({ roughness: 0.7, side: THREE.DoubleSide }),
        leafMatrices.length
    );
    leafMatrices.forEach((m, i) => {
        leaves.setMatrixAt(i, m);
        leaves.setColorAt(i, leafColors[i]);
    });
    leaves.castShadow = true;
    leaves.receiveShadow = true;
    scene.add(leaves);
}
