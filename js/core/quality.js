// Qualité du rendu adaptée à la machine.
// - Niveau de départ (QUALITY.low) deviné au chargement : petit GPU intégré, peu de mémoire ou de cœurs,
//   téléphone. Forçable dans l'URL : ?qualite=basse ou ?qualite=haute.
// - Résolution dynamique (createAdaptiveResolution) : si les images/s mesurées chutent, la définition
//   du rendu baisse par paliers ; elle ne remonte jamais au-dessus d'un palier qui a déjà ramé
//   (évite les allers-retours, chaque changement réalloue les tampons de rendu).

function gpuName() {
    try {
        const gl = document.createElement("canvas").getContext("webgl");
        const ext = gl?.getExtension("WEBGL_debug_renderer_info");
        const name = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER);
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        return String(name ?? "");
    } catch {
        return "";
    }
}

function detectLow() {
    const forced = new URLSearchParams(location.search).get("qualite");
    if (forced === "basse") return true;
    if (forced === "haute") return false;
    const gpu = gpuName();
    // GPU dédié reconnu : haute qualité, même avec peu de cœurs
    if (/nvidia|geforce|rtx|gtx|radeon (rx|pro)|apple m\d/i.test(gpu)) return false;
    // vieilles puces Intel (HD / UHD Graphics), GPU de téléphone, rendu logiciel.
    // Les puces intégrées récentes (Iris Xe, Radeon intégrées) restent en haute qualité.
    if (/(u?hd) graphics|mali|adreno|powervr|swiftshader|llvmpipe|basic render/i.test(gpu)) return true;
    if ((navigator.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2) return true;
    return window.matchMedia("(pointer: coarse)").matches;
}

const low = detectLow();
console.info(`[3D] qualité ${low ? "basse" : "haute"} (forcer : ?qualite=basse ou ?qualite=haute)`);

export const QUALITY = {
    low,
    maxPixelRatio: low ? 1.5 : 2,         // plafond de la définition (écrans haute densité)
    minPixelRatio: 1,                     // plancher de la résolution dynamique : jamais sous la définition
                                          // native (sinon tout se pixelise) ; elle ne joue que sur écran haute densité
    shadowSize: low ? 1024 : 2048,
    shadowEvery: low ? 4 : 2,             // ombres recalculées toutes les N images (seuls de petits objets bougent)
    reflectScale: low ? 0.2 : 0.35,       // définition du reflet du fleuve
    reflectEvery: low ? 2 : 1,            // reflet recalculé toutes les N images
    bloomScale: low ? 0.5 : 1,            // définition du halo lumineux
    anisotropy: low ? 2 : 8,
    minorLightDistance: low ? 3 : 0       // petites lumières d'appoint éteintes (portée ≤ cette valeur)
};

// Résolution dynamique : apply(pixelRatio) redimensionne le rendu
export function createAdaptiveResolution(apply) {
    const device = () => Math.min(window.devicePixelRatio || 1, QUALITY.maxPixelRatio);
    const floor = () => Math.min(QUALITY.minPixelRatio, device());
    let ceiling = device();
    let ratio = ceiling;
    let frames = 0, time = 0, warmup = 3, calm = 0;

    function set(r) {
        r = Math.min(ceiling, Math.max(floor(), r));
        if (Math.abs(r - ratio) < 0.01) return;
        ratio = r;
        apply(ratio);
    }

    return {
        get pixelRatio() { return ratio; },
        // dt réel de l'image (non plafonné)
        tick(dt) {
            if (dt > 0.5) { frames = 0; time = 0; return; }   // onglet en arrière-plan, gros à-coup : on ignore
            if (warmup > 0) { warmup -= dt; return; }        // compilation des shaders au démarrage
            frames++;
            time += dt;
            if (time < 1.5) return;
            const fps = frames / time;
            frames = 0;
            time = 0;
            if (fps < 45 && ratio > floor() + 0.01) {
                ceiling = ratio;                               // ce palier rame : on n'y reviendra pas
                set(ratio * (fps < 30 ? 0.75 : 0.87));
                calm = 0;
            } else if (fps > 57 && ratio < ceiling - 0.01) {
                if (++calm >= 3) { set(ratio * 1.1); calm = 0; }
            } else {
                calm = 0;
            }
        },
        // fenêtre redimensionnée ou déplacée vers un autre écran
        reset() {
            ceiling = Math.min(ceiling, device());
            ratio = Math.min(ratio, ceiling);
            return ratio;
        }
    };
}
