import * as THREE from "three";
import { scene } from "../core/scene.js";
import { rand, rr, pick } from "../core/random.js";
import { addBox, canvasTexture } from "../core/helpers.js";
import { std, glow, wallMat, frameMat, woodMat, darkWood, ceilingMat, dimLight, lampGlow } from "../core/materials.js";
import { makePcScreenTexture } from "../core/textures.js";
import { onFrame } from "../core/animated.js";
import { vine, bush, pot } from "../props/foliage.js";
import { bigPoster, smallPoster, straightPoster } from "../props/posters.js";
import { createOfficeChair } from "../props/officeChair.js";
import { createPcTower } from "../props/computer.js";
import { createCatTree } from "../props/catTree.js";
import { createMug, createPenHolder } from "../props/cozy.js";
import { createPrinter } from "../props/printer.js";
import { SF, SX0, SZ1, PC_SCREEN, SPOTS } from "../config/layout.js";
import { registerClickable } from "../core/interactive.js";

// Bureau : pièce à gauche du salon, poste de travail face au mur ouest,
// fenêtre sur la ville au nord. Renseigne PC_SCREEN (fin du trajet caméra).

export function createOffice({ salonWood, rugTex }) {
    const RX0b = -8.8, RX1b = SX0 - 0.3, RZ0 = -9.0, RZ1 = SZ1, RH = SF + 3.7;   // plafond assez haut pour les posters au-dessus du bureau
    const OWX0 = -8.5, OWX1 = -5.2, OWY0 = SF + 0.45, OWY1 = RH - 0.2;

    // sol, murs, plafond
    const floor = new THREE.Mesh(
        new THREE.PlaneGeometry(RX1b - RX0b, RZ0 - RZ1),
        new THREE.MeshStandardMaterial({ map: salonWood, color: 0x8a6a5a, roughness: 0.5 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.set((RX0b + RX1b) / 2, SF + 0.002, (RZ0 + RZ1) / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    addBox(RX0b - 0.3, RX0b, SF, RH, RZ1 - 0.35, RZ0 + 0.3, wallMat);
    addBox(RX0b, RX1b, SF, RH, RZ0, RZ0 + 0.3, wallMat);
    addBox(RX0b - 0.3, RX1b, RH, RH + 0.2, RZ1 - 0.35, RZ0 + 0.3, ceilingMat);

    // mur nord percé d'une fenêtre sur la ville
    addBox(RX0b, OWX0, SF, RH, RZ1 - 0.35, RZ1, wallMat);
    addBox(OWX1, RX1b, SF, RH, RZ1 - 0.35, RZ1, wallMat);
    addBox(OWX0, OWX1, SF, OWY0, RZ1 - 0.35, RZ1, wallMat);
    addBox(OWX0, OWX1, OWY1, RH, RZ1 - 0.35, RZ1, wallMat);
    for (const x of [OWX0, (OWX0 + OWX1) / 2 - 0.05, OWX1 - 0.1]) {
        addBox(x, x + 0.1, OWY0, OWY1, RZ1 - 0.25, RZ1 - 0.12, frameMat);
    }
    addBox(OWX0, OWX1, OWY0 - 0.05, OWY0 + 0.05, RZ1 - 0.3, RZ1 + 0.12, frameMat);
    addBox(OWX0, OWX1, OWY1 - 0.08, OWY1, RZ1 - 0.25, RZ1 - 0.12, frameMat);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4), std(0xffffff, { map: rugTex, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-7.0, SF + 0.006, -10.8);
    scene.add(rug);

    // bureau + caisson à tiroirs
    const DKX0 = RX0b, DKX1 = RX0b + 0.8, DKZ0 = -11.7, DKZ1 = -9.7, DKY = SF + 0.76;
    addBox(DKX0, DKX1, DKY - 0.05, DKY, DKZ0, DKZ1, woodMat);
    addBox(DKX0, DKX1 - 0.02, SF, DKY - 0.05, DKZ1 - 0.5, DKZ1, woodMat);
    for (let i = 0; i < 4; i++) {
        const y = SF + 0.05 + i * 0.165;
        addBox(DKX1 - 0.02, DKX1, y, y + 0.15, DKZ1 - 0.48, DKZ1 - 0.02, darkWood);
        addBox(DKX1, DKX1 + 0.015, y + 0.11, y + 0.125, DKZ1 - 0.32, DKZ1 - 0.18, std(0x1a1418, { metalness: 0.6 }));
    }
    addBox(DKX0, DKX1, SF, DKY - 0.05, DKZ0, DKZ0 + 0.04, woodMat);

    // écran du PC
    makePcScreenTexture();   // texture plus affichée (l'écran reste noir), mais l'appel garde le flux rand() du décor
    const monZ = (DKZ0 + DKZ1) / 2 + 0.05;
    addBox(DKX0 + 0.03, DKX0 + 0.3, DKY, DKY + 0.02, monZ - 0.15, monZ + 0.15, std(0x18161c, { metalness: 0.5 }));
    addBox(DKX0 + 0.07, DKX0 + 0.11, DKY, DKY + 0.3, monZ - 0.03, monZ + 0.03, std(0x18161c, { metalness: 0.5 }));
    addBox(DKX0 + 0.12, DKX0 + 0.16, DKY + 0.12, DKY + 0.72, monZ - 0.54, monZ + 0.54, std(0x0e0c12));
    // écran toujours noir : une fois la caméra arrivée devant, le bureau HTML (desktop.js, qui démarre
    // sur l'écran noir du BIOS) le recouvre. Seule sa lueur s'allume quand on va vers le PC.
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.574), new THREE.MeshBasicMaterial({ color: 0x050408, fog: false }));
    let screenOn = false;
    screen.userData.setOn = (on) => { screenOn = on; };
    screen.position.set(DKX0 + 0.165, DKY + 0.42, monZ);
    screen.rotation.y = Math.PI / 2;
    scene.add(screen);
    const screenLight = new THREE.PointLight(0x9a88d0, 0.45, 3, 2);
    screenLight.position.set(DKX0 + 0.6, DKY + 0.4, monZ);
    scene.add(screenLight);
    onFrame((dt, t) => {   // lueur de l'écran : seulement allumé (léger scintillement)
        screenLight.intensity = screenOn ? 0.45 + Math.sin(t * 3.1) * Math.sin(t * 7.3) * 0.03 : 0;
    });
    PC_SCREEN.copy(screen.position);
    // clic : on se penche vers l'écran, qui devient un petit bureau d'ordinateur (desktop.js)
    registerClickable(screen, "pc");
    SPOTS.pc = { pos: PC_SCREEN.clone().add(new THREE.Vector3(1.12, 0, 0)), look: PC_SCREEN.clone(), fov: 40, dip: 0, still: true };   // still : caméra fixe, le bureau HTML reste calé sur l'écran

    // clavier, souris, tapis, tasse, pot à crayons
    addBox(DKX0 + 0.35, DKX0 + 0.7, DKY, DKY + 0.004, monZ - 0.55, monZ + 0.4, std(0x1a1620));
    addBox(DKX0 + 0.42, DKX0 + 0.58, DKY, DKY + 0.025, monZ - 0.25, monZ + 0.2, std(0x2a2228));
    addBox(DKX0 + 0.45, DKX0 + 0.55, DKY + 0.025, DKY + 0.03, monZ - 0.23, monZ + 0.18, lampGlow(0xffb070, 0.35), scene, false);
    const mouse3d = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), std(0x18161c));
    mouse3d.scale.set(1.4, 0.5, 1);
    mouse3d.position.set(DKX0 + 0.5, DKY + 0.01, monZ - 0.4);
    scene.add(mouse3d);
    // coin gauche du bureau : lampe et plante au fond, pot à crayons, tasse à portée de main
    createPenHolder(new THREE.Vector3(DKX0 + 0.5, DKY, DKZ1 - 0.1));
    createMug(new THREE.Vector3(DKX0 + 0.66, DKY, DKZ1 - 0.24), 0xb0705a, { rotationY: -0.6 });

    // tour PC : façade vers la pièce, vitre fumée côté écran
    createPcTower(DKX0 + 0.12, DKX0 + 0.6, DKY, DKZ0 + 0.05, DKZ0 + 0.27);

    // lumière indirecte derrière l'écran
    addBox(RX0b + 0.001, RX0b + 0.012, DKY + 0.2, DKY + 0.22, monZ - 0.62, monZ + 0.62, lampGlow(0xff9a68, 0.6), scene, false);
    const biasLight = dimLight(new THREE.PointLight(0xff9068, 0.5, 2.2, 2));
    biasLight.position.set(RX0b + 0.22, DKY + 0.45, monZ);
    scene.add(biasLight);

    // lampe d'architecte
    const armMat = std(0x1a1618, { metalness: 0.6, roughness: 0.4 });
    // lampe d'architecte : pied dans le coin du fond, tête au-dessus du plan de travail
    const lampBase = new THREE.Vector3(DKX0 + 0.1, DKY, DKZ1 - 0.12);
    const elbow = new THREE.Vector3(DKX0 + 0.08, DKY + 0.7, DKZ1 - 0.13);
    const head = new THREE.Vector3(DKX0 + 0.3, DKY + 0.5, DKZ1 - 0.24);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.02, 20), armMat);
    foot.position.set(lampBase.x, DKY + 0.01, lampBase.z);
    scene.add(foot);
    for (const [a, b] of [[lampBase, elbow], [elbow, head]]) {
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(a, b), 1, 0.012, 6), armMat));
    }
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.16, 20, 1, true), std(0x2a2024, { side: THREE.DoubleSide }));
    shade.position.copy(head).add(new THREE.Vector3(0, -0.05, 0));
    shade.rotation.z = 0.45;   // l'ouverture éclaire le plan de travail, vers l'avant
    scene.add(shade);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), lampGlow(0xffc080, 1.5));
    bulb.position.copy(head).add(new THREE.Vector3(0.035, -0.1, 0));
    scene.add(bulb);
    const deskLamp = dimLight(new THREE.PointLight(0xffa860, 1.5, 4, 1.8));
    deskLamp.position.copy(head).add(new THREE.Vector3(0.05, -0.2, 0));
    scene.add(deskLamp);

    // étagères au-dessus du bureau
    const bookColors = [0x2a3a6a, 0x6a2a3a, 0xd8c8a8, 0x3a5a4a, 0x2a2a2a, 0x7a3a7a, 0xc8a050];
    for (const [y, z0, z1] of [[DKY + 1.2, -11.3, -9.45], [DKY + 1.75, -11.0, -9.45]]) {
        addBox(RX0b, RX0b + 0.3, y, y + 0.04, z0, z1, woodMat);
        let z = z0 + 0.05;
        while (z < z1 - 0.1) {
            if (rand() < 0.12) {
                const ph = pot(RX0b + 0.15, z + 0.1, 0.07, 0.11, 0xd8d0c8, y + 0.04);
                bush(RX0b + 0.15, ph, z + 0.1, 16, 0.12, 1.3);
                z += 0.3;
                continue;
            }
            const bw = rr(0.03, 0.07), bh = rr(0.18, 0.32);
            addBox(RX0b + 0.03, RX0b + rr(0.2, 0.27), y + 0.04, y + 0.04 + bh, z, z + bw, std(pick(bookColors), { roughness: 0.7 }));
            z += bw + 0.004;
        }
        vine(RX0b + 0.25, y, z1 - rr(0.1, 0.6), rr(0.5, 1.1), Math.floor(y * 100));
    }

    // grande bibliothèque sur le mur sud
    const BKX0 = RX0b, BKX1 = RX0b + 1.9, BKZ0 = RZ0 - 0.38, BKZ1 = RZ0;
    addBox(BKX0, BKX1, SF, SF + 3.0, BKZ1 - 0.03, BKZ1, woodMat);
    addBox(BKX1 - 0.04, BKX1, SF, SF + 3.0, BKZ0, BKZ1, woodMat);
    const lv = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 2.96];
    for (const y of lv) addBox(BKX0, BKX1, SF + y, SF + y + 0.04, BKZ0, BKZ1, woodMat);
    addBox(BKX0, BKX0 + 0.04, SF, SF + 3.0, BKZ0, BKZ1, woodMat);                 // montant côté mur
    addBox(BKX0, BKX1 + 0.02, SF + 2.96, SF + 3.0, BKZ0 - 0.03, BKZ1, woodMat);   // chapeau débordant
    for (let s = 0; s < lv.length - 1; s++) {
        let x = BKX0 + 0.05;
        while (x < BKX1 - 0.12) {
            if (s === 3 && x > BKX0 + 0.8 && x < BKX0 + 1.2) {
                const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 12), lampGlow(0xffc070, 1.0));
                orb.position.set(BKX0 + 1.0, SF + lv[s] + 0.17, BKZ0 + 0.2);
                scene.add(orb);
                x = BKX0 + 1.25;
                continue;
            }
            if (rand() < 0.08) { x += 0.22; continue; }
            const bw = rr(0.03, 0.07), bh = rr(0.22, 0.4);
            addBox(x, x + bw, SF + lv[s] + 0.04, SF + lv[s] + 0.04 + bh, BKZ1 - rr(0.25, 0.32), BKZ1 - 0.03, std(pick(bookColors), { roughness: 0.7 }));
            x += bw + 0.004;
        }
    }
    const orbLight = dimLight(new THREE.PointLight(0xffa850, 0.9, 3.5, 2));
    orbLight.position.set(BKX0 + 1.0, SF + 1.7, BKZ0 - 0.2);
    scene.add(orbLight);
    for (let i = 0; i < 4; i++) vine(rr(BKX0 + 0.1, BKX1 - 0.1), SF + 3.0, BKZ0 + 0.05, rr(0.6, 1.8), 900 + i);

    // posters au-dessus du bureau
    straightPoster(bigPoster, 0.8, 1.2, -11.85, DKY + 1.95, RX0b);
    straightPoster(smallPoster(1201), 0.42, 0.56, -10.4, DKY + 2.3, RX0b);
    straightPoster(smallPoster(1202), 0.36, 0.48, -9.7, DKY + 2.35, RX0b);

    createOfficeChair(new THREE.Vector3(-7.05, SF, -11.55), -2.2);

    // arbre à chat dans le coin nord-ouest, entre la fenêtre et le bureau (niche tournée vers la pièce)
    createCatTree(new THREE.Vector3(-8.4, SF, -12.08), 0.9);

    // plantes
    let ph = pot(OWX1 + 0.35, RZ1 + 0.45, 0.22, 0.5, 0x3a3a3a, SF);
    bush(OWX1 + 0.35, ph, RZ1 + 0.45, 70, 0.55, 1.1);
    ph = pot(DKX0 + 0.3, DKZ1 - 0.15, 0.07, 0.12, 0x7a4a30, DKY);
    bush(DKX0 + 0.3, ph, DKZ1 - 0.15, 30, 0.17, 1.2);
    vine(OWX0 + 0.3, OWY1 - 0.05, RZ1 + 0.15, 1.6, 1301);
    vine(OWX1 - 0.4, OWY1 - 0.05, RZ1 + 0.15, 1.2, 1302);

    const officeGlow = dimLight(new THREE.PointLight(0xff8a78, 1.3, 6, 1.6));
    officeGlow.position.set((OWX0 + OWX1) / 2, SF + 1.8, RZ1 + 0.8);
    scene.add(officeGlow);

    // console sous la fenêtre, avec l'imprimante du CV (clic : la caméra s'approche et le CV s'imprime, cv.js)
    // ajoutée en fin de pièce, sans tirage aléatoire
    const CX0 = -6.7, CX1 = -5.9, CZ0 = RZ1 + 0.02, CZ1 = RZ1 + 0.6, CY = SF + 0.72;
    addBox(CX0, CX1, CY - 0.04, CY, CZ0, CZ1, woodMat);
    for (const x of [CX0 + 0.03, CX1 - 0.07]) for (const z of [CZ0 + 0.03, CZ1 - 0.07]) {
        addBox(x, x + 0.04, SF, CY - 0.04, z, z + 0.04, darkWood);
    }
    addBox(CX0 + 0.03, CX1 - 0.03, SF + 0.18, SF + 0.2, CZ0 + 0.03, CZ1 - 0.03, darkWood);   // tablette basse
    const printer = createPrinter(new THREE.Vector3((CX0 + CX1) / 2, CY, CZ0 + 0.19), 0, { paperImage: "assets/cv/cv-apercu.jpg" });
    registerClickable(printer, "printer");
    SPOTS.printer = {
        pos: new THREE.Vector3((CX0 + CX1) / 2, SF + 1.4, RZ1 + 1.2),
        look: new THREE.Vector3((CX0 + CX1) / 2, CY + 0.05, RZ1 + 0.42),
        fov: 46, dip: 0, still: true
    };

    // téléphone posé à plat à gauche du clavier, sous la lampe, écran allumé (clic : on s'en approche et il s'ouvre en
    // interface de smartphone, phone.js) : pour les visiteurs sur mobile, à qui l'écran du PC est peu pratique.
    // Ajouté en fin de pièce, sans tirage aléatoire.
    const phone = new THREE.Group();
    phone.position.set(DKX0 + 0.3, DKY, DKZ1 - 0.42);
    phone.rotation.y = Math.PI / 2 + 0.25;   // haut du téléphone vers le mur, légèrement de biais
    addBox(-0.038, 0.038, 0, 0.009, -0.078, 0.078, std(0x1c1820, { metalness: 0.5, roughness: 0.35 }), phone);
    const phoneTex = canvasTexture(256, 512, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#3a1f4a");
        g.addColorStop(0.55, "#a2496a");
        g.addColorStop(1, "#ff9a6a");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#fff3f7";
        ctx.textAlign = "center";
        ctx.font = "italic 72px Georgia, serif";
        ctx.fillText("21:47", w / 2, 130);
        ["#ff9a6a", "#c58cff", "#6ae0a8", "#4fb3d1", "#ffc070", "#f4e6ea"].forEach((c, i) => {
            ctx.fillStyle = c;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.roundRect(38 + (i % 3) * 66, 250 + Math.floor(i / 3) * 76, 48, 48, 12);
            ctx.fill();
        });
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = "#fff3f7";
        ctx.fillRect(w / 2 - 40, h - 26, 80, 6);
    });
    const phoneScreen = new THREE.Mesh(
        new THREE.PlaneGeometry(0.068, 0.146),
        new THREE.MeshBasicMaterial({ map: phoneTex, color: new THREE.Color(0.75, 0.72, 0.75), fog: false })
    );
    phoneScreen.rotation.x = -Math.PI / 2;
    phoneScreen.position.y = 0.0095;
    phone.add(phoneScreen);
    // zone de clic plus large que le téléphone (petit à l'écran, surtout au doigt)
    const phoneHit = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.3), new THREE.MeshBasicMaterial());
    phoneHit.visible = false;
    phone.add(phoneHit);
    scene.add(phone);
    registerClickable(phone, "phone");
    SPOTS.phone = {
        pos: phone.position.clone().add(new THREE.Vector3(0.28, 0.5, 0)),
        look: phone.position.clone(),
        fov: 40, dip: 0, still: true
    };
}
