import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { scene, shared } from "../core/scene.js";
import { unitBox } from "../core/helpers.js";
import { std } from "../core/materials.js";

// Boîte à outils du décor : géométries de bâtiments partagées, fusion de pièces statiques
// (un seul mesh par matériau), lots d'instances, trajectoires échantillonnées, rubans.

// objet de travail propre au décor (rotation en lacet d'abord)
export const dummy = new THREE.Object3D();
dummy.rotation.order = "YXZ";

// --- géométries unitaires (emprise 1 × 1, hauteur 1, base en y = 0) ----------

function clean(g) {
    g = g.index ? g.toNonIndexed() : g;
    for (const k of Object.keys(g.attributes)) {
        if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    }
    return g;
}

// prisme à faces planes, faces alignées sur les axes, largeur 1 entre faces opposées
function prism(sides, topScale = 1) {
    const r = 0.5 / Math.cos(Math.PI / sides);
    const g = new THREE.CylinderGeometry(r * topScale, r, 1, sides, 1)
        .rotateY(Math.PI / sides)
        .translate(0, 0.5, 0)
        .toNonIndexed();
    g.computeVertexNormals();
    return g;
}

function boxAt(w, h, d, x, y, z) {
    return clean(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z));
}

export const GEO = {
    box: unitBox,
    oct: prism(8),
    hex: prism(6),
    taper: prism(4, 0.62),
    // trois gradins
    setback: mergeGeometries([
        boxAt(1, 0.58, 1, 0, 0, 0),
        boxAt(0.8, 0.27, 0.8, 0, 0.58, 0),
        boxAt(0.56, 0.15, 0.56, 0, 0.85, 0)
    ]),
    // socle commercial + tour en retrait
    podium: mergeGeometries([
        boxAt(1, 0.18, 1, 0, 0, 0),
        boxAt(0.55, 0.82, 0.55, -0.15, 0.18, -0.15)
    ]),
    // deux lames reliées par des passerelles
    twin: mergeGeometries([
        boxAt(0.4, 1, 0.8, -0.3, 0, 0),
        boxAt(0.4, 0.86, 0.8, 0.3, 0, 0),
        boxAt(0.25, 0.04, 0.3, 0, 0.45, 0),
        boxAt(0.25, 0.04, 0.3, 0, 0.7, 0)
    ]),
    mast: new THREE.CylinderGeometry(0.12, 0.35, 1, 5).translate(0, 0.5, 0),
    light: new THREE.OctahedronGeometry(0.5, 0),
    ring: new THREE.TorusGeometry(1, 0.03, 6, 48).rotateX(Math.PI / 2),
    disc: new THREE.CylinderGeometry(1, 1, 1, 32).translate(0, -0.5, 0),
    cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 16).translate(0, 0.5, 0),
    sphere: new THREE.SphereGeometry(1, 16, 10)
};

// --- matériaux de la ville ----------------------------------------------------

export const metalMat = std(0x2a2638, { roughness: 0.45, metalness: 0.6 });
export const darkMetalMat = std(0x16131f, { roughness: 0.5, metalness: 0.7 });
export const concreteMat = std(0x3a3044, { roughness: 0.9 });

// Lumière de la ville : contrairement à glow(), elle se fond dans la brume au loin.
// Avec une couleur blanche, la couleur vient des instances (valeurs > 1 → bloom).
// Un seul matériau par couple (couleur, intensité) : moins de draw calls après fusion.
const glowCache = new Map();
export function cityGlow(color = 0xffffff, intensity = 1) {
    const key = color + ":" + intensity;
    if (!glowCache.has(key)) {
        const m = new THREE.MeshBasicMaterial({ color, fog: true });
        m.color.multiplyScalar(intensity);
        glowCache.set(key, m);
    }
    return glowCache.get(key);
}
export const instGlow = cityGlow();

// Feux clignotants (balises, feux de navigation) : chaque instance a sa propre phase
export function makeBlinkMaterial(color, rate = 0.5, duty = 0.2) {
    const m = cityGlow(color, 1);
    m.onBeforeCompile = (s) => {
        s.uniforms.uTime = shared.uTime;
        s.uniforms.uRate = { value: rate };
        s.uniforms.uDuty = { value: duty };
        s.vertexShader = "uniform float uTime, uRate, uDuty;\n" + s.vertexShader.replace(
            "#include <begin_vertex>",
            /* glsl */`#include <begin_vertex>
            #ifdef USE_INSTANCING
                vec3 bo = instanceMatrix[3].xyz;
            #else
                vec3 bo = modelMatrix[3].xyz;
            #endif
            float bph = fract(sin(dot(bo.xz, vec2(12.99, 78.23))) * 43758.5);
            transformed *= mix(0.2, 1.0, step(1.0 - uDuty, fract(uTime * uRate + bph)));`
        );
    };
    return m;
}

// --- lots d'instances ---------------------------------------------------------

const tmpColor = new THREE.Color();

export class Batch {
    constructor() {
        this.matrices = [];
        this.colors = [];
    }

    // position, échelle, rotation (y puis x, z), couleur facultative (hex ou Color, peut dépasser 1)
    add(x, y, z, sx, sy, sz, ry = 0, color = null, rx = 0, rz = 0) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        this.matrices.push(dummy.matrix.clone());
        if (color !== null) this.colors.push(color.isColor ? color.clone() : tmpColor.set(color).clone());
        return this;
    }

    addMatrix(m, color = null) {
        this.matrices.push(m.clone());
        if (color !== null) this.colors.push(color.clone());
    }

    get count() {
        return this.matrices.length;
    }

    build(geo, mat, parent = scene) {
        if (!this.matrices.length) return null;
        const mesh = new THREE.InstancedMesh(geo, mat, this.matrices.length);
        this.matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
        if (this.colors.length === this.matrices.length) {
            this.colors.forEach((c, i) => mesh.setColorAt(i, c));
        }
        mesh.computeBoundingSphere();
        parent.add(mesh);
        return mesh;
    }
}

// --- fusion de pièces statiques -----------------------------------------------
// Les pièces sont regroupées par matériau puis fusionnées : une tour entière = quelques draw calls.

export class MergeKit {
    constructor() {
        this.parts = new Map();
    }

    addMatrix(geo, mat, matrix) {
        const g = clean(geo.clone());
        g.applyMatrix4(matrix);
        if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
        if (!this.parts.has(mat)) this.parts.set(mat, []);
        this.parts.get(mat).push(g);
        return this;
    }

    add(geo, mat, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, rx = 0, rz = 0) {
        dummy.position.set(x, y, z);
        dummy.rotation.set(rx, ry, rz);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        return this.addMatrix(geo, mat, dummy.matrix);
    }

    // boîte définie par ses bornes, comme addBox()
    box(mat, x0, x1, y0, y1, z0, z1) {
        return this.add(unitBox, mat, (x0 + x1) / 2, y0, (z0 + z1) / 2, x1 - x0, y1 - y0, z1 - z0);
    }

    build(parent = scene) {
        const meshes = [];
        for (const [mat, list] of this.parts) {
            const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
            parent.add(mesh);
            meshes.push(mesh);
        }
        return meshes;
    }
}

// --- trajectoires -------------------------------------------------------------
// Points régulièrement espacés : position et direction le long d'une courbe en O(1).

export class PathSampler {
    constructor(curve, n = 400) {
        this.pts = curve.getSpacedPoints(n);
        this.n = n;
        this.length = curve.getLength();
    }

    at(t, out) {
        t = THREE.MathUtils.clamp(t, 0, 0.99999);
        const f = t * this.n, i = Math.floor(f);
        return out.lerpVectors(this.pts[i], this.pts[i + 1], f - i);
    }

    tangent(t, out) {
        t = THREE.MathUtils.clamp(t, 0, 0.99999);
        const i = Math.floor(t * this.n);
        return out.subVectors(this.pts[i + 1], this.pts[i]).normalize();
    }
}

// --- ruban à section rectangulaire le long d'une courbe (tabliers, voies) -------

const UP = new THREE.Vector3(0, 1, 0);

export function ribbonGeometry(curve, width, thickness, segments = 200, offset = 0) {
    const pts = curve.getSpacedPoints(segments);
    const pos = [];
    const uv = [];
    const t = new THREE.Vector3(), s = new THREE.Vector3(), up = new THREE.Vector3();
    const ring = pts.map((p, i) => {
        const a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, segments)];
        t.subVectors(b, a).normalize();
        s.crossVectors(t, UP).normalize();
        up.crossVectors(s, t).normalize();
        const tl = p.clone().addScaledVector(s, offset - width / 2);
        const tr = p.clone().addScaledVector(s, offset + width / 2);
        return { tl, tr, bl: tl.clone().addScaledVector(up, -thickness), br: tr.clone().addScaledVector(up, -thickness) };
    });
    const quad = (A, B, C, D, u0, u1) => {
        pos.push(...A.toArray(), ...B.toArray(), ...C.toArray(), ...A.toArray(), ...C.toArray(), ...D.toArray());
        uv.push(u0, 0, u0, 1, u1, 1, u0, 0, u1, 1, u1, 0);
    };
    for (let i = 0; i < segments; i++) {
        const a = ring[i], b = ring[i + 1];
        const u0 = i / segments, u1 = (i + 1) / segments;
        quad(a.tl, a.tr, b.tr, b.tl, u0, u1);   // dessus
        quad(a.bl, b.bl, b.br, a.br, u0, u1);   // dessous
        quad(a.tr, a.br, b.br, b.tr, u0, u1);   // côté droit
        quad(a.tl, b.tl, b.bl, a.bl, u0, u1);   // côté gauche
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
}

// Câble qui pend entre deux points (chaînette approchée par une parabole)
export function cableCurve(a, b, sag) {
    const pts = [];
    for (let i = 0; i <= 16; i++) {
        const f = i / 16;
        const p = new THREE.Vector3().lerpVectors(a, b, f);
        p.y -= sag * 4 * f * (1 - f);
        pts.push(p);
    }
    return new THREE.CatmullRomCurve3(pts);
}
