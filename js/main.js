import * as THREE from "three";
import { scene, shared } from "./core/scene.js";
import { skipRand } from "./core/random.js";
import { runFrame } from "./core/animated.js";
import { QUALITY, createAdaptiveResolution } from "./core/quality.js";
import { pickClickable, getClickable } from "./core/interactive.js";
import "./world/atmosphere.js";
import { createSky } from "./world/sky.js";
import { createCity } from "./world/city.js";
import { createStreets } from "./world/streets.js";
import { createWater, enableReflections } from "./world/water.js";
import { createTowers } from "./world/towers.js";
import { createNearTower } from "./world/nearTower.js";
import { createForeground } from "./world/foreground.js";
import { createIndustry } from "./world/industry.js";
import { createBridges } from "./world/bridges.js";
import { createHighways } from "./world/highways.js";
import { createHolograms } from "./world/holograms.js";
import { createAirTraffic } from "./world/traffic.js";
import { createShips } from "./world/ships.js";
import { buildVegetation } from "./world/vegetation.js";
import { createBedroom } from "./rooms/bedroom.js";
import { createSalon } from "./rooms/salon.js";
import { buildLeaves } from "./props/foliage.js";
import { createLights } from "./lighting.js";
import { createComposer } from "./fx/postprocessing.js";
import { createNavigation } from "./navigation.js";
import { createUI } from "./ui.js";
import { createCursor } from "./cursor.js";
import { createDesktop } from "./desktop.js";
import { createPhone } from "./phone.js";
import { createDaylight } from "./daylight.js";
import { createVinylPlayer, createVinylPad } from "./vinyl.js";
import { createStory } from "./story.js";
import { createHotspots } from "./hotspots.js";
import { createGuide } from "./guide.js";
import { createCv } from "./cv.js";
import { SPOTS } from "./config/layout.js";

// Point d'entrée : renderer, construction de la scène, navigation, boucle de rendu.

const canvas = document.querySelector("#webgl");

let nav;
const ui = createUI({ onSelect: (stop) => nav.goTo(stop) });

let renderer;
try {
    // pas d'antialiasing natif : le rendu passe par le post-traitement, qui ne l'utilise pas
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
} catch (err) {
    ui.error("WebGL n'est pas disponible sur ce navigateur.");
    throw err;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, QUALITY.maxPixelRatio));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = QUALITY.low ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
renderer.shadowMap.autoUpdate = false;   // recalculées toutes les QUALITY.shadowEvery images (boucle de rendu)

const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.05, 4000);

// Construction du décor : chaque module de la ville a son propre générateur aléatoire
createSky();
createCity();
createStreets();
createWater();
createTowers();
createNearTower();
createForeground();
createIndustry();
createBridges();
createHighways();
createHolograms();
createAirTraffic();
createShips();
buildVegetation();
enableReflections();

// L'appartement utilise le flux aléatoire global : on l'avance du nombre de tirages
// que consommait l'ancienne ville, pour que livres, plantes et feuilles restent à l'identique.
skipRand(81469);

const { woodTex, rugTex } = createBedroom();
const { arcades, turntable, speakers, sleeves, tv: tvScreen } = createSalon({ woodTex, rugTex });
buildLeaves();
createLights();
dimMinorLights();

// basse qualité : les petites lumières d'appoint (portée courte) sont éteintes une fois pour toutes.
// Chaque lumière ponctuelle coûte à chaque pixel de chaque matériau éclairé.
function dimMinorLights() {
    if (!QUALITY.minorLightDistance) return;
    scene.traverse((o) => {
        if (o.isPointLight && o.distance > 0 && o.distance <= QUALITY.minorLightDistance) o.visible = false;
    });
}

// bouton jour / coucher de soleil
const dayButton = document.querySelector("#daytoggle");
const syncDayButton = (day) => {
    const label = day ? "Revenir au coucher de soleil" : "Passer en plein jour";
    dayButton.setAttribute("aria-pressed", String(day));
    dayButton.setAttribute("aria-label", label);
    dayButton.title = label;
};
const daylight = createDaylight(renderer, { onChange: syncDayButton });
syncDayButton(daylight.day);
dayButton.addEventListener("click", (e) => { e.stopPropagation(); daylight.toggle(); });

const { composer, resize: resizeComposer } = createComposer(renderer, scene, camera);

nav = createNavigation(camera, { onChange: (goal, seated, spot) => ui.setGoal(goal, seated, spot) });

// aller à un point de vue depuis n'importe où : on rejoint la pièce, puis on s'y installe à l'arrivée
// (abandonné si l'on part vers une autre pièce entre-temps)
let wanted = null;
function goToSpot(spot, stop) {
    if (nav.spot === spot || (spot === "arcades" && nav.spot?.startsWith("arcade"))) return;
    wanted = { spot, stop };
    if (Math.abs(nav.goal - stop) > 0.3 || nav.seated) nav.goTo(stop);
}
function followWanted() {
    if (!wanted) return;
    if (Math.abs(nav.goal - wanted.stop) > 0.5) { wanted = null; return; }
    if (nav.canSit(wanted.spot)) {
        nav.sit(wanted.spot);   // refusé tant qu'on se relève d'un autre point de vue : on réessaie
        if (nav.spot === wanted.spot) wanted = null;
    }
}

// CV : imprimante du bureau (props/printer.js), aperçu et téléchargement (cv.js)
const cv = createCv({ nav, printer: getClickable("printer").userData.printer, goToSpot });

// textes du portfolio à l'arrivée dans chaque pièce ; au bureau, le bouton allume l'ordinateur, ou prend
// le téléphone sur mobile (visible avant l'arrivée : le bouton finit le trajet puis s'y installe)
const story = createStory({ onAction: (room) => room === "bureau" && goToSpot(story.mobile ? "phone" : "pc", 2) });

// repères violets sur les objets cliquables (étiquette au survol). Les bornes d'arcade, dans le coin de
// l'entrée du salon, sont hors champ une fois arrivé : leur repère se colle au bord de l'écran.
// Les bornes ont aussi un lien direct #arcade.
const hotspots = createHotspots(camera, nav, [
    { spot: "arcades", label: "Arcade", aria: "S'approcher des bornes d'arcade", edge: true, pos: SPOTS.arcades.look.clone().setY(SPOTS.arcades.look.y + 0.35) },
    // télé et platine, contre le mur de droite : hors champ sur un téléphone tenu en hauteur, collées au bord droit
    { spot: "tv", label: "Regarder la télé", edge: true, edgeRow: 0 },
    { spot: "window", label: "Contempler la vue", dy: -0.4 },
    { spot: "turntable", label: "Choisir un vinyle", dy: 0.1, edge: true, edgeRow: 1 },
    { spot: "etage", label: "Bibliothèque", offset: [0, 0.35, -1.1] },   // vers la baie, à l'écart du texte du salon
    { spot: "figurines", label: "Figurines" },
    { spot: "poster1", label: "Posters" },
    { spot: "poster2", label: "Autoportrait" },
    { spot: "poster3", label: "Posters" },
    // sur mobile, l'écran du PC est remplacé par le téléphone (story.mobile)
    ...(story.mobile ? [] : [{ spot: "pc", label: "Allumer l'ordinateur", dy: 0.2 }]),
    { spot: "phone", label: "Allumer le téléphone", dy: 0.03 },
    { spot: "printer", label: "Imprimer mon CV", dy: 0.12, onClick: () => cv.open() }
]);

// guide de prise en main : à la première visite, juste après le chargement ; lien « Guide » pour le revoir
const guide = createGuide();
document.querySelector("#guidelink").addEventListener("click", (e) => { e.stopPropagation(); guide.open(); });

// bouton « repères » : affiche ou masque les points violets (masqués par défaut)
const spotButton = document.querySelector("#spottoggle");
spotButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const off = document.body.classList.toggle("hotspots-off");
    const label = off ? "Afficher les repères cliquables" : "Masquer les repères cliquables";
    spotButton.setAttribute("aria-pressed", String(off));
    spotButton.setAttribute("aria-label", label);
    spotButton.title = label;
});
if (location.hash === "#arcade") { nav.goTo(1, true); goToSpot("arcades", 1); }

// bouton « œil » (ou touche H) : masque l'interface (nom, menu, textes, indications) pour profiter de la scène
const hudButton = document.querySelector("#hudtoggle");
function setHud(hidden) {
    document.body.classList.toggle("hud-hidden", hidden);
    const label = hidden ? "Afficher l'interface (H)" : "Masquer l'interface (H)";
    hudButton.setAttribute("aria-pressed", String(hidden));
    hudButton.setAttribute("aria-label", label);
    hudButton.title = label;
}
hudButton.addEventListener("click", (e) => { e.stopPropagation(); setHud(!document.body.classList.contains("hud-hidden")); });
window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() !== "h" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea") || nav.spot?.startsWith("arcade")) return;   // saisie dans l'ordinateur, bornes
    setHud(!document.body.classList.contains("hud-hidden"));
});

// bouton plein écran (comme F11) : masqué si le navigateur ne le permet pas (Safari sur iPhone)
const fullButton = document.querySelector("#fulltoggle");
const fullElement = () => document.fullscreenElement ?? document.webkitFullscreenElement;
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) fullButton.hidden = true;
function syncFull() {
    const full = !!fullElement();
    const label = full ? "Quitter le plein écran" : "Plein écran";
    fullButton.setAttribute("aria-pressed", String(full));
    fullButton.setAttribute("aria-label", label);
    fullButton.title = label;
}
fullButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const root = document.documentElement;
    const request = fullElement()
        ? (document.exitFullscreen ?? document.webkitExitFullscreen)?.call(document)
        : (root.requestFullscreen ?? root.webkitRequestFullscreen)?.call(root);
    request?.catch?.(() => {});   // refusé par le navigateur : rien à faire
});
for (const ev of ["fullscreenchange", "webkitfullscreenchange"]) document.addEventListener(ev, syncFull);

// platine vinyle : disques lofi qui jouent dans le salon (étouffés quand on en sort)
const vinyl = createVinylPlayer();
const vinylPad = createVinylPad(vinyl);
vinyl.subscribe(() => {
    turntable.userData.vinyl.update(vinyl.discs[vinyl.current]?.color, vinyl.playing);
    speakers.forEach((sp) => sp.userData.setPlaying(vinyl.playing));
    sleeves.setSelected(vinyl.current);
});
const SLEEVE = /^sleeve(\d)$/;   // identifiant d'une pochette : sleeve0..3 = disque 0..3

// objets de la bibliothèque et du mur de gauche à contempler de près
const VIEWS = new Set(["etage", "figurines", "poster1", "poster2", "poster3"]);

// clic : sur la télé du salon on s'installe dans le canapé ; assis, on se relève
canvas.addEventListener("click", (e) => {
    if (nav.spot === "arcades") {   // vue « choix » : un clic sur une borne s'y installe (même en arrivant), ailleurs on se relève
        const id = pickClickable(e.clientX, e.clientY, camera);
        if (arcades[id]) return nav.switchTo(id);
        return nav.focusProgress < 1 ? undefined : nav.standUp();
    }
    if (nav.spot === "turntable") {   // devant la platine : une pochette pose son disque, la platine met en pause / reprend
        if (nav.focusProgress < 1) return;
        const id = pickClickable(e.clientX, e.clientY, camera);
        const m = SLEEVE.exec(id ?? "");
        if (m) return vinyl.select(+m[1]);
        if (id === "turntable") return vinyl.playing ? vinyl.pause() : vinyl.current >= 0 ? vinyl.select(vinyl.current) : undefined;
        return nav.standUp();
    }
    if (nav.spot === "tv") {   // assis devant la télé : un clic sur l'écran change de chaîne, ailleurs on se relève
        if (nav.focusProgress < 1) return;
        return pickClickable(e.clientX, e.clientY, camera) === "tv" ? tvScreen.next() : nav.standUp();
    }
    if (VIEWS.has(nav.spot)) {      // figurines / posters : un clic sur un autre objet y glisse, ailleurs on se relève
        if (nav.focusProgress < 1) return;
        const id = pickClickable(e.clientX, e.clientY, camera);
        return VIEWS.has(id) ? nav.switchTo(id) : nav.standUp();
    }
    if (nav.spot === "printer") {   // devant l'imprimante : un clic sur elle (ou la feuille) montre le CV, ailleurs on revient
        if (nav.focusProgress < 1) return;
        return pickClickable(e.clientX, e.clientY, camera) === "printer" ? cv.open() : nav.standUp();
    }
    if (nav.seated) return nav.spot?.startsWith("arcade") ? undefined : nav.standUp();   // à la borne : Échap, scroll ou bouton ×
    let id = nav.canSit() && pickClickable(e.clientX, e.clientY, camera);
    if (id === "printer" && nav.canSit(id)) return cv.open();
    const sleeve = SLEEVE.exec(id || "");
    if (id === "pc" && story.mobile) id = "phone";   // sur mobile, toucher l'écran du PC ouvre le téléphone
    if (arcades[id]) id = "arcades";   // les deux bornes mènent d'abord à la vue qui permet de choisir
    else if (sleeve) id = "turntable";
    if (id && nav.canSit(id)) {
        nav.sit(id);
        if (sleeve) vinyl.select(+sleeve[1]);   // cliquer une pochette de loin : on s'approche et le disque est posé
    }
});
const touch = window.matchMedia("(pointer: coarse)").matches;
const cursor = createCursor();
// survol : recalculé quand la souris bouge, mais aussi régulièrement pendant que la caméra se déplace
// (un objet peut arriver sous une souris immobile)
let pointer = null;
function updateHover(x, y) {
    const LABELS = { tv: "regarder", arcade: "approcher", arcade2: "approcher", turntable: "choisir un disque", window: "contempler la vue", pc: "utiliser", phone: "allumer le téléphone", printer: "imprimer mon CV", etage: "contempler", figurines: "contempler", poster1: "contempler", poster2: "contempler", poster3: "contempler" };
    const CHOICE = { arcade: "jouer à Star Run", arcade2: "jouer à Breaker" };
    const choosing = nav.spot === "arcades", browsing = VIEWS.has(nav.spot), atTable = nav.spot === "turntable", atTv = nav.spot === "tv";
    let over = (choosing || browsing || atTable || atTv || nav.spot === "printer" || (!nav.seated && nav.canSit())) && pickClickable(x, y, camera);
    const sm = SLEEVE.exec(over || "");
    if (atTable) {   // devant la platine : le survol d'une pochette la soulève et annonce son disque
        sleeves.setHover(sm ? +sm[1] : -1);
        const d = sm && vinyl.discs[+sm[1]];
        cursor.setHover(sm ? `${vinyl.playing && vinyl.current === +sm[1] ? "mettre en pause" : "poser"} « ${d.title} »`
            : over === "turntable" ? (vinyl.playing ? "mettre en pause" : vinyl.current >= 0 ? "reprendre" : "se lever") : "se lever");
        return;
    }
    sleeves.setHover(-1);
    if (atTv) { cursor.setHover(over === "tv" ? "changer de chaîne" : "se lever"); return; }
    if (nav.spot === "printer") { cursor.setHover(over === "printer" ? "voir le CV" : "revenir"); return; }
    if (sm) over = "turntable";   // de loin, toutes les pochettes mènent à la platine
    if (choosing ? !arcades[over] : browsing ? !VIEWS.has(over) : over && !nav.canSit(over)) over = null;
    cursor.setHover(over ? (choosing ? CHOICE : LABELS)[over] : choosing || browsing ? "se lever" : nav.spot === "tv" ? "se lever" : nav.spot?.startsWith("arcade") ? null : nav.spot ? "revenir" : null);
}
canvas.addEventListener("pointermove", (e) => {
    pointer = { x: e.clientX, y: e.clientY };
    updateHover(pointer.x, pointer.y);
});
canvas.addEventListener("pointerleave", () => { pointer = null; cursor.setHover(null); sleeves.setHover(-1); });
let hoverClock = 0;

function resize(pixelRatio) {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(w, h);
    resizeComposer(w, h, pixelRatio);
}
// résolution dynamique : la définition baisse si la machine n'arrive pas à suivre
const adaptive = createAdaptiveResolution(resize);
window.addEventListener("resize", () => resize(adaptive.reset()));

// télé : ← / → changent de chaîne une fois installé devant
window.addEventListener("keydown", (e) => {
    if (nav.spot !== "tv" || nav.focusProgress < 1) return;
    if (e.key === "ArrowRight") tvScreen.next();
    else if (e.key === "ArrowLeft") tvScreen.prev();
});

// borne d'arcade : le jeu est jouable (clavier) une fois la caméra arrivée devant
const atArcade = (id) => nav.spot === id && nav.focusProgress >= 1;
const playedGame = () => Object.entries(arcades).find(([id]) => atArcade(id))?.[1].game;
for (const down of [true, false]) {
    window.addEventListener(down ? "keydown" : "keyup", (e) => {
        if (!e.repeat && playedGame()?.key(e.code, down)) e.preventDefault();
    });
}

// commandes tactiles de la borne : boutons maintenus, relâchés au doigt levé
const pad = document.querySelector("#arcadepad");
const PAD_KEYS = { left: "ArrowLeft", right: "ArrowRight", fire: "Space", start: "Enter" };
pad.querySelectorAll("[data-pad]").forEach((btn) => {
    const code = PAD_KEYS[btn.dataset.pad];
    const release = () => { btn.classList.remove("is-down"); playedGame()?.key(code, false); };
    btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.setPointerCapture(e.pointerId);
        btn.classList.add("is-down");
        playedGame()?.key(code, true);
    });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) btn.addEventListener(ev, release);
});
pad.querySelector("[data-pad-quit]").addEventListener("click", (e) => { e.stopPropagation(); nav.back(); });
pad.addEventListener("contextmenu", (e) => e.preventDefault());

// écran du PC : une fois la caméra arrivée devant, le bureau HTML se cale sur sa projection
const desktop = createDesktop({ onCv: () => cv.open() });

// téléphone du bureau (surtout pour le mobile) : son interface s'ouvre une fois la caméra arrivée devant
const phone = createPhone({ onCv: () => cv.open(), onClose: () => nav.standUp() });
const corners = [[-0.51, -0.287], [0.51, -0.287], [0.51, 0.287], [-0.51, 0.287]].map(([x, y]) => new THREE.Vector3(x, y, 0));
const tmp = new THREE.Vector3();
function updateDesktop() {
    const pc = getClickable("pc");
    pc?.userData.setOn?.(nav.spot === "pc");   // écran noir sauf quand on va vers le PC ou qu'on l'utilise
    if (!pc || nav.spot !== "pc" || nav.focusProgress < 1) return desktop.update(null);
    camera.updateMatrixWorld();
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of corners) {
        tmp.copy(c).applyMatrix4(pc.matrixWorld).project(camera);
        const sx = (tmp.x + 1) / 2 * window.innerWidth, sy = (1 - tmp.y) / 2 * window.innerHeight;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    desktop.update({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 });
}

const clock = new THREE.Clock();
let firstFrame = true;

let frame = 0;

renderer.setAnimationLoop(() => {
    const rawDt = clock.getDelta();
    const dt = Math.min(rawDt, 0.1);
    adaptive.tick(rawDt);
    const t = clock.elapsedTime;
    shared.uTime.value = t;

    const travel = nav.update(dt, t);
    ui.setProgress(travel);
    story.update(travel, nav.seated || nav.focusProgress > 0.02);
    followWanted();
    cv.update();
    vinyl.setDistance(Math.abs(travel - 1));   // 0 dans le salon, 1 à la chambre ou au bureau
    vinylPad.setVisible(nav.spot === "turntable" && nav.focusProgress >= 1);
    for (const [id, a] of Object.entries(arcades)) a.game.setActive(atArcade(id));
    const padOn = touch && !!playedGame();
    pad.classList.toggle("is-visible", padOn);
    document.body.classList.toggle("arcade-pad", padOn);   // à la borne sur mobile : le reste de l'interface s'efface
    runFrame(dt, t);
    hoverClock += dt;
    if (pointer && !touch && hoverClock > 0.12) { hoverClock = 0; updateHover(pointer.x, pointer.y); }
    hotspots.update();
    updateDesktop();
    phone.update(nav.spot === "phone" && nav.focusProgress >= 1 && !cv.isOpen);
    if (frame++ % QUALITY.shadowEvery === 0) renderer.shadowMap.needsUpdate = true;
    composer.render();

    if (firstFrame) {
        firstFrame = false;
        ui.ready();
        guide.openIfFirstVisit(1100);   // pendant le fondu de l'écran de chargement
    }
});
