import { MathUtils } from "three";

// Version compressée (Meshopt + quantification) générée depuis models-source/mascotte.glb,
// l'export Blender, qui reste hors de public/ pour ne pas être publié :
// npx @gltf-transform/cli meshopt models-source/mascotte.glb public/models/mascotte.opt.glb
export const MODEL_URL = "/models/mascotte.opt.glb";

// Dimensions du modèle (mètres, origine au sol entre les pieds)
export const MODEL_HEIGHT = 1.85;
/** Largeur oreilles comprises */
export const MODEL_WIDTH = 2.25;
/** Hauteur du centre de la visière, pour calculer le regard */
export const HEAD_CENTER_Y = 1.25;

// Regard vers la souris
export const LOOK_MAX_YAW = MathUtils.degToRad(35);
export const LOOK_MAX_PITCH = MathUtils.degToRad(20);
/** Profondeur virtuelle (px) qui convertit une distance à l'écran en angle */
export const LOOK_DEPTH_PX = 650;
/** Sans mouvement de souris pendant ce délai, la tête revient au neutre */
export const LOOK_IDLE_MS = 3500;

// Clignements
export const BLINK_MIN_MS = 2000;
export const BLINK_MAX_MS = 6000;
export const BLINK_DURATION_MS = 120;

// Comportements
export const SLEEP_AFTER_MS = 30_000;
export const EASTER_EGG_CLICKS = 10;
/** Délai maximal entre deux clics pour qu'ils comptent comme « rapides » */
export const EASTER_EGG_GAP_MS = 450;
export const FAST_SCROLL_PX_PER_S = 4500;

// Déplacements entre ancres
export const TRAVEL_DURATION_S = 0.9;

// Légère plongée de la caméra sur la mascotte (radians)
export const VIEW_TILT = 0.12;
/** Inclinaison du socle pour qu'il se lise en ellipse */
export const SOCLE_TILT = 0.38;
