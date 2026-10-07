// Textes du portfolio affichés à l'arrivée dans chaque pièce (caméra posée, pas assise) :
// chambre = phrase d'intro, salon = à propos, bureau = invitation à allumer l'ordinateur.
// Le contenu se modifie dans STORY ci-dessous ; mobile remplace des champs sur téléphone ou écran tactile.

const STORY = {
    chambre: {
        kicker: "Bienvenue",
        title: "Salut, moi c'est Clément.",
        text: ["Développeur full-stack en BUT MMI, avec un vrai faible pour le front : interfaces soignées, animations et 3D.", "Installe-toi, et descends visiter l'appartement."]
    },
    salon: {
        kicker: "À propos",
        title: "Du serveur à l'écran, avec une touche créative.",
        text: [
            "Je développe des applications web complètes, de la base de données à l'interface. Mais c'est côté front que je m'amuse le plus : animations, 3D dans le navigateur, petits détails qui font la différence.",
            "Cet appartement en est le terrain de jeu : tout y est codé, du décor aux applis de l'ordinateur."
        ],
        tags: ["JavaScript", "Three.js", "PHP · Laravel", "MySQL", "UI / UX", "Motion"]
    },
    bureau: {
        kicker: "Mon bureau",
        title: "Allume l'ordinateur pour en savoir plus sur moi.",
        text: ["Projets, contact, galerie… tout est rangé sur le bureau du PC.", "Mon CV t'attend à l'imprimante, sous la fenêtre."],
        action: "Allumer l'ordinateur",
        // sur mobile, l'écran du PC est peu pratique : on invite à allumer le téléphone posé sur le bureau
        mobile: {
            title: "Allume le téléphone pour en savoir plus sur moi.",
            text: ["Projets, contact, galerie… tout est rangé dans le téléphone posé sur le bureau.", "Mon CV t'attend à l'imprimante, sous la fenêtre."],
            action: "Allumer le téléphone"
        }
    }
};

const ROOMS = Object.keys(STORY);
const SHOW_RANGE = 0.45;   // écart au point d'arrêt (trajet 0 → 2) dans lequel le texte de la pièce est visible
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

export function createStory({ onAction }) {
    const root = document.querySelector("#story");
    const mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    const panels = ROOMS.map((room) => {
        const s = { ...STORY[room], ...(mobile && STORY[room].mobile) };
        const el = document.createElement("section");
        el.className = `story__panel story__panel--${room}`;
        el.setAttribute("aria-hidden", "true");
        el.innerHTML = `
            <p class="story__kicker">${esc(s.kicker)}</p>
            <h2 class="story__title">${esc(s.title)}</h2>
            ${s.text.map((p) => `<p class="story__text">${esc(p)}</p>`).join("")}
            ${s.tags ? `<ul class="story__tags">${s.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
            ${s.action ? `<button type="button" class="story__action" tabindex="-1"><span aria-hidden="true">${s.icon ?? "⏻"}</span>${esc(s.action)}</button>` : ""}`;
        // délai d'apparition échelonné des lignes
        [...el.children].forEach((child, i) => child.style.setProperty("--i", i));
        el.querySelector(".story__action")?.addEventListener("click", (e) => {
            e.stopPropagation();
            onAction?.(room);
        });
        root.appendChild(el);
        return el;
    });

    let shown = -1;

    return {
        mobile,   // version mobile des textes (le bouton du bureau mène au téléphone)
        // appelé à chaque image : le texte d'une pièce reste affiché tant que la caméra est dans sa zone
        // (presque la moitié du trajet de part et d'autre), seul le milieu exact des passages n'en a aucun
        update(travel, seated) {
            const stop = Math.round(travel);
            const show = !seated && Math.abs(travel - stop) < SHOW_RANGE ? stop : -1;
            if (show === shown) return;
            shown = show;
            panels.forEach((p, i) => {
                const on = i === show;
                p.classList.toggle("is-visible", on);
                p.setAttribute("aria-hidden", String(!on));
                p.querySelector(".story__action")?.setAttribute("tabindex", on ? "0" : "-1");
            });
        }
    };
}
