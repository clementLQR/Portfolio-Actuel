import * as THREE from "three";
import { canvasTexture } from "./helpers.js";
import { mulberry32, rand, rr } from "./random.js";

// Textures peintes au canvas. Celles qui utilisent rand() doivent être créées
// à leur place dans l'ordre de construction (voir main.js).

export function makeWoodTexture() {
    const tex = canvasTexture(1024, 1024, (g, w, h) => {
        const planks = 8;
        for (let i = 0; i < planks; i++) {
            const x = (i / planks) * w;
            const offset = (i % 2) * h * 0.5;
            for (let j = -1; j < 2; j++) {
                const l = 38 + Math.floor(rand() * 14);
                g.fillStyle = `hsl(${20 + rand() * 8}, 38%, ${l * 0.5}%)`;
                g.fillRect(x, offset + j * h, w / planks, h);
                g.strokeStyle = "rgba(20,8,4,0.18)";
                g.lineWidth = 1;
                for (let k = 0; k < 14; k++) {
                    const gx = x + rand() * (w / planks);
                    g.beginPath();
                    g.moveTo(gx, offset + j * h);
                    g.bezierCurveTo(gx + rr(-6, 6), offset + j * h + h * 0.3, gx + rr(-6, 6), offset + j * h + h * 0.7, gx + rr(-4, 4), offset + (j + 1) * h);
                    g.stroke();
                }
                g.fillStyle = "rgba(10,4,2,0.8)";
                g.fillRect(x, offset + j * h, w / planks, 3);
            }
            g.fillStyle = "rgba(10,4,2,0.8)";
            g.fillRect(x, 0, 3, h);
        }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2.2, 3);
    return tex;
}

export function makeRugTexture() {
    return canvasTexture(512, 512, (g, w, h) => {
        g.fillStyle = "#2a2230";
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 6) {
            g.fillStyle = `rgba(${60 + rand() * 30},${50 + rand() * 20},${70 + rand() * 30},0.6)`;
            g.fillRect(0, y, w, 3);
        }
        g.strokeStyle = "#4a3a50";
        g.lineWidth = 18;
        g.strokeRect(20, 20, w - 40, h - 40);
    });
}

export function makeSalonRugTexture() {
    return canvasTexture(512, 768, (g, w, h) => {
        g.fillStyle = "#2c2030";
        g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 4) {
            g.fillStyle = `rgba(${70 + rand() * 30},${45 + rand() * 20},${60 + rand() * 25},0.5)`;
            g.fillRect(0, y, w, 2);
        }
        g.strokeStyle = "#6a2a34";
        g.lineWidth = 22;
        g.strokeRect(24, 24, w - 48, h - 48);
        g.strokeStyle = "#a07850";
        g.lineWidth = 4;
        for (let y = 90; y < h - 90; y += 60) {
            g.beginPath();
            for (let x = 60; x <= w - 60; x += 30) g.lineTo(x, y + ((x / 30) % 2 ? 14 : -14));
            g.stroke();
        }
    });
}

// Poster « 未来の街 » : soleil, mont Fuji
export function makeBigPosterTexture() {
    return canvasTexture(512, 768, (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "#1e1450");
        bg.addColorStop(0.5, "#6a2e8a");
        bg.addColorStop(1, "#2a1440");
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);

        const sg = g.createLinearGradient(0, h * 0.18, 0, h * 0.55);
        sg.addColorStop(0, "#ff7a3a");
        sg.addColorStop(1, "#e0303a");
        g.fillStyle = sg;
        g.beginPath();
        g.arc(w * 0.55, h * 0.36, w * 0.27, 0, Math.PI * 2);
        g.fill();

        g.fillStyle = "#1c1442";
        g.beginPath();
        g.moveTo(0, h * 0.68);
        g.lineTo(w * 0.36, h * 0.44);
        g.quadraticCurveTo(w * 0.42, h * 0.4, w * 0.48, h * 0.44);
        g.lineTo(w, h * 0.7);
        g.lineTo(w, h);
        g.lineTo(0, h);
        g.fill();

        g.fillStyle = "#c8b8f0";
        g.beginPath();
        g.moveTo(w * 0.36, h * 0.44);
        g.quadraticCurveTo(w * 0.42, h * 0.4, w * 0.48, h * 0.44);
        g.lineTo(w * 0.52, h * 0.47);
        g.lineTo(w * 0.46, h * 0.46);
        g.lineTo(w * 0.42, h * 0.48);
        g.lineTo(w * 0.38, h * 0.46);
        g.lineTo(w * 0.32, h * 0.47);
        g.fill();

        g.fillStyle = "#0e0a24";
        g.beginPath();
        g.moveTo(0, h * 0.8);
        g.quadraticCurveTo(w * 0.3, h * 0.72, w * 0.6, h * 0.8);
        g.quadraticCurveTo(w * 0.8, h * 0.84, w, h * 0.78);
        g.lineTo(w, h);
        g.lineTo(0, h);
        g.fill();

        g.fillStyle = "#ff9ab8";
        g.font = "bold 58px 'Yu Gothic', 'Meiryo', 'Noto Sans JP', sans-serif";
        g.fillText("未来の街", 34, h * 0.93);

        g.strokeStyle = "#0a0614";
        g.lineWidth = 16;
        g.strokeRect(0, 0, w, h);
    });
}

// Petit poster de ville, déterminé par sa graine (n'utilise pas le flux global)
export function makeSmallPosterTexture(seed) {
    const r = mulberry32(seed);
    const hue = 200 + r() * 140;
    return canvasTexture(256, 340, (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, `hsl(${hue}, 60%, 18%)`);
        bg.addColorStop(0.7, `hsl(${(hue + 60) % 360}, 70%, 42%)`);
        bg.addColorStop(1, `hsl(${hue}, 50%, 12%)`);
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        if (r() < 0.5) {
            g.fillStyle = `hsla(${20 + r() * 30}, 100%, 65%, 0.9)`;
            g.beginPath();
            g.arc(w * (0.3 + r() * 0.4), h * (0.25 + r() * 0.2), 20 + r() * 30, 0, Math.PI * 2);
            g.fill();
        }
        for (let x = 0; x < w; x += 10 + r() * 18) {
            const bh = h * (0.15 + r() * 0.5);
            const bw = 8 + r() * 20;
            g.fillStyle = `hsl(${hue}, 40%, ${6 + r() * 8}%)`;
            g.fillRect(x, h - bh, bw, bh);
            g.fillStyle = "rgba(255,210,150,0.8)";
            for (let k = 0; k < bh / 9; k++) {
                if (r() < 0.3) g.fillRect(x + 2 + r() * (bw - 4), h - bh + k * 9, 2, 3);
            }
        }
        g.strokeStyle = "#f4ecf4";
        g.lineWidth = 10;
        g.strokeRect(0, 0, w, h);
    });
}

// Télé du salon : ville violette + silhouette avec casque
export function makeTvTexture() {
    return canvasTexture(640, 360, (g, w, h) => {
        const bg = g.createLinearGradient(0, 0, 0, h);
        bg.addColorStop(0, "#1a1650");
        bg.addColorStop(0.6, "#7a3ca8");
        bg.addColorStop(1, "#2a1440");
        g.fillStyle = bg;
        g.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 14 + rand() * 20) {
            const bh = h * (0.15 + rand() * 0.45);
            g.fillStyle = "#1a1036";
            g.fillRect(x, h - bh, 10 + rand() * 18, bh);
        }
        g.fillStyle = "#120a26";
        g.beginPath();
        g.ellipse(w * 0.74, h * 0.48, 52, 62, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.moveTo(w * 0.58, h);
        g.quadraticCurveTo(w * 0.62, h * 0.62, w * 0.74, h * 0.62);
        g.quadraticCurveTo(w * 0.88, h * 0.62, w * 0.92, h);
        g.fill();
        g.strokeStyle = "#2a1a4a";
        g.lineWidth = 12;
        g.beginPath();
        g.arc(w * 0.74, h * 0.47, 60, Math.PI * 1.05, Math.PI * 1.95);
        g.stroke();
    });
}

// Écran du PC : la ville au coucher du soleil
export function makePcScreenTexture() {
    return canvasTexture(1024, 576, (g, w, h) => {
        const sky = g.createLinearGradient(0, 0, 0, h * 0.62);
        sky.addColorStop(0, "#2a2470");
        sky.addColorStop(0.55, "#a04a9a");
        sky.addColorStop(1, "#ff8a5a");
        g.fillStyle = sky;
        g.fillRect(0, 0, w, h);
        g.fillStyle = "rgba(255,150,170,0.35)";
        for (let i = 0; i < 14; i++) {
            g.beginPath();
            g.ellipse(rand() * w, rand() * h * 0.4, 60 + rand() * 120, 6 + rand() * 10, 0, 0, Math.PI * 2);
            g.fill();
        }
        g.fillStyle = "#ffd890";
        g.beginPath();
        g.arc(w * 0.55, h * 0.6, 26, 0, Math.PI * 2);
        g.fill();
        const city = (base, minH, maxH, color, lit) => {
            for (let x = -10; x < w; x += 10 + rand() * 22) {
                const bw = 12 + rand() * 26, bh = minH + rand() * (maxH - minH);
                g.fillStyle = color;
                g.fillRect(x, base - bh, bw, bh);
                if (lit) {
                    g.fillStyle = "rgba(255,200,140,0.8)";
                    for (let k = 0; k < bh / 8; k++) if (rand() < 0.25) g.fillRect(x + 2 + rand() * (bw - 5), base - bh + k * 8, 2, 3);
                }
            }
        };
        city(h * 0.62, 30, 110, "#5a3a80", false);
        for (const [x, tw, th] of [[0.5, 46, 300], [0.6, 34, 240], [0.4, 30, 200], [0.72, 28, 180]]) {
            g.fillStyle = "#2e2050";
            g.fillRect(w * x - tw / 2, h * 0.62 - th, tw, th);
            g.beginPath();
            g.moveTo(w * x - 4, h * 0.62 - th);
            g.lineTo(w * x, h * 0.62 - th - 60);
            g.lineTo(w * x + 4, h * 0.62 - th);
            g.fill();
            g.fillStyle = "#c070ff";
            g.fillRect(w * x - tw / 2, h * 0.62 - th, 3, th);
        }
        city(h * 0.66, 20, 70, "#24183e", true);
        const water = g.createLinearGradient(0, h * 0.66, 0, h);
        water.addColorStop(0, "#d0708a");
        water.addColorStop(1, "#3a2460");
        g.fillStyle = water;
        g.fillRect(0, h * 0.66, w, h);
        g.fillStyle = "rgba(255,210,140,0.6)";
        for (let y = h * 0.68; y < h; y += 6) g.fillRect(w * 0.55 - 30 + rand() * 20, y, 30 + rand() * 30, 2);
        g.fillStyle = "#1c1430";
        g.fillRect(0, h * 0.64, w, 8);
    });
}

// Résille du dossier de la chaise de bureau (fond transparent)
export function makeMeshFabricTexture() {
    const tex = canvasTexture(128, 128, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.strokeStyle = "#2c2c32";
        g.lineWidth = 1.6;
        for (let i = -h; i < w + h; i += 5) {
            g.beginPath(); g.moveTo(i, 0); g.lineTo(i + h, h); g.stroke();
            g.beginPath(); g.moveTo(i, h); g.lineTo(i + h, 0); g.stroke();
        }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 4);
    return tex;
}
