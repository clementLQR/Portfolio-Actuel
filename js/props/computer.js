import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { std, glow } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";

// Tour PC moyen format : façade en grille perforée (vers +x), paroi vitrée fumée (vers +z)
// qui laisse voir les composants, lueur intérieure très discrète. Aucun tirage aléatoire.

function meshTexture() {
    return canvasTexture(128, 256, (g, w, h) => {
        g.fillStyle = "#3a3640";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#060508";
        for (let y = 6; y < h - 4; y += 6) {
            for (let x = (y / 6) % 2 ? 6 : 3; x < w - 3; x += 6) {
                g.beginPath(); g.arc(x, y, 1.6, 0, Math.PI * 2); g.fill();
            }
        }
    });
}

// x0..x1 : profondeur (façade en x1), z0..z1 : largeur (vitre en z1), y0 : dessus du bureau
export function createPcTower(x0, x1, y0, z0, z1, height = 0.46) {
    const g = new THREE.Group();
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.castShadow = true;
        m.receiveShadow = true;
        g.add(m);
        return m;
    };
    const box = (w, h, d, mat, x, y, z) => add(new THREE.BoxGeometry(w, h, d), mat, x, y, z);

    const D = x1 - x0, W = z1 - z0, H = height, foot = 0.015;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, yb = y0 + foot;
    const T = 0.008; // épaisseur des tôles

    const shell = std(0x34303a, { metalness: 0.35, roughness: 0.5 });
    const dark = std(0x0e0d11, { roughness: 0.6 });

    // pieds
    for (const fx of [x0 + 0.05, x1 - 0.05]) for (const fz of [z0 + 0.03, z1 - 0.03]) {
        box(0.04, foot, 0.02, dark, fx, y0 + foot / 2, fz);
    }

    // carcasse : fond, dessus, arrière, flanc plein
    box(D, T, W, shell, cx, yb + T / 2, cz);
    box(D, T, W, shell, cx, yb + H - T / 2, cz);
    box(T, H, W, shell, x0 + T / 2, yb + H / 2, cz);
    box(D, H, T, shell, cx, yb + H / 2, z0 + T / 2);

    // façade : cadre arrondi + grille perforée, bouton et voyant
    add(new RoundedBoxGeometry(0.02, H, W, 3, 0.006), shell, x1 - 0.01, yb + H / 2, cz);
    const grille = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.03, H - 0.06), std(0xffffff, { map: meshTexture(), roughness: 0.8 }));
    grille.position.set(x1 + 0.0005, yb + H / 2 - 0.015, cz);
    grille.rotation.y = Math.PI / 2;
    g.add(grille);
    add(new THREE.CylinderGeometry(0.008, 0.008, 0.004, 16), dark, x1 + 0.002, yb + H - 0.02, cz - 0.04, 0, 0, Math.PI / 2);
    add(new THREE.SphereGeometry(0.0025, 8, 6), glow(0xffc890, 0.8), x1 + 0.002, yb + H - 0.02, cz - 0.02);
    for (const dz of [0.02, 0.045]) box(0.003, 0.006, 0.014, dark, x1 + 0.001, yb + H - 0.02, cz + dz);

    // grille d'aération sur le dessus
    const vent = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.08, W - 0.05), std(0xffffff, { map: meshTexture(), roughness: 0.8 }));
    vent.rotation.x = -Math.PI / 2;
    vent.position.set(cx, yb + H + 0.0005, cz);
    g.add(vent);

    // --- intérieur, visible à travers la vitre ---
    const pcb = std(0x2c343a, { roughness: 0.7, emissive: 0x0c0a0e });
    const metal = std(0x6a6672, { metalness: 0.6, roughness: 0.35, emissive: 0x141016 });
    // carte mère contre le flanc plein
    box(D - 0.08, H - 0.12, 0.004, pcb, cx - 0.01, yb + H / 2 + 0.03, z0 + T + 0.004);
    // ventirad tour + ventilateur
    const cpuX = cx - 0.02, cpuY = yb + H - 0.13;
    box(0.11, 0.12, 0.06, metal, cpuX, cpuY, z0 + 0.045);
    add(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 24), dark, cpuX + 0.06, cpuY, z0 + 0.045, 0, 0, Math.PI / 2);
    // barrettes de mémoire
    for (const dx of [0.08, 0.095]) box(0.006, 0.09, 0.03, std(0x2a2830, { roughness: 0.5 }), cpuX + dx, cpuY, z0 + 0.03);
    for (const dx of [0.08, 0.095]) box(0.006, 0.004, 0.028, glow(0xc89070, 0.45), cpuX + dx, cpuY + 0.047, z0 + 0.03);
    // carte graphique horizontale
    const gpuY = yb + 0.17;
    box(D - 0.12, 0.05, 0.11, std(0x22202a, { metalness: 0.4, roughness: 0.45 }), cx - 0.03, gpuY, z0 + 0.07);
    for (const dx of [-0.08, 0.06]) {
        add(new THREE.CylinderGeometry(0.038, 0.038, 0.006, 24), dark, cx - 0.03 + dx, gpuY - 0.028, z0 + 0.07);
    }
    box(D - 0.18, 0.006, 0.003, glow(0xd0a080, 0.6), cx - 0.03, gpuY + 0.012, z0 + 0.127);
    // cache d'alimentation en bas
    box(D - 0.02, 0.09, W - 0.02, shell, cx, yb + T + 0.045, cz);
    // lueur intérieure très douce sous le dessus
    box(D - 0.06, 0.004, 0.01, glow(0xffb080, 0.9), cx, yb + H - T - 0.004, z1 - 0.03);
    box(0.004, H - 0.16, 0.01, glow(0xffb080, 0.55), x1 - 0.025, yb + H / 2 + 0.03, z1 - 0.03);

    // petite lumière chaude qui éclaire les composants (remplace celle des anciens ventilateurs)
    const inner = new THREE.PointLight(0xffb888, 0.35, 0.7, 2);
    inner.position.set(cx + 0.05, yb + H - 0.06, z1 - 0.05);
    g.add(inner);

    // vitre fumée
    const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(D - 0.02, H - 0.02),
        new THREE.MeshStandardMaterial({ color: 0x2a2430, transparent: true, opacity: 0.24, roughness: 0.08, metalness: 0.2, depthWrite: false })
    );
    glass.position.set(cx - 0.005, yb + H / 2, z1 - T / 2);
    g.add(glass);
    // liseré de la vitre
    box(D, 0.01, 0.006, shell, cx, yb + H - 0.005, z1 - 0.003);
    box(D, 0.01, 0.006, shell, cx, yb + 0.005, z1 - 0.003);

    scene.add(g);
    return g;
}
