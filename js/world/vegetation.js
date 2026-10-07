import * as THREE from "three";
import { shared } from "../core/scene.js";
import { std } from "../core/materials.js";
import { Batch } from "./kit.js";

// Végétation de la ville : arbres, buissons et murs végétaux.
// Comme foliage.js pour l'appartement, chaque module ajoute ses plantes puis
// buildVegetation() dessine tout en trois InstancedMesh (feuillage proche détaillé,
// feuillage lointain simplifié, troncs). Le feuillage se balance très légèrement.

const canopyNear = new THREE.IcosahedronGeometry(1, 1);
const canopyFar = new THREE.IcosahedronGeometry(1, 0);
const trunkGeo = new THREE.CylinderGeometry(0.05, 0.09, 1, 5).translate(0, 0.5, 0);

// au-delà de cette distance de la caméra, feuillage à 20 faces au lieu de 80
const LOD_DIST = 160;
const CAM_X = 0.5, CAM_Z = -8;

export const foliageMat = std(0xffffff, { flatShading: true, emissive: 0x112a1e, roughness: 0.85 });
foliageMat.onBeforeCompile = (s) => {
    s.uniforms.uTime = shared.uTime;
    s.vertexShader = "uniform float uTime;\n" + s.vertexShader.replace(
        "#include <begin_vertex>",
        /* glsl */`#include <begin_vertex>
        #ifdef USE_INSTANCING
            vec3 io = instanceMatrix[3].xyz;
            float sw = sin(uTime * 0.9 + io.x * 0.21 + io.z * 0.17) * 0.035 + sin(uTime * 2.1 + io.z * 0.5) * 0.012;
            transformed.xz += vec2(sw, sw * 0.6) * (position.y + 1.0);
        #endif`
    );
};
const trunkMat = std(0x2a2026, { roughness: 1 });

const near = new Batch();
const far = new Batch();
const trunks = new Batch();
const color = new THREE.Color();

// vert sombre à vert bleuté, cohérent avec la lumière du couchant
function leafColor(r) {
    return color.setHSL(0.31 + r() * 0.14, 0.3 + r() * 0.25, 0.13 + r() * 0.13);
}

function blob(x, y, z, sx, sy, sz, r) {
    const b = Math.hypot(x - CAM_X, z - CAM_Z) > LOD_DIST ? far : near;
    b.add(x, y, z, sx, sy, sz, r() * 6, leafColor(r), r() * 0.5, r() * 0.5);
}

// Arbre de hauteur size posé en (x, y, z) ; r : générateur aléatoire du module appelant
export function addTree(x, y, z, size, r) {
    const th = size * (0.35 + r() * 0.15);
    const cr = size * (0.22 + r() * 0.08);
    trunks.add(x, y, z, size * 0.55, th + cr * 0.4, size * 0.55);
    const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) {
        const s = cr * (0.55 + r() * 0.4);
        blob(x + (r() - 0.5) * cr * 1.3, y + th + cr * (0.3 + r() * 0.8), z + (r() - 0.5) * cr * 1.3, s, s * (0.75 + r() * 0.3), s, r);
    }
}

export function addBush(x, y, z, size, r) {
    const n = 1 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
        const s = size * (0.6 + r() * 0.5);
        blob(x + (r() - 0.5) * size, y + s * 0.4, z + (r() - 0.5) * size, s, s * 0.7, s, r);
    }
}

// Mur végétal sur une façade orientée vers +z (ou -z si dir = -1), de x0 à x1, y0 à y1
export function addGreenWall(x0, x1, y0, y1, z, r, dir = 1, density = 0.7) {
    for (let y = y0; y < y1; y += 1.3) {
        for (let x = x0; x < x1; x += 1.3) {
            if (r() > density) continue;
            const s = 0.8 + r() * 0.7;
            blob(x + r() * 0.6, y + r() * 0.6, z + dir * 0.25, s, s * 0.9, s * 0.35, r);
        }
    }
}

// Rideau de végétation qui retombe d'un balcon (lierre) : blobs étirés vers le bas
export function addHangingPlants(x0, x1, y, z, len, r, dir = 1) {
    for (let x = x0; x < x1; x += 0.9) {
        if (r() < 0.35) continue;
        const l = len * (0.3 + r() * 0.7);
        blob(x, y - l * 0.5, z + dir * 0.3, 0.45 + r() * 0.3, l * 0.5, 0.25, r);
    }
}

// Les arbres proches et les troncs n'apparaissent pas dans le reflet du fleuve (invisibles à cette distance)
export function buildVegetation() {
    for (const [batch, geo, reflect] of [[near, canopyNear, false], [far, canopyFar, true], [trunks, trunkGeo, false]]) {
        const mesh = batch.build(geo, batch === trunks ? trunkMat : foliageMat);
        if (!mesh) continue;
        mesh.frustumCulled = false;
        mesh.userData.noReflect = !reflect;
    }
}
