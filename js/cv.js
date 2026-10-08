// CV : un clic sur l'imprimante du bureau, sur le fichier « CV.pdf » de l'ordinateur, sur « Mon CV » du
// téléphone ou sur le bouton de l'appli Contact amène la caméra devant l'imprimante, qui imprime la feuille ; la feuille
// s'affiche ensuite en grand, avec de quoi télécharger le PDF ou l'imprimer pour de vrai.

export const CV = {
    pdf: "assets/cv/Clement_Lequeurre_CV.pdf",
    image: "assets/cv/cv-apercu.jpg",
    fileName: "CV_Clement_Lequeurre.pdf"
};

// nav : navigation ; printer : API de l'imprimante (props/printer.js) ;
// goToSpot(spot, stop) : rejoint une pièce puis s'installe au point de vue (main.js)
export function createCv({ nav, printer, goToSpot }) {
    const root = document.createElement("div");
    root.className = "cvview";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Mon CV");
    root.innerHTML = `
        <div class="cvview__sheet">
            <img src="${CV.image}" alt="CV de Clément Lequeurre : étudiant en BUT MMI, recherche d'un stage en développement web de 11 semaines (mars à juin 2027)" width="1400" height="1980">
        </div>
        <div class="cvview__side">
            <p class="cvview__kicker">Impression terminée</p>
            <h2 class="cvview__title">Mon CV</h2>
            <p class="cvview__text">Développeur full-stack créatif côté front, en 3<sup>e</sup> année de BUT MMI, je recherche un stage en développement web de 11 semaines, de mars à juin 2027.</p>
            <div class="cvview__actions">
                <a class="cvview__btn cvview__btn--main" href="${CV.pdf}" download="${CV.fileName}">↓ Télécharger le PDF</a>
                <button type="button" class="cvview__btn" data-act="print">⎙ Imprimer</button>
                <a class="cvview__btn" href="${CV.pdf}" target="_blank" rel="noopener">Ouvrir dans un onglet ↗</a>
            </div>
            <button type="button" class="cvview__close" data-act="close">← Revenir dans l'appartement <kbd>Échap</kbd></button>
        </div>`;
    document.body.appendChild(root);

    let pending = false;   // en route vers l'imprimante
    let from = null;       // venu de l'ordinateur ou du téléphone : on y retourne en fermant
    let isOpen = false;

    function show() {
        isOpen = true;
        root.classList.add("is-open");
        document.body.classList.add("cv-open");
        setTimeout(() => root.querySelector(".cvview__btn--main").focus({ preventScroll: true }), 60);
    }

    function hide() {
        if (!isOpen) return;
        isOpen = false;
        root.classList.remove("is-open");
        document.body.classList.remove("cv-open");
        document.activeElement?.blur?.();
    }

    // ferme l'aperçu et quitte l'imprimante (retour à l'ordinateur si l'on en vient)
    function close() {
        hide();
        if (nav.spot !== "printer") return;
        if (from) nav.switchTo(from);
        else nav.standUp();
    }

    function printNow() {
        if (printer.printed) return show();
        printer.print().then(() => { if (nav.spot === "printer") show(); });
    }

    // impression réelle : le PDF dans un cadre invisible, sinon dans un nouvel onglet
    function printPdf() {
        const frame = document.createElement("iframe");
        frame.className = "cvview__frame";
        frame.src = CV.pdf;
        frame.addEventListener("load", () => {
            try {
                frame.contentWindow.focus();
                frame.contentWindow.print();
            } catch {
                window.open(CV.pdf, "_blank", "noopener");
            }
            setTimeout(() => frame.remove(), 60000);
        });
        document.body.appendChild(frame);
    }

    root.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "print") printPdf();
        else if (act === "close" || e.target === root) close();
    });
    // défiler dans l'aperçu (molette ou doigt) ne doit pas faire quitter l'imprimante
    for (const ev of ["wheel", "touchstart", "touchmove"]) {
        root.addEventListener(ev, (e) => e.stopPropagation(), { passive: true });
    }
    window.addEventListener("keydown", (e) => {
        if (isOpen && e.key === "Escape") { e.stopImmediatePropagation(); close(); }
    }, true);

    return {
        get isOpen() { return isOpen; },
        // lance l'impression depuis n'importe où
        open() {
            if (nav.spot === "printer") return nav.focusProgress >= 1 ? printNow() : (pending = true);
            from = nav.spot === "pc" || nav.spot === "phone" ? nav.spot : null;
            pending = true;
            if (from) nav.switchTo("printer");
            else if (nav.canSit("printer") && !nav.seated) nav.sit("printer");
            else goToSpot("printer", 2);
        },
        // appelé à chaque image : imprime à l'arrivée devant l'imprimante, ferme l'aperçu si l'on part
        update() {
            if (pending && nav.spot === "printer" && nav.focusProgress >= 1) {
                pending = false;
                printNow();
            }
            if (pending && nav.spot && nav.spot !== "printer" && nav.spot !== from) pending = false;
            if (isOpen && nav.spot !== "printer") hide();
        }
    };
}
