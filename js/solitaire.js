// Solitaire (Klondike, pioche d'une carte) pour l'ordinateur du bureau (js/desktop.js).
// On déplace les cartes en les glissant (une colonne entière se prend par sa première carte) ou en
// deux clics (sélection, puis destination) ; double-clic : envoi automatique sur une fondation. La
// défausse montre les trois dernières cartes en éventail (seule celle du dessus se joue). Annuler,
// nouvelle partie, compteur de coups. Le rendu est en HTML absolu : le bureau est mis à l'échelle de
// l'écran 3D, les déplacements du pointeur sont donc ramenés à l'échelle de conception.

const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = [null, "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CW = 58, CH = 80;                       // carte
const GAP = 76, X0 = 48;                      // écart entre colonnes, marge gauche
const TOP = 8, TAB_Y = 100, FIELD_H = 410;    // rangée du haut, début des colonnes, hauteur du tapis
const OFF_DOWN = 10, OFF_UP = 22;             // décalage des cartes cachées / visibles dans une colonne

const isRed = (c) => c.s === 1 || c.s === 2;
const clone = (o) => JSON.parse(JSON.stringify(o));
const col = (c) => X0 + c * GAP;

function cardHtml(c, x, y, pile, i, picked, under = false) {
    return c.up
        ? `<div class="sol-card${isRed(c) ? " is-red" : ""}${picked ? " is-sel" : ""}${under ? " is-under" : ""}" data-pile="${pile}" data-i="${i}" style="left:${x}px;top:${y}px">
               <span class="sol-corner">${RANKS[c.r]}${SUITS[c.s]}</span><span class="sol-big">${SUITS[c.s]}</span></div>`
        : `<div class="sol-card is-down" data-pile="${pile}" data-i="${i}" style="left:${x}px;top:${y}px"></div>`;
}

export function createSolitaire(body) {
    body.innerHTML = `
        <div class="app-sol">
            <div class="app-sol__bar">
                <button type="button" data-act="new">Nouvelle partie</button>
                <button type="button" data-act="undo">↶ Annuler</button>
                <span class="app-sol__moves"></span>
            </div>
            <div class="app-sol__field"></div>
        </div>`;
    const root = body.querySelector(".app-sol");
    const field = root.querySelector(".app-sol__field");
    const undoBtn = root.querySelector('[data-act="undo"]');
    const movesEl = root.querySelector(".app-sol__moves");

    let st, sel = null, history = [];
    let pending = null, drag = null, layerEl = null, suppressClick = false;   // glisser-déposer

    // pile désignée par son identifiant : stock, waste, f0..f3, t0..t6
    const pileOf = (id) => {
        if (id === "stock") return st.stock;
        if (id === "waste") return st.waste;
        return id[0] === "f" ? st.found[+id[1]] : st.tab[+id[1]];
    };

    function deal() {
        const deck = [];
        for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ s, r, up: false });
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        st = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []], moves: 0, won: false };
        for (let i = 0; i < 7; i++) for (let j = 0; j <= i; j++) {
            const c = deck.pop();
            c.up = j === i;
            st.tab[i].push(c);
        }
        st.stock = deck;
        stopAuto();
        sel = null;
        history = [];
        render();
    }

    const snapshot = () => { history.push(clone(st)); if (history.length > 200) history.shift(); };

    // --- règles ---

    const canOnTab = (c, dest) => {
        const top = dest[dest.length - 1];
        return top ? top.up && isRed(top) !== isRed(c) && top.r === c.r + 1 : c.r === 13;
    };
    const canOnFound = (c, f) => {
        const top = f[f.length - 1];
        return top ? top.s === c.s && top.r === c.r - 1 : c.r === 1;
    };

    // déplace la sélection (sel) vers la pile dest ; renvoie true si le coup est valide
    function tryMove(from, destId) {
        if (from.pile === destId) return false;
        const src = pileOf(from.pile), dest = pileOf(destId);
        const cards = from.pile[0] === "t" ? src.slice(from.idx) : [src[src.length - 1]];
        if (!cards.length || !cards[0]) return false;
        if (destId[0] === "t" ? !canOnTab(cards[0], dest) : cards.length !== 1 || !canOnFound(cards[0], dest)) return false;
        snapshot();
        src.splice(src.length - cards.length, cards.length);
        dest.push(...cards);
        const left = src[src.length - 1];
        if (from.pile[0] === "t" && left && !left.up) left.up = true;
        st.moves++;
        sel = null;
        if (st.found.reduce((n, f) => n + f.length, 0) === 52) st.won = true;
        render();
        maybeAutoFinish();
        return true;
    }

    // --- finition automatique ---
    // pioche et défausse vides, toutes les cartes des colonnes retournées : la partie est gagnée,
    // les cartes s'envolent une à une vers les fondations (la plus petite d'abord)
    let auto = false, autoTimer = null;
    const stopAuto = () => { clearTimeout(autoTimer); auto = false; root.classList.remove("is-auto"); };

    function maybeAutoFinish() {
        if (auto || st.won || st.stock.length || st.waste.length) return;
        if (!st.tab.some((p) => p.length) || st.tab.some((p) => p.some((c) => !c.up))) return;
        auto = true;
        sel = null;
        root.classList.add("is-auto");
        autoTimer = setTimeout(autoStep, 350);
    }

    function autoStep() {
        if (!root.isConnected) return stopAuto();
        let best = -1, dest = -1;
        st.tab.forEach((p, c) => {
            const top = p[p.length - 1];
            if (!top || (best >= 0 && st.tab[best].at(-1).r <= top.r)) return;
            const k = st.found.findIndex((f) => canOnFound(top, f));
            if (k >= 0) { best = c; dest = k; }
        });
        if (best < 0) {   // plus rien à poser (ne devrait pas arriver) : on rend la main
            stopAuto();
            if (st.found.reduce((n, f) => n + f.length, 0) === 52) { st.won = true; render(); }
            return;
        }
        const src = st.tab[best], i = src.length - 1, c = src[i];
        const el = field.querySelector(`.sol-card[data-pile="t${best}"][data-i="${i}"]`);
        const x0 = parseFloat(el?.style.left ?? col(best)), y0 = parseFloat(el?.style.top ?? TAB_Y);
        src.pop();
        st.moves++;
        render();
        const fly = document.createElement("div");
        fly.innerHTML = cardHtml(c, x0, y0, "", 0, false);
        const card = fly.firstElementChild;
        card.classList.add("sol-fly");
        field.appendChild(card);
        card.getBoundingClientRect();   // force la position de départ avant la transition
        card.style.left = col(3 + dest) + "px";
        card.style.top = TOP + "px";
        autoTimer = setTimeout(() => {
            st.found[dest].push(c);
            const done = st.found.reduce((n, f) => n + f.length, 0) === 52;
            if (done) { st.won = true; stopAuto(); }
            render();
            if (!done) autoTimer = setTimeout(autoStep, 30);
        }, 170);
    }

    function draw() {
        snapshot();
        if (st.stock.length) {
            const c = st.stock.pop();
            c.up = true;
            st.waste.push(c);
        } else if (st.waste.length) {
            st.stock = st.waste.reverse();
            st.stock.forEach((c) => { c.up = false; });
            st.waste = [];
        } else { history.pop(); return; }
        st.moves++;
        sel = null;
        render();
    }

    function select(pile, idx) {
        const p = pileOf(pile);
        if (pile === "waste" || pile[0] === "f") sel = p.length ? { pile, idx: p.length - 1 } : null;
        else sel = idx != null && p[idx]?.up ? { pile, idx } : null;
        render();
    }

    function onPile(pile, idx) {
        if (pile === "stock") return draw();
        if (!sel) return select(pile, idx);
        const same = sel.pile === pile && (pile === "waste" || pile[0] === "f" || sel.idx === idx);
        if (same) { sel = null; return render(); }
        if ((pile[0] === "t" || pile[0] === "f") && tryMove(sel, pile)) return;
        select(pile, idx);   // coup invalide : on change de sélection
    }

    // double-clic : la carte du dessus part sur la première fondation qui l'accepte
    function autoFound(pile) {
        const p = pileOf(pile);
        if (!p.length) return;
        for (let k = 0; k < 4; k++) if (tryMove({ pile, idx: p.length - 1 }, "f" + k)) return;
    }

    // --- rendu ---

    function render() {
        const slot = (id, x, y, label = "") =>
            `<div class="sol-slot" data-pile="${id}" style="left:${x}px;top:${y}px">${label}</div>`;
        const card = cardHtml;
        const picked = (pile, i) => sel && sel.pile === pile && (pile[0] === "t" ? i >= sel.idx : true);

        let html = slot("stock", col(0), TOP, st.stock.length ? "" : "↺") + slot("waste", col(1), TOP);
        SUITS.forEach((s, k) => { html += slot("f" + k, col(3 + k), TOP, s); });
        for (let c = 0; c < 7; c++) html += slot("t" + c, col(c), TAB_Y);

        if (st.stock.length) html += card({ up: false }, col(0), TOP, "stock", 0, false);
        // défausse : les deux cartes précédentes dépassent sous la carte du dessus, seule celle-ci se joue
        const wn = st.waste.length, w0 = Math.max(0, wn - 3);
        for (let k = w0; k < wn; k++) html += card(st.waste[k], col(1) + (k - w0) * 14, TOP, "waste", k, k === wn - 1 && picked("waste"), k < wn - 1);
        st.found.forEach((f, k) => {
            if (f.length) html += card(f[f.length - 1], col(3 + k), TOP, "f" + k, f.length - 1, picked("f" + k));
        });
        // colonnes : les cartes se resserrent si la pile devient trop haute pour le tapis
        const room = FIELD_H - TAB_Y - CH - 6;
        st.tab.forEach((pile, c) => {
            const down = pile.filter((x) => !x.up).length, up = pile.length - down;
            const need = down * OFF_DOWN + Math.max(up - 1, 0) * OFF_UP;
            const k = need > room ? room / need : 1;
            let y = TAB_Y;
            pile.forEach((x, i) => {
                html += card(x, col(c), y, "t" + c, i, picked("t" + c, i));
                y += (x.up ? OFF_UP : OFF_DOWN) * k;
            });
        });
        if (st.won) {
            html += `<div class="app-sol__win"><div><h2>Bravo !</h2><p>Partie gagnée en ${st.moves} coups.</p>
                <button type="button" data-act="new">Rejouer</button></div></div>`;
        }
        field.innerHTML = html;
        movesEl.textContent = `Coups : ${st.moves}`;
        undoBtn.disabled = !history.length || auto;
    }

    // --- interactions ---

    root.addEventListener("click", (e) => {
        if (suppressClick) return;
        const act = e.target.closest("[data-act]")?.dataset.act;
        if (act === "new") return deal();
        if (auto) return;   // finition automatique en cours
        if (act === "undo") {
            if (history.length) { st = history.pop(); sel = null; render(); }
            return;
        }
        const el = e.target.closest("[data-pile]");
        if (!el) { sel = null; return render(); }
        onPile(el.dataset.pile, el.dataset.i === undefined ? null : +el.dataset.i);
    });

    root.addEventListener("dblclick", (e) => {
        if (auto) return;
        const el = e.target.closest(".sol-card[data-pile]");
        if (!el || el.classList.contains("is-down")) return;
        const pile = el.dataset.pile;
        if (pile === "stock" || pile[0] === "f") return;
        if (pile === "waste" || +el.dataset.i === pileOf(pile).length - 1) autoFound(pile);
    });

    // --- glisser-déposer ---

    // position du pointeur dans le tapis, en pixels de conception (le bureau est mis à l'échelle)
    const fieldPoint = (e) => {
        const r = field.getBoundingClientRect();
        const k = r.width / field.offsetWidth || 1;
        return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k };
    };

    field.addEventListener("pointerdown", (e) => {
        if (e.button !== 0 || auto) return;
        const el = e.target.closest(".sol-card");
        if (!el || el.classList.contains("is-down") || el.classList.contains("is-under") || el.dataset.pile === "stock") return;
        const p = fieldPoint(e);
        pending = {
            pile: el.dataset.pile, idx: +el.dataset.i, sx: e.clientX, sy: e.clientY,
            gx: p.x - parseFloat(el.style.left), gy: p.y - parseFloat(el.style.top)
        };
        try { el.setPointerCapture(e.pointerId); } catch { /* pas de capture : les écouteurs de la fenêtre suffisent */ }
    });

    function startDrag() {
        const p = pileOf(pending.pile);
        const cards = pending.pile[0] === "t" ? p.slice(pending.idx) : [p[p.length - 1]];
        if (!cards.length || !cards[0].up) { pending = null; return; }
        drag = { pile: pending.pile, idx: pending.idx, gx: pending.gx, gy: pending.gy };
        pending = null;
        sel = null;
        // les cartes d'origine se cachent (on ne refait pas le rendu : le pointeur reste capturé)
        field.querySelectorAll(`.sol-card:not(.is-under)[data-pile="${drag.pile}"]`).forEach((el) => {
            if (drag.pile[0] !== "t" || +el.dataset.i >= drag.idx) el.style.visibility = "hidden";
        });
        field.querySelectorAll(".is-sel").forEach((el) => el.classList.remove("is-sel"));
        layerEl = document.createElement("div");
        layerEl.className = "sol-drag";
        layerEl.innerHTML = cards.map((c, k) => cardHtml(c, 0, k * OFF_UP, "", 0, false)).join("");
        field.appendChild(layerEl);
    }

    function moveDrag(e) {
        const p = fieldPoint(e);
        layerEl.style.left = p.x - drag.gx + "px";
        layerEl.style.top = p.y - drag.gy + "px";
    }

    // la destination se déduit du centre de la première carte lâchée : colonne la plus proche, fondations en haut
    function dropTarget(e) {
        const p = fieldPoint(e);
        const cx = p.x - drag.gx + CW / 2, cy = p.y - drag.gy + CH / 2;
        const c = Math.round((cx - X0 - CW / 2) / GAP);
        if (Math.abs(cx - (col(c) + CW / 2)) > GAP * 0.6) return null;
        if (cy < TAB_Y - 10) return c >= 3 && c <= 6 ? "f" + (c - 3) : null;
        return c >= 0 && c <= 6 ? "t" + c : null;
    }

    function endDrag(e) {
        pending = null;
        if (!drag) return;
        const dest = dropTarget(e), from = { pile: drag.pile, idx: drag.idx };
        layerEl.remove();
        layerEl = null;
        drag = null;
        suppressClick = true;                      // le « click » qui suit le relâchement ne doit rien sélectionner
        setTimeout(() => { suppressClick = false; }, 0);
        if (!dest || !tryMove(from, dest)) render();   // lâché hors cible : la carte revient
    }

    // écouteurs sur la fenêtre (le pointeur peut sortir du tapis) ; retirés quand la fenêtre est fermée
    function onMove(e) {
        if (!root.isConnected) return unbind();
        if (!drag && pending && Math.hypot(e.clientX - pending.sx, e.clientY - pending.sy) > 5) startDrag();
        if (drag) moveDrag(e);
    }
    function onUp(e) {
        if (!root.isConnected) return unbind();
        endDrag(e);
    }
    function unbind() {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    deal();
}
