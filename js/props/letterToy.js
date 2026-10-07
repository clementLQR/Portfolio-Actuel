import * as THREE from "three";
import { scene } from "../core/scene.js";
import { canvasTexture } from "../core/helpers.js";
import { mulberry32 } from "../core/random.js";

// Figurine « W » en vinyle : corps bombé bleu foncé (silhouette de W lissée, extrudée avec un
// gros chanfrein arrondi), aplat bleu clair en relief sur l'avant, grands yeux qui regardent en
// bas à gauche, sourire épais. Vinyle brillant à légère « peau d'orange ». ~17 cm de large,
// pieds posés en y = 0. Regarde vers +z local. Aucun tirage aléatoire global.

const PX = 0.15 / 920;                      // mètres par pixel de la photo de référence
const FEET = 1002;                          // ligne des pieds (px)
const DEPTH = 0.03, BEVEL = 0.012, BEVEL_SIZE = 0.009;
const FRONT_Z = DEPTH / 2 + BEVEL;          // plan de la face avant

// moitié droite du contour (dx par rapport à l'axe, y en px), du haut de la bosse centrale au creux du bas
const HALF = [
    [0, 478], [65, 492], [105, 525], [150, 430], [230, 340], [320, 315], [405, 345], [455, 430],
    [462, 540], [440, 700], [375, 860], [305, 960], [230, 1002], [140, 975], [70, 925], [0, 905]
];

// contour fermé et lisse ; k réduit la silhouette autour de son centre (aplat clair)
function outline(k = 1) {
    const pts = HALF.map(([dx, py]) => [dx, py]);
    for (let i = HALF.length - 2; i >= 1; i--) pts.push([-HALF[i][0], HALF[i][1]]);
    const cy = 0.065;
    const v = pts.map(([dx, py]) => new THREE.Vector3(dx * PX * k, cy + ((FEET - py) * PX - cy) * k, 0));
    const curve = new THREE.CatmullRomCurve3(v, true, "centripetal");
    const p = curve.getPoints(180).map((q) => new THREE.Vector2(q.x, q.y));
    p.pop();                                // le dernier point répète le premier
    return new THREE.Shape(p);
}

// grain très fin du vinyle (relief seul, sans changer la couleur)
function grainTexture() {
    const rnd = mulberry32(31);
    const t = canvasTexture(128, 128, (g, w, h) => {
        g.fillStyle = "#808080";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 700; i++) {
            const v = 96 + Math.floor(rnd() * 64);
            g.fillStyle = `rgba(${v},${v},${v},0.55)`;
            g.beginPath();
            g.arc(rnd() * w, rnd() * h, 1 + rnd() * 3, 0, Math.PI * 2);
            g.fill();
        }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(55, 55);                   // les UV d'une extrusion sont en mètres
    return t;
}

export function createLetterToy(position, rotationY = 0, scale = 1) {
    const g = new THREE.Group();
    const grain = grainTexture();
    const vinyl = (color, extra = {}) => new THREE.MeshPhysicalMaterial({
        color, roughness: 0.34, clearcoat: 0.55, clearcoatRoughness: 0.28, bumpMap: grain, bumpScale: 0.35, ...extra
    });
    const dark = vinyl(0x1944c4), light = vinyl(0x2a98ec);
    const white = new THREE.MeshPhysicalMaterial({ color: 0xf8f6f0, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.2 });
    const black = new THREE.MeshPhysicalMaterial({ color: 0x0e0e12, roughness: 0.22, clearcoat: 0.6, clearcoatRoughness: 0.2 });

    const mesh = (geo, mat) => {
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = m.receiveShadow = true;
        g.add(m);
        return m;
    };

    // corps : le chanfrein dépasse du contour de BEVEL_SIZE, on remonte pour que les pieds touchent y = 0
    const bodyGeo = new THREE.ExtrudeGeometry(outline(), { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL_SIZE, bevelSegments: 8, curveSegments: 1 });
    bodyGeo.translate(0, BEVEL_SIZE, -DEPTH / 2);
    mesh(bodyGeo, dark);

    // aplat clair, légèrement bombé, qui laisse un liseré foncé tout autour
    const faceGeo = new THREE.ExtrudeGeometry(outline(0.85), { depth: 0.003, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 4, curveSegments: 1 });
    faceGeo.translate(0, BEVEL_SIZE, FRONT_Z - 0.001);
    mesh(faceGeo, light);

    // yeux : blanc bombé + grosse pupille décalée vers le bas, côté gauche
    const dome = new THREE.SphereGeometry(1, 32, 20);
    const px = (x, y) => new THREE.Vector2(x * PX, (FEET - y) * PX + BEVEL_SIZE);
    const faceZ = FRONT_Z + 0.004;
    for (const [wx, wy, pxx, pyy, r] of [[-249, 635, -280, 660, 95], [263, 640, 230, 662, 100]]) {
        const w = px(wx, wy), p = px(pxx, pyy);
        const eye = mesh(dome, white);
        eye.scale.set(r * PX, r * PX, 0.0035);
        eye.position.set(w.x, w.y, faceZ);
        const pupil = mesh(dome, black);
        pupil.scale.set(68 * PX, 68 * PX, 0.003);
        pupil.position.set(p.x, p.y, faceZ + 0.0025);
    }

    // sourire : arc épais aux extrémités arrondies
    const R = 0.0195, tube = 0.0034, mouth = px(0, 715);
    const smile = mesh(new THREE.TorusGeometry(R, tube, 14, 40, Math.PI), black);
    smile.rotation.z = Math.PI;
    smile.position.set(0, mouth.y, faceZ + 0.0012);
    for (const s of [-1, 1]) {
        const cap = mesh(new THREE.SphereGeometry(tube, 14, 10), black);
        cap.position.set(s * R, mouth.y, faceZ + 0.0012);
    }

    g.position.copy(position);
    g.rotation.y = rotationY;
    g.scale.setScalar(scale);
    scene.add(g);
    return g;
}
