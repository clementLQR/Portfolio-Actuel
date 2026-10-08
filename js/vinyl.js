// Platine vinyle du salon : quatre disques lofi synthétisés (Web Audio) et leur panneau de choix.
// La musique se joue « dans le salon » : plus on s'en éloigne (chambre, bureau), plus elle est
// étouffée et lointaine (filtre passe-bas + volume, voir setDistance).

const mtof = (n) => 440 * 2 ** ((n - 69) / 12);

// Les couleurs reprennent celles des pochettes posées contre le meuble (props/music.js).
export const DISCS = [
    {
        id: "pluie", title: "Pluie sur le fleuve", artist: "Mirai Beats", color: "#c06a48",
        bpm: 68, swing: 0.2, keys: "rhodes", drums: "boombap", melody: 0.22,
        chords: [[50, 53, 57, 60, 64], [53, 59, 62, 64], [52, 55, 59, 62], [57, 60, 64, 67]],
        roots: [38, 43, 36, 45], scale: [74, 77, 79, 81, 84]
    },
    {
        id: "cafe", title: "Café de minuit", artist: "Mirai Beats", color: "#e0c8a0",
        bpm: 76, swing: 0.28, keys: "pluck", drums: "jazz", melody: 0.18,
        chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [55, 59, 62, 65]],
        roots: [41, 40, 38, 43], scale: [72, 74, 76, 79, 81]
    },
    {
        id: "neons", title: "Néons de Mirai", artist: "Mirai Beats", color: "#6a4a6a",
        bpm: 82, swing: 0.1, keys: "pad", drums: "soft", melody: 0.3,
        chords: [[57, 60, 64, 67], [53, 57, 60, 64], [52, 55, 60, 64], [50, 55, 59, 62]],
        roots: [45, 41, 36, 43], scale: [69, 72, 74, 76, 79]
    },
    {
        id: "brume", title: "Brume du matin", artist: "Mirai Beats", color: "#3a5a58",
        bpm: 60, swing: 0, keys: "pad", drums: "none", melody: 0.12,
        chords: [[48, 55, 59, 62], [45, 52, 60, 64], [41, 48, 57, 60], [43, 50, 55, 59]],
        roots: null, scale: [72, 74, 76, 79, 83]
    }
];

// Radio de l'ordinateur (appli « Radio lofi » de desktop.js) : même moteur, autres morceaux.
export const RADIO_TRACKS = [
    {
        id: "devoirs", title: "Devoirs du soir", artist: "Mirai FM", color: "#ff9a6a",
        bpm: 70, swing: 0.22, keys: "rhodes", drums: "boombap", melody: 0.2,
        chords: [[50, 53, 57, 60, 64], [53, 59, 64, 67], [52, 55, 59, 62], [57, 60, 64, 67]],
        roots: [38, 43, 36, 45], scale: [74, 76, 77, 79, 81]
    },
    {
        id: "ligne7", title: "Ligne 7 de nuit", artist: "Mirai FM", color: "#b48cff",
        bpm: 84, swing: 0.12, keys: "pluck", drums: "soft", melody: 0.25,
        chords: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]],
        roots: [41, 40, 38, 36], scale: [72, 74, 76, 77, 79]
    },
    {
        id: "radiateur", title: "Chat sur le radiateur", artist: "Mirai FM", color: "#ffd166",
        bpm: 64, swing: 0.3, keys: "rhodes", drums: "jazz", melody: 0.15,
        chords: [[51, 55, 58, 62], [51, 55, 58, 60], [51, 56, 60, 63], [50, 53, 56, 58]],
        roots: [39, 36, 41, 46], scale: [75, 77, 79, 82, 84]
    },
    {
        id: "the", title: "Pixels & thé vert", artist: "Mirai FM", color: "#7bd389",
        bpm: 78, swing: 0.18, keys: "pluck", drums: "boombap", melody: 0.3,
        chords: [[57, 60, 64, 67], [54, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]],
        roots: [45, 38, 43, 40], scale: [69, 71, 74, 76, 79]
    },
    {
        id: "toit", title: "Toit-terrasse, 2 h", artist: "Mirai FM", color: "#4fb3d1",
        bpm: 58, swing: 0, keys: "pad", drums: "none", melody: 0.14,
        chords: [[48, 55, 59, 62], [53, 57, 59, 64], [45, 52, 55, 59], [43, 50, 55, 60]],
        roots: null, scale: [72, 74, 76, 79, 81]
    },
    {
        id: "velo", title: "Retour à vélo", artist: "Mirai FM", color: "#ff6f91",
        bpm: 88, swing: 0.08, keys: "rhodes", drums: "soft", melody: 0.28,
        chords: [[50, 53, 57, 58], [52, 55, 57, 60], [50, 53, 55, 58], [48, 52, 55, 58]],
        roots: [46, 45, 43, 48], scale: [72, 74, 77, 79, 81]
    }
];

const CUTOFF_NEAR = 9000, CUTOFF_FAR = 420;   // voix « dans la pièce » / « de l'autre bout de l'appartement »

// tracks : liste de morceaux (par défaut les disques de la platine)
export function createVinylPlayer(tracks = DISCS) {
    let ctx = null, bus = null, room = null, master = null, noiseBuf = null;
    let track = null, current = -1, playing = false, dist = 0;
    const listeners = new Set();
    const emit = () => listeners.forEach((fn) => fn());

    function ensure() {
        if (ctx) return true;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC();
        master = ctx.createGain();
        master.connect(ctx.destination);
        room = ctx.createBiquadFilter();
        room.type = "lowpass";
        room.Q.value = 0.6;
        room.connect(master);
        const hp = ctx.createBiquadFilter();
        hp.type = "highpass";
        hp.frequency.value = 35;
        hp.connect(room);
        bus = ctx.createGain();
        bus.gain.value = 0.9;
        bus.connect(hp);

        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

        // craquements de vinyle, en continu
        const len = ctx.sampleRate * 2.5;
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() < 0.0007 ? (Math.random() - 0.5) * 0.7 : (Math.random() - 0.5) * 0.012;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;
        const cg = ctx.createGain();
        cg.gain.value = 0.55;
        src.connect(cg).connect(bus);
        src.start();
        applyDistance(true);
        return true;
    }

    // éloignement : 0 = dans le salon, 1 = autre pièce
    function applyDistance(immediate = false) {
        if (!ctx) return;
        const cutoff = CUTOFF_NEAR * (CUTOFF_FAR / CUTOFF_NEAR) ** dist;
        const gain = 1 - 0.55 * dist;
        const now = ctx.currentTime;
        if (immediate) {
            room.frequency.setValueAtTime(cutoff, now);
            master.gain.setValueAtTime(gain, now);
        } else {
            room.frequency.setTargetAtTime(cutoff, now, 0.12);
            master.gain.setTargetAtTime(gain, now, 0.12);
        }
    }

    // --- voix ---

    function osc(type, f, t0, dur, vol, dest, { a = 0.01, detune = 0, lp = 0, to = 0 } = {}) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f, t0);
        if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
        o.detune.value = detune;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(vol, t0 + a);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        if (lp) {
            const f2 = ctx.createBiquadFilter();
            f2.type = "lowpass";
            f2.frequency.value = lp;
            o.connect(f2).connect(g);
        } else o.connect(g);
        g.connect(dest);
        o.start(t0);
        o.stop(t0 + dur + 0.05);
    }

    function noise(t0, dur, vol, type, freq, dest) {
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
        s.buffer = noiseBuf;
        f.type = type;
        f.frequency.value = freq;
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f).connect(g).connect(dest);
        s.start(t0, Math.random() * 0.8);
        s.stop(t0 + dur + 0.05);
    }

    const kick = (t0, dest, v = 1) => osc("sine", 130, t0, 0.22, 0.5 * v, dest, { a: 0.003, to: 42 });
    const snare = (t0, dest, v = 1) => { noise(t0, 0.16, 0.16 * v, "bandpass", 1800, dest); osc("triangle", 190, t0, 0.09, 0.1 * v, dest, { a: 0.002 }); };
    const hat = (t0, dest, v = 1) => noise(t0, 0.045, 0.045 * v, "highpass", 7000, dest);

    function keys(kind, chord, t0, dur, v, dest) {
        chord.forEach((n, i) => {
            const f = mtof(n), dt = i * 0.012;   // petit arpégé, plus humain
            if (kind === "rhodes") {
                osc("sine", f, t0 + dt, dur, 0.05 * v, dest, { a: 0.008, detune: (i % 2 ? 5 : -5) });
                osc("triangle", f * 2, t0 + dt, dur * 0.45, 0.012 * v, dest, { a: 0.005 });
                osc("sine", f * 4, t0 + dt, 0.25, 0.006 * v, dest, { a: 0.002 });
            } else if (kind === "pluck") {
                osc("triangle", f, t0 + dt, Math.min(dur, 1.1), 0.055 * v, dest, { a: 0.004, lp: 2400 });
                osc("sine", f * 2, t0 + dt, 0.35, 0.012 * v, dest, { a: 0.003 });
            } else {
                osc("sawtooth", f, t0, dur, 0.017 * v, dest, { a: 0.5, lp: 900, detune: -9 });
                osc("sawtooth", f, t0, dur, 0.017 * v, dest, { a: 0.5, lp: 900, detune: 9 });
            }
        });
    }

    function playStep(tr, s, t0) {
        const d = tr.disc, dest = tr.gain;
        const beat = 60 / d.bpm, st = s % 16, bar = Math.floor(s / 16);
        const chord = d.chords[bar % d.chords.length];

        if (st === 0) keys(d.keys, chord, t0, beat * 4 * 0.98, 1, dest);
        else if (st === 6 && d.keys !== "pad") keys(d.keys, chord, t0, beat * 1.2, 0.55, dest);

        if (d.roots && (st === 0 || st === 7 || st === 10)) {
            osc("sine", mtof(d.roots[bar % d.roots.length]), t0, beat * (st === 0 ? 1.4 : 0.8), 0.2, dest, { a: 0.01 });
        }

        if (d.drums === "boombap") {
            if (st === 0 || st === 10) kick(t0, dest);
            if (st === 7 && bar % 2) kick(t0, dest, 0.7);
            if (st === 4 || st === 12) snare(t0, dest);
            if (st % 2 === 0) hat(t0, dest, st % 4 === 0 ? 1 : 0.6);
        } else if (d.drums === "jazz") {
            if (st === 0) kick(t0, dest, 0.7);
            if (st === 4 || st === 12) snare(t0, dest, 0.45);
            if ([0, 3, 6, 8, 11, 14].includes(st)) hat(t0, dest, 0.7);
        } else if (d.drums === "soft") {
            if (st === 0 || st === 8) kick(t0, dest, 0.8);
            if (st === 12) snare(t0, dest, 0.5);
            if (st % 4 === 2) hat(t0, dest, 0.8);
        }

        // mélodie clairsemée sur la gamme du disque
        if (st % 2 === 0 && Math.random() < d.melody) {
            const n = d.scale[Math.floor(Math.random() * d.scale.length)];
            osc("triangle", mtof(n), t0, beat * 1.1, 0.04, dest, { a: 0.01, lp: 2600 });
        }
    }

    function schedule(tr) {
        const d = tr.disc, step = 60 / d.bpm / 4;
        while (tr.next < ctx.currentTime + 0.3) {
            playStep(tr, tr.step, tr.next + (tr.step % 2 ? d.swing * step : 0));
            tr.next += step;
            tr.step++;
        }
    }

    function stopTrack(tr) {
        if (!tr) return;
        clearInterval(tr.timer);
        tr.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
        setTimeout(() => tr.gain.disconnect(), 1500);
    }

    function startTrack(i) {
        stopTrack(track);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
        g.connect(bus);
        track = { disc: tracks[i], gain: g, step: 0, next: ctx.currentTime + 0.15, timer: null };
        track.timer = setInterval(() => schedule(track), 40);
        schedule(track);
    }

    return {
        discs: tracks,
        get current() { return current; },
        get playing() { return playing; },
        subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
        // choisit un disque ; choisir celui qui joue déjà le met en pause
        select(i) {
            if (!ensure()) return;
            ctx.resume();
            if (playing && current === i) return this.pause();
            current = i;
            playing = true;
            startTrack(i);
            emit();
        },
        pause() {
            if (!playing) return;
            stopTrack(track);
            track = null;
            playing = false;
            emit();
        },
        setDistance(d) {
            const v = Math.min(1, Math.max(0, d));
            if (Math.abs(v - dist) < 0.002) return;
            dist = v;
            applyDistance();
        }
    };
}

// Légende affichée quand on est installé devant la platine : disque en cours et consigne.
// Le choix se fait directement sur les pochettes en 3D (voir main.js).
export function createVinylPad(player) {
    const touch = window.matchMedia("(pointer: coarse)").matches;
    const el = document.createElement("div");
    el.className = "vinylpad";
    el.setAttribute("aria-live", "polite");
    el.innerHTML = '<p class="vinylpad__now"></p><p class="vinylpad__sub"></p>';
    document.body.appendChild(el);

    const now = el.querySelector(".vinylpad__now");
    const sub = el.querySelector(".vinylpad__sub");
    const verb = touch ? "Touche" : "Clique";

    function sync() {
        const d = player.discs[player.current];
        now.textContent = player.playing ? `♪ ${d.title}` : "Platine à l'arrêt";
        sub.textContent = player.playing
            ? `${d.artist} · ${d.bpm} bpm — ${verb.toLowerCase()} la platine pour la pause`
            : `${verb} sur une pochette pour poser un disque`;
    }
    player.subscribe(sync);
    sync();

    return { setVisible(v) { el.classList.toggle("is-visible", v); } };
}
