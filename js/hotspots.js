import * as THREE from "three";
import { getClickables } from "./core/interactive.js";

// Repères cliquables (HTML) posés sur les objets interactifs : un point violet, dont l'étiquette
// s'ouvre au survol. Un clic amène au point de vue de l'objet (nav.sit), comme un clic sur l'objet.
// Les bornes d'arcade, hors champ une fois arrivé au salon, ont un repère qui se colle au bord de
// l'écran (edge: true), avec une flèche dans leur direction et son étiquette toujours visible.
// Options d'un repère : spot (point de vue), label ; position par target (identifiant d'objet
// cliquable, repère au centre de ses objets, décalé de dy ou du vecteur offset) ou pos (point de la scène) ;
// when() pour une autre condition d'affichage, onClick() pour une autre action ; edgeRow : rang fixe
// au bord de l'écran (repères collés du même côté, l'un sous l'autre).
// Désactivables avec le bouton « repères » (classe hotspots-off sur body), masqués avec l'interface.
// Un point qui tomberait sous l'interface (nom, texte de la pièce, menu, boutons) est masqué.

const MARGIN = 18;   // écart au bord de l'écran quand le repère y est collé (px)
const UI = ".brand, .story__panel.is-visible, .rooms, .daytoggle, .legal-links";   // zones à ne pas recouvrir
const PAD = 14;      // marge autour de ces zones (px)

// centre des objets enregistrés sous un identifiant (les objets cliquables ne bougent pas)
function centerOf(id, dy = 0, offset = [0, 0, 0]) {
    const box = new THREE.Box3();
    for (const o of getClickables(id)) { o.updateWorldMatrix(true, true); box.expandByObject(o); }
    return box.isEmpty() ? null : box.getCenter(new THREE.Vector3()).add(new THREE.Vector3(offset[0], offset[1] + dy, offset[2]));
}

export function createHotspots(camera, nav, items) {
    const tmp = new THREE.Vector3();
    const spots = items.map((item) => {
        const pos = item.pos ?? centerOf(item.target ?? item.spot, item.dy, item.offset);
        if (!pos) return null;
        const el = document.createElement("button");
        el.type = "button";
        el.className = "hotspot" + (item.edge ? " hotspot--edge" : "");
        el.setAttribute("aria-label", item.aria ?? item.label);
        el.innerHTML = `<span class="hotspot__in"><span class="hotspot__arrow" aria-hidden="true">‹</span><span class="hotspot__dot" aria-hidden="true"></span><span class="hotspot__label">${item.label}</span></span>`;
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            if (item.onClick) item.onClick();
            else if (nav.canSit(item.spot)) nav.sit(item.spot);
        });
        document.body.appendChild(el);
        return { ...item, pos, el, shown: false };
    }).filter(Boolean);

    const setShown = (s, show) => {
        if (show === s.shown) return;
        s.shown = show;
        s.el.classList.toggle("is-visible", show);
        s.el.tabIndex = show ? 0 : -1;
    };

    return {
        // appelé à chaque image, après le déplacement de la caméra
        update() {
            const off = document.body.classList.contains("hotspots-off") || document.body.classList.contains("hud-hidden");
            const w = window.innerWidth, h = window.innerHeight;
            camera.updateMatrixWorld();
            const blocked = off ? [] : [...document.querySelectorAll(UI)].map((e) => e.getBoundingClientRect()).filter((r) => r.width);
            const underUi = (x, y) => blocked.some((r) => x > r.left - PAD && x < r.right + PAD && y > r.top - PAD && y < r.bottom + PAD);
            for (const s of spots) {
                if (off || !(s.when ? s.when() : !nav.seated && nav.focusProgress < 0.02 && nav.canSit(s.spot))) {
                    setShown(s, false);
                    continue;
                }

                // position dans le repère de la caméra : derrière elle, on inverse pour garder la bonne direction
                tmp.copy(s.pos).applyMatrix4(camera.matrixWorldInverse);
                const behind = tmp.z > 0;
                tmp.copy(s.pos).project(camera);
                let x = (tmp.x + 1) / 2 * w, y = (1 - tmp.y) / 2 * h;
                if (behind) { x = w - x; y = h - y; }
                const inside = !behind && x > MARGIN && x < w - MARGIN && y > MARGIN && y < h - MARGIN;
                if (!inside && !s.edge) { setShown(s, false); continue; }   // hors champ : rien à signaler
                if (inside && underUi(x, y)) { setShown(s, false); continue; }   // sous l'interface : masqué
                setShown(s, true);
                if (!inside) {   // hors champ : collé au bord gauche ou droit, sous le nom et au-dessus des textes des pièces
                    const left = behind ? x > w / 2 : x < w / 2;
                    x = left ? MARGIN : w - MARGIN;
                    y = s.edgeRow !== undefined
                        ? Math.max(120, h * 0.2) + s.edgeRow * 52
                        : THREE.MathUtils.clamp(y, Math.max(120, h * 0.2), Math.max(140, h * 0.3));
                    s.el.classList.toggle("is-left", left);
                    s.el.classList.toggle("is-right", !left);
                }
                s.el.classList.toggle("is-edge", !inside);
                s.el.classList.toggle("is-flip", inside && x > w * 0.6);   // côté droit : l'étiquette s'ouvre vers la gauche
                s.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
            }
        }
    };
}
