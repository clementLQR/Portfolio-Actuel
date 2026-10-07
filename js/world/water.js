import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { scene, shared, REFLECT_LAYER } from "../core/scene.js";
import { seeded } from "../core/random.js";
import { RIVER_DIR, RIVER_HALF, RIVER_ORIGIN, RIVER_START, RIVER_END, WATER_Y, GROUND_Y } from "../config/layout.js";
import { ATMOS_GLSL } from "./atmosphere.js";
import { MergeKit, concreteMat } from "./kit.js";
import { LAGOON } from "./zones.js";
import { addTree } from "./vegetation.js";

// Fleuve et lagune : reflet planaire réel (ciel, tours, enseignes, véhicules), rendu en basse
// résolution et seulement pour le calque REFLECT_LAYER (la ville, pas l'appartement).
// Le shader ajoute des rides animées, un effet de Fresnel, le scintillement du soleil et la brume.
// Méthode de projection reprise de three/addons/objects/Reflector.js (plan de coupe oblique).

const REFLECT_SCALE = 0.35;

function createReflection(mesh) {
    const target = new THREE.WebGLRenderTarget(256, 256, { type: THREE.HalfFloatType });
    const textureMatrix = new THREE.Matrix4();
    const virtualCamera = new THREE.PerspectiveCamera();
    virtualCamera.layers.set(REFLECT_LAYER);

    const plane = new THREE.Plane();
    const normal = new THREE.Vector3(0, 1, 0);
    const mirrorPos = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    const rotation = new THREE.Matrix4();
    const lookAt = new THREE.Vector3();
    const view = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    const clipPlane = new THREE.Vector4();
    const q = new THREE.Vector4();
    const size = new THREE.Vector2();
    let rendering = false;

    mesh.onBeforeRender = (renderer, sc, camera) => {
        if (rendering) return;

        renderer.getDrawingBufferSize(size);
        const w = Math.max(64, Math.round(size.x * REFLECT_SCALE)), h = Math.max(64, Math.round(size.y * REFLECT_SCALE));
        if (target.width !== w || target.height !== h) target.setSize(w, h);

        mirrorPos.set(0, WATER_Y, 0);
        camPos.setFromMatrixPosition(camera.matrixWorld);
        view.subVectors(mirrorPos, camPos);
        if (view.dot(normal) > 0) return;
        view.reflect(normal).negate().add(mirrorPos);

        rotation.extractRotation(camera.matrixWorld);
        lookAt.set(0, 0, -1).applyMatrix4(rotation).add(camPos);
        tgt.subVectors(mirrorPos, lookAt).reflect(normal).negate().add(mirrorPos);

        virtualCamera.position.copy(view);
        virtualCamera.up.set(0, 1, 0).applyMatrix4(rotation).reflect(normal);
        virtualCamera.lookAt(tgt);
        virtualCamera.far = camera.far;
        virtualCamera.updateMatrixWorld();
        virtualCamera.projectionMatrix.copy(camera.projectionMatrix);

        textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
        textureMatrix.multiply(virtualCamera.projectionMatrix);
        textureMatrix.multiply(virtualCamera.matrixWorldInverse);

        // plan de coupe oblique : rien sous la surface de l'eau
        plane.setFromNormalAndCoplanarPoint(normal, mirrorPos);
        plane.applyMatrix4(virtualCamera.matrixWorldInverse);
        clipPlane.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
        const pm = virtualCamera.projectionMatrix.elements;
        q.x = (Math.sign(clipPlane.x) + pm[8]) / pm[0];
        q.y = (Math.sign(clipPlane.y) + pm[9]) / pm[5];
        q.z = -1.0;
        q.w = (1.0 + pm[10]) / pm[14];
        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q));
        pm[2] = clipPlane.x;
        pm[6] = clipPlane.y;
        pm[10] = clipPlane.z + 1.0;
        pm[14] = clipPlane.w;

        rendering = true;
        const currentTarget = renderer.getRenderTarget();
        const xr = renderer.xr.enabled;
        const shadowAuto = renderer.shadowMap.autoUpdate;
        renderer.xr.enabled = false;
        renderer.shadowMap.autoUpdate = false;
        renderer.setRenderTarget(target);
        renderer.state.buffers.depth.setMask(true);
        if (renderer.autoClear === false) renderer.clear();
        renderer.render(sc, virtualCamera);
        renderer.xr.enabled = xr;
        renderer.shadowMap.autoUpdate = shadowAuto;
        renderer.setRenderTarget(currentTarget);
        if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
        rendering = false;
    };

    return { texture: target.texture, textureMatrix };
}

export function createWater() {
    const { r, rr } = seeded(8812);

    // fleuve + lagune en une seule géométrie, à plat dans le plan xz
    const len = RIVER_END - RIVER_START;
    const riverGeo = new THREE.PlaneGeometry(RIVER_HALF * 2, len, 1, 1).rotateX(-Math.PI / 2);
    riverGeo.rotateY(-Math.atan2(RIVER_DIR.x, -RIVER_DIR.y));
    const mid = RIVER_ORIGIN.clone().addScaledVector(RIVER_DIR, (RIVER_START + RIVER_END) / 2);
    riverGeo.translate(mid.x, 0, mid.y);
    const lagoonGeo = new THREE.CircleGeometry(LAGOON.r, 64).rotateX(-Math.PI / 2).translate(LAGOON.x, 0, LAGOON.z);
    const geo = mergeGeometries([riverGeo.toNonIndexed(), lagoonGeo.toNonIndexed()]);

    const mesh = new THREE.Mesh(geo);
    mesh.position.y = WATER_Y;
    mesh.userData.noReflect = true;
    const refl = createReflection(mesh);

    mesh.material = new THREE.ShaderMaterial({
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
        uniforms: {
            ...shared,
            tRefl: { value: refl.texture },
            uTexMat: { value: refl.textureMatrix },
            uDeep: { value: new THREE.Color(0x0c0818) }
        },
        vertexShader: /* glsl */`
            uniform mat4 uTexMat;
            varying vec3 vWP;
            varying vec4 vRefl;
            void main(){
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWP = wp.xyz;
                vRefl = uTexMat * wp;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: /* glsl */`
            uniform sampler2D tRefl;
            uniform vec3 uDeep, uFogColor;
            uniform float uTime, uFogDensity;
            varying vec3 vWP;
            varying vec4 vRefl;
            ${ATMOS_GLSL}

            // pente de la surface : rides allongées en travers du courant + clapot
            vec2 slope(vec2 p, float t){
                vec2 s = vec2(0.0);
                s += vec2(0.15, 1.0) * cos(p.y * 0.21 + t * 1.1 + sin(p.x * 0.05) * 1.5) * 0.6;
                s += vec2(-0.35, 1.0) * cos(p.y * 0.47 - p.x * 0.11 + t * 1.7) * 0.35;
                s += vec2(1.0, 0.4) * cos(p.x * 0.33 + p.y * 0.18 - t * 1.3) * 0.25;
                s += vec2(0.6, 1.0) * cos(p.y * 1.13 + p.x * 0.27 + t * 2.6) * 0.18;
                return s;
            }

            void main(){
                atm_init(uDay);
                vec3 toCam = cameraPosition - vWP;
                float dist = length(toCam);
                vec3 V = toCam / dist;

                // rides plus douces au loin (évite le scintillement)
                float amp = mix(0.06, 0.012, smoothstep(150.0, 1200.0, dist));
                vec2 s = slope(vWP.xz, uTime) * amp;
                vec3 N = normalize(vec3(-s.x, 1.0, -s.y));

                // reflet : coordonnées projetées, déformées surtout verticalement (traînées)
                vec2 ruv = vRefl.xy / vRefl.w + vec2(s.x * 0.25, s.y * 0.9);
                vec3 refl = texture2D(tRefl, ruv).rgb;

                float fres = 0.04 + 0.96 * pow(1.0 - max(dot(V, N), 0.0), 5.0);
                vec3 col = mix(uDeep, refl, clamp(0.25 + fres, 0.0, 0.95));

                // scintillement du soleil
                vec3 R = reflect(-V, N);
                float sd = max(dot(R, ATM_SUN_DIR), 0.0);
                col += ATM_SUN * pow(sd, 400.0) * 3.0;
                col += ATM_GLOW * pow(sd, 40.0) * 0.35;

                col = atm_apply(col, vWP, uFogDensity, uFogColor);
                gl_FragColor = vec4(col, 1.0);
            }
        `
    });
    scene.add(mesh);

    // quais : murets bas le long des berges, arbres sur les promenades
    const kit = new MergeKit();
    const rd = new THREE.Vector3(RIVER_DIR.x, 0, RIVER_DIR.y);
    const side = new THREE.Vector3(-RIVER_DIR.y, 0, RIVER_DIR.x);
    const ry = Math.atan2(RIVER_DIR.x, RIVER_DIR.y);
    for (const s of [-1, 1]) {
        const c = new THREE.Vector3(RIVER_ORIGIN.x, 0, RIVER_ORIGIN.y)
            .addScaledVector(rd, (RIVER_START + RIVER_END - 60) / 2)
            .addScaledVector(side, s * (RIVER_HALF + 0.6));
        kit.add(new THREE.BoxGeometry(1.2, 1, len - 60).translate(0, 0.5, 0), concreteMat, c.x, GROUND_Y, c.z, 1, WATER_Y - GROUND_Y + 1.2, 1, ry);
    }
    kit.build();

    for (let i = 0; i < 300; i++) {
        const t = rr(RIVER_START + 50, RIVER_END - 120);
        const s = r() < 0.5 ? -1 : 1;
        const p = new THREE.Vector3(RIVER_ORIGIN.x, 0, RIVER_ORIGIN.y)
            .addScaledVector(rd, t).addScaledVector(side, s * (RIVER_HALF + rr(10, 13)));
        addTree(p.x, GROUND_Y, p.z, rr(6, 10), r);
    }
}

// Tout le décor construit jusque-là apparaît dans le reflet (sauf l'eau elle-même)
export function enableReflections() {
    scene.traverse((o) => {
        if (!o.userData.noReflect) o.layers.enable(REFLECT_LAYER);
    });
}
