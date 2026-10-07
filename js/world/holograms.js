import * as THREE from "three";
import { scene, shared } from "../core/scene.js";
import { canvasTexture } from "../core/helpers.js";
import { onFrame } from "../core/animated.js";
import { GROUND_Y } from "../config/layout.js";
import { MergeKit, darkMetalMat } from "./kit.js";
import { hero } from "./zones.js";

// Hologrammes et publicités : quelques points focaux seulement (silhouette géante,
// logo tournant, enseignes verticales, interface abstraite, portrait de la tour proche).
// Scintillement, lignes de balayage, petits décrochages, halo lumineux autour.

let seedCount = 0;

export function holoMaterial(tex, { tint = 0xffffff, intensity = 1.6, opacity = 0.85, additive = true, lines = 60 } = {}) {
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: !additive,
        side: THREE.DoubleSide,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        fog: false,
        uniforms: {
            uTime: shared.uTime,
            uFogDensity: shared.uFogDensity,
            tMap: { value: tex },
            uTint: { value: new THREE.Color(tint) },
            uIntensity: { value: intensity },
            uOpacity: { value: opacity },
            uLines: { value: lines },
            uSeed: { value: ++seedCount * 7.13 }
        },
        vertexShader: /* glsl */`
            varying vec2 vUv;
            varying vec3 vWP;
            void main(){
                vUv = uv;
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWP = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tMap;
            uniform vec3 uTint;
            uniform float uTime, uIntensity, uOpacity, uLines, uSeed, uFogDensity;
            varying vec2 vUv;
            varying vec3 vWP;
            float hash(float x){ return fract(sin(x * 91.17) * 43758.5453); }
            void main(){
                vec2 uv = vUv;
                // décrochage horizontal bref, de temps en temps
                float tick = floor(uTime * 9.0);
                float glitch = step(0.975, hash(tick + uSeed));
                uv.x += glitch * (hash(floor(uv.y * 18.0) + tick) - 0.5) * 0.06;
                vec4 tx = texture2D(tMap, uv);

                float sl = vUv.y * uLines - uTime * 1.5;
                float scan = mix(1.0, 0.72 + 0.28 * sin(sl * 6.2832), 1.0 - smoothstep(0.3, 0.8, fwidth(sl)));
                float flick = 0.88 + 0.12 * sin(uTime * 11.0 + uSeed) * sin(uTime * 6.7 + uSeed * 2.0);
                flick *= 1.0 - glitch * 0.35;
                float edge = smoothstep(0.0, 0.02, vUv.x) * smoothstep(1.0, 0.98, vUv.x)
                           * smoothstep(0.0, 0.02, vUv.y) * smoothstep(1.0, 0.98, vUv.y);

                float dist = length(vWP - cameraPosition);
                float k = dist * uFogDensity * 0.85;
                float fogKeep = 1.0 - 0.8 * (1.0 - exp(-k * k));

                vec3 c = tx.rgb * uTint * uIntensity * scan * flick * fogKeep;
                gl_FragColor = vec4(c, tx.a * uOpacity * edge);
            }
        `
    });
}

// halo doux derrière un hologramme (lumière diffusée dans la brume)
let haloTex;
export function holoHalo(w, h, color, strength = 0.5) {
    haloTex ??= canvasTexture(128, 128, (g, s) => {
        const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(0.4, "rgba(255,255,255,0.35)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, s, s);
    });
    const m = new THREE.MeshBasicMaterial({
        map: haloTex, color, transparent: true, opacity: strength,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: true
    });
    return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

// --- textures peintes ------------------------------------------------------------

// silhouette de danseuse, en dégradé cyan → magenta
function makeDancerTexture() {
    return canvasTexture(512, 1024, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        const grd = g.createLinearGradient(0, 0, 0, h);
        grd.addColorStop(0, "#7af0ff");
        grd.addColorStop(0.5, "#b080ff");
        grd.addColorStop(1, "#ff5ac8");
        g.fillStyle = grd;
        g.beginPath();
        // tête et chevelure qui flotte
        g.ellipse(w * 0.52, h * 0.12, w * 0.085, h * 0.05, -0.2, 0, Math.PI * 2);
        g.moveTo(w * 0.47, h * 0.09);
        g.bezierCurveTo(w * 0.3, h * 0.05, w * 0.18, h * 0.14, w * 0.1, h * 0.22);
        g.bezierCurveTo(w * 0.25, h * 0.17, w * 0.38, h * 0.15, w * 0.46, h * 0.16);
        // buste, bras levé, jambes
        g.moveTo(w * 0.47, h * 0.17);
        g.bezierCurveTo(w * 0.4, h * 0.25, w * 0.42, h * 0.33, w * 0.45, h * 0.42);
        g.bezierCurveTo(w * 0.4, h * 0.52, w * 0.36, h * 0.66, w * 0.3, h * 0.95);
        g.lineTo(w * 0.36, h * 0.95);
        g.bezierCurveTo(w * 0.44, h * 0.72, w * 0.5, h * 0.6, w * 0.53, h * 0.52);
        g.bezierCurveTo(w * 0.58, h * 0.66, w * 0.66, h * 0.78, w * 0.8, h * 0.9);
        g.lineTo(w * 0.84, h * 0.86);
        g.bezierCurveTo(w * 0.7, h * 0.72, w * 0.64, h * 0.56, w * 0.6, h * 0.42);
        g.bezierCurveTo(w * 0.62, h * 0.32, w * 0.62, h * 0.24, w * 0.58, h * 0.18);
        g.bezierCurveTo(w * 0.66, h * 0.14, w * 0.74, h * 0.08, w * 0.8, h * 0.01);
        g.lineTo(w * 0.76, h * 0.0);
        g.bezierCurveTo(w * 0.7, h * 0.07, w * 0.62, h * 0.12, w * 0.56, h * 0.16);
        g.closePath();
        g.fill();
        // fines lignes horizontales qui « construisent » la figure
        g.globalCompositeOperation = "destination-out";
        for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2);
        g.globalCompositeOperation = "source-over";
    });
}

// logo fictif : anneau, idéogrammes, nom
function makeLogoTexture() {
    return canvasTexture(512, 512, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.strokeStyle = "#ff7ad0";
        g.lineWidth = 18;
        g.beginPath();
        g.arc(w / 2, h / 2, w * 0.4, 0, Math.PI * 2);
        g.stroke();
        g.lineWidth = 5;
        g.beginPath();
        g.arc(w / 2, h / 2, w * 0.46, -0.6, Math.PI * 1.2);
        g.stroke();
        g.fillStyle = "#ffe0f4";
        g.textAlign = "center";
        g.font = "bold 150px 'Yu Gothic', 'Meiryo', 'Noto Sans JP', sans-serif";
        g.fillText("未来", w / 2, h * 0.56);
        g.font = "600 46px 'DM Mono', monospace";
        g.fillStyle = "#ff9ad8";
        g.fillText("M I R A I", w / 2, h * 0.72);
    });
}

// enseigne verticale en idéogrammes (opaque)
function makeSignTexture(text, fg, border) {
    return canvasTexture(128, 512, (g, w, h) => {
        g.fillStyle = "#0b0614";
        g.fillRect(0, 0, w, h);
        g.strokeStyle = border;
        g.lineWidth = 8;
        g.strokeRect(8, 8, w - 16, h - 16);
        g.fillStyle = fg;
        g.textAlign = "center";
        g.font = "bold 92px 'Yu Gothic', 'Meiryo', 'Noto Sans JP', sans-serif";
        [...text].forEach((ch, i) => g.fillText(ch, w / 2, 120 + i * 125));
    });
}

// interface abstraite : arcs, graduations, histogramme
function makeInterfaceTexture() {
    return canvasTexture(512, 512, (g, w, h) => {
        g.clearRect(0, 0, w, h);
        g.strokeStyle = "rgba(110,220,255,0.9)";
        g.lineWidth = 4;
        for (const [rad, a0, a1] of [[200, 0.2, 2.6], [170, 3.0, 5.6], [140, 1.0, 4.4], [110, 4.8, 7.6]]) {
            g.beginPath();
            g.arc(w / 2, h / 2, rad, a0, a1);
            g.stroke();
        }
        for (let a = 0; a < 60; a++) {
            const t = (a / 60) * Math.PI * 2, r0 = a % 5 ? 222 : 212;
            g.beginPath();
            g.moveTo(w / 2 + Math.cos(t) * r0, h / 2 + Math.sin(t) * r0);
            g.lineTo(w / 2 + Math.cos(t) * 232, h / 2 + Math.sin(t) * 232);
            g.stroke();
        }
        g.fillStyle = "rgba(110,220,255,0.75)";
        for (let i = 0; i < 9; i++) {
            const bh = 20 + ((i * 37) % 70);
            g.fillRect(w / 2 - 80 + i * 18, h / 2 + 40 - bh, 10, bh);
        }
        g.fillStyle = "rgba(255,120,200,0.9)";
        g.font = "600 30px 'DM Mono', monospace";
        g.textAlign = "center";
        g.fillText("SYS·07  ▲ 98.2", w / 2, h / 2 + 90);
    });
}

// --- placement -----------------------------------------------------------------------

function plane(w, h, mat, x, y, z, ry = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    scene.add(m);
    return m;
}

export function createHolograms() {
    // silhouette géante devant les tours jumelles
    const t4 = hero("T4");
    const dz = t4.z + t4.w * 0.35 + 6;
    plane(42, 84, holoMaterial(makeDancerTexture(), { intensity: 1.5, lines: 160 }), t4.x + t4.w * 0.3, GROUND_Y + 125, dz);
    const halo = holoHalo(110, 150, 0xa070ff, 0.22);
    halo.position.set(t4.x + t4.w * 0.3, GROUND_Y + 125, dz - 1);
    scene.add(halo);

    // logo tournant sur la tour colossale de droite
    const m2 = hero("M2");
    const logo = plane(64, 64, holoMaterial(makeLogoTexture(), { intensity: 1.7, lines: 120 }), m2.x, GROUND_Y + 335, m2.z + m2.w * 0.5 + 30);
    onFrame((dt, t) => { logo.rotation.y = Math.sin(t * 0.15) * 0.9; });

    // interface abstraite flottant devant la tour colossale centrale
    const m1 = hero("M1");
    plane(46, 46, holoMaterial(makeInterfaceTexture(), { intensity: 1.4, opacity: 0.75, lines: 90 }), m1.x + 4, GROUND_Y + 205, m1.z + m1.w * 0.5 + 14, 0.08);

    // enseignes verticales, montées sur un cadre
    const signs = [
        { t: hero("T3"), text: "電脳街", fg: "#7ae8ff", border: "#ff5ac8", dx: -0.32, y: 70, front: 0.625 },
        { t: hero("T7"), text: "夜市場", fg: "#ffb070", border: "#b060ff", dx: 0.3, y: 58, front: 0.55 }
    ];
    const kit = new MergeKit();
    for (const s of signs) {
        const x = s.t.x + s.t.w * s.dx, z = s.t.z + s.t.w * s.front;
        const mat = holoMaterial(makeSignTexture(s.text, s.fg, s.border), { additive: false, opacity: 1, intensity: 1.35, lines: 50 });
        plane(7, 28, mat, x, GROUND_Y + s.y, z);
        kit.box(darkMetalMat, x - 3.9, x + 3.9, GROUND_Y + s.y - 14.6, GROUND_Y + s.y + 14.6, z - 1.2, z - 0.15);
    }
    kit.build();
}
