import * as THREE from "three";
import { scene } from "../core/scene.js";
import { std } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";

// Figurine d'ange en vinyle laqué, debout sur un socle rond en bois sombre : grosse tête crème au
// masque blanc souriant (yeux plissés de joie), fine auréole dorée flottante, grandes ailes à plumes
// de chaque côté, robe-tunique bordeaux à liseré doré avec son emblème, bras ouverts.
// Hauteur ~29 cm avec le socle et l'auréole. Regarde vers +z local. Aucun tirage aléatoire.

const CREAM = 0xf3dfa6, FEATHER = 0xf8ebc8, GOLD = 0xe8b43a, BORDEAUX = 0x7a2236, WOOD = 0x3b1d10;

function faceTexture() {
    return canvasTexture(256, 256, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        // grand masque blanc ovale
        g.fillStyle = "#fffaf0";
        g.beginPath();
        g.ellipse(w / 2, h / 2, w * 0.47, h * 0.46, 0, 0, Math.PI * 2);
        g.fill();
        // yeux plissés de joie
        g.strokeStyle = "#1c1214";
        g.lineWidth = 15;
        g.lineCap = "round";
        for (const x of [0.3, 0.7]) {
            g.beginPath();
            g.arc(w * x, h * 0.4, w * 0.085, Math.PI * 1.12, Math.PI * 1.88);
            g.stroke();
        }
        // grand sourire
        g.fillStyle = "#1c1214";
        g.beginPath();
        g.moveTo(w * 0.22, h * 0.56);
        g.quadraticCurveTo(w * 0.5, h * 0.62, w * 0.78, h * 0.56);
        g.quadraticCurveTo(w * 0.72, h * 0.88, w * 0.5, h * 0.88);
        g.quadraticCurveTo(w * 0.28, h * 0.88, w * 0.22, h * 0.56);
        g.fill();
    });
}

function emblemTexture() {
    return canvasTexture(64, 64, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.fillStyle = "#e8b040";
        g.beginPath();
        g.moveTo(w * 0.15, h * 0.2);
        g.lineTo(w * 0.85, h * 0.2);
        g.quadraticCurveTo(w * 0.85, h * 0.85, w * 0.5, h * 0.9);
        g.quadraticCurveTo(w * 0.15, h * 0.85, w * 0.15, h * 0.2);
        g.fill();
        g.fillStyle = "#7a2a34";
        for (const x of [0.36, 0.64]) { g.beginPath(); g.arc(w * x, h * 0.42, 4, 0, Math.PI * 2); g.fill(); }
    });
}

// Aile d'ange (côté droit, racine en 0,0) : arche arrondie en haut, rangée de plumes aux bouts arrondis
// le long du bord de fuite. k réduit la forme autour de la racine (rangées de plumes superposées).
function wingShape(k = 1) {
    const sh = new THREE.Shape();
    const P = (x, y) => [x * k, y * k];
    sh.moveTo(0, 0);
    sh.bezierCurveTo(...P(0.004, 0.06), ...P(0.04, 0.108), ...P(0.078, 0.1));
    sh.bezierCurveTo(...P(0.1, 0.095), ...P(0.114, 0.072), ...P(0.114, 0.054));
    // bouts de plumes, du haut vers la racine : chaque plume est un arrondi qui bombe vers l'extérieur
    const tips = [[0.114, 0.054], [0.108, 0.031], [0.093, 0.012], [0.071, -0.004], [0.044, -0.013], [0.016, -0.014]];
    for (let i = 1; i < tips.length; i++) {
        const [x0, y0] = tips[i - 1], [x1, y1] = tips[i];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        // le bombé pointe à l'opposé du centre de l'aile (≈ 0.05, 0.04)
        const dx = mx - 0.05, dy = my - 0.04, d = Math.hypot(dx, dy) || 1;
        sh.quadraticCurveTo(...P(mx + (dx / d) * 0.016, my + (dy / d) * 0.016), ...P(x1, y1));
    }
    sh.lineTo(0, 0);
    return sh;
}

function wingGeometry(k = 1) {
    return new THREE.ExtrudeGeometry(wingShape(k), { depth: 0.004, bevelEnabled: true, bevelThickness: 0.0025, bevelSize: 0.0022, bevelSegments: 3, curveSegments: 14 });
}

export function createFigurine(position, rotationY = 0, scale = 1) {
    const g = new THREE.Group();
    const lacquer = (c, extra = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.35, ...extra });
    const cream = lacquer(CREAM), feather = lacquer(FEATHER, { roughness: 0.55 }), dress = lacquer(BORDEAUX);
    const gold = std(GOLD, { roughness: 0.3, metalness: 0.45 });
    const wood = lacquer(WOOD, { roughness: 0.28, clearcoat: 0.6 });
    let target = g;
    const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, parent = target) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.set(rx, ry, rz);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    };
    // capsule entre deux points (jambes, bras, doigts)
    const UP = new THREE.Vector3(0, 1, 0);
    const limb = (a, b, r, mat) => {
        const dir = b.clone().sub(a), len = dir.length();
        const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - 2 * r, 0.001), 6, 12), mat);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(UP, dir.normalize());
        m.castShadow = m.receiveShadow = true;
        target.add(m);
        return m;
    };

    // socle rond en deux paliers, bois sombre verni
    const base = new THREE.LatheGeometry([
        new THREE.Vector2(0.001, 0), new THREE.Vector2(0.088, 0), new THREE.Vector2(0.092, 0.004), new THREE.Vector2(0.092, 0.015),
        new THREE.Vector2(0.086, 0.021), new THREE.Vector2(0.072, 0.023), new THREE.Vector2(0.07, 0.027), new THREE.Vector2(0.068, 0.034),
        new THREE.Vector2(0.001, 0.036)
    ], 64);
    add(base, wood, 0, 0, 0);
    add(new THREE.TorusGeometry(0.0715, 0.0025, 8, 64), lacquer(0x6a4630, { roughness: 0.3 }), 0, 0.0245, 0, Math.PI / 2);

    // tout le corps (jambes, tunique, bras) est agrandi de 20 % autour du dessus du socle
    const BODY = 1.2, baseTop = 0.036;
    const body = new THREE.Group();
    body.scale.setScalar(BODY);
    body.position.y = baseTop * (1 - BODY);
    g.add(body);
    target = body;

    // jambes courtes et petits pieds
    for (const s of [-1, 1]) {
        limb(new THREE.Vector3(s * 0.012, baseTop + 0.008, 0), new THREE.Vector3(s * 0.012, 0.072, 0), 0.0085, cream);
        add(new THREE.SphereGeometry(0.011, 16, 12), cream, s * 0.013, baseTop + 0.006, 0.005).scale.set(1, 0.6, 1.5);
    }

    // robe-tunique évasée, liseré doré épais en bas, col doré
    const robe = new THREE.LatheGeometry([
        new THREE.Vector2(0.001, 0.064), new THREE.Vector2(0.0405, 0.065), new THREE.Vector2(0.041, 0.075), new THREE.Vector2(0.0375, 0.1),
        new THREE.Vector2(0.035, 0.12), new THREE.Vector2(0.0335, 0.136), new THREE.Vector2(0.023, 0.147), new THREE.Vector2(0.001, 0.15)
    ], 40);
    add(robe, dress, 0, 0, 0);
    add(new THREE.CylinderGeometry(0.0425, 0.0435, 0.012, 44, 1, true), gold, 0, 0.07, 0);
    add(new THREE.TorusGeometry(0.0425, 0.0025, 8, 44), gold, 0, 0.0765, 0, Math.PI / 2);
    add(new THREE.TorusGeometry(0.0225, 0.0035, 8, 32), gold, 0, 0.1465, 0, Math.PI / 2);

    // emblème (masque doré) sur la poitrine
    const emblem = new THREE.Mesh(new THREE.PlaneGeometry(0.022, 0.022), new THREE.MeshStandardMaterial({ map: emblemTexture(), transparent: true, roughness: 0.4 }));
    emblem.position.set(0, 0.125, 0.0365);
    emblem.rotation.x = -0.08;
    target.add(emblem);

    // bras ouverts : manche courte à poignet doré, avant-bras crème, main à trois doigts
    for (const s of [-1, 1]) {
        const shoulder = new THREE.Vector3(s * 0.036, 0.132, 0), hand = new THREE.Vector3(s * 0.084, 0.119, 0.012);
        const cuffAt = shoulder.clone().lerp(hand, 0.5), dir = hand.clone().sub(shoulder).normalize();
        limb(shoulder, cuffAt, 0.0125, dress);
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.0125, 0.004, 8, 22), gold);
        cuff.position.copy(cuffAt);
        cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
        target.add(cuff);
        limb(cuffAt, hand, 0.0105, cream);
        const palm = add(new THREE.SphereGeometry(0.011, 16, 12), cream, hand.x + s * 0.004, hand.y, hand.z);
        palm.scale.set(1, 1.15, 0.65);
        // doigts écartés vers le bas / l'extérieur
        [[-0.2, 0.011], [-0.7, 0.012], [-1.2, 0.009]].forEach(([a, len]) => {
            const f0 = new THREE.Vector3(hand.x + s * 0.006, hand.y - 0.004, hand.z);
            const f1 = new THREE.Vector3(f0.x + s * Math.cos(a) * len * 0.6 + s * 0.004, f0.y + Math.sin(a) * len, f0.z);
            limb(f0, f1, 0.0042, cream);
        });
    }

    target = g;

    // grosse tête crème et masque blanc souriant
    const R = 0.058;
    add(new THREE.SphereGeometry(R, 44, 30), cream, 0, 0.225, 0).scale.set(1.0, 1.04, 0.97);
    const face = new THREE.Mesh(
        new THREE.SphereGeometry(R * 1.004, 44, 26, Math.PI / 2 - 0.9, 1.8, 0.85, 1.55),
        new THREE.MeshPhysicalMaterial({ map: faceTexture(), transparent: true, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3 })
    );
    face.position.set(0, 0.225, 0);
    face.scale.set(1.0, 1.04, 0.97);
    g.add(face);

    // fine auréole dorée flottant au-dessus, tenue par une tige dans le dos
    add(new THREE.TorusGeometry(0.05, 0.0035, 10, 64), gold, 0, 0.308, -0.004, Math.PI / 2 - 0.12);
    limb(new THREE.Vector3(0, 0.272, -0.048), new THREE.Vector3(0, 0.306, -0.048), 0.0025, gold);

    // ailes d'ange attachées dans le dos : trois rangées de plumes superposées, relevées de chaque côté
    const wingMats = [feather, lacquer(0xfff3d8, { roughness: 0.55 }), lacquer(0xf4e2b4, { roughness: 0.55 })];
    for (const s of [-1, 1]) {
        const wing = new THREE.Group();
        wing.position.set(s * 0.024, 0.136, -0.05);
        wing.rotation.set(0, s * 0.32, s * 0.38);      // balayée vers l'arrière, relevée
        wing.scale.x = s;
        [[1, 0], [0.78, 0.0035], [0.54, 0.007]].forEach(([k, z], i) => {
            add(wingGeometry(k), wingMats[i], 0, 0, z, 0, 0, 0, wing);
        });
        g.add(wing);
    }

    g.position.copy(position);
    g.rotation.y = rotationY;
    g.scale.setScalar(scale);
    scene.add(g);
    return g;
}
