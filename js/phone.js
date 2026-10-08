// Téléphone posé sur le bureau, pensé pour les visiteurs sur mobile (l'écran du PC, conçu en 960×540
// puis réduit, y est difficile à utiliser). Un clic sur le téléphone en approche la caméra ; une fois
// arrivé, une interface de smartphone s'ouvre : plein écran sur mobile, format téléphone au centre sinon.
// Applications partagées avec l'ordinateur (appRenderers de desktop.js) : À propos, Projets, Contact,
// Galerie ; « CV » lance l'impression (onCv). Le contenu se modifie dans CONTENT (desktop.js).

import { CONTENT, esc, appRenderers } from "./desktop.js";
import { appGlyph, appIconStyle } from "./icons.js";

const APPS = {
    // icônes et couleurs : js/icons.js (mêmes que sur le PC)
    about: { title: "À propos" },
    projects: { title: "Projets" },
    contact: { title: "Contact" },
    gallery: { title: "Galerie" },
    cv: { title: "Mon CV", action: true }   // pas d'écran : lance l'impression
};

// onCv : imprime le CV ; onClose : repose le téléphone (la caméra se relève)
export function createPhone({ onCv, onClose }) {
    const a = CONTENT.about;
    const root = document.createElement("div");
    root.className = "phone";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Mon téléphone");
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
        <div class="phone__device">
            <div class="phone__screen" style="background-image:linear-gradient(rgba(20, 10, 30, 0.55), rgba(20, 10, 30, 0.88)), url('${CONTENT.wallpaper}')">
                <div class="phone__status" aria-hidden="true"><span class="phone__clock"></span><span class="phone__notch"></span><span>◠ ▮</span></div>
                <div class="phone__home">
                    <p class="phone__time"></p>
                    <p class="phone__date"></p>
                    <div class="phone__hello">
                        <img src="${a.avatar}" alt="">
                        <div><strong>${esc(a.name)}</strong><span>${esc(a.role)}</span></div>
                    </div>
                    <div class="phone__apps">
                        ${Object.entries(APPS).map(([id, app]) => `
                            <button type="button" class="phone__icon" data-app="${id}" style="${appIconStyle(id)}">
                                <span class="phone__icon-glyph" aria-hidden="true">${appGlyph(id)}</span>${esc(app.title)}
                            </button>`).join("")}
                    </div>
                    <button type="button" class="phone__close" data-close>Reposer le téléphone <kbd>Échap</kbd></button>
                </div>
                <section class="phone__app" aria-live="polite">
                    <header class="phone__app-bar">
                        <button type="button" data-home>‹ Accueil</button>
                        <span class="phone__app-title"></span>
                        <span aria-hidden="true"></span>
                    </header>
                    <div class="phone__app-body"></div>
                </section>
                <button type="button" class="phone__homebar" data-home aria-label="Revenir à l'accueil"></button>
            </div>
        </div>`;
    document.body.appendChild(root);

    const RENDER = appRenderers({ onCv });
    const appEl = root.querySelector(".phone__app");
    const body = root.querySelector(".phone__app-body");
    const title = root.querySelector(".phone__app-title");
    let visible = false;

    // le défilement et le tactile dans le téléphone ne font pas bouger la caméra
    for (const ev of ["wheel", "touchstart", "touchmove"]) {
        root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    }

    function tick() {
        const d = new Date();
        const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        root.querySelector(".phone__clock").textContent = time;
        root.querySelector(".phone__time").textContent = time;
        root.querySelector(".phone__date").textContent = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
    }
    tick();
    setInterval(tick, 15000);

    function openApp(id) {
        const app = APPS[id];
        if (app.action) return onCv?.();
        title.textContent = app.title;
        body.innerHTML = "";
        RENDER[id](body);
        body.scrollTop = 0;
        appEl.classList.add("is-open");
        appEl.querySelector("[data-home]").focus({ preventScroll: true });
    }

    function home() {
        appEl.classList.remove("is-open");
    }

    root.addEventListener("click", (e) => {
        e.stopPropagation();
        const btn = e.target.closest("[data-app], [data-home], [data-close]");
        if (!btn) return;
        if (btn.dataset.app) openApp(btn.dataset.app);
        else if (btn.hasAttribute("data-home")) home();
        else onClose?.();
    });

    return {
        // appelé à chaque image : affiché une fois la caméra arrivée devant le téléphone
        update(show) {
            if (show === visible) return;
            visible = show;
            root.classList.toggle("is-on", show);
            root.setAttribute("aria-hidden", String(!show));
            document.body.classList.toggle("phone-open", show);
            if (show) setTimeout(() => root.querySelector(appEl.classList.contains("is-open") ? "[data-home]" : ".phone__icon")?.focus({ preventScroll: true }), 60);
            else document.activeElement?.blur?.();
        }
    };
}
