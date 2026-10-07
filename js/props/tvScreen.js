import * as THREE from "three";
import { onFrame } from "../core/animated.js";
import { mulberry32 } from "../core/random.js";
import { makeTvTexture } from "../core/textures.js";

// Écran de la télé du salon : cinq chaînes animées qui bouclent toutes les 12 secondes (fréquences
// entières : aucun à-coup au redémarrage), avec parasites à chaque changement et incrustation du
// numéro de chaîne :
//   1 Lofi · nuit de pluie  2 Aquarium  3 Cheminée  4 Synthwave  5 Mire de test
// Dessiné en 15 images/s dans une texture canvas. next() / prev() changent de chaîne.

const W = 640, H = 360;
const LOOP = 12;          // secondes
const FPS = 15;
const ZAP = 0.4;          // durée des parasites
const TAU = Math.PI * 2;
const HEAD = { x: W * 0.74, y: H * 0.47 };       // tête de la silhouette (chaîne 1)
const NECK = { x: W * 0.74, y: H * 0.64 };       // pivot du hochement

const wrap = (v, m) => ((v % m) + m) % m;

function layer(draw) {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    draw(c.getContext("2d"));
    return c;
}

export function createTvScreen() {
    // l'ancienne texture fixe consommait des tirages du flux aléatoire global ; on les consomme encore
    // (puis on la jette) pour que les livres, plantes et feuilles du salon restent à l'identique
    makeTvTexture().dispose();

    const rnd = mulberry32(2024);
    const range = (a, b) => a + rnd() * (b - a);

    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const g = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;

    // ------------------------------------------------------------------ chaîne 1 : lofi

    function makeLofi() {
        const sky = layer((c) => {
            const bg = c.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, "#1a1650");
            bg.addColorStop(0.55, "#7a3ca8");
            bg.addColorStop(1, "#2a1440");
            c.fillStyle = bg;
            c.fillRect(0, 0, W, H);
        });

        // ville en deux plans ; les fenêtres qui vacillent sont listées pour être redessinées à chaque image
        const windows = [];
        function city(base, minH, maxH, color, lit, plane) {
            return layer((c) => {
                for (let x = -10; x < W; x += range(10, 26)) {
                    const bw = range(14, 34), bh = range(minH, maxH);
                    c.fillStyle = color;
                    c.fillRect(x, base - bh, bw, bh);
                    for (let y = base - bh + 5; y < base - 6; y += 9) {
                        for (let xx = x + 3; xx < x + bw - 4; xx += 7) {
                            const r = rnd();
                            if (r < lit * 0.45) { c.fillStyle = "rgba(255,200,140,0.75)"; c.fillRect(xx, y, 2.5, 3.5); }
                            else if (r < lit) windows.push({ x: xx, y, f: 1 + Math.floor(rnd() * 3), ph: rnd(), duty: range(0.25, 0.7), plane });
                        }
                    }
                }
            });
        }
        const cityFar = city(H * 0.72, 40, 150, "#2a1a52", 0.16, 0);
        const cityNear = city(H * 0.86, 30, 120, "#150c30", 0.3, 1);

        const sill = layer((c) => {
            c.fillStyle = "#0c0718";
            c.fillRect(0, H * 0.9, W, H * 0.1);
            c.fillStyle = "rgba(255,170,200,0.12)";
            c.fillRect(0, H * 0.9, W, 2);
        });
        const vignette = layer((c) => {
            const v = c.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
            v.addColorStop(0, "rgba(10,4,20,0)");
            v.addColorStop(1, "rgba(10,4,20,0.5)");
            c.fillStyle = v;
            c.fillRect(0, 0, W, H);
        });

        const stars = Array.from({ length: 46 }, () => ({ x: rnd() * W, y: rnd() * H * 0.5, ph: rnd(), f: 1 + Math.floor(rnd() * 4), r: range(0.6, 1.5) }));
        const clouds = Array.from({ length: 4 }, (_, i) => ({ x: rnd() * W, y: range(H * 0.08, H * 0.38), w: range(110, 200), h: range(10, 18), n: 1 + (i % 2) }));
        const drops = Array.from({ length: 70 }, () => ({ x: rnd() * (W + 60), y: rnd() * H, len: range(8, 18), cycles: 3 + Math.floor(rnd() * 3) }));

        function flicker(u, plane) {
            g.fillStyle = "rgba(255,205,150,0.8)";
            for (const w of windows) {
                if (w.plane === plane && ((w.f * u + w.ph) % 1) < w.duty) g.fillRect(w.x, w.y, 2.5, 3.5);
            }
        }

        return (u) => {
            g.drawImage(sky, 0, 0);

            // lune qui palpite doucement
            const pulse = 0.5 + 0.5 * Math.sin(TAU * u * 2);
            const glow = g.createRadialGradient(W * 0.28, H * 0.2, 6, W * 0.28, H * 0.2, 90 + pulse * 10);
            glow.addColorStop(0, "rgba(255,220,240,0.75)");
            glow.addColorStop(0.25, "rgba(255,170,220,0.28)");
            glow.addColorStop(1, "rgba(255,150,220,0)");
            g.fillStyle = glow;
            g.fillRect(0, 0, W, H * 0.6);
            g.fillStyle = "#ffe8f0";
            g.beginPath();
            g.arc(W * 0.28, H * 0.2, 26, 0, TAU);
            g.fill();

            for (const s of stars) {
                g.fillStyle = `rgba(255,235,255,${(0.25 + 0.75 * Math.max(0, Math.sin(TAU * (s.f * u + s.ph)))).toFixed(2)})`;
                g.fillRect(s.x, s.y, s.r, s.r);
            }

            g.fillStyle = "rgba(255,170,210,0.16)";
            for (const c of clouds) {
                const x = ((c.x + u * c.n * (W + c.w * 2)) % (W + c.w * 2)) - c.w;
                g.beginPath();
                g.ellipse(x, c.y, c.w / 2, c.h, 0, 0, TAU);
                g.fill();
            }

            // avion à feu rouge clignotant
            const px = -20 + u * (W + 40), py = H * 0.12 + Math.sin(TAU * u) * 6;
            g.fillStyle = Math.sin(TAU * 12 * u) > 0.3 ? "rgba(255,90,90,0.95)" : "rgba(255,90,90,0.15)";
            g.fillRect(px, py, 2.5, 2.5);

            g.drawImage(cityFar, 0, 0);
            flicker(u, 0);

            // train sur le viaduc : une rame de voitures éclairées qui traverse une fois par boucle
            const ry = H * 0.67;
            g.fillStyle = "#1a1036";
            g.fillRect(0, ry + 12, W, 4);
            const tx = -270 + u * (W + 300);
            for (let i = 0; i < 6; i++) {
                const x = tx + i * 46;
                g.fillStyle = "#241648";
                g.fillRect(x, ry, 42, 13);
                g.fillStyle = "rgba(255,215,150,0.9)";
                for (let k = 0; k < 5; k++) g.fillRect(x + 4 + k * 7.5, ry + 3, 4.5, 4);
            }
            g.fillStyle = "rgba(255,200,140,0.08)";
            g.fillRect(tx, ry + 16, 276, 18);

            g.drawImage(cityNear, 0, 0);
            flicker(u, 1);

            // silhouette au casque : épaules fixes, tête qui hoche en rythme (8 fois par boucle)
            const beat = Math.sin(TAU * 8 * u);
            g.fillStyle = "#120a26";
            g.beginPath();
            g.moveTo(W * 0.58, H);
            g.quadraticCurveTo(W * 0.62, H * 0.66, W * 0.74, H * 0.66);
            g.quadraticCurveTo(W * 0.88, H * 0.66, W * 0.92, H);
            g.fill();
            g.save();
            g.translate(NECK.x, NECK.y);
            g.rotate(beat * 0.045);
            g.translate(-NECK.x, -NECK.y + Math.abs(beat) * 2);
            g.fillStyle = "#120a26";
            g.beginPath();
            g.ellipse(HEAD.x, HEAD.y, 52, 62, 0, 0, TAU);
            g.fill();
            g.strokeStyle = "rgba(255,190,230,0.3)";
            g.lineWidth = 2;
            g.beginPath();
            g.ellipse(HEAD.x, HEAD.y, 52, 62, 0, Math.PI * 1.1, Math.PI * 1.6);
            g.stroke();
            g.strokeStyle = "#2a1a4a";
            g.lineWidth = 12;
            g.beginPath();
            g.arc(HEAD.x, HEAD.y - 1, 60, Math.PI * 1.05, Math.PI * 1.95);
            g.stroke();
            g.fillStyle = "#3a2468";
            g.beginPath();
            g.ellipse(HEAD.x - 58, HEAD.y + 4, 11, 20, 0, 0, TAU);
            g.fill();
            g.fillStyle = `rgba(255,160,210,${(0.35 + 0.35 * Math.max(0, beat)).toFixed(2)})`;
            g.beginPath();
            g.ellipse(HEAD.x - 60, HEAD.y + 4, 4, 11, 0, 0, TAU);
            g.fill();
            g.restore();

            g.font = "bold 22px sans-serif";
            g.textAlign = "center";
            for (let k = 0; k < 3; k++) {
                const p = (u * 2 + k / 3) % 1;
                g.fillStyle = `rgba(255,220,240,${(Math.sin(Math.PI * p) * 0.85).toFixed(2)})`;
                g.fillText(k % 2 ? "♪" : "♫", HEAD.x - 70 + Math.sin(TAU * (p * 1.5 + k * 0.3)) * 16, HEAD.y - 50 - p * 90);
            }

            g.drawImage(sill, 0, 0);

            // tasse fumante sur le rebord
            const mx = 110, my = H * 0.9;
            g.fillStyle = "#e8d0c0";
            g.beginPath();
            if (g.roundRect) g.roundRect(mx - 20, my - 30, 40, 30, 6); else g.rect(mx - 20, my - 30, 40, 30);
            g.fill();
            g.strokeStyle = "#e8d0c0";
            g.lineWidth = 5;
            g.beginPath();
            g.arc(mx + 22, my - 16, 9, -Math.PI / 2, Math.PI / 2);
            g.stroke();
            g.fillStyle = "#6a3a2a";
            g.fillRect(mx - 16, my - 28, 32, 4);
            g.lineWidth = 3;
            g.lineCap = "round";
            for (let i = 0; i < 3; i++) {
                const p = (u * 3 + i / 3) % 1;
                g.strokeStyle = `rgba(255,235,245,${(0.5 * (1 - p)).toFixed(2)})`;
                g.beginPath();
                for (let s = 0; s <= 1; s += 0.1) {
                    const x = mx - 9 + i * 9 + Math.sin(TAU * (s * 1.1 + u * 3 + i * 0.3)) * 4 * (0.4 + s);
                    const y = my - 34 - (p * 24 + s * 26);
                    s === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
                }
                g.stroke();
            }

            // pluie
            g.strokeStyle = "rgba(210,190,255,0.24)";
            g.lineWidth = 1;
            g.beginPath();
            for (const d of drops) {
                const y = (d.y + u * d.cycles * H) % H;
                const x = d.x - y * 0.14;
                g.moveTo(x, y);
                g.lineTo(x - d.len * 0.14, y + d.len);
            }
            g.stroke();

            g.drawImage(vignette, 0, 0);
        };
    }

    // ------------------------------------------------------------------ chaîne 2 : aquarium

    function makeAquarium() {
        const bg = layer((c) => {
            const w = c.createLinearGradient(0, 0, 0, H);
            w.addColorStop(0, "#0e5a7a");
            w.addColorStop(0.6, "#07354f");
            w.addColorStop(1, "#031a2c");
            c.fillStyle = w;
            c.fillRect(0, 0, W, H);
            // sable, galets et roches
            const sand = c.createLinearGradient(0, H * 0.86, 0, H);
            sand.addColorStop(0, "#c8a878");
            sand.addColorStop(1, "#7a5a3c");
            c.fillStyle = sand;
            c.beginPath();
            c.moveTo(0, H);
            for (let x = 0; x <= W; x += 40) c.lineTo(x, H * 0.88 + Math.sin(x * 0.02) * 6);
            c.lineTo(W, H);
            c.fill();
            for (let i = 0; i < 40; i++) {
                c.fillStyle = `rgba(${range(90, 170)},${range(70, 130)},${range(50, 90)},0.8)`;
                c.beginPath();
                c.ellipse(rnd() * W, H * range(0.9, 0.99), range(3, 8), range(2, 4), 0, 0, TAU);
                c.fill();
            }
            for (const [x, r] of [[110, 44], [520, 58]]) {
                c.fillStyle = "#1d2c3c";
                c.beginPath();
                c.ellipse(x, H * 0.9, r, r * 0.55, 0, Math.PI, TAU);
                c.fill();
            }
        });
        const plants = Array.from({ length: 9 }, (_, i) => ({ x: range(30, W - 30), h: range(70, 140), ph: rnd(), w: range(5, 9), c: ["#2a8a5a", "#3aa070", "#1f7a50"][i % 3] }));
        const bubbles = Array.from({ length: 26 }, () => ({ x: range(0, W), y: rnd() * H, r: range(1.5, 4.5), n: 1 + Math.floor(rnd() * 3), ph: rnd() }));
        const fish = [
            { y: 0.3, c: "#ff9a4a", dir: 1, n: 1, size: 22, x0: 100, ph: 0.1 },
            { y: 0.5, c: "#ff6aa0", dir: -1, n: 1, size: 16, x0: 400, ph: 0.4 },
            { y: 0.42, c: "#ffd060", dir: 1, n: 2, size: 12, x0: 250, ph: 0.7 },
            { y: 0.62, c: "#7ad0ff", dir: -1, n: 2, size: 14, x0: 50, ph: 0.2 },
            { y: 0.22, c: "#c090ff", dir: -1, n: 1, size: 18, x0: 520, ph: 0.9 }
        ];

        return (u) => {
            g.drawImage(bg, 0, 0);
            // rayons de lumière qui balaient l'eau
            g.fillStyle = "rgba(190,240,255,0.06)";
            for (let k = 0; k < 5; k++) {
                const x0 = 40 + k * 140 + Math.sin(TAU * (u + k * 0.2)) * 28;
                g.beginPath();
                g.moveTo(x0, 0);
                g.lineTo(x0 + 60, 0);
                g.lineTo(x0 + 130 + Math.sin(TAU * (u + k * 0.3)) * 20, H * 0.88);
                g.lineTo(x0 + 20, H * 0.88);
                g.fill();
            }
            // algues qui ondulent
            g.lineCap = "round";
            for (const p of plants) {
                const sway = Math.sin(TAU * (2 * u + p.ph)) * 16;
                g.strokeStyle = p.c;
                g.lineWidth = p.w;
                g.beginPath();
                g.moveTo(p.x, H * 0.9);
                g.quadraticCurveTo(p.x - sway, H * 0.9 - p.h * 0.5, p.x + sway, H * 0.9 - p.h);
                g.stroke();
            }
            // poissons : traversent l'écran, queue qui bat
            for (const f of fish) {
                const M = W + 160;
                const x = wrap(f.x0 + u * f.n * f.dir * M, M) - 80;
                const y = H * f.y + Math.sin(TAU * (3 * u + f.ph)) * 9;
                const wag = Math.sin(TAU * (12 * u + f.ph)) * 0.4;
                g.save();
                g.translate(x, y);
                g.scale(f.dir, 1);
                g.fillStyle = f.c;
                g.beginPath();
                g.moveTo(-f.size * 1.2, 0);
                g.lineTo(-f.size * 2.1, -f.size * (0.7 + wag));
                g.lineTo(-f.size * 2.1, f.size * (0.7 - wag));
                g.fill();
                g.beginPath();
                g.ellipse(0, 0, f.size * 1.5, f.size * 0.85, 0, 0, TAU);
                g.fill();
                g.fillStyle = "rgba(255,255,255,0.28)";
                g.beginPath();
                g.ellipse(f.size * 0.1, -f.size * 0.3, f.size * 0.9, f.size * 0.25, 0, 0, TAU);
                g.fill();
                g.fillStyle = "#fff";
                g.beginPath();
                g.arc(f.size * 0.9, -f.size * 0.15, f.size * 0.22, 0, TAU);
                g.fill();
                g.fillStyle = "#101820";
                g.beginPath();
                g.arc(f.size * 0.95, -f.size * 0.15, f.size * 0.11, 0, TAU);
                g.fill();
                g.restore();
            }
            // bulles
            g.strokeStyle = "rgba(210,245,255,0.55)";
            g.lineWidth = 1;
            for (const b of bubbles) {
                const p = ((b.y / H) + u * b.n) % 1;
                const y = H * 0.9 - p * H * 0.9;
                g.beginPath();
                g.arc(b.x + Math.sin(TAU * (p * 3 + b.ph)) * 6, y, b.r, 0, TAU);
                g.stroke();
            }
            // reflets du verre
            const sheen = g.createLinearGradient(0, 0, W, 0);
            sheen.addColorStop(0, "rgba(255,255,255,0.07)");
            sheen.addColorStop(0.15, "rgba(255,255,255,0)");
            g.fillStyle = sheen;
            g.fillRect(0, 0, W, H);
        };
    }

    // ------------------------------------------------------------------ chaîne 3 : cheminée

    function makeFire() {
        const bg = layer((c) => {
            c.fillStyle = "#1b1014";
            c.fillRect(0, 0, W, H);
            // mur de briques
            for (let row = 0; row * 22 < H; row++) {
                for (let x = -(row % 2) * 30; x < W; x += 60) {
                    c.fillStyle = `rgb(${52 + range(0, 14)},${28 + range(0, 8)},${30 + range(0, 8)})`;
                    c.fillRect(x + 2, row * 22 + 2, 56, 18);
                }
            }
            // foyer
            c.fillStyle = "#0a0507";
            c.beginPath();
            c.moveTo(150, H);
            c.lineTo(150, 130);
            c.quadraticCurveTo(150, 52, 320, 52);
            c.quadraticCurveTo(490, 52, 490, 130);
            c.lineTo(490, H);
            c.fill();
            c.strokeStyle = "#3a2a2a";
            c.lineWidth = 12;
            c.stroke();
            // sol du foyer
            c.fillStyle = "#16090c";
            c.fillRect(150, H * 0.84, 340, H);
        });
        const embers = Array.from({ length: 24 }, () => ({ x: range(-70, 70), n: 1 + Math.floor(rnd() * 2), ph: rnd(), r: range(1, 2.6) }));
        const tongues = Array.from({ length: 9 }, (_, i) => ({ x: -72 + i * 18, h: range(86, 128), f: 2 + (i % 4), ph: rnd(), w: range(16, 22) }));

        return (u) => {
            g.drawImage(bg, 0, 0);
            const cx = W / 2, base = H * 0.84;
            const flare = 0.5 + 0.5 * Math.sin(TAU * 3 * u);
            // lueur sur le foyer et sur le mur
            const glow = g.createRadialGradient(cx, base, 10, cx, base, 280);
            glow.addColorStop(0, `rgba(255,150,50,${(0.55 + 0.15 * flare).toFixed(2)})`);
            glow.addColorStop(1, "rgba(255,90,20,0)");
            g.fillStyle = glow;
            g.fillRect(0, 0, W, H);
            // bûches
            g.fillStyle = "#2a1408";
            for (const [dx, a] of [[-26, -0.12], [26, 0.12]]) {
                g.save();
                g.translate(cx + dx, base + 6);
                g.rotate(a);
                g.beginPath();
                if (g.roundRect) g.roundRect(-70, -12, 140, 24, 12); else g.rect(-70, -12, 140, 24);
                g.fill();
                g.restore();
            }
            // flammes : trois couches de langues, de plus en plus chaudes
            for (const [scale, color] of [[1, "#d4380d"], [0.78, "#ff8a1e"], [0.5, "#ffd84a"]]) {
                g.fillStyle = color;
                for (const t of tongues) {
                    const h = (t.h + Math.sin(TAU * (t.f * u + t.ph)) * 26) * scale;
                    const sway = Math.sin(TAU * ((t.f % 3 + 1) * u + t.ph)) * 12 * scale;
                    const x = cx + t.x * (scale > 0.7 ? 1 : 0.7), w = t.w * scale;
                    g.beginPath();
                    g.moveTo(x - w, base);
                    g.quadraticCurveTo(x - w * 0.6, base - h * 0.55, x + sway, base - h);
                    g.quadraticCurveTo(x + w * 0.6, base - h * 0.55, x + w, base);
                    g.fill();
                }
            }
            // braises qui s'envolent
            for (const e of embers) {
                const p = (u * e.n + e.ph) % 1;
                g.fillStyle = `rgba(255,${Math.round(190 - 90 * p)},60,${(1 - p).toFixed(2)})`;
                g.beginPath();
                g.arc(cx + e.x + Math.sin(TAU * (p * 2 + e.ph)) * 22, base - 20 - p * 200, e.r * (1 - p * 0.5), 0, TAU);
                g.fill();
            }
        };
    }

    // ------------------------------------------------------------------ chaîne 4 : synthwave

    function makeSynthwave() {
        const horizon = H * 0.55;
        const bg = layer((c) => {
            const s = c.createLinearGradient(0, 0, 0, horizon);
            s.addColorStop(0, "#14002e");
            s.addColorStop(0.6, "#5a0a6a");
            s.addColorStop(1, "#ff3a8a");
            c.fillStyle = s;
            c.fillRect(0, 0, W, horizon);
            c.fillStyle = "#16002e";
            c.fillRect(0, horizon, W, H - horizon);
            // montagnes
            c.fillStyle = "#1a0036";
            c.strokeStyle = "#ff4fd8";
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(0, horizon);
            for (let x = 0; x <= W; x += 8) {
                const d = Math.abs(x - W / 2);
                c.lineTo(x, horizon - Math.max(0, (d - 90) * 0.35) * (0.6 + 0.4 * Math.sin(x * 0.05)) - (d > 90 ? 4 : 0));
            }
            c.lineTo(W, horizon);
            c.fill();
            c.stroke();
        });
        const stars = Array.from({ length: 40 }, () => ({ x: rnd() * W, y: rnd() * horizon * 0.7, ph: rnd(), f: 1 + Math.floor(rnd() * 3) }));

        return (u) => {
            g.drawImage(bg, 0, 0);
            for (const s of stars) {
                g.fillStyle = `rgba(255,255,255,${(0.2 + 0.8 * Math.max(0, Math.sin(TAU * (s.f * u + s.ph)))).toFixed(2)})`;
                g.fillRect(s.x, s.y, 1.5, 1.5);
            }
            // soleil rayé : les bandes noires descendent et s'épaississent
            const sx = W / 2, sy = horizon - 48, r = 92;
            g.save();
            g.beginPath();
            g.rect(0, 0, W, sy);
            for (let k = 0; k < 6; k++) {
                const t = (k + u * 1) / 6;                         // 0 en haut des rayures, 1 en bas
                const y = sy + t * r * 1.1, th = 2 + t * 9;
                g.rect(sx - r, y, r * 2, th);
            }
            g.clip();
            const sun = g.createLinearGradient(0, sy - r, 0, sy + r);
            sun.addColorStop(0, "#ffe24a");
            sun.addColorStop(1, "#ff2a8a");
            g.fillStyle = sun;
            g.beginPath();
            g.arc(sx, sy, r, 0, TAU);
            g.fill();
            g.restore();
            // halo à l'horizon
            const halo = g.createLinearGradient(0, horizon - 30, 0, horizon + 6);
            halo.addColorStop(0, "rgba(255,80,200,0)");
            halo.addColorStop(1, "rgba(255,80,200,0.55)");
            g.fillStyle = halo;
            g.fillRect(0, horizon - 30, W, 36);
            // grille en perspective : les lignes viennent vers nous
            g.lineWidth = 1.5;
            const N = 12;
            for (let k = 0; k < N; k++) {
                const t = ((k + u * 3) % N) / N;
                const y = horizon + (H - horizon) * t * t;
                g.strokeStyle = `rgba(255,79,216,${(0.25 + 0.75 * t).toFixed(2)})`;
                g.beginPath();
                g.moveTo(0, y);
                g.lineTo(W, y);
                g.stroke();
            }
            for (let i = -14; i <= 14; i++) {
                g.strokeStyle = "rgba(255,79,216,0.55)";
                g.beginPath();
                g.moveTo(sx + i * 14, horizon);
                g.lineTo(sx + i * 130, H);
                g.stroke();
            }
            // voiture-silhouette qui file, feux arrière allumés
            const bob = Math.sin(TAU * 6 * u) * 1.2;
            g.fillStyle = "#0a0018";
            g.beginPath();
            g.moveTo(sx - 46, H * 0.9 + bob);
            g.lineTo(sx - 38, H * 0.82 + bob);
            g.lineTo(sx - 18, H * 0.78 + bob);
            g.lineTo(sx + 18, H * 0.78 + bob);
            g.lineTo(sx + 38, H * 0.82 + bob);
            g.lineTo(sx + 46, H * 0.9 + bob);
            g.fill();
            g.fillStyle = "#ff2a4a";
            g.fillRect(sx - 40, H * 0.855 + bob, 14, 4);
            g.fillRect(sx + 26, H * 0.855 + bob, 14, 4);
            g.fillStyle = "rgba(255,42,74,0.25)";
            g.fillRect(sx - 44, H * 0.9 + bob, 88, 7);
        };
    }

    // ------------------------------------------------------------------ chaîne 5 : mire de test

    function makeTestCard() {
        const bars = ["#c8c8c8", "#c8c800", "#00c8c8", "#00c800", "#c800c8", "#c80000", "#0000c8"];
        const bg = layer((c) => {
            const bw = W / 7;
            bars.forEach((col, i) => { c.fillStyle = col; c.fillRect(i * bw, 0, bw + 1, H * 0.66); });
            ["#0000c8", "#111", "#c800c8", "#111", "#00c8c8", "#111", "#c8c8c8"].forEach((col, i) => {
                c.fillStyle = col;
                c.fillRect(i * bw, H * 0.66, bw + 1, H * 0.09);
            });
            const ramp = c.createLinearGradient(0, 0, W, 0);
            ramp.addColorStop(0, "#000");
            ramp.addColorStop(1, "#fff");
            c.fillStyle = "#00214c";
            c.fillRect(0, H * 0.75, W * 0.17, H * 0.25);
            c.fillStyle = ramp;
            c.fillRect(W * 0.17, H * 0.75, W * 0.5, H * 0.25);
            c.fillStyle = "#32006a";
            c.fillRect(W * 0.67, H * 0.75, W * 0.17, H * 0.25);
            c.fillStyle = "#111";
            c.fillRect(W * 0.84, H * 0.75, W * 0.16, H * 0.25);
            // cadre central
            c.fillStyle = "#0a0a0e";
            c.fillRect(W / 2 - 130, H * 0.22, 260, 90);
            c.strokeStyle = "#e8e8e8";
            c.lineWidth = 3;
            c.strokeRect(W / 2 - 130, H * 0.22, 260, 90);
            c.fillStyle = "#f4ecf4";
            c.textAlign = "center";
            c.font = "bold 40px sans-serif";
            c.fillText("未来 TV", W / 2, H * 0.22 + 46);
            c.font = "14px monospace";
            c.fillStyle = "#9a9aa8";
            c.fillText("MIRE DE TEST · 50 Hz", W / 2, H * 0.22 + 74);
        });

        return (u) => {
            g.drawImage(bg, 0, 0);
            // barre de balayage qui descend et marqueur qui défile sur la rampe de gris
            g.fillStyle = "rgba(255,255,255,0.09)";
            g.fillRect(0, u * H * 2 % H, W, 26);
            g.fillStyle = "#fff";
            g.fillRect(W * 0.17 + u * W * 0.5, H * 0.96, 6, 8);
            // clignotement du « signal »
            if (Math.sin(TAU * 2 * u) > 0) {
                g.fillStyle = "#c80000";
                g.beginPath();
                g.arc(W - 36, 34, 9, 0, TAU);
                g.fill();
            }
            g.fillStyle = `rgba(0,0,0,${(0.04 + 0.04 * Math.sin(TAU * 24 * u)).toFixed(3)})`;
            g.fillRect(0, 0, W, H);
        };
    }

    // ------------------------------------------------------------------ parasites, incrustation, pilotage

    const CHANNELS = [
        { name: "Lofi · nuit de pluie", draw: makeLofi() },
        { name: "Aquarium", draw: makeAquarium() },
        { name: "Cheminée", draw: makeFire() },
        { name: "Synthwave", draw: makeSynthwave() },
        { name: "Mire de test", draw: makeTestCard() }
    ];

    const noiseC = document.createElement("canvas");
    noiseC.width = 160;
    noiseC.height = 90;
    const noiseCtx = noiseC.getContext("2d");
    const noiseImg = noiseCtx.createImageData(160, 90);
    function staticNoise(alpha) {
        const d = noiseImg.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = Math.random() * 255;
            d[i] = d[i + 1] = d[i + 2] = v;
            d[i + 3] = 255;
        }
        noiseCtx.putImageData(noiseImg, 0, 0);
        g.save();
        g.globalAlpha = alpha;
        g.imageSmoothingEnabled = false;
        g.drawImage(noiseC, 0, 0, W, H);
        g.restore();
    }

    // incrustation du numéro de chaîne (haut gauche), façon vieille télé
    function osdDraw(alpha) {
        g.save();
        g.globalAlpha = alpha;
        g.textAlign = "left";
        g.shadowColor = "rgba(0,0,0,0.9)";
        g.shadowBlur = 4;
        g.fillStyle = "#8aff9a";
        g.font = "bold 40px monospace";
        g.fillText(`CH ${String(idx + 1).padStart(2, "0")}`, 34, 66);
        g.font = "20px monospace";
        g.fillText(CHANNELS[idx].name.toUpperCase(), 34, 96);
        g.restore();
    }

    let idx = 0, zap = 0, osd = 0, clock = 0, acc = 0, frame = 0;

    function setChannel(i) {
        idx = wrap(i, CHANNELS.length);
        zap = ZAP;
        osd = 2.8;
        acc = 1;   // redessine tout de suite
    }

    draw0();
    function draw0() { CHANNELS[0].draw(0); }

    onFrame((dt) => {
        clock += dt;
        acc += dt;
        zap = Math.max(0, zap - dt);
        osd = Math.max(0, osd - dt);
        if (acc < 1 / FPS) return;
        acc = 0;
        frame++;
        CHANNELS[idx].draw((clock % LOOP) / LOOP);
        if (zap > 0) {
            // image qui se déchire horizontalement, puis neige qui s'éclaircit
            for (let k = 0; k < 3; k++) {
                const y = Math.random() * (H - 30), dx = (Math.random() - 0.5) * 60;
                g.drawImage(canvas, 0, y, W, 24, dx, y, W, 24);
            }
            staticNoise(0.25 + 0.7 * (zap / ZAP));
        }
        if (osd > 0) osdDraw(Math.min(1, osd / 0.6));
        tex.needsUpdate = true;
    });

    return {
        tex,
        next() { setChannel(idx + 1); },
        prev() { setChannel(idx - 1); },
        get channel() { return idx; },
        get names() { return CHANNELS.map((c) => c.name); }
    };
}
