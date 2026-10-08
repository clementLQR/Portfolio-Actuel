import { STOPS } from "./navigation.js";

// Interface HTML par-dessus la scène : écran de chargement, menu des pièces, indication.

const touch = window.matchMedia("(pointer: coarse)").matches;
const HINTS = touch
    ? ["Glisse vers le haut pour descendre", "Glisse pour entrer dans le bureau · touche la télé ou la borne", "Glisse vers le bas pour revenir · touche l'écran ou le téléphone"]
    : ["Scroll pour descendre au salon", "Scroll pour entrer dans le bureau · clique sur la télé ou la borne", "Scroll vers le haut pour revenir · clique sur l'écran du PC ou le téléphone"];
const PC_HINT = touch ? "Touche à côté de l'écran pour revenir" : "Clique à côté de l'écran ou Échap pour revenir";
const PHONE_HINT = touch ? "" : "Clique à côté du téléphone ou Échap pour revenir";
const SEATED_HINT = touch ? "Touche l'écran pour revenir" : "Clique ou scroll pour revenir";

const CHOICE_HINT = touch ? "Touche une borne pour jouer" : "Clique sur une borne pour jouer · Échap pour revenir";
const VIEW_HINT = touch ? "Touche un autre objet · touche ailleurs pour revenir" : "Clique sur un autre objet · Échap pour revenir";
const TURNTABLE_HINT = touch ? "Choisis un disque · touche ailleurs pour revenir" : "Choisis un disque · Échap ou clic ailleurs pour revenir";
const WINDOW_HINT = touch ? "Glisse pour regarder · touche pour revenir" : "Bouge la souris pour regarder · clic ou Échap pour revenir";
const TV_HINT = touch ? "Touche la télé pour changer de chaîne · touche ailleurs pour revenir" : "Clique la télé ou ← → pour changer de chaîne · Échap pour revenir";
const PRINTER_HINT = touch ? "Touche l'imprimante pour voir le CV · touche ailleurs pour revenir" : "Clique l'imprimante pour voir le CV · Échap pour revenir";
const ARCADE_HINT = touch ? "" : "← → bouger · Espace tirer · Entrée jouer · Échap pour revenir";

export function createUI({ onSelect }) {
    const loader = document.querySelector("#loader");
    const hint = document.querySelector("#hint");
    const links = [...document.querySelectorAll("[data-room]")];

    links.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect(STOPS.indexOf(link.dataset.room));
        });
    });

    let lastActive = -1;

    return {
        // appelé à chaque changement de destination
        setGoal(goal, seated = false, spot = null) {
            const stop = Math.round(goal);
            const settled = Math.abs(goal - stop) < 0.01;
            hint.textContent = spot === "printer" ? PRINTER_HINT : spot === "pc" ? PC_HINT : spot === "phone" ? PHONE_HINT : spot === "tv" ? TV_HINT : spot === "window" ? WINDOW_HINT : spot === "turntable" ? TURNTABLE_HINT : spot === "arcades" ? CHOICE_HINT : spot === "etage" || spot === "figurines" || spot?.startsWith("poster") ? VIEW_HINT : spot?.startsWith("arcade") ? ARCADE_HINT : seated ? SEATED_HINT : HINTS[stop];
            hint.classList.toggle("is-hidden", !settled);
        },

        // appelé à chaque image avec la position réelle de la caméra
        setProgress(travel) {
            const active = Math.round(travel);
            if (active === lastActive) return;
            lastActive = active;
            links.forEach((l, i) => l.classList.toggle("is-active", i === active));
            history.replaceState(null, "", `#${STOPS[active]}`);
        },

        ready() {
            window.__appReady = true;
            loader.classList.add("is-done");
        },

        error(message) {
            window.__appReady = true;
            loader.classList.add("is-error");
            loader.querySelector(".loader__text").textContent = message;
        }
    };
}
