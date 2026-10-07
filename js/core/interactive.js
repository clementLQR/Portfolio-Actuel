import * as THREE from "three";

// Objets cliquables de la scène (la télé du salon…). Le rayon n'est lancé que contre
// ces objets : pas de parcours de toute la ville à chaque mouvement de souris.

const targets = [];
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

export function registerClickable(object, id) {
    targets.push({ object, id });
}

export function getClickable(id) {
    return targets.find((t) => t.id === id)?.object ?? null;
}

// tous les objets enregistrés sous un identifiant (un poster double, les figurines…)
export function getClickables(id) {
    return targets.filter((t) => t.id === id).map((t) => t.object);
}

// Identifiant de l'objet sous le pointeur (coordonnées écran), ou null
export function pickClickable(clientX, clientY, camera) {
    if (!targets.length) return null;
    ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(targets.map((t) => t.object), true);
    if (!hits.length) return null;
    const hit = hits[0].object;
    const found = targets.find((t) => t.object === hit || t.object.getObjectById(hit.id));
    return found ? found.id : null;
}
