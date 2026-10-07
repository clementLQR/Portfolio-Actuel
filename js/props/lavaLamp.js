import * as THREE from "three";
import { dimLight } from "../core/materials.js";
import { scene, shared } from "../core/scene.js";
import { rand, rr } from "../core/random.js";
import { canvasTexture } from "../core/helpers.js";

// Lampe à lave : pied et capuchon chromés (matcap peint), verre en bouteille.
// La cire est calculée dans le shader du verre (lancer de rayon dans un champ de distance) :
// les gouttes fusionnent entre elles et avec la flaque du fond, s'étirent en montant,
// et sont éclairées par l'ampoule cachée dans le pied. Le liquide rougeoie plus en bas.
//
// Les tirages aléatoires (5 par goutte) sont faits dans le même ordre qu'avant :
// la disposition du reste de l'appartement ne change pas.

const MAX_BLOBS = 8;
const GLASS_Y0 = 0.2, GLASS_Y1 = 0.56;

// Profil du verre : large et légèrement renflé en bas, étroit en haut (même formule en GLSL)
function glassRadius(y) {
    const t = THREE.MathUtils.clamp((y - GLASS_Y0) / (GLASS_Y1 - GLASS_Y0), 0, 1);
    const s = t * t * (3 - 2 * t);
    return 0.075 + (0.046 - 0.075) * s + 0.007 * Math.sin(t * Math.PI) * (1 - t);
}

const PALETTES = {
    ambre: {
        liquidLow: new THREE.Color(0.62, 0.1, 0.04), liquidHigh: new THREE.Color(0.16, 0.025, 0.04),
        waxHot: new THREE.Color(1.9, 0.62, 0.08), waxCool: new THREE.Color(0.9, 0.16, 0.03)
    },
    rose: {
        liquidLow: new THREE.Color(0.5, 0.08, 0.2), liquidHigh: new THREE.Color(0.12, 0.02, 0.08),
        waxHot: new THREE.Color(1.8, 0.5, 0.32), waxCool: new THREE.Color(0.85, 0.1, 0.16)
    }
};

// --- chrome : matcap peint (reflets chauds de la lampe, fond prune) -----------------

let chromeMat;
function getChromeMaterial() {
    if (chromeMat) return chromeMat;
    const matcap = canvasTexture(256, 256, (g, w, h) => {
        const base = g.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.5);
        base.addColorStop(0, "#7a6068");
        base.addColorStop(0.7, "#2c1c24");
        base.addColorStop(1, "#0e080c");
        g.fillStyle = base;
        g.fillRect(0, 0, w, h);
        // reflet orangé de la lampe en bas
        const warm = g.createLinearGradient(0, h * 0.55, 0, h);
        warm.addColorStop(0, "rgba(255,140,70,0)");
        warm.addColorStop(1, "rgba(255,140,70,0.75)");
        g.fillStyle = warm;
        g.beginPath(); g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2); g.fill();
        // fenêtre violette sur le côté, reflet blanc chaud en haut
        g.fillStyle = "rgba(170,120,230,0.45)";
        g.beginPath(); g.ellipse(w * 0.82, h * 0.45, w * 0.08, h * 0.22, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,236,215,0.9)";
        g.beginPath(); g.ellipse(w * 0.32, h * 0.26, w * 0.1, h * 0.05, -0.5, 0, Math.PI * 2); g.fill();
    });
    chromeMat = new THREE.MeshMatcapMaterial({ matcap });
    return chromeMat;
}

function lathe(points, segments = 48) {
    return new THREE.LatheGeometry(points.map(([x, y]) => new THREE.Vector2(x, y)), segments);
}

// --- verre + cire ---------------------------------------------------------------------

function makeGlassMaterial(blobs, palette) {
    const uBlobs = Array.from({ length: MAX_BLOBS }, (_, i) => blobs[i] ?? new THREE.Vector4(0, 0, 0, 0));
    const uSpeeds = Array.from({ length: MAX_BLOBS }, (_, i) => blobs[i]?.speed ?? 0);
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            uTime: shared.uTime,
            uCamLocal: { value: new THREE.Vector3() },
            uBlobs: { value: uBlobs },
            uSpeeds: { value: uSpeeds },
            uCount: { value: blobs.length },
            uLiquidLow: { value: palette.liquidLow },
            uLiquidHigh: { value: palette.liquidHigh },
            uWaxHot: { value: palette.waxHot },
            uWaxCool: { value: palette.waxCool }
        },
        vertexShader: /* glsl */`
            varying vec3 vLocal;
            varying vec3 vNormalL;
            varying vec3 vNormalV;
            void main(){
                vLocal = position;
                vNormalL = normal;
                vNormalV = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */`
            #define MAX_BLOBS ${MAX_BLOBS}
            uniform float uTime;
            uniform vec3 uCamLocal;
            uniform vec4 uBlobs[MAX_BLOBS];      // x, z, rayon, phase
            uniform float uSpeeds[MAX_BLOBS];
            uniform int uCount;
            uniform vec3 uLiquidLow, uLiquidHigh, uWaxHot, uWaxCool;
            varying vec3 vLocal;
            varying vec3 vNormalL;
            varying vec3 vNormalV;

            const float Y0 = ${GLASS_Y0.toFixed(3)}, Y1 = ${GLASS_Y1.toFixed(3)};

            float glassR(float y){
                float t = clamp((y - Y0) / (Y1 - Y0), 0.0, 1.0);
                float s = t * t * (3.0 - 2.0 * t);
                return 0.075 + (0.046 - 0.075) * s + 0.007 * sin(t * 3.14159) * (1.0 - t);
            }

            float smin(float a, float b, float k){
                float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
                return mix(b, a, h) - k * h * (1.0 - h);
            }

            float wax(vec3 p){
                // flaque de cire au fond, légèrement ondulante
                float d = p.y - (Y0 + 0.03 + 0.004 * sin(p.x * 60.0 + uTime * 0.7) * sin(p.z * 50.0 - uTime * 0.5));
                for(int i = 0; i < MAX_BLOBS; i++){
                    if(i >= uCount) break;
                    vec4 b = uBlobs[i];
                    float ph = uTime * uSpeeds[i] * 2.0 + b.w;
                    float k = 0.5 - 0.5 * cos(ph);
                    float y = mix(Y0 + 0.035, Y1 - 0.05, k);
                    float vel = abs(sin(ph));
                    float r = b.z * (1.0 + 0.2 * sin(uTime * 0.9 + b.w * 3.0));
                    vec3 c = vec3(b.x + sin(uTime * 0.6 + b.w) * 0.01, y, b.y + cos(uTime * 0.5 + b.w * 2.0) * 0.01);
                    // reste dans le verre
                    float lim = max(glassR(y) - r - 0.006, 0.0);
                    float l = length(c.xz);
                    if(l > lim) c.xz *= lim / l;
                    vec3 q = p - c;
                    float stretch = 1.0 + 0.45 * vel;
                    q.y /= stretch;
                    q.xz *= 1.0 + 0.12 * vel;
                    d = smin(d, (length(q) - r) * 0.85, 0.022);
                }
                return d;
            }

            vec3 waxNormal(vec3 p){
                const vec2 e = vec2(0.0012, -0.0012);
                return normalize(e.xyy * wax(p + e.xyy) + e.yyx * wax(p + e.yyx) + e.yxy * wax(p + e.yxy) + e.xxx * wax(p + e.xxx));
            }

            void main(){
                vec3 ro = vLocal;
                vec3 rd = normalize(vLocal - uCamLocal);
                float h = clamp((vLocal.y - Y0) / (Y1 - Y0), 0.0, 1.0);

                // liquide : rougeoie en bas, s'assombrit vers le haut
                vec3 liquid = mix(uLiquidLow, uLiquidHigh, smoothstep(0.0, 0.9, h)) * (1.0 + 0.9 * exp(-h * 4.0));

                float t = 0.003;
                bool hit = false;
                vec3 p = ro;
                for(int i = 0; i < 48; i++){
                    p = ro + rd * t;
                    if(p.y < Y0 || p.y > Y1 || length(p.xz) > glassR(p.y) + 0.003) break;
                    float d = wax(p);
                    if(d < 0.0006){ hit = true; break; }
                    t += max(d, 0.0012);
                }

                vec3 col;
                float alpha;
                if(hit){
                    vec3 n = waxNormal(p);
                    float hp = clamp((p.y - Y0) / (Y1 - Y0), 0.0, 1.0);
                    vec3 L = normalize(vec3(0.0, Y0 - 0.05, 0.0) - p);
                    float wrap = 0.5 + 0.5 * dot(n, L);
                    float rim = pow(1.0 - abs(dot(n, -rd)), 2.0);
                    vec3 base = mix(uWaxHot, uWaxCool, smoothstep(0.0, 0.85, hp));
                    // éclairée par l'ampoule du pied : dessous lumineux, dessus dans l'ombre colorée
                    col = base * (0.3 + 1.0 * wrap * wrap) + base * rim * 0.35;
                    col = mix(col, liquid, 1.0 - exp(-t * 14.0));   // vu à travers le liquide
                    alpha = 1.0;
                } else {
                    col = liquid * 0.8;
                    alpha = 0.82;
                }

                // verre : liseré lumineux sur les bords, reflet vertical
                vec3 nl = normalize(vNormalL);
                float fres = pow(1.0 - abs(dot(nl, -rd)), 3.0);
                col += vec3(1.0, 0.75, 0.6) * fres * 0.18;
                vec3 nv = normalize(vNormalV);
                float spec = smoothstep(0.93, 0.985, dot(nv, normalize(vec3(-0.55, 0.25, 0.8))));
                col += vec3(1.0, 0.92, 0.85) * spec * 0.45;
                alpha = max(alpha, max(fres * 0.8, spec));

                gl_FragColor = vec4(col, alpha);
            }
        `
    });
}

export function createLavaLamp({ position, scale, blobCount, light, palette = "ambre" }) {
    const pal = PALETTES[palette] ?? PALETTES.ambre;
    const lamp = new THREE.Group();
    lamp.position.copy(position);
    lamp.scale.setScalar(scale);
    scene.add(lamp);

    // gouttes : mêmes tirages et même ordre que l'ancienne version
    const blobs = [];
    for (let i = 0; i < Math.min(blobCount, MAX_BLOBS); i++) {
        const radius = rr(0.018, 0.032);
        const phase = rand() * 10, speed = rr(0.15, 0.3), x = rr(-0.02, 0.02), z = rr(-0.02, 0.02);
        const b = new THREE.Vector4(x, z, radius, phase);
        b.speed = speed * 0.55;
        blobs.push(b);
    }

    const chrome = getChromeMaterial();
    // pied conique avec un léger rebord
    const base = new THREE.Mesh(lathe([[0, 0], [0.1, 0], [0.104, 0.012], [0.098, 0.02], [0.074, 0.12], [0.064, 0.188], [0.07, 0.2], [0, 0.2]]), chrome);
    base.castShadow = true;
    lamp.add(base);
    // bague entre le pied et le verre
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.073, 0.005, 8, 40), chrome);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = GLASS_Y0 + 0.002;
    lamp.add(ring);

    // verre en bouteille
    const pts = [];
    for (let i = 0; i <= 24; i++) {
        const y = GLASS_Y0 + (GLASS_Y1 - GLASS_Y0) * (i / 24);
        pts.push([glassRadius(y), y]);
    }
    const glassMat = makeGlassMaterial(blobs, pal);
    const glass = new THREE.Mesh(lathe(pts, 48), glassMat);
    glass.renderOrder = 2;
    const inv = new THREE.Matrix4();
    glass.onBeforeRender = (renderer, sc, camera) => {
        inv.copy(glass.matrixWorld).invert();
        glassMat.uniforms.uCamLocal.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
    };
    lamp.add(glass);

    // capuchon
    const cap = new THREE.Mesh(lathe([[0.049, GLASS_Y1 - 0.004], [0.044, GLASS_Y1 + 0.03], [0.03, GLASS_Y1 + 0.1], [0.022, GLASS_Y1 + 0.118], [0.012, GLASS_Y1 + 0.124], [0, GLASS_Y1 + 0.125]]), chrome);
    cap.castShadow = true;
    lamp.add(cap);

    const pl = dimLight(new THREE.PointLight(0xff7838, light.intensity, light.distance, 2));
    pl.position.copy(light.position);
    lamp.add(pl);

    return { lamp, light: pl };
}
