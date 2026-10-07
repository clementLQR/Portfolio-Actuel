// Registre des animations : chaque module y inscrit ce qui doit bouger à chaque image.

const updaters = [];

export function onFrame(fn) {
    updaters.push(fn);
}

export function runFrame(dt, t) {
    for (const fn of updaters) fn(dt, t);
}

// Léger scintillement d'écran (télé, moniteur)
export function flicker(light, base, amount) {
    onFrame((dt, t) => {
        light.intensity = base + Math.sin(t * 3.1) * Math.sin(t * 7.3) * amount;
    });
}
