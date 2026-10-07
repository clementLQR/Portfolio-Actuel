import * as THREE from "three";
import { scene, shared } from "../core/scene.js";
import { ATMOS_GLSL } from "./atmosphere.js";

// Ciel : dégradé du coucher de soleil (voir atmosphere.js), soleil bas avec halo,
// nuages en bandes éclairés par dessous, fines traînées près de l'horizon

export function createSky() {
    const skyMat = new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { ...shared },
        vertexShader: /* glsl */`
            varying vec3 vDir;
            void main(){
                vDir = normalize(position);
                vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_Position = p.xyww;
            }
        `,
        fragmentShader: /* glsl */`
            uniform float uTime;
            varying vec3 vDir;
            ${ATMOS_GLSL}

            float noise(vec2 p){
                vec2 i = floor(p), f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(atm_hash(i), atm_hash(i + vec2(1, 0)), u.x),
                           mix(atm_hash(i + vec2(0, 1)), atm_hash(i + vec2(1, 1)), u.x), u.y);
            }
            float fbm(vec2 p){
                float v = 0.0, a = 0.5;
                for(int i = 0; i < 5; i++){ v += a * noise(p); p *= 2.03; a *= 0.5; }
                return v;
            }

            void main(){
                atm_init(uDay);
                vec3 d = normalize(vDir);
                float h = d.y;
                vec3 col = atm_sky(d);

                float s = max(dot(d, ATM_SUN_DIR), 0.0);

                if(h > 0.004){
                    // grands nuages en bandes
                    vec2 uv = d.xz / (h + 0.08);
                    uv *= vec2(1.2, 3.0);
                    uv.x += uTime * 0.004;
                    float c = smoothstep(0.44, 0.74, fbm(uv * 1.3));
                    float fade = smoothstep(0.006, 0.07, h) * (1.0 - smoothstep(0.38, 0.75, h));
                    vec3 cloudLit = mix(vec3(1.0, 0.45, 0.26), vec3(0.88, 0.25, 0.55), smoothstep(0.03, 0.14, h));
                    cloudLit = mix(cloudLit, vec3(0.32, 0.18, 0.55), smoothstep(0.14, 0.38, h));
                    cloudLit += ATM_SUN * pow(s, 5.0) * 0.9;
                    cloudLit = mix(cloudLit, vec3(1.35, 1.37, 1.4) * mix(0.82, 1.0, smoothstep(0.0, 0.3, h)), ATM_DAY);   // nuages blancs le jour
                    col = mix(col, cloudLit * 0.72, c * fade * (1.0 - 0.35 * ATM_DAY));

                    // traînées fines et lumineuses qui barrent le soleil
                    float band = fbm(vec2(d.x / (h + 0.05) * 0.6 + uTime * 0.002, h * 90.0));
                    float streak = smoothstep(0.55, 0.8, band) * smoothstep(0.012, 0.03, h) * (1.0 - smoothstep(0.05, 0.11, h));
                    col = mix(col, mix(ATM_PINK * 0.8, ATM_GLOW * 1.2, pow(s, 3.0)), streak * 0.55 * (1.0 - ATM_DAY));
                }

                // soleil : disque, couronne, halo large
                col += ATM_SUN * smoothstep(0.99955, 0.99972, s) * 2.6;
                col += ATM_SUN * pow(s, 700.0) * 1.2;
                col += ATM_GLOW * pow(s, 60.0) * 0.45;
                col += vec3(1.0, 0.5, 0.35) * pow(s, 7.0) * 0.16 * (1.0 - smoothstep(0.0, 0.3, h));

                gl_FragColor = vec4(col, 1.0);
            }
        `
    });

    const sky = new THREE.Mesh(new THREE.SphereGeometry(2000, 48, 24), skyMat);
    sky.frustumCulled = false;
    sky.renderOrder = -1;
    scene.add(sky);
}
