import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { std } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";

// Arbre à chat (~1,4 m) : base moquettée avec une niche ronde, poteaux gainés de sisal, deux
// plateformes, un panier en haut où dort un chat européen tigré gris et noir, ventre blanc (il respire,
// une oreille tressaute de temps en temps), et un pompon qui se balance au bout d'une ficelle. Empreinte ~50 × 50 cm, niche tournée vers +z local.
// Aucun tirage aléatoire global.

function sisalTexture() {
    const t = canvasTexture(32, 64, (g, w, h) => {
        g.fillStyle = "#c9a977";
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 4) {
            g.fillStyle = "rgba(90,60,30,0.38)";
            g.fillRect(0, y, w, 1.4);
            g.fillStyle = "rgba(255,235,190,0.22)";
            g.fillRect(0, y + 2, w, 1);
        }
        for (let x = 0; x < w; x += 5) {
            g.fillStyle = "rgba(90,60,30,0.1)";
            g.fillRect(x, 0, 1, h);
        }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
}

export function createCatTree(position, rotationY = 0) {
    const tree = new THREE.Group();
    const carpet = std(0xb8a898, { roughness: 1 });
    const carpetDark = std(0x9a8a7a, { roughness: 1 });
    const sisalTex = sisalTexture();
    const add = (geo, mat, x, y, z, parent = tree) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    };
    const board = (w, h, d) => new RoundedBoxGeometry(w, h, d, 2, 0.012);
    const post = (x, z, y0, y1, r = 0.045) => {
        const tex = sisalTex.clone();
        tex.needsUpdate = true;
        tex.repeat.set(1, Math.max(1, Math.round((y1 - y0) * 9)));
        return add(new THREE.CylinderGeometry(r, r, y1 - y0, 20), std(0xffffff, { map: tex, roughness: 1 }), x, (y0 + y1) / 2, z);
    };

    // base moquettée + niche ronde (ouverture face à +z)
    add(board(0.5, 0.05, 0.5), carpetDark, 0, 0.025, 0);
    add(board(0.32, 0.34, 0.32), carpet, -0.07, 0.22, -0.06);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.085, 28), std(0x120d0b, { roughness: 1 }));
    hole.position.set(-0.07, 0.22, 0.1005);
    tree.add(hole);
    const rim = add(new THREE.TorusGeometry(0.088, 0.008, 8, 28), carpetDark, -0.07, 0.22, 0.102);
    rim.castShadow = false;

    // premier poteau et première plateforme (au-dessus de la niche)
    post(0.15, 0.15, 0.05, 0.43);
    add(board(0.46, 0.04, 0.46), carpet, 0, 0.43, 0);

    // deuxième poteau, deuxième plateforme
    post(-0.13, -0.11, 0.45, 0.9);
    add(board(0.4, 0.04, 0.4), carpet, -0.02, 0.92, -0.02);

    // troisième poteau et panier du haut (rebord arrondi, coussin clair)
    post(0.1, 0.1, 0.94, 1.32, 0.04);
    add(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 28), carpet, 0.02, 1.345, 0);
    const bedRim = add(new THREE.TorusGeometry(0.185, 0.035, 10, 32), carpetDark, 0.02, 1.39, 0, tree);
    bedRim.rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(0.165, 0.165, 0.03, 28), std(0xe8d8c8, { roughness: 1 }), 0.02, 1.38, 0);

    // pompon au bout d'une ficelle, accroché au bord de la deuxième plateforme
    const toy = new THREE.Group();
    toy.position.set(0.17, 0.9, 0.17);
    tree.add(toy);
    add(new THREE.CylinderGeometry(0.0025, 0.0025, 0.26, 4), std(0xd8d0c0), 0, -0.13, 0, toy);
    add(new THREE.SphereGeometry(0.032, 12, 10), std(0xe86a8a, { roughness: 1 }), 0, -0.28, 0, toy);

    // chat européen tigré gris et noir, ventre blanc, endormi sur le flanc dans le panier.
    // Repère du chat : long axe = x, tête vers +x, ventre et visage tournés vers +z (la pièce).
    const cat = new THREE.Group();
    cat.position.set(0.02, 1.395, 0);
    cat.rotation.y = 0.15;
    tree.add(cat);
    const gray = std(0x80838a, { roughness: 1 }), darkGray = std(0x55575e, { roughness: 1 });
    const black = std(0x16161a, { roughness: 1 }), white = std(0xf4f0ea, { roughness: 1 }), pink = std(0xe89098, { roughness: 1 });
    const blob = (r, mat, x, y, z, sx, sy, sz, parent = cat) => {
        const m = add(new THREE.SphereGeometry(r, 16, 12), mat, x, y, z, parent);
        m.scale.set(sx, sy, sz);
        m.castShadow = false;
        return m;
    };

    // corps gris, ventre blanc bombé côté pièce
    const BX = 0.15, BY = 0.08, BZ = 0.11, BC = 0.075;
    const body = blob(1, gray, 0, BC, 0, BX, BY, BZ);
    body.castShadow = true;
    const belly = blob(1, white, 0, BC - 0.012, 0.062, BX * 0.8, BY * 0.78, BZ * 0.58);
    // rayures noires en travers du dos (bandes de petites boules posées sur la surface)
    for (const x0 of [-0.105, -0.055, -0.005, 0.045, 0.095]) {
        const k = Math.sqrt(1 - (x0 / BX) ** 2);
        for (let i = 0; i < 6; i++) {
            const phi = 0.15 + i * 0.3;                               // du dessus vers l'arrière
            blob(1, black, x0, BC + BY * Math.cos(phi) * k * 1.01, -BZ * Math.sin(phi) * k * 1.01, 0.012, 0.013, 0.013);
        }
    }
    // hanche : une cuisse grise et une patte arrière blanche
    blob(1, gray, -0.1, 0.05, 0.085, 0.06, 0.045, 0.05);
    blob(1, white, -0.075, 0.025, 0.125, 0.035, 0.02, 0.025);

    // tête tournée vers la pièce, posée sur les pattes avant
    const head = new THREE.Group();
    head.position.set(0.105, 0.062, 0.09);
    head.rotation.y = 0.45;
    cat.add(head);
    blob(0.062, gray, 0, 0, 0, 1.08, 0.92, 0.98, head).castShadow = true;
    for (const x of [-0.016, 0, 0.016]) {                              // rayures du front
        const f = blob(1, black, x, 0.047, 0.03, 0.004, 0.015, 0.004, head);
        f.rotation.x = -0.9;
    }
    for (const s of [-1, 1]) {                                         // rayures des joues
        for (const dy of [-0.004, 0.012]) {
            const c = blob(1, black, s * 0.058, dy, 0.022, 0.003, 0.003, 0.02, head);
            c.rotation.y = s * 0.35;
        }
    }
    blob(1, white, 0, -0.02, 0.048, 0.034, 0.026, 0.026, head);        // museau blanc
    blob(1, white, 0, -0.04, 0.036, 0.018, 0.012, 0.016, head);        // menton
    blob(1, pink, 0, -0.004, 0.072, 0.008, 0.006, 0.006, head);        // truffe
    const ears = [];
    for (const s of [-1, 1]) {
        const earPivot = new THREE.Group();
        earPivot.position.set(s * 0.04, 0.052, 0.002);
        head.add(earPivot);
        const ear = add(new THREE.ConeGeometry(0.024, 0.045, 4), darkGray, 0, 0.018, 0, earPivot);
        ear.rotation.y = Math.PI / 4;
        ear.castShadow = false;
        const inner = add(new THREE.ConeGeometry(0.014, 0.03, 4), pink, 0, 0.014, 0.006, earPivot);
        inner.rotation.y = Math.PI / 4;
        inner.castShadow = false;
        earPivot.rotation.z = -s * 0.25;
        ears.push(earPivot);
        // œil fermé : petit arc tourné vers le bas
        const eye = add(new THREE.TorusGeometry(0.011, 0.0024, 4, 10, Math.PI), black, s * 0.026, 0.014, 0.057, head);
        eye.rotation.z = Math.PI;
        eye.castShadow = false;
        // moustaches
        for (const dy of [0, -0.008]) {
            const w = add(new THREE.CylinderGeometry(0.0008, 0.0008, 0.05, 3), white, s * 0.043, -0.016 + dy, 0.058, head);
            w.rotation.set(0, 0, Math.PI / 2 + s * (0.1 - dy * 8));
            w.castShadow = false;
        }
    }
    // pattes avant blanches sous le menton
    blob(1, white, 0.115, 0.02, 0.145, 0.03, 0.02, 0.022);
    blob(1, white, 0.16, 0.02, 0.118, 0.03, 0.02, 0.022);

    // queue annelée gris / noir qui épouse le corps de la croupe jusqu'aux pattes, bout noir
    const N = 14;
    for (let i = 0; i < N; i++) {
        const a = Math.PI + (i / (N - 1)) * (Math.PI + 1.0);
        const r = 0.025 - 0.008 * (i / (N - 1));
        blob(r, i % 3 === 2 || i === N - 1 ? black : gray, 0.17 * Math.cos(a), 0.03, 0.125 * Math.sin(a), 1, 1, 1).castShadow = false;
    }

    onFrame((dt, t) => {
        const breath = 1 + 0.045 * Math.sin(t * 1.9);
        body.scale.y = BY * breath;
        belly.scale.y = BY * 0.78 * breath;
        const twitch = Math.max(0, Math.sin(t * 0.55)) ** 40 * 0.3;   // une oreille tressaute de temps en temps
        ears[1].rotation.z = -0.25 - twitch;
        toy.rotation.z = Math.sin(t * 1.3) * 0.12;
        toy.rotation.x = Math.sin(t * 0.9 + 1) * 0.08;
    });

    tree.position.copy(position);
    tree.rotation.y = rotationY;
    scene.add(tree);
    return tree;
}
