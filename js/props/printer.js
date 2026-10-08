import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { scene } from "../core/scene.js";
import { std, glow } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";
import { QUALITY } from "../core/quality.js";

// Imprimante jet d'encre posée sur une console : bac à papier à l'arrière, panneau de commande
// (petit écran, voyant), fente et bac de sortie à l'avant (vers +z local).
// print() fait sortir la feuille du CV par saccades (voyant qui clignote, légère vibration, bruit
// d'impression synthétisé) et se résout quand la feuille est posée dans le bac.
// Aucun tirage aléatoire (ne décale pas le flux de l'appartement).

const A4 = [0.21, 0.297];
const PRINT_TIME = 3.4;   // durée de sortie de la feuille (s)

// petit écran du panneau : « Prêt » / « Impression… »
function panelTexture(text) {
    return canvasTexture(128, 48, (g, w, h) => {
        g.fillStyle = "#122a2c";
        g.fillRect(0, 0, w, h);
        g.fillStyle = "#8af0d8";
        g.font = "bold 20px monospace";
        g.textBaseline = "middle";
        g.fillText(text, 10, h / 2 + 1);
    });
}

// bruit d'impression : chariot (bruit filtré qui va et vient), entraînement du papier, petits clacs
function playPrintSound(duration) {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        const ctx = (playPrintSound.ctx ??= new AC());
        ctx.resume();
        const t0 = ctx.currentTime + 0.05;
        const out = ctx.createGain();
        out.gain.value = 0.16;
        out.connect(ctx.destination);

        const len = Math.ceil(ctx.sampleRate * (duration + 0.5));
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const band = ctx.createBiquadFilter();
        band.type = "bandpass";
        band.frequency.value = 1300;
        band.Q.value = 1.4;
        const carriage = ctx.createGain();
        carriage.gain.setValueAtTime(0, t0);
        // passes du chariot : montées / descentes régulières
        for (let k = 0, t = t0; t < t0 + duration; k++, t += 0.32) {
            carriage.gain.linearRampToValueAtTime(0.9, t + 0.05);
            carriage.gain.linearRampToValueAtTime(0.25, t + 0.24);
            band.frequency.setValueAtTime(k % 2 ? 1500 : 1150, t);
        }
        carriage.gain.linearRampToValueAtTime(0, t0 + duration + 0.1);
        noise.connect(band).connect(carriage).connect(out);
        noise.start(t0);
        noise.stop(t0 + duration + 0.3);

        // moteur d'entraînement du papier
        const motor = ctx.createOscillator(), mg = ctx.createGain();
        motor.type = "triangle";
        motor.frequency.value = 96;
        mg.gain.setValueAtTime(0, t0);
        mg.gain.linearRampToValueAtTime(0.18, t0 + 0.1);
        mg.gain.setValueAtTime(0.18, t0 + duration - 0.1);
        mg.gain.linearRampToValueAtTime(0, t0 + duration + 0.05);
        motor.connect(mg).connect(out);
        motor.start(t0);
        motor.stop(t0 + duration + 0.1);

        // clacs de début et de fin
        for (const t of [t0, t0 + duration]) {
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = "square";
            o.frequency.setValueAtTime(320, t);
            o.frequency.exponentialRampToValueAtTime(90, t + 0.06);
            g.gain.setValueAtTime(0.35, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            o.connect(g).connect(out);
            o.start(t);
            o.stop(t + 0.1);
        }
    } catch { /* audio indisponible : impression silencieuse */ }
}

// pos : sol de l'imprimante (dessus de la console), face avant tournée vers +z après rotation rotY
export function createPrinter(pos, rotY = 0, { paperImage } = {}) {
    const g = new THREE.Group();
    g.position.copy(pos);
    g.rotation.y = rotY;
    const body = new THREE.Group();   // ce qui vibre pendant l'impression
    g.add(body);

    const W = 0.44, D = 0.34, H = 0.17;
    const shell = std(0xddd4cc, { roughness: 0.55 });
    const top = std(0x2a2630, { roughness: 0.45, metalness: 0.2 });
    const dark = std(0x141218, { roughness: 0.6 });
    const add = (geo, mat, x, y, z, parent = body) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
    };

    // coque, capot sombre, fente de sortie
    add(new RoundedBoxGeometry(W, H, D, 4, 0.025), shell, 0, H / 2, 0);
    add(new RoundedBoxGeometry(W - 0.02, 0.02, D - 0.06, 3, 0.008), top, 0, H + 0.004, -0.02);
    add(new THREE.BoxGeometry(W - 0.1, 0.012, 0.01), dark, 0, 0.075, D / 2 + 0.001);

    // bac à papier à l'arrière, incliné, avec sa pile de feuilles
    const feeder = new THREE.Group();
    feeder.position.set(0, H - 0.01, -D / 2 + 0.03);
    feeder.rotation.x = -0.5;
    body.add(feeder);
    add(new THREE.BoxGeometry(0.26, 0.006, 0.2), top, 0, 0, -0.1, feeder);
    add(new THREE.BoxGeometry(0.215, 0.012, 0.17), std(0xf6f2ec, { roughness: 0.9 }), 0, 0.009, -0.1, feeder);

    // panneau de commande : écran, bouton, voyant
    const screenMat = new THREE.MeshBasicMaterial({ map: panelTexture("Prêt"), toneMapped: false });
    const panel = add(new THREE.PlaneGeometry(0.07, 0.026), screenMat, W / 2 - 0.08, H + 0.016, D / 2 - 0.06);
    panel.rotation.x = -Math.PI / 2 + 0.35;
    panel.castShadow = false;
    add(new THREE.CylinderGeometry(0.009, 0.009, 0.006, 16), dark, W / 2 - 0.035, H + 0.016, D / 2 - 0.055);
    const LED = new THREE.Color(0x60f0a0);
    const ledMat = glow(0x60f0a0, 0.6);
    const setLed = (k) => ledMat.color.copy(LED).multiplyScalar(k);
    add(new THREE.SphereGeometry(0.0045, 10, 8), ledMat, W / 2 - 0.035, H + 0.016, D / 2 - 0.08);

    // bac de sortie à l'avant
    const trayZ = D / 2 + 0.13;
    add(new THREE.BoxGeometry(0.25, 0.006, 0.26), top, 0, 0.045, trayZ, g);
    add(new THREE.BoxGeometry(0.25, 0.018, 0.006), top, 0, 0.054, trayZ + 0.13, g);

    // feuille imprimée : sort de la fente, image vers le haut, haut de la page côté imprimante
    const paperTex = new THREE.TextureLoader().load(paperImage);
    paperTex.colorSpace = THREE.SRGBColorSpace;
    paperTex.anisotropy = QUALITY.anisotropy;
    const paper = new THREE.Mesh(
        new THREE.PlaneGeometry(A4[0], A4[1]),
        new THREE.MeshStandardMaterial({ map: paperTex, roughness: 0.9, side: THREE.DoubleSide })
    );
    paper.rotation.x = -Math.PI / 2;
    paper.receiveShadow = true;
    paper.visible = false;
    g.add(paper);
    const zIn = -A4[1] / 2 + 0.02, zOut = trayZ + 0.02;   // feuille cachée dans la coque → posée dans le bac
    const placePaper = (p) => {
        paper.position.set(0, 0.051 + 0.012 * Math.sin(Math.PI * Math.min(p * 1.2, 1)), zIn + (zOut - zIn) * p);
    };

    let printing = null;   // { t, resolve }
    let printed = false;
    onFrame((dt, t) => {
        if (!printing) return;
        printing.t += dt;
        const k = Math.min(printing.t / PRINT_TIME, 1);
        // avance par saccades, comme une vraie imprimante
        const p = Math.min(1, k + Math.sin(k * Math.PI * 14) * 0.012 * (1 - k));
        placePaper(p);
        body.position.set(Math.sin(t * 90) * 0.0008, 0, Math.sin(t * 73) * 0.0006);
        setLed(Math.sin(t * 12) > 0 ? 1.4 : 0.1);
        if (k >= 1) {
            const done = printing.resolve;
            printing = null;
            printed = true;
            body.position.set(0, 0, 0);
            setLed(0.6);
            screenMat.map = panelTexture("Prêt");
            done();
        }
    });

    g.userData.printer = {
        get printed() { return printed; },
        get printing() { return !!printing; },
        // imprime la feuille (une seule fois : ensuite elle reste dans le bac)
        print() {
            if (printed) return Promise.resolve();
            if (printing) return printing.promise;
            let resolve;
            const promise = new Promise((r) => { resolve = r; });
            printing = { t: 0, resolve, promise };
            paper.visible = true;
            placePaper(0);
            screenMat.map = panelTexture("Impression");
            playPrintSound(PRINT_TIME);
            return promise;
        }
    };

    scene.add(g);
    return g;
}
