import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { OutputShader } from "three/addons/shaders/OutputShader.js";
import { shared } from "../core/scene.js";
import { QUALITY } from "../core/quality.js";

// Étalonnage lo-fi : couleurs adoucies, noirs relevés, teinte chaude, vignette, grain animé.
// Greffé à la fin de la passe de sortie (tone mapping + sRGB) : une seule passe plein écran au lieu de deux.
const LOFI_PARS = /* glsl */`
    uniform float uTime;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
`;
const LOFI_MAIN = /* glsl */`
    vec3 c = gl_FragColor.rgb;
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, 0.82);
    c = c * 0.9 + vec3(0.05, 0.035, 0.06);
    c *= vec3(1.02, 0.98, 0.96);
    float v = smoothstep(1.05, 0.35, length(vUv - 0.5));
    c *= mix(0.72, 1.0, v);
    c += (hash(vUv * 900.0 + fract(uTime * 7.0)) - 0.5) * 0.045;
    gl_FragColor = vec4(c, 1.0);
`;

function createLofiOutputPass() {
    const pass = new OutputPass();
    pass.uniforms.uTime = shared.uTime;
    pass.material.fragmentShader = OutputShader.fragmentShader
        .replace("varying vec2 vUv;", "varying vec2 vUv;\n" + LOFI_PARS)
        .replace(/\}\s*$/, LOFI_MAIN + "\n}");
    return pass;
}

export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.4, 0.95);
    if (QUALITY.bloomScale !== 1) {   // halo calculé en plus basse définition (il est flou de toute façon)
        const setSize = bloom.setSize.bind(bloom);
        bloom.setSize = (w, h) => setSize(Math.max(1, Math.round(w * QUALITY.bloomScale)), Math.max(1, Math.round(h * QUALITY.bloomScale)));
    }
    composer.addPass(bloom);
    composer.addPass(createLofiOutputPass());

    function resize(w, h, pixelRatio) {
        composer.setPixelRatio(pixelRatio);
        composer.setSize(w, h);
    }

    return { composer, resize };
}
