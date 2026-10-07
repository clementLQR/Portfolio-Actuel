import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { std, glow } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";

// Objets musicaux : casque audio, platine vinyle (le disque tourne), petite enceinte,
// pochettes de disques. Aucun tirage aléatoire (ne décale pas le flux global).

const darkMetal = std(0x1a1a1e, { metalness: 0.5, roughness: 0.4 });

function place(obj, position, rotationY, parent) {
    obj.position.copy(position);
    obj.rotation.y = rotationY;
    obj.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    parent.add(obj);
    return obj;
}

// Casque posé à plat
export function createHeadphones(position, rotationY = 0, parent = scene) {
    const hp = new THREE.Group();
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.014, 8, 24, Math.PI), darkMetal);
    band.rotation.x = -Math.PI / 2;
    hp.add(band);
    for (const s of [-1, 1]) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.04, 20), darkMetal);
        cup.position.set(s * 0.11, 0.02, 0);
        cup.rotation.z = Math.PI / 2;
        hp.add(cup);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 6, 20), glow(0xdddddd, 1.2));
        ring.position.set(s * 0.132, 0.02, 0);
        ring.rotation.y = Math.PI / 2;
        hp.add(ring);
    }
    return place(hp, position, rotationY, parent);
}

function labelTexture(color) {
    return canvasTexture(128, 128, (g, w, h) => {
        g.fillStyle = "#141014";
        g.fillRect(0, 0, w, h);
        for (let r = 62; r > 30; r -= 3) {
            g.strokeStyle = r % 2 ? "#1e181e" : "#0e0a0e";
            g.beginPath(); g.arc(w / 2, h / 2, r, 0, Math.PI * 2); g.stroke();
        }
        g.fillStyle = color;
        g.beginPath(); g.arc(w / 2, h / 2, 22, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#f0e0d0";
        g.beginPath(); g.arc(w / 2, h / 2, 2.5, 0, Math.PI * 2); g.fill();
    });
}

// Platine : socle en bois, plateau, disque qui tourne lentement, bras de lecture
export function createTurntable(position, rotationY = 0, parent = scene) {
    const tt = new THREE.Group();
    const wood = std(0x5a3a2a, { roughness: 0.6 });
    const base = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.08, 0.34, 3, 0.015), wood);
    base.position.y = 0.04;
    tt.add(base);
    const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.015, 40), darkMetal);
    platter.position.set(-0.04, 0.088, 0);
    tt.add(platter);
    const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.004, 48),
        new THREE.MeshStandardMaterial({ map: labelTexture("#a0503a"), roughness: 0.35 })
    );
    disc.position.set(-0.04, 0.098, 0);
    tt.add(disc);
    // bras de lecture
    const pivot = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.035, 12), darkMetal);
    pivot.position.set(0.15, 0.1, -0.11);
    tt.add(pivot);
    // le bras pivote autour de son axe : posé sur le disque quand la musique joue, relevé sinon
    const armGroup = new THREE.Group();
    armGroup.position.set(0.15, 0.112, -0.11);
    tt.add(armGroup);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.22, 6), std(0xb8b0a8, { metalness: 0.7, roughness: 0.35 }));
    arm.rotation.set(Math.PI / 2, 0, 0.55);
    arm.position.set(-0.05, 0, 0.09);
    armGroup.add(arm);
    // petit voyant ambré
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.005, 6, 4), glow(0xffa050, 1.2));
    led.position.set(0.18, 0.06, 0.171);
    tt.add(led);
    // état de lecture : le disque accélère / ralentit en douceur (33 tours/minute à plein régime)
    let playing = false, spin = 0, armK = 0;
    onFrame((dt) => {
        spin += ((playing ? 1 : 0) - spin) * Math.min(dt * (playing ? 1.4 : 0.7), 1);
        armK += ((playing ? 1 : 0) - armK) * Math.min(dt * 1.6, 1);
        disc.rotation.y -= dt * 3.49 * spin;
        armGroup.rotation.y = (1 - armK) * 0.5;
    });
    tt.userData.vinyl = {
        // couleur de l'étiquette du disque posé et état de lecture
        update(color, isPlaying) {
            playing = isPlaying;
            if (color) {
                disc.material.map?.dispose();
                disc.material.map = labelTexture(color);
                disc.material.needsUpdate = true;
            }
        }
    };
    return place(tt, position, rotationY, parent);
}

// Petite enceinte en bois, façade en tissu
export function createSpeaker(position, rotationY = 0, parent = scene) {
    const sp = new THREE.Group();
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.24, 0.16, 3, 0.02), std(0x4a3024, { roughness: 0.6 }));
    box.position.y = 0.12;
    sp.add(box);
    const grill = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.2), std(0x2a2226, { roughness: 1 }));
    grill.position.set(0, 0.12, 0.081);
    sp.add(grill);
    for (const [y, r] of [[0.17, 0.028], [0.08, 0.045]]) {
        const cone = new THREE.Mesh(new THREE.CircleGeometry(r, 20), std(0x18141a, { roughness: 0.8 }));
        cone.position.set(0, y, 0.083);
        sp.add(cone);
    }
    return place(sp, position, rotationY, parent);
}

// Enceinte colonne posée au sol (face vers +z) : caisse en bois sur quatre pieds, baffle sombre avec
// tweeter, médium, grave et évent. Les haut-parleurs « respirent » quand la musique joue
// (userData.setPlaying).
export function createFloorSpeaker(position, rotationY = 0, parent = scene) {
    const sp = new THREE.Group();
    const W = 0.17, D = 0.24, H = 0.95, FOOT = 0.03;
    const wood = std(0x4a3024, { roughness: 0.55 });
    const cone = std(0x0e0c10, { roughness: 0.7 });
    const cap = std(0x2a2428, { roughness: 0.5 });
    const rim = std(0x6a6a72, { metalness: 0.6, roughness: 0.35 });

    const box = new THREE.Mesh(new RoundedBoxGeometry(W, H, D, 3, 0.012), wood);
    box.position.y = FOOT + H / 2;
    sp.add(box);
    for (const [x, z] of [[-0.06, -0.085], [0.06, -0.085], [-0.06, 0.085], [0.06, 0.085]]) {
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, FOOT, 10), darkMetal);
        foot.position.set(x, FOOT / 2, z);
        sp.add(foot);
    }
    // baffle avant en retrait légèrement saillant
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.024, H - 0.07), std(0x18141a, { roughness: 0.6 }));
    face.position.set(0, FOOT + H / 2, D / 2 + 0.0015);
    sp.add(face);

    // haut-parleurs : cône, bourrelet métallique, cache-poussière (chacun dans un groupe pour pouvoir vibrer)
    const drivers = [[0.84, 0.024], [0.68, 0.04], [0.37, 0.056]].map(([y, r]) => {
        const d = new THREE.Group();
        d.position.set(0, FOOT + y, D / 2 + 0.002);
        d.add(new THREE.Mesh(new THREE.CircleGeometry(r, 32), cone));
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0035, 8, 32), rim);
        ring.position.z = 0.002;
        d.add(ring);
        const dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.38, 14, 10), cap);
        dome.scale.z = 0.5;
        dome.position.z = 0.003;
        d.add(dome);
        sp.add(d);
        return d;
    });
    // évent
    const port = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.014, 0.004), std(0x050405, { roughness: 0.9 }));
    port.position.set(0, FOOT + 0.14, D / 2 + 0.002);
    sp.add(port);

    let playing = false, k = 0;
    onFrame((dt, t) => {
        k += ((playing ? 1 : 0) - k) * Math.min(dt * 6, 1);
        const beat = k * Math.abs(Math.sin(t * 4.4));
        drivers.forEach((d, i) => d.scale.set(1 + beat * (i === 2 ? 0.07 : 0.025), 1 + beat * (i === 2 ? 0.07 : 0.025), 1 + beat * 0.5));
    });
    sp.userData.setPlaying = (v) => { playing = v; };
    return place(sp, position, rotationY, parent);
}

// Pochettes de disques appuyées contre un meuble (face vers +x), en éventail pour qu'on puisse les
// viser une à une. Renvoie les pochettes, dans l'ordre des disques de vinyl.js, avec
// setSelected(i) : la pochette du disque posé sur la platine se soulève ; setHover(i) : survol.
export function createRecordSleeves(x, y, z0, parent = scene) {
    const colors = ["#c06a48", "#e0c8a0", "#6a4a6a", "#3a5a58"];
    const sleeves = [];
    let selected = -1, hover = -1;
    colors.forEach((c, i) => {
        const tex = canvasTexture(128, 128, (g, w, h) => {
            g.fillStyle = c;
            g.fillRect(0, 0, w, h);
            g.fillStyle = "rgba(20,10,20,0.35)";
            g.beginPath(); g.arc(w * (0.3 + 0.15 * i), h * 0.45, 26 + i * 6, 0, Math.PI * 2); g.fill();
            g.fillStyle = "rgba(255,240,220,0.7)";
            g.fillRect(12, h - 26, 50 + i * 8, 6);
        });
        const s = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.31, 0.31), std(0xffffff, { map: tex, roughness: 0.8 }));
        const tilt = 0.16 + i * 0.03;   // le haut s'appuie contre le meuble
        s.position.set(x - Math.sin(tilt) * 0.155 - i * 0.015, y + 0.155 * Math.cos(tilt), z0 - i * 0.11);
        s.rotation.z = -tilt;
        s.userData = { base: s.position.clone(), tilt, k: 0 };
        s.castShadow = true;
        parent.add(s);
        sleeves.push(s);
    });
    // la pochette glisse vers le haut, le long de sa pente
    onFrame((dt) => sleeves.forEach((s, i) => {
        const u = s.userData;
        u.k += ((selected === i ? 0.085 : 0) + (hover === i ? 0.03 : 0) - u.k) * Math.min(dt * 9, 1);
        s.position.set(u.base.x + Math.sin(u.tilt) * u.k, u.base.y + Math.cos(u.tilt) * u.k, u.base.z);
    }));
    sleeves.setSelected = (i) => { selected = i; };
    sleeves.setHover = (i) => { hover = i; };
    return sleeves;
}
