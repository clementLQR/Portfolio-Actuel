// Éléments communs aux jeux des bornes d'arcade : touches, bruitages, meilleur score.

// Meilleur score gardé dans le navigateur (silencieux si le stockage est indisponible)
export function hiScore(key, fallback = 1000) {
    return {
        load() { try { return Number(localStorage.getItem(key)) || fallback; } catch { return fallback; } },
        save(v) { try { localStorage.setItem(key, String(v)); } catch { /* stockage indisponible */ } }
    };
}

export const KEYS = {
    ArrowLeft: "left", KeyA: "left", KeyQ: "left",
    ArrowRight: "right", KeyD: "right",
    Space: "fire", ArrowUp: "fire", KeyW: "fire", KeyZ: "fire"
};

// Bruitages synthétisés (Web Audio) ; le contexte n'est créé qu'après un geste du joueur.
export function createSfx() {
    let ctx = null, out = null, noiseBuf = null;
    const tone = (type, f0, f1, dur, vol, at = 0) => {
        const t0 = ctx.currentTime + at;
        const o = ctx.createOscillator(), v = ctx.createGain();
        o.type = type;
        o.frequency.setValueAtTime(f0, t0);
        o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t0 + dur);
        v.gain.setValueAtTime(vol, t0);
        v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(v).connect(out);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
    };
    const noise = (dur, vol, cutoff) => {
        const t0 = ctx.currentTime;
        const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
        s.buffer = noiseBuf;
        f.type = "lowpass";
        f.frequency.setValueAtTime(cutoff, t0);
        f.frequency.exponentialRampToValueAtTime(80, t0 + dur);
        v.gain.setValueAtTime(vol, t0);
        v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        s.connect(f).connect(v).connect(out);
        s.start(t0);
        s.stop(t0 + dur + 0.02);
    };
    const arp = (type, notes, step, vol) => notes.forEach((n, i) => tone(type, n, n, step * 1.4, vol, i * step));

    const SOUNDS = {
        bounce: () => tone("square", 440, 330, 0.05, 0.04),
        shoot: () => tone("square", 880, 220, 0.12, 0.05),
        hit: () => { tone("square", 300, 60, 0.14, 0.07); noise(0.12, 0.08, 3000); },
        hurt: () => { tone("sawtooth", 180, 30, 0.5, 0.12); noise(0.5, 0.15, 1800); },
        start: () => arp("square", [262, 330, 392, 523], 0.07, 0.06),
        wave: () => arp("triangle", [392, 494, 587, 784], 0.08, 0.1),
        over: () => arp("sawtooth", [392, 330, 262, 196], 0.18, 0.07),
        boss: () => { tone("sawtooth", 140, 140, 0.2, 0.09); tone("sawtooth", 100, 100, 0.2, 0.09, 0.25); tone("sawtooth", 140, 140, 0.2, 0.09, 0.5); },
        bossdie: () => { noise(0.9, 0.2, 2500); arp("square", [784, 659, 523, 392, 523, 659, 784, 1047], 0.09, 0.07); }
    };

    return {
        // à appeler dans un geste utilisateur (touche, toucher)
        unlock() {
            if (ctx) { ctx.resume(); return; }
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return;
            ctx = new AC();
            out = ctx.createGain();
            out.gain.value = 0.7;
            out.connect(ctx.destination);
            noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 0.6, ctx.sampleRate);
            const d = noiseBuf.getChannelData(0);
            for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        },
        play(name) { if (ctx && ctx.state === "running") SOUNDS[name]?.(); }
    };
}
