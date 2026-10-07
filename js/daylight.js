import { scene, shared, FOG_COLOR, FOG_COLOR_SUNSET, FOG_COLOR_DAY } from "./core/scene.js";
import { onFrame } from "./core/animated.js";
import { setDaylight } from "./lighting.js";

// Bascule coucher de soleil ↔ plein jour : transition douce (~2,5 s) de la palette du ciel
// (uniform uDay), du brouillard, des lumières et de l'exposition. Le choix est mémorisé
// dans le navigateur.

const KEY = "appartement3d.daylight";
const DURATION = 2.5;
const EXPOSURE = [0.95, 1.2];

function load() {
    try { return localStorage.getItem(KEY) === "day"; } catch { return false; }
}
function save(day) {
    try { localStorage.setItem(KEY, day ? "day" : "sunset"); } catch { /* indisponible */ }
}

export function createDaylight(renderer, { onChange } = {}) {
    let target = load() ? 1 : 0;
    let k = target;
    let applied = -1;

    function apply() {
        const e = k * k * (3 - 2 * k);
        shared.uDay.value = e;
        FOG_COLOR.lerpColors(FOG_COLOR_SUNSET, FOG_COLOR_DAY, e);
        scene.fog.color.copy(FOG_COLOR);
        renderer.toneMappingExposure = EXPOSURE[0] + (EXPOSURE[1] - EXPOSURE[0]) * e;
        setDaylight(e);
        applied = k;
    }

    onFrame((dt) => {
        if (k !== target) k = target > k ? Math.min(target, k + dt / DURATION) : Math.max(target, k - dt / DURATION);
        if (k !== applied) apply();
    });
    apply();

    return {
        get day() { return target === 1; },
        toggle() {
            target = target ? 0 : 1;
            save(target === 1);
            onChange?.(target === 1);
        }
    };
}
