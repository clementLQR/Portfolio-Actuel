import * as THREE from "three";

// Plan de l'appartement (mètres). Axe -z = vers la ville.

// Chambre
export const RX0 = -4, RX1 = 4;          // murs gauche / droite
export const BZ = -3.5, FZ = 4.6;        // mur du fond (ouverture) / mur avant
export const H = 3.8;                    // hauteur sous plafond
export const T = 0.35;                   // épaisseur du mur du fond

// Ouverture de la chambre vers les marches
export const WX0 = -2.0, WX1 = 4.0, WY1 = 3.3;

// Salon en contrebas
export const SF = -0.6;                  // niveau du sol
export const SX0 = -4.5, SX1 = 4.6;      // murs gauche / droite
export const SH = 4.6;                   // plafond
export const SZ1 = -12.5;                // mur de la baie vitrée

// Baie vitrée du salon (tout le mur du fond)
export const FWX0 = SX0, FWX1 = SX1, FWY0 = SF + 0.15, FWY1 = SH - 0.3;

// Ville (implantation détaillée : world/zones.js)
export const GROUND_Y = -25;
export const RIVER_ORIGIN = new THREE.Vector2(2, 0);             // axe du fleuve, qui file vers le soleil
export const RIVER_DIR = new THREE.Vector2(-0.02, -1).normalize();
export const RIVER_HALF = 32;                                    // demi-largeur
export const RIVER_START = 110, RIVER_END = 1250;                // distances le long de l'axe
export const WATER_Y = GROUND_Y + 0.6;

// Caméra
export const CAM_BASE = new THREE.Vector3(-2.9, 1.25, 3.2);     // arrivée : lampe à lave
export const CAM_TARGET = new THREE.Vector3(-2.4, 1.1, -3.5);
export const SALON_TARGET = new THREE.Vector3(0.1, 0.7, -12.5);
export const PC_SCREEN = new THREE.Vector3();                   // renseigné par le bureau
// Borne d'arcade : coin du salon contre le mur de gauche, écran tourné vers la pièce
export const ARCADE_POS = new THREE.Vector3(SX0 + 0.02, SF, -5.22);
export const ARCADE2_POS = new THREE.Vector3(SX0 + 0.02, SF, -4.4);     // sa voisine, vers le mur d'entrée

// Points de vue des objets cliquables du salon : position, cible, champ, petit « plongeon » (s'asseoir)
export const SPOTS = {
    tv: { pos: new THREE.Vector3(-2.45, SF + 1.2, -8.55), look: new THREE.Vector3(SX1 - 0.1, SF + 1.45, -8.4), fov: 42, dip: 0.12 },
    arcade: { pos: new THREE.Vector3(SX0 + 1.6, SF + 1.6, -5.22), look: new THREE.Vector3(SX0 + 0.5, SF + 1.25, -5.22), fov: 52, dip: 0 },
    window: { pos: new THREE.Vector3(0.3, SF + 1.75, SZ1 + 2.3), look: new THREE.Vector3(0.3, SF + 2.1, SZ1 - 25), fov: 58, dip: 0, pan: 7 },
    turntable: { pos: new THREE.Vector3(SX1 - 2.0, SF + 1.15, -7.3), look: new THREE.Vector3(SX1 - 0.4, SF + 0.45, -7.32), fov: 48, dip: 0.05 },
    figurines: { pos: new THREE.Vector3(SX0 + 1.2, SF + 2.55, -8.92), look: new THREE.Vector3(SX0 + 0.2, SF + 2.45, -8.92), fov: 34, dip: 0 },
    etage: { pos: new THREE.Vector3(SX0 + 3.5, 2.1, -7.65), look: new THREE.Vector3(SX0, 1.9, -7.65), fov: 62, dip: 0 },   // vue d'ensemble : bibliothèque, figurines et posters
    poster1: { pos: new THREE.Vector3(SX0 + 1.7, 2.7, -6.47), look: new THREE.Vector3(SX0 + 0.02, 2.85, -6.47), fov: 50, dip: 0 },
    poster2: { pos: new THREE.Vector3(SX0 + 2.1, 2.8, -7.65), look: new THREE.Vector3(SX0 + 0.02, 2.95, -7.65), fov: 46, dip: 0 },
    poster3: { pos: new THREE.Vector3(SX0 + 1.7, 2.7, -8.82), look: new THREE.Vector3(SX0 + 0.02, 2.85, -8.82), fov: 50, dip: 0 },
    arcades: { pos: new THREE.Vector3(SX0 + 2.3, SF + 1.5, -4.81), look: new THREE.Vector3(SX0 + 0.5, SF + 1.15, -4.81), fov: 58, dip: 0 },
    arcade2: { pos: new THREE.Vector3(SX0 + 1.6, SF + 1.6, -4.4), look: new THREE.Vector3(SX0 + 0.5, SF + 1.25, -4.4), fov: 52, dip: 0 }
};
