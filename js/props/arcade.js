import * as THREE from "three";
import { scene } from "../core/scene.js";
import { std, glow } from "../core/materials.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";
import { mulberry32 } from "../core/random.js";
import { KEYS, createSfx, hiScore } from "./arcadeShared.js";

// Borne d'arcade : meuble au profil classique, côtés décorés (dégradé coucher de soleil),
// fronton lumineux, panneau de commandes (joystick, boutons), monnayeur, et un écran
// qui fait tourner un petit jeu de tir rétro (texture canvas animée) : démo en veille,
// jouable au clavier quand on est installé devant la borne (voir game.key / game.setActive).
// Repère local : avant = +z, dos en z = 0, largeur centrée sur x = 0.

const W = 0.68;                       // largeur
const PROFILE = [                     // profil latéral (avancée u, hauteur y)
    [0, 0], [0.7, 0], [0.7, 0.86], [0.74, 0.9], [0.56, 0.98], [0.5, 1.04],
    [0.38, 1.55], [0.56, 1.62], [0.56, 1.86], [0, 1.86]
];
const SCREEN = { u: 0.44, y: 1.295, tilt: Math.atan2(0.12, 0.51), w: 0.54, h: 0.46 };

function profileShape() {
    const s = new THREE.Shape();
    PROFILE.forEach(([u, y], i) => (i ? s.lineTo(u, y) : s.moveTo(u, y)));
    s.closePath();
    return s;
}

// --- textures -------------------------------------------------------------------

function sideArtTexture() {
    const t = canvasTexture(256, 512, (g, w, h) => {
        g.fillStyle = "#1c1226";
        g.fillRect(0, 0, w, h);
        // soleil rayé et bandes obliques
        const sun = g.createLinearGradient(0, h * 0.25, 0, h * 0.55);
        sun.addColorStop(0, "#ffb070");
        sun.addColorStop(1, "#d0507a");
        g.fillStyle = sun;
        g.beginPath(); g.arc(w * 0.42, h * 0.42, w * 0.3, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#1c1226";
        for (let k = 0; k < 6; k++) g.fillRect(0, h * (0.42 + k * 0.025), w, 3 + k * 1.5);
        for (const [c, o] of [["#d0507a", 0], ["#ff9a6a", 26], ["#7a5ac8", 52]]) {
            g.strokeStyle = c;
            g.lineWidth = 14;
            g.beginPath(); g.moveTo(-20, h * 0.95 - o); g.lineTo(w + 20, h * 0.6 - o); g.stroke();
        }
    });
    // UV de ShapeGeometry = coordonnées du profil en mètres
    t.repeat.set(1 / 0.74, 1 / 1.86);
    return t;
}

function marqueeTexture(jp, name) {
    return canvasTexture(512, 128, (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, w, 0);
        bg.addColorStop(0, "#3a1648");
        bg.addColorStop(0.5, "#7a2a5a");
        bg.addColorStop(1, "#3a1648");
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        g.textAlign = "center";
        g.fillStyle = "#ffd2a0";
        g.font = "bold 58px 'Yu Gothic', 'Meiryo', sans-serif";
        g.fillText(jp, w * 0.2, h * 0.68);
        g.font = "bold 50px 'DM Mono', monospace";
        g.fillStyle = "#ff9ad0";
        g.fillText(name, w * 0.62, h * 0.66);
        g.strokeStyle = "#ffb070";
        g.lineWidth = 4;
        g.strokeRect(6, 6, w - 12, h - 12);
    });
}

// --- jeu : démo en veille, jouable quand on est devant la borne -----------------------

const hiStore = hiScore("starrun-hi");
const loadHi = hiStore.load, saveHi = hiStore.save;

// Formations des niveaux ("X" = envahisseur, 7 colonnes) ; un niveau sur cinq est un boss.
const PATTERNS = [
    ["XXXXXXX", "XXXXXXX", "XXXXXXX"],
    ["...X...", "..XXX..", ".XXXXX.", "XXXXXXX"],
    ["XXXXXXX", ".XXXXX.", "..XXX..", "...X..."],
    ["X.X.X.X", ".X.X.X.", "X.X.X.X"],
    ["X.....X", ".X...X.", "..X.X..", "...X..."],
    ["XX...XX", "XXXXXXX", "XX...XX"],
    ["...X...", "..XXX..", ".XXXXX.", "..XXX..", "...X..."],
    ["X.X.X.X", "X.X.X.X", "X.X.X.X", "X.X.X.X"]
];
const BOSS = [
    "......XXXXXXXXXX......",
    "....XXXXXXXXXXXXXX....",
    "..XXXXXXXXXXXXXXXXXX..",
    ".XXXXEEXXXXXXXXEEXXXX.",
    "XXXXXEEXXXXXXXXEEXXXXX",
    "XXXXXXXXXXXXXXXXXXXXXX",
    "XX.XXXX..XXXX..XXXX.XX",
    "X...XX..........XX...X",
    "....XXX........XXX...."
];
const BOSS_COLORS = ["#ff7aa0", "#9a8aff", "#ffb070"];

function createGameScreen() {
    const cw = 224, ch = 192;
    const STEP = 1 / 30;                  // 30 images/s : rendu rétro et léger
    const SHIP_SPEED = 110;
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const g = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;

    const sfx = createSfx();
    const r = mulberry32(77);
    const stars = Array.from({ length: 50 }, () => ({ x: r() * cw, y: r() * ch, s: 0.4 + r() * 1.4 }));
    const COLORS = ["#ff7aa0", "#ffb070", "#9a8aff", "#7ae0b0", "#7ae0ff"];

    let state = "attract";                // attract (démo) | play | over
    let active = false;                   // le joueur est devant la borne
    let invaders = [], shots = [], bombs = [], bursts = [];
    let score = 0, hi = loadHi(), lives = 3, wave = 0;
    let ship = cw / 2, cooldown = 0, bombT = 1, invuln = 0, overT = 0;
    let ox = 0, oy = 0, dir = 1;          // décalage et sens de la formation
    let boss = null;                      // boss du niveau (un niveau sur cinq)
    let intro = 0;                        // annonce du niveau : les ennemis attendent
    let nextT = -1;                       // pause entre deux niveaux (< 0 : pas de pause)
    let clearMsg = "";
    let acc = 0, frame = 0, t = 0;
    const held = { left: false, right: false, fire: false };

    function spawnWave() {
        wave++;
        nextT = -1;
        ox = oy = 0;
        dir = 1;
        bombs = [];
        boss = null;
        invaders = [];
        intro = state === "play" ? 1.2 : 0;
        if (state === "play" && wave % 5 === 0) {
            const idx = wave / 5 - 1, hp = 14 + idx * 8;
            boss = { x: cw / 2, y: -20, hp, max: hp, ph: 0, fireT: 1.2, flash: 0, idx };
            intro = 1.6;
            sfx.play("boss");
            return;
        }
        // en partie, les boss ne comptent pas dans la rotation des formations
        const k = state === "play" ? wave - 1 - Math.floor(wave / 5) : wave - 1;
        PATTERNS[k % PATTERNS.length].forEach((line, row) => [...line].forEach((cell, col) => {
            if (cell !== "X") return;
            const tough = state === "play" && wave > 5 && row === 0;   // les plus hauts résistent à deux tirs
            invaders.push({ x: 34 + col * 24, y: 26 + row * 16, row, c: tough ? "#ff5050" : COLORS[row], hp: tough ? 2 : 1, flash: 0, alive: true });
        }));
    }

    function reset(next) {
        state = next;
        score = 0;
        lives = 3;
        wave = 0;
        ship = cw / 2;
        shots = [];
        bursts = [];
        cooldown = 0;
        invuln = next === "play" ? 1 : 0;
        if (next === "play") sfx.play("start");
        bombT = 1.5;
        spawnWave();
    }
    reset("attract");

    function gameOver() {
        state = "over";
        overT = 0;
        if (score > hi) { hi = score; saveHi(hi); }
        sfx.play("over");
    }

    const burst = (x, y) => bursts.push({ x, y, k: 0 });

    const invader = (x, y, c, f) => {
        g.fillStyle = c;
        const px = [[1, 0], [5, 0], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [0, 3], [1, 3], [3, 3], [5, 3], [6, 3],
            [0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], f ? [0, 5] : [1, 5], f ? [6, 5] : [5, 5]];
        for (const [a, b] of px) g.fillRect(x - 7 + a * 2, y - 5 + b * 2, 2, 2);
    };

    const text = (s, x, y, align = "left") => { g.textAlign = align; g.fillText(s, x, y); };

    function killBoss() {
        score += 500 * (boss.idx + 1);
        for (let i = 0; i < 8; i++) burst(boss.x + (Math.random() - 0.5) * 44, boss.y + (Math.random() - 0.5) * 18);
        lives = Math.min(5, lives + 1);
        sfx.play("bossdie");
        clearMsg = "BOSS VAINCU ! +1 VIE";
        boss = null;
        bombs = [];
        nextT = 2;
    }

    function update(dt) {
        t += dt;
        frame++;
        for (const s of stars) s.y = (s.y + s.s * 18 * dt) % ch;
        if (state === "over") overT += dt;
        invuln = Math.max(0, invuln - dt);
        cooldown -= dt;
        intro = Math.max(0, intro - dt);

        let alive = invaders.filter((i) => i.alive);
        for (const inv of alive) inv.flash = Math.max(0, inv.flash - dt);

        // niveau terminé : courte pause puis niveau suivant (la démo enchaîne tout de suite)
        let waiting = false;
        if (!alive.length && !boss) {
            if (state === "play") {
                if (nextT < 0) { nextT = 1.3; bombs = []; clearMsg = "NIVEAU TERMINÉ"; sfx.play("wave"); }
                nextT -= dt;
                if (nextT <= 0) { spawnWave(); alive = invaders; } else waiting = true;
            } else if (state === "attract") { spawnWave(); alive = invaders; }
        }

        // commandes : joueur ou pilote automatique en veille
        let move = 0, fire = false;
        if (state === "play") {
            move = (held.right ? 1 : 0) - (held.left ? 1 : 0);
            fire = held.fire;
        } else if (state === "attract" && alive.length) {
            const tgt = alive[(frame >> 5) % alive.length];
            const tx = tgt.x + ox + Math.sin(t * 0.8) * 6;
            move = Math.abs(tx - ship) > 2 ? Math.sign(tx - ship) : 0;
            fire = true;
        }
        if (state !== "over") ship = Math.min(cw - 8, Math.max(8, ship + move * SHIP_SPEED * dt));
        if (fire && cooldown <= 0 && shots.length < 4) {
            shots.push({ x: ship, y: ch - 24 });
            cooldown = state === "play" ? 0.3 : 0.4;
            if (state === "play") sfx.play("shoot");
        }

        // formation : accélère quand il en reste peu, descend à chaque bord
        if (state !== "over" && alive.length && intro <= 0) {
            const frac = alive.length / invaders.length;
            ox += dir * Math.min(14 + wave * 3, 45) * (1 + 2 * (1 - frac)) * dt;
            let lo = Infinity, hi2 = -Infinity;
            for (const i of alive) { lo = Math.min(lo, i.x); hi2 = Math.max(hi2, i.x); }
            if ((dir > 0 && hi2 + ox + 8 > cw - 6) || (dir < 0 && lo + ox - 8 < 6)) {
                dir = -dir;
                ox += dir * 1.5;
                if (state === "play" || oy < 22) oy += 8;
            }
        }

        // boss : arrive du haut, balaie l'écran et tire en éventail (plus vite sous la moitié de ses points de vie)
        if (boss && state === "play") {
            const rage = boss.hp <= boss.max / 2;
            boss.flash = Math.max(0, boss.flash - dt);
            if (intro > 0) boss.y = -20 + 56 * (1 - intro / 1.6);
            else {
                boss.ph += (0.9 + boss.idx * 0.12) * (rage ? 1.5 : 1) * dt;
                boss.x = cw / 2 + Math.sin(boss.ph) * 72;
                boss.fireT -= dt;
                if (boss.fireT <= 0) {
                    const n = rage ? 5 : 3;
                    for (let i = 0; i < n; i++) bombs.push({ x: boss.x, y: boss.y + 10, vx: (i - (n - 1) / 2) * 22 });
                    boss.fireT = rage ? 0.9 : 1.4;
                }
            }
        }

        // tirs du joueur
        shots = shots.filter((s) => {
            s.y -= 150 * dt;
            for (const inv of alive) {
                if (inv.alive && Math.abs(s.x - (inv.x + ox)) < 8 && Math.abs(s.y - (inv.y + oy)) < 7) {
                    if (state === "play") sfx.play("hit");
                    if (--inv.hp > 0) { inv.flash = 0.08; return false; }
                    inv.alive = false;
                    score += Math.max(10, 30 - inv.row * 10) * (inv.c === "#ff5050" ? 2 : 1);
                    burst(inv.x + ox, inv.y + oy);
                    return false;
                }
            }
            if (boss && intro <= 0 && Math.abs(s.x - boss.x) < 22 && Math.abs(s.y - boss.y) < 9) {
                boss.hp--;
                boss.flash = 0.08;
                score += 5;
                burst(s.x, s.y);
                sfx.play("hit");
                if (boss.hp <= 0) killBoss();
                return false;
            }
            return s.y > 0;
        });

        // bombes des envahisseurs et fin de partie
        if (state === "play") {
            if (intro <= 0) bombT -= dt;
            if (bombT <= 0 && alive.length) {
                const col = alive[Math.floor(Math.random() * alive.length)].x;
                const low = alive.filter((i) => i.x === col).reduce((a, b) => (b.y > a.y ? b : a));
                bombs.push({ x: low.x + ox, y: low.y + oy + 6 });
                bombT = Math.max(0.4, 1.3 - wave * 0.09) * (0.6 + Math.random() * 0.8);
            }
            bombs = bombs.filter((b) => {
                b.y += Math.min(60 + wave * 4, 120) * dt;
                b.x += (b.vx || 0) * dt;
                if (invuln <= 0 && Math.abs(b.x - ship) < 8 && b.y > ch - 26 && b.y < ch - 12) {
                    burst(ship, ch - 18);
                    invuln = 1.6;
                    sfx.play("hurt");
                    if (--lives <= 0) gameOver();
                    return false;
                }
                return b.y < ch && b.x > 0 && b.x < cw;
            });
            if (state === "play" && alive.some((i) => i.y + oy > ch - 34)) { lives = 0; burst(ship, ch - 18); gameOver(); }
        }
    }

    function draw() {
        g.fillStyle = "#0a0614";
        g.fillRect(0, 0, cw, ch);
        for (const s of stars) {
            g.fillStyle = s.s > 1.2 ? "#e8dcff" : "#6a5a8a";
            g.fillRect(s.x | 0, s.y | 0, 1, s.s > 1.2 ? 2 : 1);
        }

        for (const inv of invaders) if (inv.alive) invader(inv.x + ox, inv.y + oy, inv.flash > 0 ? "#fff0d0" : inv.c, (frame >> 3) & 1);
        if (boss) {
            BOSS.forEach((line, row) => [...line].forEach((cell, col) => {
                if (cell === ".") return;
                g.fillStyle = cell === "E" ? (boss.hp <= boss.max / 2 ? "#ff3050" : "#fff0d0") : boss.flash > 0 ? "#fff0d0" : BOSS_COLORS[boss.idx % 3];
                g.fillRect((boss.x - 22 + col * 2) | 0, (boss.y - 9 + row * 2) | 0, 2, 2);
            }));
            if (intro <= 0) {
                g.fillStyle = "#3a2a5a";
                g.fillRect(62, 17, 100, 3);
                g.fillStyle = "#ff5a7a";
                g.fillRect(62, 17, Math.ceil(100 * boss.hp / boss.max), 3);
            }
        }

        g.fillStyle = "#ffe0a0";
        for (const s of shots) g.fillRect(s.x - 1, s.y, 2, 5);
        g.fillStyle = "#ff7aa0";
        for (const b of bombs) g.fillRect(b.x - 1, b.y, 2, 5);

        bursts = bursts.filter((b) => {
            b.k++;
            g.fillStyle = b.k < 3 ? "#fff0d0" : "#ff9a6a";
            for (let a = 0; a < 6; a++) g.fillRect(b.x + Math.cos(a) * b.k * 2, b.y + Math.sin(a) * b.k * 2, 2, 2);
            return b.k < 6;
        });

        // vaisseau du joueur (clignote après un coup)
        if (state !== "over" && !(invuln > 0 && state === "play" && (frame >> 1) & 1)) {
            g.fillStyle = "#7ae0ff";
            g.fillRect(ship - 1, ch - 24, 2, 4);
            g.fillRect(ship - 5, ch - 20, 10, 4);
            g.fillRect(ship - 7, ch - 16, 14, 3);
            g.fillStyle = "#ff9a6a";
            if (frame & 1) g.fillRect(ship - 2, ch - 13, 4, 2);
        }

        // score, vies et sol
        g.fillStyle = "#ffd2a0";
        g.font = "10px monospace";
        text(`SCORE ${String(score).padStart(5, "0")}`, 8, 12);
        text(`HI ${String(Math.max(hi, score)).padStart(5, "0")}`, cw - 8, 12, "right");
        g.fillStyle = "#3a2a5a";
        g.fillRect(0, ch - 8, cw, 1);
        if (state === "play") {
            g.fillStyle = "#7ae0ff";
            for (let i = 0; i < lives; i++) g.fillRect(8 + i * 10, ch - 5, 7, 3);
            g.fillStyle = "#ffd2a0";
            g.font = "8px monospace";
            text(`NIV ${wave}`, cw - 8, ch - 1, "right");
        }

        // messages
        const blink = (frame >> 4) & 1;
        g.fillStyle = "#ff9ad0";
        if (state === "attract") {
            const help = active && ((t / 3) | 0) % 2;
            if (help) { g.font = "8px monospace"; text("← → BOUGER · ESPACE TIRER", cw / 2, ch - 1, "center"); }
            else if (blink) text(active ? "ENTRÉE : JOUER" : "INSERT COIN", cw / 2, ch - 1, "center");
        } else if (state === "play" && (intro > 0 || nextT >= 0)) {
            g.fillStyle = "rgba(10,6,20,0.5)";
            g.fillRect(0, ch / 2 - 22, cw, 44);
            const isBoss = intro > 0 && boss;
            g.fillStyle = isBoss ? "#ff5a7a" : "#ffd2a0";
            g.font = "bold 16px monospace";
            if (intro > 0) {
                text(isBoss ? "! BOSS !" : `NIVEAU ${wave}`, cw / 2, ch / 2 + 1, "center");
                g.font = "10px monospace";
                g.fillStyle = "#ff9ad0";
                text(isBoss ? `NIVEAU ${wave}` : "PRÊT ?", cw / 2, ch / 2 + 15, "center");
            } else {
                g.font = "bold 12px monospace";
                text(clearMsg, cw / 2, ch / 2 + 4, "center");
            }
        } else if (state === "over") {
            g.fillStyle = "rgba(10,6,20,0.6)";
            g.fillRect(0, ch / 2 - 26, cw, 52);
            g.fillStyle = "#ffd2a0";
            g.font = "bold 16px monospace";
            text("GAME OVER", cw / 2, ch / 2 - 2, "center");
            g.font = "10px monospace";
            g.fillStyle = score >= hi && score > 0 ? "#7ae0ff" : "#ffd2a0";
            text(score >= hi && score > 0 ? "NOUVEAU RECORD !" : `NIVEAU ${wave} · SCORE ${score}`, cw / 2, ch / 2 + 12, "center");
            g.fillStyle = "#ff9ad0";
            if (blink && overT > 0.8) text("ENTRÉE : REJOUER", cw / 2, ch - 1, "center");
        }

        // lignes de balayage
        g.fillStyle = "rgba(0,0,0,0.22)";
        for (let y = 0; y < ch; y += 2) g.fillRect(0, y, cw, 1);
        tex.needsUpdate = true;
    }

    function step(dt) {
        acc = Math.min(acc + dt, STEP * 3);
        if (acc < STEP) return;
        while (acc >= STEP) { update(STEP); acc -= STEP; }
        draw();
    }
    update(STEP);
    draw();
    onFrame((dt) => step(dt));

    const game = {
        // le joueur arrive devant la borne / s'en va (la partie en cours est alors abandonnée)
        setActive(v) {
            if (v === active) return;
            active = v;
            held.left = held.right = held.fire = false;
            if (!v && state !== "attract") reset("attract");
        },
        // touche pressée / relâchée ; renvoie true si elle est utilisée par le jeu
        key(code, down) {
            if (down) sfx.unlock();
            const k = KEYS[code];
            if (k) {
                held[k] = down;
                if (down && k === "fire" && state !== "play") code = "Enter";   // espace lance aussi la partie
                else return true;
            }
            if (down && code === "Enter" && (state === "attract" || (state === "over" && overT > 0.8))) reset("play");
            return k !== undefined || code === "Enter";
        }
    };
    return { tex, game };
}


// --- borne -------------------------------------------------------------------------

// Pose la borne en position (sol), tournée de rotationY. Renvoie { group, screen, screenCenter, game }
// opts : screen (fabrique de l'écran de jeu → { tex, game }), marquee [japonais, nom], body, edge (couleurs)
export function createArcade(position, rotationY, opts = {}) {
    const { screen: makeScreen = createGameScreen, marquee: [jp, title] = ["未来", "STAR·RUN"], body: bodyColor = 0x2a1a2e, edge: edgeColor = 0xff9a6a } = opts;
    const group = new THREE.Group();
    const body = std(bodyColor, { roughness: 0.55 });
    const black = std(0x0c0a10, { roughness: 0.4 });
    const add = (geo, mat, x, y, z, rx = 0) => {
        const m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        m.rotation.x = rx;
        m.castShadow = m.receiveShadow = true;
        group.add(m);
        return m;
    };

    // caisse : profil extrudé sur la largeur (profil dans le plan u-y → avant +z)
    const shape = profileShape();
    const caseGeo = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false });
    caseGeo.rotateY(-Math.PI / 2).translate(W / 2, 0, 0);
    add(caseGeo, body, 0, 0, 0);

    // décors latéraux
    const art = new THREE.MeshStandardMaterial({ map: sideArtTexture(), roughness: 0.6, side: THREE.DoubleSide });
    const sideGeo = new THREE.ShapeGeometry(shape).rotateY(-Math.PI / 2);   // profil u → +z
    for (const s of [-1, 1]) {
        const side = new THREE.Mesh(sideGeo, art);
        side.position.x = s * (W / 2 + 0.002);
        group.add(side);
    }
    // liserés (T-molding) le long du profil, côté visible et caché
    const edge = glow(edgeColor, 0.7);
    for (let i = 0; i < PROFILE.length; i++) {
        const [u0, y0] = PROFILE[i], [u1, y1] = PROFILE[(i + 1) % PROFILE.length];
        if (u0 === 0 && u1 === 0) continue;            // dos
        if (y0 === 0 && y1 === 0) continue;            // dessous
        const len = Math.hypot(u1 - u0, y1 - y0);
        for (const s of [-1, 1]) {
            const m = new THREE.Mesh(new THREE.BoxGeometry(0.012, len, 0.012), edge);
            m.position.set(s * (W / 2 + 0.004), (y0 + y1) / 2, (u0 + u1) / 2);
            m.rotation.x = Math.atan2(u1 - u0, y1 - y0);
            group.add(m);
        }
    }

    // écran : cadre noir + jeu
    const { u, y, tilt, w, h } = SCREEN;
    // normale de l'écran : (0, sin tilt, cos tilt), tilt mesuré depuis la verticale
    add(new THREE.PlaneGeometry(W - 0.06, h + 0.06), black, 0, y + 0.003 * Math.sin(tilt), u + 0.003 * Math.cos(tilt), -tilt);
    const { tex: gameTex, game } = makeScreen();
    const screenMat = new THREE.MeshBasicMaterial({ map: gameTex, color: new THREE.Color(0.95, 0.95, 0.95) });
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat);
    screen.position.set(0, y + 0.006 * Math.sin(tilt), u + 0.006 * Math.cos(tilt));
    screen.rotation.x = -tilt;
    group.add(screen);

    // fronton lumineux
    const marquee = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.04, 0.2), new THREE.MeshBasicMaterial({ map: marqueeTexture(jp, title), color: new THREE.Color(0.85, 0.85, 0.85) }));
    marquee.position.set(0, 1.74, 0.562);
    group.add(marquee);

    // panneau de commandes : joystick et boutons sur la pente
    const panelY = (pu) => 0.9 + (0.74 - pu) * (0.08 / 0.18);
    const slope = Math.atan2(0.08, 0.18);
    add(new THREE.BoxGeometry(W - 0.02, 0.006, 0.2), black, 0, panelY(0.65) + 0.004, 0.65, slope);
    const pu = 0.66, py = panelY(pu) + 0.008;
    add(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 20), black, -0.15, py, pu);
    add(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), std(0x1a1a1e, { metalness: 0.6, roughness: 0.3 }), -0.15, py + 0.035, pu);
    add(new THREE.SphereGeometry(0.02, 16, 12), std(0xc04a4a, { roughness: 0.3 }), -0.15, py + 0.075, pu);
    const buttons = [[0xff9a6a, 0.0, 0.69], [0xff7aa0, 0.06, 0.685], [0x9a8aff, 0.12, 0.68], [0xffd090, 0.03, 0.635], [0x7ae0ff, 0.09, 0.63]];
    for (const [c, bx, bu] of buttons) {
        add(new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16), glow(c, 0.8), bx, panelY(bu) + 0.01, bu, slope);
    }

    // monnayeur
    add(new THREE.BoxGeometry(0.24, 0.2, 0.01), black, 0, 0.5, 0.705);
    for (const x of [-0.05, 0.05]) {
        add(new THREE.BoxGeometry(0.035, 0.05, 0.004), glow(0xff8a50, 0.9), x, 0.53, 0.711);
        add(new THREE.BoxGeometry(0.004, 0.026, 0.006), black, x, 0.53, 0.714);
    }

    // lueur de l'écran sur l'environnement
    const light = new THREE.PointLight(0x9a8aff, 0.5, 2.2, 2);
    light.position.set(0, 1.3, 0.9);
    group.add(light);

    group.position.copy(position);
    group.rotation.y = rotationY;
    scene.add(group);
    group.updateMatrixWorld(true);
    const screenCenter = new THREE.Vector3();
    screen.getWorldPosition(screenCenter);
    return { group, screen, screenCenter, game };
}
