import * as THREE from "three";
import { shared } from "../core/scene.js";
import { ATMOS_GLSL } from "./atmosphere.js";

// Matériau des immeubles : façades procédurales calculées en coordonnées monde,
// reflet du ciel sur le verre, brume atmosphérique. Fonctionne en instancié comme en mesh simple.
//
// Quatre familles de façades (STYLE) :
//   RESIDENTIAL  petites fenêtres très nombreuses, piliers, balcons, logements allumés au hasard
//   COMMERCIAL   murs-rideaux vitrés, meneaux, plateaux de bureaux éclairés par zones
//   TOWER        métal sombre segmenté, nervures verticales, fentes vitrées, lignes LED
//   INDUSTRIAL   panneaux métalliques, rares lumières
//
// Les fenêtres mélangent orange, jaune, blanc, cyan et violet ; certaines s'allument ou
// s'éteignent très lentement. Au loin, le motif est remplacé par sa moyenne (pas de scintillement).

export const STYLE = { RESIDENTIAL: 0, COMMERCIAL: 1, TOWER: 2, INDUSTRIAL: 3 };

export function makeBuildingMaterial(baseHex, style = STYLE.RESIDENTIAL, { neon = 0xb060ff, lit = 0.4 } = {}) {
    return new THREE.ShaderMaterial({
        fog: false,
        defines: { STYLE: style },
        uniforms: {
            ...shared,
            uBase: { value: new THREE.Color(baseHex) },
            uNeon: { value: new THREE.Color(neon) },
            uLit: { value: lit }
        },
        vertexShader: /* glsl */`
            varying vec3 vWP;
            varying vec3 vN;
            varying float vSeed;
            void main(){
                mat4 m = modelMatrix;
                #ifdef USE_INSTANCING
                    m = m * instanceMatrix;
                #endif
                vec4 wp = m * vec4(position, 1.0);
                vWP = wp.xyz;
                vN = normalize(mat3(m) * normal);
                vec3 o = (m * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                vSeed = fract(sin(dot(o.xz, vec2(12.9898, 78.233))) * 43758.5453);
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */`
            uniform vec3 uBase, uNeon, uFogColor;
            uniform float uFogDensity, uTime, uLit;
            varying vec3 vWP;
            varying vec3 vN;
            varying float vSeed;
            ${ATMOS_GLSL}

            float h2(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 17371.137); }

            vec3 windowColor(float h){
                if(h < 0.40) return vec3(1.0, 0.56, 0.24);   // orange
                if(h < 0.66) return vec3(1.0, 0.80, 0.46);   // jaune chaud
                if(h < 0.79) return vec3(0.96, 0.92, 1.0);   // blanc
                if(h < 0.91) return vec3(0.40, 0.84, 1.0);   // cyan
                return vec3(0.80, 0.48, 1.0);                // violet
            }

            // fenêtre allumée ? variation lente : quelques fenêtres changent d'état de temps en temps
            float isLit(vec2 id, float ratio){
                float h = atm_hash(id + vSeed * 37.1);
                float lit = step(1.0 - ratio, h);
                float epoch = floor(uTime / 21.0 + h * 9.0);
                float flip = step(0.975, atm_hash(id * 1.37 + epoch));
                return abs(lit - flip);
            }

            float rect(vec2 f, vec2 a, vec2 b){ return step(a.x, f.x) * step(f.x, b.x) * step(a.y, f.y) * step(f.y, b.y); }

            void main(){
                atm_init(uDay);
                vec3 n = normalize(vN);
                vec3 V = normalize(cameraPosition - vWP);
                float hRel = vWP.y - ATM_GROUND;

                // teinte propre à chaque bâtiment
                vec3 base = uBase * (0.72 + 0.56 * vSeed);
                base *= mix(vec3(1.0), vec3(0.88, 0.94, 1.18), fract(vSeed * 7.31));

                vec3 col = base * mix(0.45, 1.08, smoothstep(0.0, 140.0, hRel));
                // plein jour : façades éclairées par le ciel, plus claires et plus neutres
                col = mix(col, base * 2.4 + vec3(0.07, 0.08, 0.1) * (0.6 + 0.4 * max(dot(n, ATM_SUN_DIR), 0.0)), ATM_DAY);
                col += ATM_HORIZON * pow(max(dot(n, ATM_SUN_DIR), 0.0), 2.0) * 0.4;   // lisière solaire
                col += ATM_HIGH * 0.3 * max(n.y, 0.0);                                 // ciel sur les toits
                vec3 emit = vec3(0.0);

                // coordonnées de façade (horizontale le long de la face, verticale = altitude)
                vec2 tt = vec2(-n.z, n.x);
                vec2 t = tt / max(length(tt), 1e-4);
                vec2 uv = vec2(dot(vWP.xz, t), vWP.y);
                vec2 fwUv = fwidth(uv);

                if(abs(n.y) < 0.5){
                    // reflet du ciel sur les surfaces vitrées / métalliques
                    vec3 R = reflect(-V, n);
                    vec3 env = atm_sky(normalize(vec3(R.x, abs(R.y), R.z)));
                    float fres = pow(1.0 - max(dot(V, n), 0.0), 4.0);

                    float ratio = uLit * (0.55 + 0.9 * fract(vSeed * 3.7));
                    vec2 cs; vec2 cell; vec2 f; float aa;
                    vec3 pattern; vec3 avg;

                    #if STYLE == 0
                        cs = vec2(1.6, 3.1) * (0.9 + 0.2 * vSeed);
                        cell = floor(uv / cs); f = fract(uv / cs);
                        float bay = 4.0 + floor(vSeed * 3.0);
                        float pillar = step(mod(cell.x, bay), 0.5);
                        float win = rect(f, vec2(0.2, 0.3), vec2(0.8, 0.8)) * (1.0 - pillar);
                        float ledge = step(f.y, 0.09);
                        vec3 wall = col * (1.0 + 0.18 * pillar) + ATM_HORIZON * 0.04 * ledge;
                        wall = mix(wall, wall * 1.35, ledge);
                        float on = isLit(vec2(floor(cell.x / 2.0), cell.y), ratio);
                        float hw = atm_hash(cell + 3.1);
                        vec3 glass = col * 0.3 + env * (0.05 + 0.35 * fres);
                        vec3 light = windowColor(atm_hash(vec2(floor(cell.x / 2.0), cell.y) + 7.7)) * (0.45 + 0.55 * hw);
                        light *= mix(0.65, 1.0, smoothstep(0.3, 0.75, f.y));       // rideau / plafonnier
                        pattern = mix(wall, glass, win);
                        emit = light * win * on;
                        avg = mix(wall, glass, 0.36 * (1.0 - 1.0 / bay)) + vec3(1.0, 0.7, 0.45) * 0.36 * ratio * 0.55;
                        // vitrines au pied des immeubles
                        float shop = step(0.6, hRel) * step(hRel, 4.2);
                        emit += windowColor(atm_hash(vec2(floor(uv.x / 6.0), vSeed))) * shop * step(0.45, atm_hash(vec2(floor(uv.x / 6.0), 3.0 + vSeed))) * 0.9;
                    #elif STYLE == 1
                        cs = vec2(3.0, 4.2);
                        cell = floor(uv / cs); f = fract(uv / cs);
                        float mull = 1.0 - step(0.045, f.x) * step(f.x, 0.955);
                        float spandrel = step(f.y, 0.2);
                        float glassA = (1.0 - mull) * (1.0 - spandrel);
                        vec3 metal = col * 1.25 + ATM_GLOW * 0.05;
                        vec3 glass = base * 0.25 + env * (0.12 + 0.6 * fres);
                        vec3 spand = col * 0.55 + vec3(0.02) * step(0.17, f.y);
                        pattern = mix(mix(spand, glass, glassA), metal, mull);
                        // plateaux éclairés par zones de 3 à 6 panneaux
                        float zone = floor(cell.x / (3.0 + floor(vSeed * 4.0)));
                        float on = isLit(vec2(zone, cell.y), ratio * 1.1);
                        vec3 office = mix(vec3(0.92, 0.95, 1.0), vec3(0.45, 0.85, 1.0), step(0.7, atm_hash(vec2(zone, cell.y) + 2.0)));
                        office = mix(office, vec3(1.0, 0.72, 0.42), step(0.55, fract(vSeed * 11.0)) * 0.8);
                        office *= 0.35 + 0.5 * smoothstep(0.55, 0.95, f.y);
                        emit = office * glassA * on;
                        avg = mix(spand, glass, 0.7) + office * 0.6 * ratio;
                    #elif STYLE == 2
                        cs = vec2(2.3, 3.7);
                        cell = floor(uv / cs); f = fract(uv / cs);
                        float rib = 1.0 - step(0.16, f.x);
                        float slit = rect(f, vec2(0.34, 0.16), vec2(0.7, 0.86));
                        vec3 metal = col * 0.85;
                        metal = mix(metal, col * 1.5 + ATM_HORIZON * 0.06, rib);
                        vec3 glass = base * 0.2 + env * (0.08 + 0.5 * fres);
                        pattern = mix(metal + env * 0.08 * fres, glass, slit);
                        float on = isLit(cell, ratio * 0.8);
                        emit = windowColor(atm_hash(cell + 5.3)) * slit * on * 0.8;
                        // façade segmentée : ligne LED tous les ~40 m, LED verticales sur certaines nervures
                        float seg = fract(uv.y / 41.0 + vSeed);
                        float ledH = smoothstep(0.0, 0.004, seg) * (1.0 - smoothstep(0.008, 0.012, seg));
                        float ledV = rib * step(mod(cell.x + floor(vSeed * 7.0), 7.0), 0.5) * step(0.5, fract(vSeed * 5.0));
                        emit += uNeon * (ledH * 1.6 + ledV * 0.9);
                        avg = mix(metal, glass, 0.3) + windowColor(0.5) * 0.24 * ratio * 0.8;
                    #else
                        cs = vec2(4.0, 3.0);
                        cell = floor(uv / cs); f = fract(uv / cs);
                        float seam = 1.0 - step(0.03, f.x) * step(0.04, f.y);
                        vec3 panel = col * (0.8 + 0.35 * atm_hash(vec2(cell.x, 0.0) + vSeed));
                        pattern = mix(panel, col * 0.4, seam);
                        float lamp = rect(f, vec2(0.45, 0.45), vec2(0.55, 0.55)) * step(0.94, atm_hash(cell + vSeed));
                        emit = vec3(1.0, 0.6, 0.3) * lamp * 1.2;
                        avg = panel * 0.92;
                    #endif

                    // au loin, une cellule fait moins de 2 pixels : on passe à la moyenne
                    vec2 fw = fwUv / cs;
                    aa = smoothstep(0.3, 0.9, max(fw.x, fw.y));
                    // le jour, presque toutes les fenêtres sont éteintes
                    float lights = 1.0 - 0.85 * ATM_DAY;
                    col = mix(pattern + emit * lights, mix(avg, pattern * 0.9 + avg * 0.1, ATM_DAY * 0.6), aa);
                } else if(n.y > 0.5){
                    // toits : un peu de ciel, quelques taches de lumière
                    col = base * 0.55 + ATM_HIGH * 0.22;
                    vec2 rc = floor(vWP.xz / 3.0);
                    col += vec3(1.0, 0.6, 0.35) * step(0.985, atm_hash(rc + vSeed)) * 0.6;
                } else {
                    col = base * 0.3;
                }

                col = atm_apply(col, vWP, uFogDensity, uFogColor);
                gl_FragColor = vec4(col, 1.0);
            }
        `
    });
}

// Matériaux partagés (bldMat / bldMatDark gardés pour compatibilité)
export const resMat = makeBuildingMaterial(0x2c2548, STYLE.RESIDENTIAL, { lit: 0.42 });
export const resWarmMat = makeBuildingMaterial(0x3a2a44, STYLE.RESIDENTIAL, { lit: 0.5 });
export const comMat = makeBuildingMaterial(0x1c2442, STYLE.COMMERCIAL, { lit: 0.45 });
export const towerMat = makeBuildingMaterial(0x1d1a34, STYLE.TOWER, { neon: 0xb060ff, lit: 0.4 });
export const towerCyanMat = makeBuildingMaterial(0x181e34, STYLE.TOWER, { neon: 0x50d0ff, lit: 0.35 });
export const towerPinkMat = makeBuildingMaterial(0x221a32, STYLE.TOWER, { neon: 0xff4fb0, lit: 0.35 });
export const industrialMat = makeBuildingMaterial(0x2a2632, STYLE.INDUSTRIAL);

export const bldMat = resMat;
export const bldMatDark = towerMat;
