// Curseur personnalisé : point ambré + anneau qui le suit avec un léger retard.
// Survol d'un élément cliquable (la télé, le menu) : l'anneau s'agrandit et affiche une étiquette.
// Désactivé sur les écrans tactiles (le curseur natif n'existe pas).

const finePointer = window.matchMedia("(pointer: fine)").matches;

export function createCursor() {
    if (!finePointer) return { setHover() {} };

    const root = document.createElement("div");
    root.className = "cursor";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `<span class="cursor__ring"><span class="cursor__label"></span></span><span class="cursor__dot"></span>`;
    document.body.appendChild(root);
    document.documentElement.classList.add("has-custom-cursor");

    const ring = root.querySelector(".cursor__ring");
    const dot = root.querySelector(".cursor__dot");
    const label = root.querySelector(".cursor__label");

    let x = -100, y = -100, rx = -100, ry = -100;
    let sceneLabel = null;   // survol dans la scène 3D (télé…)
    let uiHover = false;     // survol d'un lien de l'interface

    function refresh() {
        const text = sceneLabel ?? (uiHover ? "" : null);
        root.classList.toggle("is-hover", text !== null);
        root.classList.toggle("has-label", !!text);
        if (text) {
            label.textContent = text;
            // l'anneau s'élargit en pastille pour contenir tout le texte, centré
            const w = Math.ceil(label.offsetWidth) + 36;
            ring.style.setProperty("--rw", Math.max(84, w) + "px");
            ring.style.setProperty("--rh", (w > 100 ? 52 : 84) + "px");
        }
    }

    window.addEventListener("pointermove", (e) => {
        x = e.clientX;
        y = e.clientY;
        root.classList.add("is-visible");
    });
    document.addEventListener("pointerleave", () => root.classList.remove("is-visible"));
    window.addEventListener("pointerdown", () => root.classList.add("is-down"));
    window.addEventListener("pointerup", () => root.classList.remove("is-down"));

    // liens et boutons de l'interface HTML ; sur un bord de fenêtre du PC, flèche native de redimensionnement
    document.addEventListener("pointerover", (e) => {
        root.classList.toggle("is-native", !!e.target.closest?.(".pc__win-rs"));
        uiHover = !!e.target.closest?.("a, button");
        refresh();
    });

    (function follow() {
        rx += (x - rx) * 0.2;
        ry += (y - ry) * 0.2;
        dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        requestAnimationFrame(follow);
    })();

    return {
        // label : texte affiché au survol d'un objet de la scène, ou null
        setHover(text) {
            if (text === sceneLabel) return;
            sceneLabel = text;
            refresh();
        }
    };
}
