import * as THREE from "three";
import { CAM_BASE, CAM_TARGET, SALON_TARGET, PC_SCREEN, SPOTS } from "./config/layout.js";

// Déplacement de la caméra piloté par le scroll : 0 = chambre, 1 = salon, 2 = écran du PC.
// Les valeurs intermédiaires interpolent le long de deux trajets.
// Depuis le salon, un clic sur la télé ou la borne d'arcade amène la caméra à un point de vue
// (sit(id) / standUp, voir SPOTS dans layout.js) ; scroll, clic ou touche la ramènent.

export const STOPS = ["chambre", "salon", "bureau"];

// format pour lequel les cadrages ont été réglés
const REF_ASPECT = 1.5;

// zones du trajet (0 → 2) où les objets d'une pièce sont cliquables. Le salon commence dès le milieu
// des marches : les bornes d'arcade, près de l'entrée, ne sont bien visibles que pendant la descente.
const SALON_FROM = 0.45, SALON_TO = 1.4, OFFICE_FROM = 1.6;
const OFFICE_SPOTS = new Set(["pc", "phone", "printer"]);   // points de vue du bureau (les autres sont au salon)

export function createNavigation(camera, { onChange } = {}) {
    // chambre -> marches -> salon
    const bedroomPath = new THREE.CatmullRomCurve3([
        CAM_BASE.clone(),
        new THREE.Vector3(-0.4, 1.6, 1.6),
        new THREE.Vector3(0.7, 1.65, -1.2),
        new THREE.Vector3(1.2, 1.3, -3.4),
        new THREE.Vector3(1.4, 0.85, -4.6)
    ]);
    // salon -> porte -> écran du PC
    const officePath = new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.4, 0.85, -4.6),
        new THREE.Vector3(0.4, 1.0, -9.0),
        new THREE.Vector3(-3.4, 1.0, -10.9),
        new THREE.Vector3(-5.6, 0.85, -10.75),
        new THREE.Vector3(PC_SCREEN.x + 1.2, PC_SCREEN.y + 0.08, PC_SCREEN.z)
    ]);
    const officeTargets = new THREE.CatmullRomCurve3([
        SALON_TARGET.clone(),
        new THREE.Vector3(-4.6, 0.95, -10.95),
        new THREE.Vector3(-8.6, 0.85, -10.8),
        new THREE.Vector3(-8.6, 0.62, -10.65),
        PC_SCREEN.clone()
    ]);

    const mouse = new THREE.Vector2();
    const smooth = new THREE.Vector2();
    const lookTarget = new THREE.Vector3();
    const seatPos = new THREE.Vector3();
    let travel = 0;
    let goal = 0;
    let seatGoal = 0;   // 1 = sur un point de vue (canapé, borne…)
    let seatK = 0;      // avancement du mouvement vers ce point de vue (0 → 1)
    let spotId = null;  // point de vue courant (gardé pendant le retour)
    let prevId = null;  // point de vue quitté lors d'un passage de l'un à l'autre (borne → borne)
    let blend = 1;      // avancement de ce passage (0 → 1)
    let fromChoice = false;   // on est arrivé à une borne depuis la vue « choix »
    const seatLook = new THREE.Vector3();

    function setGoal(v) {
        goal = THREE.MathUtils.clamp(v, 0, STOPS.length - 1);
        onChange?.(goal, seatGoal === 1, spotId);
    }

    function goTo(stop, instant = false) {
        seatGoal = 0;
        setGoal(stop);
        if (instant) travel = goal;
    }

    // objets cliquables : ceux du salon dans toute la zone du salon, le PC dans celle du bureau,
    // même si la caméra n'est pas tout à fait arrêtée (un scroll un peu long ne les désactive plus)
    const canSit = (id) => {
        const salon = travel > SALON_FROM && travel < SALON_TO, office = travel > OFFICE_FROM;
        return id === undefined ? salon || office : OFFICE_SPOTS.has(id) ? office : salon;
    };

    function sit(id = "tv") {
        if (!canSit(id) || !SPOTS[id]) return;
        if (seatK > 0.01 && spotId !== id) return;   // laisser finir le retour
        if (seatK < 0.01) { prevId = null; blend = 1; fromChoice = false; }
        spotId = id;
        seatGoal = 1;
        goal = OFFICE_SPOTS.has(id) ? 2 : 1;   // en se relevant, on retrouve la vue posée de la pièce
        onChange?.(goal, true, id);
    }

    // passe en douceur d'un point de vue à un autre sans se relever (vue « choix » ↔ borne)
    function switchTo(id) {
        if (!seatGoal || !SPOTS[id] || id === spotId || blend < 1) return;
        fromChoice = id !== "arcades" ? spotId === "arcades" : false;
        prevId = spotId;
        spotId = id;
        blend = 0;
        onChange?.(goal, true, id);
    }

    // retour d'un cran : d'une borne vers la vue « choix » si on en vient, sinon on se relève
    function back() {
        if (seatGoal && fromChoice && spotId !== "arcades") switchTo("arcades");
        else standUp();
    }

    function standUp() {
        seatGoal = 0;
        onChange?.(goal, false, null);
    }

    // tant qu'on est assis (ou qu'on n'est pas encore relevé), défiler fait d'abord se lever
    const busySeated = () => seatGoal === 1 || seatK > 0.3;

    // lien direct : #chambre, #salon, #bureau ou #t=1.4 (position précise, pour le debug)
    const hash = location.hash.slice(1);
    const hashT = hash.match(/^t=([\d.]+)$/);
    if (STOPS.includes(hash)) goTo(STOPS.indexOf(hash), true);
    else if (hashT) goTo(parseFloat(hashT[1]), true);
    else setGoal(0);

    // point de vue « contemplatif » (fenêtre) : sur écran tactile, glisser le doigt oriente le regard
    const panning = () => seatGoal === 1 && SPOTS[spotId]?.pan;

    window.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch" && panning()) return;   // géré par touchmove (glissement relatif)
        mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    });
    window.addEventListener("wheel", (e) => {
        if (busySeated()) { if (seatGoal) standUp(); return; }
        setGoal(goal + e.deltaY * 0.0012);
    }, { passive: true });

    let touchY = null, touchX = null;
    window.addEventListener("touchstart", (e) => { touchY = e.touches[0].clientY; touchX = e.touches[0].clientX; }, { passive: true });
    window.addEventListener("touchmove", (e) => {
        if (touchY === null) return;
        if (panning()) {   // on « attrape » la vue : glisser vers la gauche fait regarder à droite
            const { clientX: x, clientY: y } = e.touches[0];
            mouse.set(
                THREE.MathUtils.clamp(mouse.x - (x - touchX) / window.innerWidth * 2.5, -1, 1),
                THREE.MathUtils.clamp(mouse.y - (y - touchY) / window.innerHeight * 2.5, -1, 1)
            );
            touchX = x; touchY = y;
            return;
        }
        if (busySeated()) { if (seatGoal && !spotId?.startsWith("arcade")) standUp(); touchY = e.touches[0].clientY; return; }
        setGoal(goal + (touchY - e.touches[0].clientY) * 0.003);
        touchY = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("keydown", (e) => {
        if (e.target.closest?.("input, textarea") && e.key !== "Escape") return;   // saisie dans l'ordinateur
        if (seatGoal && spotId?.startsWith("arcade") && e.key !== "Escape") return;   // les touches servent au jeu
        if (seatGoal && e.key === "Escape" && fromChoice && spotId !== "arcades") { back(); return; }
        if (seatGoal && ["ArrowDown", "PageDown", " ", "ArrowUp", "PageUp", "Escape"].includes(e.key)) { standUp(); return; }
        if (["ArrowDown", "PageDown", " "].includes(e.key)) setGoal(Math.min(Math.round(goal) + 1, STOPS.length - 1));
        if (["ArrowUp", "PageUp"].includes(e.key)) setGoal(Math.max(Math.round(goal) - 1, 0));
    });

    function update(dt, t) {
        travel += (goal - travel) * Math.min(dt * 2.2, 1);
        if (Math.abs(goal - travel) < 0.0005) travel = goal;

        const seg = Math.min(Math.floor(travel), 1);
        const f = travel - seg;
        const k = f * f * (3 - 2 * f);
        let fov, sway;
        if (seg === 0) {
            bedroomPath.getPoint(k, camera.position);
            lookTarget.lerpVectors(CAM_TARGET, SALON_TARGET, k);
            fov = 48 + k * 24;
            sway = 1;
        } else {
            officePath.getPoint(k, camera.position);
            officeTargets.getPoint(k, lookTarget);
            fov = 72 - k * 27;
            sway = 1 - k * 0.85;
        }

        // parallaxe souris + léger balancement, petits pas dans les marches
        camera.position.x += smooth.x * 0.35 * sway;
        camera.position.y += (-smooth.y * 0.15 + Math.sin(t * 0.4) * 0.015) * sway
            + Math.sin(k * Math.PI * 6) * 0.03 * Math.sin(k * Math.PI) * (1 - seg);
        smooth.lerp(mouse, 0.04);

        // assis dans le canapé : on quitte le trajet, on se laisse tomber dans les coussins
        // mouvement de durée fixe (~1,3 s) adouci par smoothstep : arrive exactement au point de vue
        seatK = THREE.MathUtils.clamp(seatK + Math.sign(seatGoal - seatK) * dt * 0.75, 0, 1);
        if (seatK > 0 && spotId) {
            const spot = SPOTS[spotId];
            const e = seatK * seatK * (3 - 2 * seatK);
            let sfov = spot.fov, sdip = spot.dip;
            seatPos.copy(spot.pos);
            seatLook.copy(spot.look);
            if (blend < 1 && prevId) {
                blend = Math.min(1, blend + dt * 1.3);
                const b = blend * blend * (3 - 2 * blend), ps = SPOTS[prevId];
                seatPos.lerpVectors(ps.pos, spot.pos, b);
                seatLook.lerpVectors(ps.look, spot.look, b);
                sfov = ps.fov + (spot.fov - ps.fov) * b;
                sdip = ps.dip + (spot.dip - ps.dip) * b;
            }
            if (spot.pan) {   // point de vue « contemplatif » : la souris oriente doucement le regard
                seatLook.x += smooth.x * spot.pan;
                seatLook.y -= smooth.y * spot.pan * 0.45;
            }
            if (!spot.still) {   // devant le PC : ni parallaxe ni balancement, l'interface ne doit pas bouger
                seatPos.x += smooth.x * 0.05;
                seatPos.y += -smooth.y * 0.03 + Math.sin(t * 0.4) * 0.004;
            }
            camera.position.lerp(seatPos, e);
            camera.position.y -= Math.sin(e * Math.PI) * sdip;
            lookTarget.lerp(seatLook, e);
            fov += (sfov - fov) * e;
        }

        camera.lookAt(lookTarget);

        // écrans plus étroits que 3:2 (portrait, tablette) : on garde le même cadrage horizontal
        if (camera.aspect < REF_ASPECT) {
            const half = Math.tan(THREE.MathUtils.degToRad(fov) / 2) * REF_ASPECT / camera.aspect;
            fov = Math.min(THREE.MathUtils.radToDeg(Math.atan(half)) * 2, 100);
        }
        if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }

        return travel;
    }

    return {
        update,
        goTo,
        sit,
        switchTo,
        back,
        standUp,
        canSit,
        get seated() { return seatGoal === 1; },
        get spot() { return seatGoal === 1 ? spotId : null; },
        get focusProgress() { return Math.min(seatK, blend); },
        get goal() { return goal; }
    };
}
