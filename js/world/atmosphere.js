import * as THREE from "three";
import { SKY, SUN_DIR, SKY_DAY, SUN_DIR_DAY, FOG_COLOR_SUNSET, FOG_COLOR_DAY } from "../core/scene.js";
import { GROUND_Y } from "../config/layout.js";

// Atmosphère commune à tout le décor : dégradé du ciel et brume qui prend la couleur
// du ciel derrière l'objet (plus chaude vers le soleil, plus légère en altitude).
// Deux palettes (coucher de soleil, plein jour) mélangées par atm_init(jour) au début de chaque
// shader : uDay pour les shaders maison, déduit de la couleur du brouillard pour ceux de three.js.
//
// ATMOS_GLSL est inclus par les shaders maison (ciel, immeubles, fleuve).
// Le brouillard des matériaux three.js (MeshStandard, MeshBasic…) est remplacé par la même
// fonction : arbres, ponts et véhicules se fondent dans la brume comme les immeubles.
// Dans l'appartement (distances < 20 m) l'effet est nul.

// couleur (r, g, b) ou direction (x, y, z) → littéral GLSL
const v3 = (c) => c.isColor ? `vec3(${c.r.toFixed(5)}, ${c.g.toFixed(5)}, ${c.b.toFixed(5)})` : `vec3(${c.x.toFixed(5)}, ${c.y.toFixed(5)}, ${c.z.toFixed(5)})`;

export const ATMOS_GLSL = /* glsl */`
uniform float uDay;
const float ATM_GROUND = ${GROUND_Y.toFixed(1)};
vec3 ATM_ZENITH, ATM_HIGH, ATM_PINK, ATM_HORIZON, ATM_GLOW, ATM_SUN, ATM_FOG_SUN, ATM_SUN_DIR;
float ATM_DAY;

// à appeler au début du shader : 0 = coucher de soleil, 1 = plein jour
void atm_init(float d){
    ATM_DAY = d;
    ATM_ZENITH = mix(${v3(SKY.zenith)}, ${v3(SKY_DAY.zenith)}, d);
    ATM_HIGH = mix(${v3(SKY.high)}, ${v3(SKY_DAY.high)}, d);
    ATM_PINK = mix(${v3(SKY.pink)}, ${v3(SKY_DAY.pink)}, d);
    ATM_HORIZON = mix(${v3(SKY.horizon)}, ${v3(SKY_DAY.horizon)}, d);
    ATM_GLOW = mix(${v3(SKY.glow)}, ${v3(SKY_DAY.glow)}, d);
    ATM_SUN = mix(${v3(SKY.sun)}, ${v3(SKY_DAY.sun)}, d);
    ATM_FOG_SUN = mix(${v3(SKY.fogSun)}, ${v3(SKY_DAY.fogSun)}, d);
    ATM_SUN_DIR = normalize(mix(${v3(SUN_DIR)}, ${v3(SUN_DIR_DAY)}, d));
}

// matériaux three.js : le jour se lit sur la couleur du brouillard (vert : ${FOG_COLOR_SUNSET.g.toFixed(4)} → ${FOG_COLOR_DAY.g.toFixed(4)})
float atm_dayFromFog(vec3 fc){
    return clamp((fc.g - ${FOG_COLOR_SUNSET.g.toFixed(5)}) / ${(FOG_COLOR_DAY.g - FOG_COLOR_SUNSET.g).toFixed(5)}, 0.0, 1.0);
}

float atm_hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Dégradé du ciel (sans soleil ni nuages) : bleu nuit en haut, violet, rose, orange, orange clair
vec3 atm_sky(vec3 d){
    float h = d.y;
    vec2 hz = normalize(d.xz + vec2(1e-5));
    float az = max(dot(hz, normalize(ATM_SUN_DIR.xz)), 0.0);
    vec3 col = mix(ATM_GLOW, ATM_HORIZON, smoothstep(0.0, 0.045, h));
    col = mix(col, ATM_PINK, smoothstep(0.035, 0.15, h));
    col = mix(col, ATM_HIGH, smoothstep(0.13, 0.36, h));
    col = mix(col, ATM_ZENITH, smoothstep(0.34, 0.85, h));
    // plus chaud et lumineux face au soleil, plus froid dans le dos
    col *= mix(mix(0.62, 1.1, pow(az, 2.0)), 1.15, ATM_DAY);
    col += ATM_GLOW * pow(az, 14.0) * exp(-max(h, 0.0) * 12.0) * 0.55;
    // sous l'horizon : brume rosée
    col = mix(col, ATM_HORIZON * 0.35 + ATM_PINK * 0.25, smoothstep(0.0, -0.12, h));
    return col;
}

// Brume atmosphérique : couleur du ciel à cette hauteur, désaturation des lointains
vec3 atm_apply(vec3 col, vec3 wp, float density, vec3 fogCol){
    vec3 v = wp - cameraPosition;
    float dist = length(v);
    float k = dist * density * 0.72;
    float f = 1.0 - exp(-k * k);
    if(f < 0.0005) return col;
    vec3 dir = v / dist;
    float alt = clamp((wp.y - ATM_GROUND) / 450.0, 0.0, 1.0);
    f = min(f * (1.0 - 0.32 * alt), 0.93);
    float s = pow(max(dot(dir, ATM_SUN_DIR), 0.0), 6.0);
    vec3 fc = mix(fogCol, ATM_FOG_SUN, s * 0.8);
    fc = mix(fc, atm_sky(normalize(vec3(dir.x, max(dir.y, 0.0) * 0.6 + 0.012, dir.z))), 0.3);
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(l), f * 0.55);
    return mix(col, fc, f);
}
`;

// --- brouillard des matériaux three.js ---------------------------------------
// FogExp2 → atm_apply ; le brouillard linéaire (non utilisé ici) garde son comportement.

THREE.ShaderChunk.fog_pars_vertex = /* glsl */`
#ifdef USE_FOG
    varying float vFogDepth;
    varying vec3 vFogWorldPos;
#endif
`;

THREE.ShaderChunk.fog_vertex = /* glsl */`
#ifdef USE_FOG
    vFogDepth = - mvPosition.z;
    vFogWorldPos = cameraPosition + transpose(mat3(viewMatrix)) * mvPosition.xyz;
#endif
`;

THREE.ShaderChunk.fog_pars_fragment = /* glsl */`
#ifdef USE_FOG
    uniform vec3 fogColor;
    varying float vFogDepth;
    varying vec3 vFogWorldPos;
    #ifdef FOG_EXP2
        uniform float fogDensity;
        ${ATMOS_GLSL}
    #else
        uniform float fogNear;
        uniform float fogFar;
    #endif
#endif
`;

THREE.ShaderChunk.fog_fragment = /* glsl */`
#ifdef USE_FOG
    #ifdef FOG_EXP2
        atm_init(atm_dayFromFog(fogColor));
        gl_FragColor.rgb = atm_apply(gl_FragColor.rgb, vFogWorldPos, fogDensity, fogColor);
    #else
        float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, fogFactor);
    #endif
#endif
`;
