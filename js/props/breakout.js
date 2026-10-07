import * as THREE from "three";
import { onFrame } from "../core/animated.js";
import { KEYS, createSfx, hiScore } from "./arcadeShared.js";

// Casse-briques de la seconde borne : démo en veille (pilote automatique), jouable au clavier
// ou aux boutons tactiles. Même interface que le jeu de la première borne : { tex, game }.
// Certaines briques (marquées d'un symbole) lâchent un bonus à rattraper avec la raquette :
// une bille (+2 billes en jeu) ou un cœur (+1 vie).

const hiStore = hiScore("breaker-hi");
const ROW_COLORS = ["#ff7aa0", "#ffb070", "#ffe08a", "#7ae0b0", "#7ae0ff"];
const HEART = ["0X0X0", "XXXXX", "0XXX0", "00X00"];     // cœur 5x4
const MAX_BALLS = 6, MAX_LIVES = 5;

export function createBreakoutScreen() {
    const cw = 224, ch = 192;
    const STEP = 1 / 30;
    const PAD_Y = ch - 18, PAD_SPEED = 200, BRICK_W = 24, BRICK_H = 8;
    const SUBSTEPS = 3;                   // la balle va vite : on la fait avancer par petits pas
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const g = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.LinearFilter;

    const sfx = createSfx();

    let state = "attract";                // attract (démo) | play | over
    let active = false;
    let bricks = [], bursts = [], pickups = [], balls = [];
    let score = 0, hi = hiStore.load(), lives = 3, level = 0;
    let padX = cw / 2, padW = 34;
    let nextT = -1, overT = 0, acc = 0, frame = 0, t = 0;
    const held = { left: false, right: false, fire: false };

    // formation des briques selon le niveau (r : rangée, c : colonne)
    const SHAPES = [
        () => true,                                       // plein
        (r, c) => (r + c) % 2 === 0,                      // damier
        (r, c) => c >= r && c < 8 - r,                    // pyramide inversée
        (r, c) => r % 2 === 0 || c === 0 || c === 7,      // rayures et montants
        (r, c) => Math.abs(c - 3.5) >= r * 0.7            // entonnoir
    ];

    const ballSpeed = () => Math.min(150 + level * 10, 260);
    const stuck = () => balls.length === 1 && balls[0].stuck;

    function buildLevel() {
        level++;
        nextT = -1;
        const shape = SHAPES[(level - 1) % SHAPES.length];
        const rows = Math.min(4 + (level > 5 ? 1 : 0), 5);
        bricks = [];
        pickups = [];
        for (let r = 0; r < rows; r++) for (let c = 0; c < 8; c++) {
            if (!shape(r, c)) continue;
            const hard = state === "play" && level >= 3 && r === 0;      // la rangée du haut résiste à deux coups
            const roll = Math.random();
            const drop = roll < 0.06 ? "heart" : roll < 0.2 ? "ball" : null;
            bricks.push({ x: 9 + c * 26, y: 26 + r * 10, row: r, hp: hard ? 2 : 1, flash: 0, drop });
        }
        padW = Math.max(24, 34 - level);
        stick();
    }

    function stick() {
        balls = [{ x: padX, y: PAD_Y - 4, vx: 0, vy: 0, stuck: true }];
    }

    function launch() {
        const b = balls[0], a = Math.random() * 0.6 - 0.3, speed = ballSpeed();
        b.vx = Math.sin(a) * speed;
        b.vy = -Math.cos(a) * speed;
        b.stuck = false;
        if (state === "play") sfx.play("shoot");
    }

    // bonus « billes » : deux billes de plus, parties de la bille la plus haute, dans des directions voisines
    function multiBall() {
        const src = balls.reduce((a, b) => (b.y < a.y ? b : a));
        const speed = Math.hypot(src.vx, src.vy) || ballSpeed();
        const base = Math.atan2(src.vx, -src.vy);
        for (const da of [-0.5, 0.5]) {
            if (balls.length >= MAX_BALLS) break;
            const a = base + da;
            balls.push({ x: src.x, y: src.y, vx: Math.sin(a) * speed, vy: -Math.cos(a) * speed, stuck: false });
        }
    }

    function reset(next) {
        state = next;
        score = 0;
        lives = 3;
        level = 0;
        bursts = [];
        padX = cw / 2;
        buildLevel();
        if (next === "play") sfx.play("start");
    }
    reset("attract");

    function gameOver() {
        state = "over";
        overT = 0;
        if (score > hi) { hi = score; hiStore.save(hi); }
        sfx.play("over");
    }

    const burst = (x, y) => bursts.push({ x, y, k: 0 });
    const text = (s, x, y, align = "left") => { g.textAlign = align; g.fillText(s, x, y); };

    function hitBrick(b) {
        if (--b.hp > 0) { b.flash = 0.08; sfx.play("bounce"); return; }
        bricks.splice(bricks.indexOf(b), 1);
        score += (5 - b.row) * 10;
        burst(b.x + BRICK_W / 2, b.y + BRICK_H / 2);
        if (b.drop) pickups.push({ x: b.x + BRICK_W / 2, y: b.y + BRICK_H, type: b.drop });
        if (state === "play") sfx.play("hit");
    }

    const brickAt = (x, y) => bricks.find((b) => x >= b.x && x < b.x + BRICK_W && y >= b.y && y < b.y + BRICK_H);

    function moveBall(ball, dt) {
        // x puis y séparément : on sait sur quelle face la balle rebondit
        let nx = ball.x + ball.vx * dt;
        if (nx < 4 || nx > cw - 4) { ball.vx = -ball.vx; nx = Math.min(cw - 4, Math.max(4, nx)); sfx.play("bounce"); }
        const bx = brickAt(nx + Math.sign(ball.vx) * 2, ball.y);
        if (bx) { ball.vx = -ball.vx; nx = ball.x; hitBrick(bx); }
        ball.x = nx;

        let ny = ball.y + ball.vy * dt;
        if (ny < 18) { ball.vy = Math.abs(ball.vy); ny = 18; sfx.play("bounce"); }
        const by = brickAt(ball.x, ny + Math.sign(ball.vy) * 2);
        if (by) { ball.vy = -ball.vy; ny = ball.y; hitBrick(by); }
        ball.y = ny;

        // raquette : l'angle dépend de l'endroit touché
        if (ball.vy > 0 && ball.y >= PAD_Y - 3 && ball.y <= PAD_Y + 4 && Math.abs(ball.x - padX) <= padW / 2 + 2) {
            const speed = Math.hypot(ball.vx, ball.vy);
            const a = Math.max(-1, Math.min(1, (ball.x - padX) / (padW / 2))) * 1.05;
            ball.vx = Math.sin(a) * speed;
            ball.vy = -Math.cos(a) * speed;
            ball.y = PAD_Y - 3;
            sfx.play("bounce");
        }
    }

    function update(dt) {
        t += dt;
        frame++;
        if (state === "over") overT += dt;
        for (const b of bricks) b.flash = Math.max(0, b.flash - dt);

        // niveau terminé : courte pause puis niveau suivant
        if (!bricks.length) {
            if (state === "play") {
                if (nextT < 0) { nextT = 1.3; sfx.play("wave"); stick(); pickups = []; }
                nextT -= dt;
                if (nextT <= 0) buildLevel();
            } else if (state === "attract") buildLevel();
        }

        // commandes : joueur ou pilote automatique en veille
        let move = 0;
        if (state === "play") move = (held.right ? 1 : 0) - (held.left ? 1 : 0);
        else if (state === "attract") {
            const low = balls.reduce((a, b) => (b.y > a.y ? b : a));
            const tx = stuck() ? cw / 2 + Math.sin(t) * 40 : low.x;
            move = Math.abs(tx - padX) > 3 ? Math.sign(tx - padX) : 0;
            if (stuck() && frame % 20 === 0) launch();
        }
        if (state !== "over") padX = Math.min(cw - padW / 2, Math.max(padW / 2, padX + move * PAD_SPEED * dt));
        if (state === "play" && held.fire && stuck() && nextT < 0) launch();

        if (stuck()) { balls[0].x = padX; balls[0].y = PAD_Y - 4; }
        else if (state !== "over") {
            for (let i = 0; i < SUBSTEPS; i++) for (const b of balls.slice()) moveBall(b, dt / SUBSTEPS);
            // billes perdues : la partie ne perd une vie que quand il n'en reste plus aucune
            const lost = balls.filter((b) => b.y > ch);
            for (const b of lost) burst(b.x, ch - 10);
            balls = balls.filter((b) => b.y <= ch);
            if (!balls.length) {
                if (state === "play") {
                    sfx.play("hurt");
                    pickups = [];
                    if (--lives <= 0) gameOver();
                }
                stick();
            }
        }

        // bonus qui tombent : rattrapés par la raquette
        pickups = pickups.filter((p) => {
            p.y += 55 * dt;
            if (p.y >= PAD_Y - 2 && p.y <= PAD_Y + 6 && Math.abs(p.x - padX) <= padW / 2 + 4) {
                if (state === "play" || state === "attract") {
                    if (p.type === "heart") { if (state === "play") lives = Math.min(MAX_LIVES, lives + 1); }
                    else if (!stuck()) multiBall();
                    if (state === "play") { score += 50; sfx.play(p.type === "heart" ? "wave" : "start"); }
                }
                burst(p.x, PAD_Y);
                return false;
            }
            return p.y < ch;
        });
    }

    function heart(x, y, size, color) {
        g.fillStyle = color;
        HEART.forEach((line, r) => [...line].forEach((cell, c) => { if (cell === "X") g.fillRect(x + c * size, y + r * size, size, size); }));
    }

    function draw() {
        g.fillStyle = "#070a18";
        g.fillRect(0, 0, cw, ch);
        // fond : grille discrète
        g.fillStyle = "#101830";
        for (let x = 0; x < cw; x += 16) g.fillRect(x, 16, 1, ch - 16);
        for (let y = 16; y < ch; y += 16) g.fillRect(0, y, cw, 1);
        g.fillStyle = "#3a4a7a";
        g.fillRect(0, 16, cw, 1);

        for (const b of bricks) {
            g.fillStyle = b.flash > 0 ? "#fff0d0" : ROW_COLORS[b.row];
            g.fillRect(b.x, b.y, BRICK_W, BRICK_H);
            g.fillStyle = "rgba(255,255,255,0.28)";
            g.fillRect(b.x, b.y, BRICK_W, 1);
            g.fillStyle = "rgba(0,0,0,0.3)";
            g.fillRect(b.x, b.y + BRICK_H - 1, BRICK_W, 1);
            if (b.hp > 1) { g.fillStyle = "rgba(0,0,0,0.45)"; g.fillRect(b.x + 10, b.y + 3, 4, 2); }
            // symbole du bonus caché
            if (b.drop === "heart") heart(b.x + 9, b.y + 2, 1, "#ffffff");
            else if (b.drop === "ball") { g.fillStyle = "#ffffff"; g.fillRect(b.x + 10, b.y + 2, 4, 4); g.fillRect(b.x + 9, b.y + 3, 6, 2); }
        }

        for (const p of pickups) {
            if (p.type === "heart") heart(p.x - 5, p.y - 4, 2, "#ff4070");
            else {
                g.fillStyle = "#7ae0ff";
                g.fillRect(p.x - 3, p.y - 4, 6, 8);
                g.fillRect(p.x - 4, p.y - 3, 8, 6);
                g.fillStyle = "#e8fbff";
                g.fillRect(p.x - 2, p.y - 3, 2, 2);
            }
        }

        bursts = bursts.filter((b) => {
            b.k++;
            g.fillStyle = b.k < 3 ? "#fff0d0" : "#ff9a6a";
            for (let a = 0; a < 6; a++) g.fillRect(b.x + Math.cos(a) * b.k * 2, b.y + Math.sin(a) * b.k * 2, 2, 2);
            return b.k < 6;
        });

        if (state !== "over") {
            g.fillStyle = "#7ae0ff";
            g.fillRect(padX - padW / 2, PAD_Y, padW, 4);
            g.fillStyle = "#ff9a6a";
            g.fillRect(padX - padW / 2, PAD_Y, 3, 4);
            g.fillRect(padX + padW / 2 - 3, PAD_Y, 3, 4);
            g.fillStyle = "#fff0d0";
            for (const b of balls) g.fillRect(b.x - 2, b.y - 2, 4, 4);
        }

        g.fillStyle = "#ffd2a0";
        g.font = "10px monospace";
        text(`SCORE ${String(score).padStart(5, "0")}`, 8, 12);
        text(`HI ${String(Math.max(hi, score)).padStart(5, "0")}`, cw - 8, 12, "right");
        g.fillStyle = "#3a2a5a";
        g.fillRect(0, ch - 8, cw, 1);
        if (state === "play") {
            for (let i = 0; i < lives; i++) heart(8 + i * 8, ch - 6, 1, "#ff4070");
            g.fillStyle = "#ffd2a0";
            g.font = "8px monospace";
            text(`NIV ${level}`, cw - 8, ch - 1, "right");
        }

        const blink = (frame >> 4) & 1;
        g.fillStyle = "#ff9ad0";
        if (state === "attract") {
            const help = active && ((t / 3) | 0) % 2;
            if (help) { g.font = "8px monospace"; text("← → BOUGER · ESPACE LANCER", cw / 2, ch - 1, "center"); }
            else if (blink) text(active ? "ENTRÉE : JOUER" : "INSERT COIN", cw / 2, ch - 1, "center");
        } else if (state === "play") {
            if (nextT >= 0) {
                g.fillStyle = "rgba(7,10,24,0.55)";
                g.fillRect(0, ch / 2 - 14, cw, 28);
                g.fillStyle = "#ffd2a0";
                g.font = "bold 12px monospace";
                text("NIVEAU TERMINÉ", cw / 2, ch / 2 + 4, "center");
            } else if (stuck() && blink) {
                g.font = "10px monospace";
                text(`NIVEAU ${level} · ESPACE : LANCER`, cw / 2, ch / 2 + 30, "center");
            }
        } else {
            g.fillStyle = "rgba(7,10,24,0.65)";
            g.fillRect(0, ch / 2 - 26, cw, 52);
            g.fillStyle = "#ffd2a0";
            g.font = "bold 16px monospace";
            text("GAME OVER", cw / 2, ch / 2 - 2, "center");
            g.font = "10px monospace";
            g.fillStyle = score >= hi && score > 0 ? "#7ae0ff" : "#ffd2a0";
            text(score >= hi && score > 0 ? "NOUVEAU RECORD !" : `NIVEAU ${level} · SCORE ${score}`, cw / 2, ch / 2 + 12, "center");
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
