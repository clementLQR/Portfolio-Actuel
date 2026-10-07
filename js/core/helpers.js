import * as THREE from "three";
import { scene } from "./scene.js";

// Objet réutilisé pour composer les matrices des instances
export const dummy = new THREE.Object3D();

// Cube unitaire posé au sol (origine en bas), utilisé pour tous les immeubles
export const unitBox = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);

// Boîte définie par ses bornes (x0..x1, y0..y1, z0..z1)
export function addBox(x0, x1, y0, y1, z0, z1, mat, parent = scene, shadows = true) {
    const m = new THREE.Mesh(
        new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0),
        mat
    );
    m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
}

export function canvasTexture(w, h, draw) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}

// Tissu posé sur un volume (couette, plaid) : dessus ondulé, bords qui retombent.
// sidesOnly : ne retombe que sur les deux côtés longs (axe z).
export function makeDrape(hx, hz, top, drop, seg, amp, sidesOnly = false) {
    const segZ = Math.round(seg * (hz + drop) / (hx + drop));
    const g = new THREE.PlaneGeometry((hx + drop) * 2, (hz + drop) * 2, seg, segZ);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    const r = 0.1;
    for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const cx = sidesOnly ? x : THREE.MathUtils.clamp(x, -hx, hx);
        const cz = THREE.MathUtils.clamp(z, -hz, hz);
        const ox = x - cx, oz = z - cz;
        const o = Math.hypot(ox, oz);
        let y = top
            + amp * (Math.sin(cx * 5.3 + cz * 2.1) * 0.5
                + Math.sin(cz * 7.7 - cx * 3.1) * 0.35
                + Math.sin(cx * 13.0 + cz * 11.0) * 0.15);
        let nx = x, nz = z;
        if (o > 0) {
            const ux = ox / o, uz = oz / o;
            let out, dy;
            if (o < r * Math.PI / 2) {
                const a = o / r;
                out = r * Math.sin(a);
                dy = r * (1 - Math.cos(a));
            } else {
                out = r + (o - r * Math.PI / 2) * 0.06;
                dy = r + (o - r * Math.PI / 2);
            }
            const wave = Math.sin((cx + cz) * 9) * 0.025 * Math.min(o / drop, 1);
            nx = cx + ux * (out + wave);
            nz = cz + uz * (out + wave);
            y -= dy;
        }
        p.setXYZ(i, nx, y, nz);
    }
    g.computeVertexNormals();
    return g;
}
