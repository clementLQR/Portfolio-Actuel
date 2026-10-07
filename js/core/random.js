// Générateur pseudo-aléatoire déterministe : la scène est identique à chaque chargement.
// Toute la génération partage le même flux, l'ordre des appels dans main.js compte.

export function mulberry32(a) {
    return function () {
        a |= 0; a = a + 0x6D2B79F5 | 0;
        let t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export const rand = mulberry32(1987);
export const rr = (a, b) => a + (b - a) * rand();
export const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// Avance le flux global de n tirages (voir main.js : la ville a son propre générateur)
export function skipRand(n) {
    for (let i = 0; i < n; i++) rand();
}

// Raccourcis pour un générateur dédié : const { r, rr, pick } = seeded(42)
export function seeded(seed) {
    const r = mulberry32(seed);
    return {
        r,
        rr: (a, b) => a + (b - a) * r(),
        pick: (arr) => arr[Math.floor(r() * arr.length)]
    };
}
