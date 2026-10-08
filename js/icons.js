// Icônes des applications du PC et du téléphone : un pictogramme au trait (SVG 24×24) sur une tuile
// de couleur unie, une couleur par appli. ink : couleur du trait (sombre par défaut) ; mark : couleur du
// pictogramme seul, en petit (barre de titre, dock), si la couleur de la tuile y est trop sombre.

const INK = "#1c1020";

export const APP_ICONS = {
    about: {
        color: "#ff9a6a",
        svg: `<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7"/>`
    },
    projects: {
        color: "#b48cff",
        svg: `<path d="M3 7.5C3 6.7 3.7 6 4.5 6H9l2 2h8.5c.8 0 1.5.7 1.5 1.5v8c0 .8-.7 1.5-1.5 1.5h-15c-.8 0-1.5-.7-1.5-1.5z"/>`
    },
    contact: {
        color: "#4fb3d1",
        svg: `<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.8 6.8 12 13l8.2-6.2"/>`
    },
    cv: {
        color: "#ffd166",
        svg: `<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15.5h6M9 8.5h2.5"/>`
    },
    gallery: {
        color: "#ff6f91",
        svg: `<rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="8.5" cy="10" r="1.8"/><path d="m3.5 17 5-5 4 4 2.5-2.5 5.5 5"/>`
    },
    notes: {
        color: "#f2e3c6",
        svg: `<path d="m4 20 1-4L16 5l3 3L8 19z"/><path d="m14 7 3 3"/>`
    },
    radio: {
        color: "#7bd389",
        svg: `<path d="M9 18V5.5l10-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>`
    },
    terminal: {
        color: "#2a2036",
        ink: "#9ef0b0",
        mark: "#9ef0b0",
        svg: `<path d="m5 8 4 4-4 4M12 17h7"/>`
    },
    solitaire: {
        color: "#e0574b",
        svg: `<path d="M12 3.5c-2.8 3.3-7 5.7-7 9a3.3 3.3 0 0 0 5.8 2.2L10 20.5h4l-.8-5.8a3.3 3.3 0 0 0 5.8-2.2c0-3.3-4.2-5.7-7-9z" fill="currentColor"/>`
    }
};

// pictogramme seul (trait de la couleur du texte : à colorer en CSS)
export function appGlyph(id) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${APP_ICONS[id].svg}</svg>`;
}

// variables CSS : --c (fond de la tuile), --ink (trait sur la tuile), --mark (pictogramme seul)
export function appIconStyle(id) {
    const i = APP_ICONS[id];
    return `--c:${i.color};--ink:${i.ink ?? INK};--mark:${i.mark ?? i.color}`;
}
