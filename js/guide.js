// Guide de prise en main, affiché juste après le chargement à la première visite (puis via le lien
// « Guide » en bas à droite) : un écran plein (la scène est masquée) avec le message de bienvenue au
// centre, une carte à gauche (légende des objets, raccourcis clavier ou gestes sur écran tactile) et
// des bulles reliées par des flèches aux boutons (repères, interface, jour / nuit), au menu des pièces
// et à l'indication de défilement, qui restent visibles par-dessus. Sur mobile, l'écran défile, sans bulles.
// Les bulles se placent d'après la position réelle des éléments : la mise en page suit l'écran.
// Fermeture : bouton « C'est parti », Échap, clic sur le fond ou scroll.

const SEEN_KEY = "appartement3d.guide";

// bulles : élément visé, titre, texte
const TIPS = [
    { target: "#fulltoggle", title: "Plein écran", text: "comme F11, pour s'immerger" },
    { target: "#spottoggle", title: "Repères", text: "affiche des points sur tout ce qui est cliquable" },
    { target: "#hudtoggle", title: "Interface", text: "masque les textes pour profiter de la vue (touche H)" },
    { target: "#daytoggle", title: "Ambiance", text: "plein jour ou coucher de soleil" },
    { target: ".rooms", title: "Pièces", text: "va directement à une pièce" },
    { target: "#hint", title: "Avancer", text: "scroll, glisse ou ↓ pour descendre dans l'appartement" }
];

// légende : objets cliquables de l'appartement (dot : le point violet des repères)
const touch = window.matchMedia("(pointer: coarse)").matches;
const mobile = touch || window.matchMedia("(max-width: 760px)").matches;   // l'ordinateur y est remplacé par le téléphone
const LEGEND = [
    { icon: "dot", title: "Point violet", text: "objet cliquable (bouton Repères)" },
    { icon: "▭", title: "Télé", text: "s'installer devant, changer de chaîne" },
    { icon: "◉", title: "Platine", text: "choisir un vinyle lofi" },
    { icon: "▣", title: "Bornes d'arcade", text: "Star Run et Breaker" },
    { icon: "▤", title: "Bibliothèque, posters", text: "les voir de près" },
    { icon: "◫", title: "Baie vitrée", text: "admirer la ville" },
    mobile
        ? { icon: "▯", title: "Téléphone", text: "projets, contact, galerie" }
        : { icon: "⌨", title: "Ordinateur", text: "projets, contact, galerie, jeux" },
    { icon: "⎙", title: "Imprimante", text: "imprimer mon CV" }
];
// raccourcis clavier, ou gestes sur écran tactile : [touches, action]
const KEYS = touch
    ? [
        [["Glisser ↑", "↓"], "changer de pièce"],
        [["Toucher"], "s'approcher d'un objet"],
        [["Toucher à côté"], "revenir"],
        [["◀", "▶", "Feu"], "jouer aux bornes d'arcade"]
    ]
    : [
        [["Molette", "↑", "↓"], "changer de pièce"],
        [["Clic"], "s'approcher d'un objet"],
        [["Échap"], "revenir"],
        [["H"], "masquer l'interface"],
        [["←", "→"], "chaîne suivante (télé)"],
        [["←", "→", "Espace", "Entrée"], "jouer aux bornes d'arcade"]
    ];

// Toutes les flèches sont faites de segments droits à angles droits.

// flèche en équerre : monte de (sx, sy) jusqu'au niveau L, file à l'horizontale jusqu'à bx,
// puis monte jusqu'à by (sous le bouton visé)
function elbow(sx, sy, L, bx, by) {
    if (Math.abs(bx - sx) < 3) return `M${bx} ${sy} L${bx} ${by}`;
    return `M${sx} ${sy} L${sx} ${L} L${bx} ${L} L${bx} ${by}`;
}

// flèche en « Z » de (x1, y1) à (x2, y2) : le dernier segment arrive à l'horizontale (cible sur le côté)
// ou à la verticale (cible au-dessus / en dessous) ; alignés, un seul segment
function zigzag(x1, y1, x2, y2, horizontalEnd) {
    if (Math.abs(horizontalEnd ? y2 - y1 : x2 - x1) < 3) return horizontalEnd ? `M${x1} ${y2} L${x2} ${y2}` : `M${x2} ${y1} L${x2} ${y2}`;
    if (horizontalEnd) {
        const mx = Math.round((x1 + x2) / 2);
        return `M${x1} ${y1} L${mx} ${y1} L${mx} ${y2} L${x2} ${y2}`;
    }
    const my = Math.round((y1 + y2) / 2);
    return `M${x1} ${y1} L${x1} ${my} L${x2} ${my} L${x2} ${y2}`;
}

function storageGet() { try { return localStorage.getItem(SEEN_KEY); } catch { return null; } }
function storageSet() { try { localStorage.setItem(SEEN_KEY, "vu"); } catch { /* stockage indisponible */ } }

export function createGuide() {
    const root = document.createElement("div");
    root.className = "guide";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "guide-title");
    root.innerHTML = `
        <svg class="guide__arrows" aria-hidden="true">
            <defs>
                <marker id="guide-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M1 1 9 5 1 9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </marker>
            </defs>
        </svg>
        <div class="guide__welcome">
            <p class="guide__kicker">Petit guide</p>
            <h2 class="guide__title" id="guide-title">Bienvenue dans l'appartement</h2>
            <p class="guide__text">${touch ? "Touche" : "Clique sur"} les objets pour t'en approcher, puis ${touch ? "touche" : "clique"} ailleurs${touch ? "" : " ou appuie sur Échap"} pour revenir. <span class="guide__where">La légende et les ${touch ? "gestes" : "raccourcis"} sont à gauche.</span></p>
            <button type="button" class="guide__go">C'est parti</button>
        </div>
        <div class="guide__card">
            <div class="guide__cols">
                <section class="guide__sec">
                    <h3>Légende</h3>
                    <ul class="guide__legend">
                        ${LEGEND.map((l) => `<li><span class="guide__icon${l.icon === "dot" ? " guide__icon--dot" : ""}" aria-hidden="true">${l.icon === "dot" ? "<i></i>" : l.icon}</span><span><strong>${l.title}</strong> ${l.text}</span></li>`).join("")}
                    </ul>
                </section>
                <section class="guide__sec">
                    <h3>${touch ? "Gestes" : "Raccourcis clavier"}</h3>
                    <ul class="guide__keys">
                        ${KEYS.map(([keys, text]) => `<li><span>${keys.map((k) => `<kbd>${k}</kbd>`).join("")}</span>${text}</li>`).join("")}
                    </ul>
                </section>
            </div>
        </div>
        ${TIPS.map((t, i) => `<p class="guide__tip" data-i="${i}"><strong>${t.title}</strong>${t.text}</p>`).join("")}`;
    document.body.appendChild(root);

    // défiler dans la carte, ou dans l'écran quand il défile (mobile), ne fait pas bouger la caméra
    // et ne ferme pas le guide
    for (const ev of ["wheel", "touchstart", "touchmove"]) {
        root.addEventListener(ev, (e) => {
            if (e.target.closest(".guide__card") || root.scrollHeight > root.clientHeight + 1) e.stopPropagation();
        }, { passive: true });
    }

    const svg = root.querySelector(".guide__arrows");
    const tips = [...root.querySelectorAll(".guide__tip")];
    let isOpen = false;

    // place les bulles près de leur cible et trace les flèches. Les bulles des boutons du haut se
    // rangent côte à côte sous les boutons (ou en escalier si l'écran est étroit) ; une bulle qui
    // rencontrerait la carte, le menu ou une autre bulle se décale, ou disparaît si la place manque.
    function layout() {
        const w = window.innerWidth, h = window.innerHeight;
        svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
        svg.querySelectorAll("path.guide__arrow").forEach((p) => p.remove());
        if (w <= 700) { tips.forEach((el) => { el.hidden = true; }); return; }   // mobile : pas de place pour les bulles
        const cardEl = root.querySelector(".guide__card");
        const obstacles = [];
        const rooms = document.querySelector(".rooms")?.getBoundingClientRect();
        if (rooms?.width) obstacles.push(rooms);
        const hintRect = document.querySelector("#hint")?.getBoundingClientRect();
        if (hintRect?.width) obstacles.push(hintRect);   // l'indication du bas reste lisible
        const blocked = (x, y, tw, th) => y < 4 || y + th > h - 4 ||
            obstacles.some((o) => x < o.right + 8 && x + tw > o.left - 8 && y < o.bottom + 8 && y + th > o.top - 8);

        const items = TIPS.map((t, i) => {
            const el = tips[i], target = document.querySelector(t.target);
            const r = target?.getBoundingClientRect();
            const usable = r?.width && !(t.target === "#hint" && w < 640);   // mobile : le menu occupe le bas
            el.hidden = !usable;
            return usable ? { t, el, r, tw: el.offsetWidth, th: el.offsetHeight, cx: r.left + r.width / 2, cy: r.top + r.height / 2 } : null;
        }).filter(Boolean);

        // boutons du haut
        const top = items.filter((it) => it.r.top < h * 0.2).sort((a, b) => b.r.left - a.r.left);
        const rowWidth = top.reduce((s, it) => s + it.tw, 0) + 14 * (top.length - 1);
        if (rowWidth < w * 0.72) {
            // côte à côte, de droite à gauche, sous les boutons
            let right = Math.max(...top.map((it) => it.r.right));
            // chaque flèche a son niveau horizontal : la plus à gauche le plus près des boutons,
            // la plus à droite monte tout droit ; ainsi aucune ne coupe les autres
            const y = Math.max(...top.map((it) => it.r.bottom)) + 24 + top.length * 12;
            for (const it of top) {
                it.x = right - it.tw;
                it.y = y;
                right = it.x - 14;
            }
        } else {
            // en escalier : la plus à gauche la plus haute, pour que les flèches ne traversent pas les bulles
            [...top].reverse().forEach((it, k) => {
                it.x = Math.max(12, it.cx + 16 - it.tw);
                it.y = it.r.bottom + 34 + k * (it.th + 18);
            });
        }
        const horizontalRooms = rooms?.width && getComputedStyle(document.querySelector(".rooms")).flexDirection !== "column";
        // la carte (à gauche) et le message de bienvenue (au centre) : les bulles les évitent
        for (const el of [cardEl, root.querySelector(".guide__welcome")]) obstacles.push(el.getBoundingClientRect());

        const btnBottom = Math.max(...top.map((it) => it.r.bottom), 0);
        [...top].sort((a, b) => a.cx - b.cx).forEach((it, level) => {
            it.dir = 1;
            it.top = true;
            it.path = () => {
                const inside = it.cx >= it.x + 16 && it.cx <= it.x + it.tw - 14;
                const sx = inside ? it.cx : it.x + it.tw - 22;
                return elbow(sx, it.y - 4, btnBottom + 12 + level * 12, it.cx, it.r.bottom + 6);
            };
        });

        // indication du bas, menu des pièces
        for (const it of items) {
            if (top.includes(it)) continue;
            const { r, tw, th, cx, cy } = it;
            if (it.t.target === "#hint") {
                // à gauche de l'indication, à sa hauteur ; au-dessus si la place manque
                const side = { x: r.left - tw - 56, y: Math.min(cy - th / 2 - 8, h - th - 8) };
                const above = { x: Math.min(Math.max(12, cx - tw / 2), w - tw - 12), y: r.top - th - 46 };
                const useSide = side.x > 12 && !blocked(side.x, side.y, tw, th);
                Object.assign(it, useSide ? side : above);
                it.dir = useSide ? 0 : -1;
                it.path = useSide
                    ? () => zigzag(it.x + tw + 6, Math.min(Math.max(cy, it.y + 12), it.y + th - 12), r.left - 8, cy, true)
                    : () => zigzag(cx, it.y + th + 4, cx, r.top - 6, false);
            } else if (!horizontalRooms) {   // menu vertical à droite : à sa gauche (décalée vers le haut ou le bas si besoin)
                it.x = Math.max(12, r.left - tw - 70);
                it.y = cy - th / 2;
                it.dir = 0;
                it.path = () => zigzag(it.x + tw + 6, Math.min(Math.max(cy, it.y + 12), it.y + th - 12), r.left - 8, cy, true);
                // repli : sous le menu, alignée à droite, flèche qui remonte
                it.alt = () => {
                    it.x = Math.max(12, r.right - tw);
                    it.y = r.bottom + 34;
                    it.dir = 1;
                    it.path = () => zigzag(Math.min(cx, it.x + tw - 20), it.y - 4, cx, r.bottom + 6, false);
                };
            } else {   // menu en ligne (mobile, en bas) : au-dessus
                it.x = Math.min(Math.max(12, cx - tw / 2), w - tw - 12);
                it.y = r.top - th - 42;
                it.dir = -1;
                it.path = () => zigzag(Math.min(Math.max(cx, it.x + 20), it.x + tw - 20), it.y + th + 4, cx, r.top - 6, false);
            }
        }

        const zones = [];   // zones des flèches du haut, réservées une fois toute la rangée placée
        for (const it of [...top, ...items.filter((x) => !top.includes(x))]) {
            if (!it.top && zones.length) obstacles.push(...zones.splice(0));
            // décale la bulle tant qu'elle gêne (jusqu'à 320 px ; dir 0 : alternativement en bas et en haut),
            // sinon elle disparaît
            const offsets = [];
            for (let d = 0; d <= 320; d += 8) offsets.push(...(it.dir ? [it.dir * d] : d ? [d, -d] : [0]));
            let off = offsets.find((d) => !blocked(it.x, it.y + d, it.tw, it.th));
            if (off === undefined && it.alt) {   // autre emplacement possible
                it.alt();
                off = [0, 8, 16, 24, 32].find((d) => !blocked(it.x, it.y + d, it.tw, it.th));
            }
            if (off === undefined) { it.el.hidden = true; continue; }
            it.y += off;
            it.el.style.left = `${it.x}px`;
            it.el.style.top = `${it.y}px`;
            obstacles.push({ left: it.x, right: it.x + it.tw, top: it.y, bottom: it.y + it.th });
            if (it.top) {   // zone de sa flèche : aucune bulle suivante ne vient s'y loger
                const sx = Math.min(it.cx, it.x + it.tw - 22);
                zones.push({ left: Math.min(sx, it.cx), right: Math.max(sx, it.cx), top: it.r.bottom, bottom: it.y });
            }
            // flèche légèrement courbée
            const d = it.path();
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("class", "guide__arrow");
            path.setAttribute("d", d);
            path.setAttribute("marker-end", "url(#guide-head)");
            svg.appendChild(path);
        }
    }

    function open() {
        if (isOpen) return;
        isOpen = true;
        document.body.classList.add("guide-open");
        root.classList.add("is-open");
        layout();
        requestAnimationFrame(layout);   // une fois les polices et la mise en page stabilisées
        setTimeout(() => root.querySelector(".guide__go").focus({ preventScroll: true }), 50);
    }

    function close() {
        if (!isOpen) return;
        isOpen = false;
        storageSet();
        document.body.classList.remove("guide-open");
        root.classList.remove("is-open");
        document.activeElement?.blur?.();
    }

    root.querySelector(".guide__go").addEventListener("click", (e) => { e.stopPropagation(); close(); });
    root.addEventListener("click", (e) => { if (!e.target.closest(".guide__card, .guide__welcome")) close(); });
    window.addEventListener("keydown", (e) => { if (isOpen && e.key === "Escape") close(); });
    // scroll ou glissé hors de l'écran du guide : on le ferme (dedans, il fait défiler son contenu)
    const scrollOut = (e) => { if (isOpen) close(); };
    window.addEventListener("wheel", scrollOut, { passive: true });
    window.addEventListener("touchmove", scrollOut, { passive: true });
    window.addEventListener("resize", () => { if (isOpen) layout(); });

    return {
        open,
        close,
        get isOpen() { return isOpen; },
        // à la première visite seulement (le lien « Guide » permet de le revoir)
        openIfFirstVisit(delay = 0) {
            if (!storageGet()) setTimeout(open, delay);
        }
    };
}
