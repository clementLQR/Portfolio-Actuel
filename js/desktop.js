// Bureau d'ordinateur affiché sur l'écran du PC quand on s'en approche (clic sur l'écran).
// Interface HTML calée sur la projection de l'écran 3D, conçue en 960×540 puis mise à l'échelle.
// Applications : À propos, Projets, Galerie, Notes (gardées dans le navigateur), Radio lofi (son généré),
// Terminal, Solitaire (js/solitaire.js). Le contenu se modifie dans CONTENT ci-dessous.
// Au premier allumage, l'écran « démarre » : texte du BIOS, logo avec barre de chargement et petit
// jingle, puis le bureau apparaît (un clic sur l'écran passe le démarrage).

import { createSolitaire } from "./solitaire.js";
import { appGlyph, appIconStyle } from "./icons.js";
import { createVinylPlayer, RADIO_TRACKS } from "./vinyl.js";

export const CONTENT = {
    os: "未来OS",
    user: "clement",
    about: {
        title: "À propos",
        avatar: "assets/poster-autoportrait.jpg",
        name: "Clément",
        role: "Développeur full-stack · créatif côté front",
        text: [
            "Bienvenue dans mon petit appartement au-dessus de la ville.",
            "Je développe des sites et applis web de bout en bout, du back-end (PHP, Laravel, MySQL) à l'interface.",
            "Côté front, j'aime aller plus loin : animations, 3D dans le navigateur, ambiances lofi. Ce bureau en est la preuve."
        ]
    },
    // Projets (appli « Projets »). Seuls title, color et summary sont obligatoires :
    // image (sinon une couverture colorée), links (boutons), facts (fiche), sections (texte et listes ;
    // un élément [titre, texte] s'affiche en gras + texte), challenges (problème / solution),
    // stats (chiffres clés), tags (technos), soon (présentation à venir).
    projects: [
        {
            title: "IUT Quest",
            year: "2026",
            type: "SAÉ 4012 · Full-stack",
            color: "#ff9633",
            image: "assets/project-iut-quest.webp",
            summary: "Un jeu de piste géolocalisé qui fait courir 12 équipes dans tout Blois, entre épreuves chronométrées et défis à prouver en photo.",
            links: [
                { label: "Page du projet", url: "/projets/iut-quest" },
                { label: "Voir la démo", url: "https://iut-quest.fr/" },
                { label: "Code", url: "https://github.com/Louischoubard/PEKIN-EXPRESS" }
            ],
            facts: [
                ["Rôle", "Développeur full-stack (front · tests · back)"],
                ["Durée", "1 mois"],
                ["Type", "SAÉ 4012, projet de groupe (4 personnes)"],
                ["Statut", "Démo en ligne"]
            ],
            sections: [
                {
                    title: "Présentation",
                    text: [
                        "IUT Quest est un jeu de piste grandeur nature inspiré de Pékin Express, conçu pour le challenge inter-filières de l'IUT de Blois. Le temps d'une journée, jusqu'à 12 équipes de 6 à 10 personnes (étudiants, enseignants et personnel administratif) s'affrontent à travers toute la ville.",
                        "Le parcours s'étend sur les deux sites de l'IUT, la bibliothèque universitaire, le centre-ville et le château. Chaque équipe enchaîne six grandes épreuves collectives et pioche en parallèle dans un catalogue d'une centaine de défis libres en photo, vidéo ou texte, valant de 5 à 30 points. L'équipe qui totalise le plus de points repart avec le trophée."
                    ]
                },
                {
                    title: "Mon rôle",
                    text: ["Front-end de l'application publique utilisée par les équipes sur le terrain, et une partie des traitements PHP."],
                    list: [
                        ["Mobile-first et PWA :", "joueurs dehors toute la journée, sur téléphone, en 4G."],
                        ["Carte temps réel :", "Leaflet + géolocalisation du navigateur ; watchPosition pousse régulièrement la position vers l'API et chaque équipe voit les autres se déplacer, chacune avec sa couleur."],
                        ["Côté serveur :", "plusieurs traitements PHP avec leurs contrôleurs Laravel et vues Blade."],
                        ["Côté interface :", "profil et progression de l'équipe, barre d'avancement, minuteur de fin, vérification des médias avant envoi, classement verrouillé une heure avant la fin."]
                    ]
                },
                {
                    title: "Fonctionnalités",
                    list: [
                        ["Carte temps réel :", "équipes en couleur à côté des lieux de l'événement, avec légende et heure de dernière actualisation."],
                        ["Épreuves et défis :", "six épreuves planifiées par créneau, plus un catalogue de défis libres ouverts jusqu'à 17 h."],
                        ["Validation par un admin :", "aucun point automatique ; l'admin accepte ou refuse chaque preuve."],
                        ["Médias en arrière-plan :", "photos converties en WebP, vidéos traitées par un job asynchrone."],
                        ["Back-office complet :", "lieux, épreuves, groupes et planning, détection des conflits de créneaux, export PDF avec QR code."]
                    ]
                },
                {
                    title: "Équipe",
                    text: ["Djibril (maquette), Louis et Paul (back-end), Clément (front-end + traitements PHP). Kanban sur Trello, une branche Git par tâche, relecture systématique avant chaque merge."]
                }
            ],
            challenges: [
                {
                    title: "Points comptés en double",
                    problem: "Les points étaient crédités dès la soumission : un retour arrière du navigateur suffisait à les compter deux fois, et un refus de l'admin ne les retirait pas.",
                    solution: "Un état explicite sur chaque défi (non validé, en cours, validé) et l'attribution des points au seul moment où un admin tranche."
                },
                {
                    title: "Vidéos lourdes en 4G",
                    problem: "L'envoi d'une vidéo de plusieurs dizaines de Mo bloquait l'interface, et la preuve pouvait être ouverte avant la fin du transfert.",
                    solution: "Photos compressées en WebP côté serveur, vidéos traitées par un job asynchrone avec FFmpeg ; la preuve n'apparaît à la validation qu'une fois prête."
                },
                {
                    title: "Géolocalisation instable",
                    problem: "Le navigateur redemandait l'autorisation à chaque page et les positions devenaient incohérentes.",
                    solution: "Autorisation demandée une fois puis gardée en session ; watchPosition suit en continu et n'envoie la position qu'à intervalle régulier, pour épargner la batterie."
                }
            ],
            stats: [["12", "équipes"], ["6", "épreuves collectives"], ["100+", "défis au catalogue"], ["100+", "utilisateurs"]],
            tags: ["Laravel", "PHP", "MySQL", "JavaScript", "Leaflet", "Docker", "FFmpeg", "PWA"]
        },
        {
            title: "FreeMessage",
            type: "Réseau social · PHP natif",
            color: "#4fb3d1",
            image: "assets/project-free-message.png",
            summary: "Un réseau social thématique où l'on publie des messages (texte + image) dans 8 catégories, avec réactions et commentaires.",
            links: [{ label: "Page du projet", url: "/projets/freemessage" }, { label: "Code", url: "https://github.com/clementLQR/FreeMessage" }],
            facts: [
                ["Stack", "PHP 8 · Twig 3 · MySQL / MariaDB · JS vanilla"],
                ["Architecture", "MVC construit à la main, sans framework"],
                ["Base de données", "6 tables relationnelles, clés étrangères"],
                ["Interface", "Responsive, CSS pur sans build"]
            ],
            stats: [["8", "catégories"], ["6", "tables SQL"], ["0", "framework"]],
            sections: [
                {
                    title: "Le projet en bref",
                    text: [
                        "FreeMessage est un réseau social organisé en 8 catégories : jeux vidéo, musique, films, livres, sport, peinture et dessin, photographie et séries. Je l'ai développé en PHP natif, avec une architecture MVC construite à la main : un routeur, des contrôleurs, des modèles et des vues Twig.",
                        "L'objectif : comprendre et maîtriser tout ce qu'un framework fait habituellement à notre place, du routage aux sessions, en passant par la sécurité des formulaires, l'envoi de fichiers et l'accès à la base de données."
                    ]
                },
                {
                    title: "Fonctionnalités",
                    list: [
                        ["Comptes :", "inscription et connexion avec mots de passe hachés, pages protégées, profil avec biographie, identifiant modifiable et liste de ses publications."],
                        ["Publications :", "message dans une catégorie, avec ou sans image ; tri par plus récentes ou plus likées ; dates en français via un filtre Twig personnalisé ; suppression de ses propres messages."],
                        ["Likes et dislikes asynchrones :", "envoyés avec fetch() sans recharger la page ; une seule réaction par message, un second clic l'annule et passer de l'une à l'autre met à jour les deux compteurs."],
                        ["Commentaires :", "sur chaque publication, avec le motif Post/Redirect/Get pour qu'un rechargement ne renvoie pas le commentaire."],
                        ["Administration :", "gestion des publications, des commentaires et des comptes, recherche et tri des tableaux côté client."],
                        ["Responsive :", "barre de navigation en bas sur mobile et tablette, barre latérale sur desktop."]
                    ]
                },
                {
                    title: "Sécurité",
                    list: [
                        ["Injection SQL :", "toutes les requêtes passent par des requêtes préparées mysqli."],
                        ["CSRF :", "jeton unique par session (random_bytes), vérifié sur chaque requête POST avec hash_equals."],
                        ["XSS :", "échappement automatique des sorties par Twig."],
                        ["Mots de passe :", "hachage avec password_hash (bcrypt)."],
                        ["Envoi de fichiers :", "liste blanche d'extensions (jpg, png, gif, webp), 5 Mo maximum, contrôle du contenu réel avec getimagesize et renommage contre les collisions."],
                        ["Double soumission :", "motif PRG (Post/Redirect/Get)."]
                    ]
                },
                {
                    title: "Architecture",
                    list: [
                        ["Point d'entrée unique :", ".htaccess → routeur.php (vérification CSRF, dispatch des routes) → contrôleur → modèle (SQL) et vues Twig."],
                        ["URLs propres :", "/categorie/3, /commentaires/12… grâce à la réécriture d'URL Apache."],
                        ["Héritage de templates :", "un gabarit parent (navigation, pied de page) et une vue enfant par page."],
                        ["Compteurs dénormalisés :", "nbrLike, nbrDislike et nbrCom dans la table message, pour trier par popularité sans jointure coûteuse."]
                    ]
                }
            ],
            tags: ["PHP 8", "Twig 3", "MySQL / MariaDB", "JavaScript", "HTML / CSS", "Composer", "Git"]
        },
        {
            title: "Appartement 3D",
            year: "2026",
            type: "Projet perso · Web 3D",
            color: "#b48cff",
            image: "assets/project-appartement-3d.webp",
            summary: "Ce portfolio : un appartement lofi en three.js au-dessus d'une ville futuriste, parcouru au scroll.",
            sections: [{
                text: [
                    "Toute la scène est générée par le code : géométries, textures peintes au canvas, shaders de ciel et d'eau, milliers d'immeubles instanciés.",
                    "Objets interactifs : télé à chaînes, platine vinyle, bornes d'arcade jouables et ce petit ordinateur."
                ]
            }],
            tags: ["Three.js", "GLSL", "JavaScript", "Web Audio"]
        }
    ],
    // appli Contact (le CV, lui, s'imprime : cv.js)
    contact: {
        status: "Recherche un stage en développement web · 11 semaines · mars → juin 2027",
        email: "clement.lequeurre@gmail.com",
        phone: "06 44 31 82 86",
        tel: "+33644318286",
        links: [
            { label: "LinkedIn", value: "Clément Lequeurre", url: "https://www.linkedin.com/in/cl%C3%A9ment-lequeurre/" },
            { label: "GitHub", value: "github.com/clementLQR", url: "https://github.com/clementLQR" }
        ],
        cvPdf: "assets/cv/Clement_Lequeurre_CV.pdf",
        cvName: "CV_Clement_Lequeurre.pdf"
    },
    gallery: [
        { src: "assets/poster-autoportrait.jpg", title: "Autoportrait" },
        { src: "assets/poster-banshee.jpg", title: "The Banshee" },
        { src: "assets/poster-ruines.jpg", title: "Ruines" },
        { src: "assets/billboard-portrait.png", title: "Portrait néon" }
    ],
    wallpaper: "assets/wallpaper-ville.webp",
    notesDefault: "À faire :\n- arroser les plantes\n- finir le projet 3D\n- acheter du café\n"
};

const BIOS_LINES = [
    "未来 BIOS v2.4 — Mirai Systems",
    "Processeur ............ OK",
    "Mémoire 16384 Mo ....... OK",
    "Disque principal ....... OK",
    "Clavier / souris ....... OK",
    "Chargement du noyau…"
];

const DESIGN_W = 960, DESIGN_H = 540;
const NOTES_KEY = "appartement3d.notes";
const RESIZE_DIRS = ["n", "e", "s", "w", "ne", "nw", "se", "sw"];
// icônes de la barre de titre, dessinées en SVG (les caractères – □ × de la police à points ne se
// centrent pas dans leurs boutons) ; toutes en 10×10, trait de la couleur du texte
const icon = (d) => `<svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">${d}</svg>`;
const WIN_ICONS = {
    min: icon(`<path d="M1.5 5h7"/>`),
    max: icon(`<rect x="1.5" y="1.5" width="7" height="7"/>`),
    restore: icon(`<rect x="1.5" y="3.5" width="5" height="5"/><path d="M3.5 3.5v-2h5v5h-2"/>`),
    close: icon(`<path d="M2 2l6 6M8 2l-6 6"/>`)
};
const RESIZE_CURSOR = { n: "ns", s: "ns", e: "ew", w: "ew", ne: "nesw", sw: "nesw", nw: "nwse", se: "nwse" };
const MIN_W = 260, MIN_H = 170;   // taille minimale d'une fenêtre (sauf indication dans APPS)
const MAX_TOP = 26;   // haut d'une fenêtre agrandie : sous la barre du système
const DOCK_TOP = DESIGN_H - 44;   // le bas d'une fenêtre redimensionnée s'arrête au-dessus du dock

const APPS = {
    about: { title: "À propos", w: 440, h: 330 },
    projects: { title: "Projets", w: 680, h: 440 },
    contact: { title: "Contact", w: 430, h: 350 },
    cv: { title: "CV.pdf", action: true },   // pas de fenêtre : lance l'impression (onCv)
    gallery: { title: "Galerie", w: 520, h: 360 },
    notes: { title: "Notes", w: 340, h: 280 },
    radio: { title: "Radio lofi", w: 380, h: 410, minW: 320, minH: 300 },
    terminal: { title: "Terminal", w: 460, h: 280 },
    solitaire: { title: "Solitaire", w: 610, h: 470, minW: 610, minH: 470 }   // tapis à taille fixe
};

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function storageGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}
function storageSet(key, value) {
    try { localStorage.setItem(key, value); } catch { /* stockage indisponible : on garde en mémoire */ }
}

// Applications communes à l'ordinateur et au téléphone (js/phone.js) : chacune remplit body.
// onCv : lance l'impression du CV (bouton de l'appli Contact)
export function appRenderers({ onCv } = {}) {
    return {
        contact(body) {
            const c = CONTENT.contact;
            body.innerHTML = `
                <div class="app-contact">
                    <p class="app-contact__status">${esc(c.status)}</p>
                    <ul class="app-contact__list">
                        <li><span>E-mail</span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a><button type="button" data-copy="${esc(c.email)}">copier</button></li>
                        <li><span>Téléphone</span><a href="tel:${esc(c.tel)}">${esc(c.phone)}</a><button type="button" data-copy="${esc(c.phone)}">copier</button></li>
                        ${c.links.map((l) => `<li><span>${esc(l.label)}</span><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.value)} ↗</a></li>`).join("")}
                    </ul>
                    <div class="app-contact__cv">
                        <button type="button" class="app-contact__print" data-print>⎙ Imprimer mon CV</button>
                        <a href="${esc(c.cvPdf)}" download="${esc(c.cvName)}">↓ Télécharger le PDF</a>
                    </div>
                </div>`;
            body.querySelector("[data-print]").addEventListener("click", () => onCv?.());
            body.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", async () => {
                try { await navigator.clipboard.writeText(b.dataset.copy); b.textContent = "copié ✓"; }
                catch { b.textContent = "sélectionne le texte"; }
                setTimeout(() => { b.textContent = "copier"; }, 1600);
            }));
        },
        about(body) {
            const a = CONTENT.about;
            body.innerHTML = `
                <div class="app-about">
                    <img src="${a.avatar}" alt="">
                    <div>
                        <h2>${esc(a.name)}</h2>
                        <p class="app-about__role">${esc(a.role)}</p>
                        ${a.text.map((t) => `<p>${esc(t)}</p>`).join("")}
                    </div>
                </div>`;
        },
        projects(body) {
            const list = CONTENT.projects;
            const cover = (p) => p.image
                ? `<img src="${p.image}" alt="">`
                : `<span class="app-projects__mark">${esc(p.title.split(/\s+/).map((w) => w[0]).join("").slice(0, 2))}</span>`;
            const meta = (p) => esc(p.soon ? "Bientôt" : [p.type, p.year].filter(Boolean).join(" · "));
            const item = (it) => `<li>${Array.isArray(it) ? `<strong>${esc(it[0])}</strong> ${esc(it[1])}` : esc(it)}</li>`;
            const section = (s) => `<section class="app-project__sec">
                    ${s.title ? `<h3>${esc(s.title)}</h3>` : ""}
                    ${(s.text ?? []).map((t) => `<p>${esc(t)}</p>`).join("")}
                    ${s.list ? `<ul class="app-project__list">${s.list.map(item).join("")}</ul>` : ""}
                </section>`;
            const grid = () => {
                body.innerHTML = `<div class="app-projects">${list.map((p, i) => `
                    <button type="button" class="app-projects__card${p.soon ? " is-soon" : ""}" data-i="${i}" style="--c:${p.color}">
                        <span class="app-projects__cover">${cover(p)}</span>
                        <span class="app-projects__meta">${meta(p)}</span>
                        <strong>${esc(p.title)}</strong>
                        <span class="app-projects__sum">${esc(p.summary)}</span>
                    </button>`).join("")}</div>`;
                body.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => view(+b.dataset.i)));
                body.scrollTop = 0;
            };
            const view = (i) => {
                const p = list[i], n = list.length;
                body.innerHTML = `<article class="app-project" style="--c:${p.color}">
                    <div class="app-view__bar"><button type="button" data-back>← projets</button><span>${i + 1} / ${n}</span>
                        <span><button type="button" data-prev aria-label="Projet précédent">‹</button><button type="button" data-next aria-label="Projet suivant">›</button></span></div>
                    <header class="app-project__head">
                        <div class="app-projects__cover app-project__cover">${cover(p)}</div>
                        <div>
                            <p class="app-projects__meta">${meta(p)}</p>
                            <h2>${esc(p.title)}</h2>
                            <p class="app-project__sum">${esc(p.summary)}</p>
                            ${p.links?.length ? `<div class="app-project__links">${p.links.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>` : ""}
                        </div>
                    </header>
                    <div class="app-project__body">
                        ${p.facts ? `<dl class="app-project__facts">${p.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
                        ${p.stats ? `<div class="app-project__stats">${p.stats.map(([n, l]) => `<div><strong>${esc(n)}</strong><span>${esc(l)}</span></div>`).join("")}</div>` : ""}
                        ${(p.sections ?? []).map(section).join("")}
                        ${p.challenges ? `<section class="app-project__sec"><h3>Défis rencontrés</h3>${p.challenges.map((c) => `
                            <div class="app-project__challenge"><h4>${esc(c.title)}</h4>
                                <p><span>Problème</span>${esc(c.problem)}</p><p><span>Solution</span>${esc(c.solution)}</p></div>`).join("")}</section>` : ""}
                        ${p.tags ? `<section class="app-project__sec"><h3>Stack</h3><ul class="app-project__tags">${p.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></section>` : ""}
                    </div></article>`;
                body.querySelector("[data-back]").addEventListener("click", grid);
                body.querySelector("[data-prev]").addEventListener("click", () => view((i + n - 1) % n));
                body.querySelector("[data-next]").addEventListener("click", () => view((i + 1) % n));
                body.scrollTop = 0;
            };
            grid();
        },
        gallery(body) {
            const grid = () => {
                body.innerHTML = `<div class="app-gallery">${CONTENT.gallery.map((g, i) => `
                    <button type="button" data-i="${i}"><img src="${g.src}" alt=""><span>${esc(g.title)}</span></button>`).join("")}</div>`;
                body.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => view(+b.dataset.i)));
            };
            const view = (i) => {
                const g = CONTENT.gallery[i];
                body.innerHTML = `<div class="app-view"><img src="${g.src}" alt="${esc(g.title)}">
                    <div class="app-view__bar"><button type="button" data-back>← retour</button><span>${esc(g.title)}</span>
                    <span><button type="button" data-prev>‹</button><button type="button" data-next>›</button></span></div></div>`;
                const n = CONTENT.gallery.length;
                body.querySelector("[data-back]").addEventListener("click", grid);
                body.querySelector("[data-prev]").addEventListener("click", () => view((i + n - 1) % n));
                body.querySelector("[data-next]").addEventListener("click", () => view((i + 1) % n));
            };
            grid();
        }
    };
}

// --- bureau -----------------------------------------------------------------------------

// onCv : appelé pour imprimer le CV (fichier « CV.pdf », bouton de l'appli Contact, « open cv »)
export function createDesktop({ onCv } = {}) {
    const frame = document.createElement("div");
    frame.className = "pc";
    frame.setAttribute("aria-hidden", "true");
    frame.innerHTML = `
        <div class="pc__screen" style="width:${DESIGN_W}px;height:${DESIGN_H}px;background-image:url('${CONTENT.wallpaper}')">
            <div class="pc__bar">
                <span class="pc__logo">${esc(CONTENT.os)}</span>
                <span class="pc__bar-right"><span class="pc__wifi">◠</span><span class="pc__clock"></span></span>
            </div>
            <div class="pc__icons">
                ${Object.entries(APPS).map(([id, a]) => `
                    <button class="pc__icon" data-app="${id}" type="button" style="${appIconStyle(id)}">
                        <span class="pc__icon-glyph">${appGlyph(id)}</span><span class="pc__icon-label">${esc(a.title)}</span>
                    </button>`).join("")}
            </div>
            <div class="pc__windows"></div>
            <div class="pc__dock"></div>
            <div class="pc__boot">
                <div class="pc__boot-bios"></div>
                <div class="pc__boot-logo">
                    <div class="pc__boot-mark">${esc(CONTENT.os)}</div>
                    <div class="pc__boot-sub">démarrage…</div>
                    <div class="pc__boot-bar"><i></i></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(frame);

    const screen = frame.querySelector(".pc__screen");
    const windowsEl = frame.querySelector(".pc__windows");
    const dock = frame.querySelector(".pc__dock");
    const clock = frame.querySelector(".pc__clock");
    const boot = frame.querySelector(".pc__boot");
    const bios = frame.querySelector(".pc__boot-bios");
    const bar = frame.querySelector(".pc__boot-bar i");
    const radio = createVinylPlayer(RADIO_TRACKS);   // morceaux lofi synthétisés (moteur de la platine, vinyl.js)
    const open = new Map();
    let zTop = 1, visible = false, scale = 1;
    let booted = false, booting = false, bootTimers = [], chimeCtx = null;

    // le défilement et le tactile dans l'ordinateur ne font pas bouger la caméra
    for (const ev of ["wheel", "touchstart", "touchmove"]) {
        frame.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    }

    function tick() {
        const d = new Date();
        clock.textContent = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    tick();
    setInterval(tick, 15000);

    // --- contenu des applications (À propos, Projets, Contact, Galerie : appRenderers, partagées avec le téléphone) ---
    const RENDER = {
        ...appRenderers({ onCv }),
        notes(body) {
            body.innerHTML = `<textarea class="app-notes" spellcheck="false"></textarea>`;
            const ta = body.querySelector("textarea");
            ta.value = storageGet(NOTES_KEY) ?? CONTENT.notesDefault;
            ta.addEventListener("input", () => storageSet(NOTES_KEY, ta.value));
        },
        radio(body) {
            const tracks = radio.discs;
            body.innerHTML = `
                <div class="app-radio">
                    <div class="app-radio__now">
                        <div class="app-radio__disc"></div>
                        <div class="app-radio__info"><strong></strong><span></span></div>
                    </div>
                    <div class="app-radio__eq">${"<i></i>".repeat(16)}</div>
                    <div class="app-radio__ctrl">
                        <button type="button" data-radio="prev" aria-label="Morceau précédent">‹‹</button>
                        <button type="button" data-radio="play" class="app-radio__play"></button>
                        <button type="button" data-radio="next" aria-label="Morceau suivant">››</button>
                    </div>
                    <ol class="app-radio__list">
                        ${tracks.map((t, i) => `<li><button type="button" data-track="${i}" style="--c:${t.color}"><span>${String(i + 1).padStart(2, "0")}</span>${esc(t.title)}<em>${t.bpm} bpm</em></button></li>`).join("")}
                    </ol>
                </div>`;
            const root = body.querySelector(".app-radio");
            const btn = body.querySelector(".app-radio__play");
            // morceau affiché : celui en cours, sinon le premier
            const shown = () => Math.max(0, radio.current);
            const sync = () => {
                if (!root.isConnected) return off();   // fenêtre fermée : on se désabonne
                const t = tracks[shown()];
                root.classList.toggle("is-playing", radio.playing);
                root.style.setProperty("--c", t.color);
                root.querySelector(".app-radio__info strong").textContent = t.title;
                root.querySelector(".app-radio__info span").textContent = `${t.artist} · ${t.bpm} bpm`;
                btn.textContent = radio.playing ? "❚❚ pause" : "▶ lecture";
                root.querySelectorAll("[data-track]").forEach((b) => b.classList.toggle("is-current", +b.dataset.track === radio.current));
            };
            const off = radio.subscribe(sync);
            const go = (step) => radio.select((shown() + step + tracks.length) % tracks.length);
            root.addEventListener("click", (e) => {
                const b = e.target.closest("button");
                if (!b) return;
                if (b.dataset.track) radio.select(+b.dataset.track);   // le morceau en cours : pause
                else if (b.dataset.radio === "play") radio.playing ? radio.pause() : radio.select(shown());
                else if (b.dataset.radio === "prev") go(-1);
                else if (b.dataset.radio === "next") go(1);
            });
            sync();
        },
        solitaire(body) {
            createSolitaire(body);
        },
        terminal(body) {
            body.innerHTML = `<div class="app-term"><div class="app-term__out"></div>
                <label class="app-term__line"><span>${esc(CONTENT.user)}@mirai:~$</span><input type="text" autocomplete="off" spellcheck="false"></label></div>`;
            const out = body.querySelector(".app-term__out");
            const input = body.querySelector("input");
            const print = (t) => { out.insertAdjacentHTML("beforeend", `<div>${esc(t)}</div>`); out.scrollTop = out.scrollHeight; };
            const CMDS = {
                help: () => "commandes : help, whoami, ls, projets, date, meteo, open <app>, clear",
                projets: () => CONTENT.projects.map((p) => `${p.year ?? "····"}  ${p.title} — ${p.soon ? "bientôt" : p.type}`).join("\n"),
                whoami: () => `${CONTENT.about.name} — ${CONTENT.about.role}`,
                ls: () => Object.keys(APPS).join("  "),
                date: () => new Date().toLocaleString("fr-FR"),
                meteo: () => "coucher de soleil · 24°C · brume légère sur le fleuve",
                clear: () => { out.innerHTML = ""; return null; },
                open: (arg) => (APPS[arg] ? (openApp(arg), `ouverture de ${arg}…`) : "usage : open <" + Object.keys(APPS).join("|") + ">")
            };
            print(`${CONTENT.os} — tape « help »`);
            input.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;
                const [cmd, ...args] = input.value.trim().split(/\s+/);
                input.value = "";
                if (!cmd) return;
                print(`$ ${cmd} ${args.join(" ")}`);
                const r = CMDS[cmd] ? CMDS[cmd](args[0]) : `commande introuvable : ${cmd}`;
                if (r) print(r);
            });
            body.addEventListener("click", () => input.focus());
            setTimeout(() => input.focus(), 50);
        }
    };

    // --- fenêtres ---
    // met à jour le dock : fenêtre active, fenêtres réduites (grisées)
    function syncDock() {
        dock.querySelectorAll("button").forEach((b) => {
            const w = open.get(b.dataset.app);
            b.classList.toggle("is-active", !!w && !w.min && w.el.classList.contains("is-focused"));
            b.classList.toggle("is-min", !!w?.min);
        });
    }

    function restoreWin(w) {
        w.min = false;
        w.el.classList.remove("is-min");
        w.el.classList.add("is-restoring");
        setTimeout(() => w.el.classList.remove("is-restoring"), 220);
    }

    // donne le focus à une fenêtre (la restaure si elle était réduite)
    function focusWin(id) {
        const w = open.get(id);
        if (!w) return;
        if (w.min) restoreWin(w);
        w.el.style.zIndex = ++zTop;
        open.forEach((o, k) => o.el.classList.toggle("is-focused", k === id));
        syncDock();
    }

    // réduit une fenêtre vers le dock ; la fenêtre visible la plus haute prend le focus
    function minimizeWin(id) {
        const w = open.get(id);
        if (!w || w.min) return;
        w.min = true;
        w.el.classList.remove("is-focused");
        w.el.classList.add("is-minimizing");
        setTimeout(() => {
            w.el.classList.remove("is-minimizing");
            if (w.min) w.el.classList.add("is-min");
        }, 180);
        let next = null, z = -1;
        open.forEach((o, k) => { if (!o.min && +o.el.style.zIndex > z) { z = +o.el.style.zIndex; next = k; } });
        if (next) focusWin(next); else syncDock();
    }

    function closeApp(id) {
        const w = open.get(id);
        if (!w) return;
        if (id === "radio" && radio.playing) radio.pause();
        w.el.remove();
        open.delete(id);
        renderDock();
    }

    function openApp(id) {
        if (APPS[id]?.action) return onCv?.();
        if (open.has(id)) return focusWin(id);
        const a = APPS[id];
        const n = open.size;
        const el = document.createElement("section");
        el.className = "pc__win";
        el.style.width = a.w + "px";
        el.style.height = a.h + "px";
        el.style.left = Math.min(150 + n * 28, DESIGN_W - a.w - 10) + "px";
        el.style.top = Math.max(30, Math.min(48 + n * 24, DESIGN_H - a.h - 46)) + "px";
        el.innerHTML = `<header class="pc__win-bar"><span class="pc__win-title" style="${appIconStyle(id)}">${appGlyph(id)}${esc(a.title)}</span>
            <span class="pc__win-btns"><button type="button" class="pc__win-min" aria-label="Réduire">${WIN_ICONS.min}</button><button type="button" class="pc__win-max" aria-label="Agrandir">${WIN_ICONS.max}</button><button type="button" class="pc__win-close" aria-label="Fermer">${WIN_ICONS.close}</button></span></header><div class="pc__win-body"></div>
            ${RESIZE_DIRS.map((d) => `<span class="pc__win-rs pc__win-rs--${d}" data-rs="${d}"></span>`).join("")}`;
        windowsEl.appendChild(el);
        open.set(id, { el });
        RENDER[id](el.querySelector(".pc__win-body"));
        el.querySelector(".pc__win-close").addEventListener("click", () => closeApp(id));
        el.querySelector(".pc__win-min").addEventListener("click", () => minimizeWin(id));
        el.querySelector(".pc__win-max").addEventListener("click", () => toggleMax(el));
        el.querySelector(".pc__win-bar").addEventListener("dblclick", (e) => { if (!e.target.closest("button")) toggleMax(el); });
        el.addEventListener("pointerdown", () => focusWin(id));
        drag(el, el.querySelector(".pc__win-bar"));
        resizable(el, a);
        renderDock();
        focusWin(id);
    }

    // agrandir : la fenêtre occupe tout l'écran du PC, entre la barre du haut et le dock ; un second
    // clic (ou double-clic sur sa barre) lui rend sa taille et sa place
    function toggleMax(el, restore = !!el.dataset.max) {
        const btn = el.querySelector(".pc__win-max");
        el.classList.add("is-animating");
        setTimeout(() => el.classList.remove("is-animating"), 220);
        if (restore) {
            const r = JSON.parse(el.dataset.max);
            delete el.dataset.max;
            Object.assign(el.style, r);
            el.classList.remove("is-max");
            btn.innerHTML = WIN_ICONS.max;
            btn.setAttribute("aria-label", "Agrandir");
        } else {
            el.dataset.max = JSON.stringify({ left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height });
            Object.assign(el.style, { left: "0px", top: MAX_TOP + "px", width: DESIGN_W + "px", height: DOCK_TOP - MAX_TOP + "px" });
            el.classList.add("is-max");
            btn.innerHTML = WIN_ICONS.restore;
            btn.setAttribute("aria-label", "Restaurer");
        }
    }

    // redimensionnement par les bords et les coins : taille minimale par appli, la fenêtre reste
    // sous la barre du haut et dans l'écran (coordonnées ramenées à l'échelle de conception)
    function resizable(el, app) {
        const minW = app.minW ?? MIN_W, minH = app.minH ?? MIN_H;
        el.querySelectorAll("[data-rs]").forEach((h) => h.addEventListener("pointerdown", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const dir = h.dataset.rs, sx = e.clientX, sy = e.clientY;
            const x0 = el.offsetLeft, y0 = el.offsetTop, w0 = el.offsetWidth, h0 = el.offsetHeight;
            const right = x0 + w0, bottom = y0 + h0;
            const kind = RESIZE_CURSOR[dir];
            el.classList.add("is-resizing");
            document.documentElement.classList.add("is-rs", "is-rs-" + kind);   // flèche native partout pendant le geste
            const move = (ev) => {
                const dx = (ev.clientX - sx) / scale, dy = (ev.clientY - sy) / scale;
                if (dir.includes("e")) el.style.width = Math.max(minW, Math.min(w0 + dx, DESIGN_W - x0)) + "px";
                if (dir.includes("s")) el.style.height = Math.max(minH, Math.min(h0 + dy, DOCK_TOP - y0)) + "px";
                if (dir.includes("w")) {
                    const x = Math.max(0, Math.min(x0 + dx, right - minW));
                    el.style.left = x + "px";
                    el.style.width = right - x + "px";
                }
                if (dir.includes("n")) {
                    const y = Math.max(26, Math.min(y0 + dy, bottom - minH));
                    el.style.top = y + "px";
                    el.style.height = bottom - y + "px";
                }
            };
            const up = () => {
                el.classList.remove("is-resizing");
                document.documentElement.classList.remove("is-rs", "is-rs-" + kind);
                window.removeEventListener("pointermove", move);
                window.removeEventListener("pointerup", up);
            };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
        }));
    }

    // déplacement des fenêtres (coordonnées ramenées à l'échelle de conception)
    function drag(el, handle) {
        handle.addEventListener("pointerdown", (e) => {
            if (e.target.closest("button")) return;
            e.preventDefault();
            const sx = e.clientX, sy = e.clientY;
            let ox = el.offsetLeft, oy = el.offsetTop, restored = false;
            const move = (ev) => {
                // fenêtre agrandie : au premier déplacement, elle reprend sa taille sous le pointeur
                if (el.dataset.max && !restored && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
                    restored = true;
                    const k = (sx - el.getBoundingClientRect().left) / el.getBoundingClientRect().width;
                    toggleMax(el, true);
                    el.classList.remove("is-animating");
                    ox = (sx - screen.getBoundingClientRect().left) / scale - k * el.offsetWidth;
                    oy = MAX_TOP;
                }
                if (el.dataset.max) return;
                const x = ox + (ev.clientX - sx) / scale, y = oy + (ev.clientY - sy) / scale;
                el.style.left = Math.max(-el.offsetWidth + 80, Math.min(x, DESIGN_W - 80)) + "px";
                el.style.top = Math.max(26, Math.min(y, DESIGN_H - 60)) + "px";
            };
            const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
            window.addEventListener("pointermove", move);
            window.addEventListener("pointerup", up);
        });
    }

    function renderDock() {
        dock.innerHTML = [...open.keys()].map((id) => `<button type="button" data-app="${id}" style="${appIconStyle(id)}">${appGlyph(id)}${esc(APPS[id].title)}</button>`).join("");
        dock.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
            const id = b.dataset.app, w = open.get(id);
            if (!w) return;
            if (w.min || !w.el.classList.contains("is-focused")) focusWin(id); else minimizeWin(id);
        }));
        syncDock();
    }

    frame.querySelectorAll(".pc__icon").forEach((b) => b.addEventListener("click", () => openApp(b.dataset.app)));

    // --- démarrage de l'ordinateur ---
    function chime() {
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            chimeCtx ??= new AC();
            chimeCtx.resume();
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                const t = chimeCtx.currentTime + i * 0.11, o = chimeCtx.createOscillator(), g = chimeCtx.createGain();
                o.type = "triangle";
                o.frequency.value = f;
                g.gain.setValueAtTime(0.0001, t);
                g.gain.exponentialRampToValueAtTime(0.05, t + 0.02);
                g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
                o.connect(g).connect(chimeCtx.destination);
                o.start(t);
                o.stop(t + 1);
            });
        } catch { /* audio indisponible : le démarrage reste silencieux */ }
    }

    const later = (fn, ms) => bootTimers.push(setTimeout(fn, ms));
    const clearBoot = () => { bootTimers.forEach(clearTimeout); bootTimers = []; };

    function startBoot() {
        booting = true;
        clearBoot();
        bios.innerHTML = "";
        bar.style.transition = "none";
        bar.style.width = "0%";
        boot.className = "pc__boot is-active";
        BIOS_LINES.forEach((line, i) => later(() => bios.insertAdjacentHTML("beforeend", `<div>${esc(line)}</div>`), 600 + i * 260));
        const tLogo = 600 + BIOS_LINES.length * 260 + 500;
        later(() => {
            boot.classList.add("is-logo");
            chime();
            requestAnimationFrame(() => {
                bar.style.transition = "width 2.2s cubic-bezier(0.4, 0.1, 0.3, 1)";
                bar.style.width = "100%";
            });
        }, tLogo);
        later(finishBoot, tLogo + 2700);
    }

    function finishBoot() {
        if (!booting) return;
        clearBoot();
        booting = false;
        booted = true;
        boot.classList.add("is-done");
        later(() => { boot.className = "pc__boot"; }, 700);
        if (!open.size) openApp("about");
    }

    // parti en plein démarrage : on recommencera depuis le début au prochain passage
    function cancelBoot() {
        clearBoot();
        booting = false;
        boot.className = "pc__boot";
    }

    boot.addEventListener("pointerdown", (e) => { e.preventDefault(); finishBoot(); });

    return {
        // rect : rectangle de l'écran à l'écran (px), ou null pour masquer
        update(rect) {
            const show = !!rect;
            if (show !== visible) {
                visible = show;
                frame.classList.toggle("is-on", show);
                frame.setAttribute("aria-hidden", String(!show));
                if (!show && radio.playing) radio.pause();
                if (!show) document.activeElement?.blur?.();
                if (show) { if (!booted) startBoot(); else if (!open.size) openApp("about"); }
                else if (booting) cancelBoot();
            }
            if (!show) return;
            scale = Math.min(rect.width / DESIGN_W, rect.height / DESIGN_H);
            frame.style.left = rect.left + "px";
            frame.style.top = rect.top + "px";
            screen.style.transform = `scale(${scale})`;
        }
    };
}
