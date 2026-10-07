import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { shared } from "../core/scene.js";

// Étalonnage lo-fi : couleurs adoucies, noirs relevés, teinte chaude, vignette, grain animé
const LofiShader = {
    uniforms: {
        tDiffuse: { value: null },
        uTime: shared.uTime
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        uniform sampler2D tDiffuse;
        uniform float uTime;
        varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
            vec3 c = texture2D(tDiffuse, vUv).rgb;
            float l = dot(c, vec3(0.299, 0.587, 0.114));
            c = mix(vec3(l), c, 0.82);
            c = c * 0.9 + vec3(0.05, 0.035, 0.06);
            c *= vec3(1.02, 0.98, 0.96);
            float v = smoothstep(1.05, 0.35, length(vUv - 0.5));
            c *= mix(0.72, 1.0, v);
            c += (hash(vUv * 900.0 + fract(uTime * 7.0)) - 0.5) * 0.045;
            gl_FragColor = vec4(c, 1.0);
        }
    `
};

export function createComposer(renderer, scene, camera) {
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.22, 0.4, 0.95);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass(LofiShader));

    function resize(w, h) {
        composer.setSize(w, h);
        bloom.resolution.set(w, h);
    }

    return { composer, resize };
}
