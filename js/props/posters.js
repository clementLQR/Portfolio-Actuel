import * as THREE from "three";
import { scene } from "../core/scene.js";
import { rr } from "../core/random.js";
import { makeBigPosterTexture, makeSmallPosterTexture } from "../core/textures.js";
import { QUALITY } from "../core/quality.js";

export const bigPoster = makeBigPosterTexture();
export const smallPoster = makeSmallPosterTexture;

// Affiche à partir d'une image du dossier assets/
export function imagePoster(path) {
    const tex = new THREE.TextureLoader().load(path);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = QUALITY.anisotropy;
    return tex;
}

function posterMaterial(tex) {
    return new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.08 });
}

// Cadre autour d'une affiche (enfant du plan : suit son inclinaison), juste derrière l'image
function addFrame(m, w, h, color) {
    const b = 0.035;
    const frame = new THREE.Mesh(
        new THREE.BoxGeometry(w + b * 2, h + b * 2, 0.012),
        new THREE.MeshStandardMaterial({ color, roughness: 0.55 })
    );
    frame.position.z = -0.0075;
    frame.castShadow = frame.receiveShadow = true;
    m.add(frame);
}

// Poster sur un mur orienté vers +x (murs de gauche), légèrement de travers ; frame : couleur du cadre
export function poster(tex, w, h, z, y, x, { frame = null } = {}) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), posterMaterial(tex));
    m.position.set(x + 0.016, y, z);
    m.rotation.y = Math.PI / 2;
    m.rotation.z = rr(-0.015, 0.015);
    m.receiveShadow = true;
    if (frame !== null) addFrame(m, w, h, frame);
    scene.add(m);
    return m;
}

// Même chose, parfaitement droit (pas de tirage aléatoire)
export function straightPoster(tex, w, h, z, y, x) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), posterMaterial(tex));
    m.position.set(x + 0.012, y, z);
    m.rotation.y = Math.PI / 2;
    scene.add(m);
}
