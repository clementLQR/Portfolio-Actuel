import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { addBox } from "../core/helpers.js";
import { std } from "../core/materials.js";
import { makeMeshFabricTexture } from "../core/textures.js";

// Chaise de bureau à dossier résille (avant = -z local, dossier vers +z)

function roundRect(w, h, r) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, 0);
    s.lineTo(w / 2 - r, 0);
    s.quadraticCurveTo(w / 2, 0, w / 2, r);
    s.lineTo(w / 2, h - r);
    s.quadraticCurveTo(w / 2, h, w / 2 - r, h);
    s.lineTo(-w / 2 + r, h);
    s.quadraticCurveTo(-w / 2, h, -w / 2, h - r);
    s.lineTo(-w / 2, r);
    s.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0);
    return s;
}

export function createOfficeChair(position, rotationY) {
    const chair = new THREE.Group();
    chair.position.copy(position);
    chair.rotation.y = rotationY;
    scene.add(chair);

    const plastic = std(0x141417, { roughness: 0.55 });
    const fabric = std(0x111114, { roughness: 0.95 });
    const chrome = std(0xb0b0b8, { metalness: 0.9, roughness: 0.25 });
    const meshMat = new THREE.MeshStandardMaterial({
        map: makeMeshFabricTexture(), color: 0x9a9aa4, transparent: true, alphaTest: 0.15,
        roughness: 0.9, side: THREE.DoubleSide
    });

    // piétement étoile en nylon + roulettes
    for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2;
        const legArm = new THREE.Group();
        legArm.rotation.y = -a;
        chair.add(legArm);
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.045), plastic);
        leg.position.set(0.17, 0.09, 0);
        leg.rotation.z = -0.12;
        legArm.add(leg);
        const fork = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.03), plastic);
        fork.position.set(0.31, 0.06, 0);
        legArm.add(fork);
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 14), plastic);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(0.32, 0.03, 0);
        legArm.add(wheel);
    }
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.07, 16), plastic);
    hub.position.y = 0.11;
    chair.add(hub);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.17, 16), plastic);
    lower.position.y = 0.22;
    chair.add(lower);
    const lift = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.1, 12), chrome);
    lift.position.y = 0.35;
    chair.add(lift);

    // mécanisme + manette
    addBox(-0.11, 0.11, 0.39, 0.43, -0.12, 0.12, plastic, chair);
    addBox(-0.26, -0.11, 0.405, 0.415, -0.06, -0.05, plastic, chair);
    addBox(-0.3, -0.24, 0.4, 0.42, -0.08, -0.03, plastic, chair);

    // assise rembourrée
    const seat = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.48, 5, 0.035), fabric);
    seat.position.set(0, 0.47, 0);
    chair.add(seat);
    addBox(-0.23, 0.23, 0.43, 0.44, -0.22, 0.22, plastic, chair);

    // dossier incliné vers l'arrière : cadre arrondi, résille, bande lombaire
    const back = new THREE.Group();
    back.position.set(0, 0.55, 0.25);
    back.rotation.x = 0.12;
    chair.add(back);
    const BW = 0.46, BH = 0.56, R = 0.06, IN = 0.03;
    const frameShape = roundRect(BW, BH, R);
    frameShape.holes.push(new THREE.Path(
        roundRect(BW - IN * 2, BH - IN * 2, R - 0.015).getPoints().map(p => new THREE.Vector2(p.x, p.y + IN))
    ));
    const frame = new THREE.Mesh(
        new THREE.ExtrudeGeometry(frameShape, { depth: 0.03, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 10 }),
        plastic
    );
    frame.position.z = -0.015;
    back.add(frame);
    const meshPanel = new THREE.Mesh(new THREE.ShapeGeometry(roundRect(BW - IN * 2 + 0.01, BH - IN * 2 + 0.01, R - 0.01), 10), meshMat);
    meshPanel.position.set(0, IN - 0.005, 0);
    back.add(meshPanel);
    const lumbar = new THREE.Mesh(new RoundedBoxGeometry(BW - 0.04, 0.075, 0.03, 3, 0.012), plastic);
    lumbar.position.set(0, 0.17, -0.02);
    back.add(lumbar);
    // tige qui relie le dossier au mécanisme
    addBox(-0.04, 0.04, -0.12, 0.05, 0.005, 0.03, plastic, back);
    addBox(-0.04, 0.04, -0.14, -0.11, -0.2, 0.03, plastic, back);

    // accoudoirs en boucle
    for (const s of [-1, 1]) {
        const loop = new THREE.CatmullRomCurve3([
            new THREE.Vector3(s * 0.26, 0.47, -0.08),
            new THREE.Vector3(s * 0.285, 0.6, -0.15),
            new THREE.Vector3(s * 0.29, 0.68, -0.08),
            new THREE.Vector3(s * 0.29, 0.69, 0.08),
            new THREE.Vector3(s * 0.275, 0.66, 0.22),
            new THREE.Vector3(s * 0.25, 0.56, 0.25),
            new THREE.Vector3(s * 0.25, 0.48, 0.16)
        ], true, "centripetal");
        chair.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 60, 0.016, 8, true), plastic));
        const pad = new THREE.Mesh(new RoundedBoxGeometry(0.055, 0.02, 0.2, 3, 0.009), plastic);
        pad.position.set(s * 0.29, 0.7, 0.0);
        chair.add(pad);
    }

    chair.traverse(o => { o.castShadow = true; });
    return chair;
}
