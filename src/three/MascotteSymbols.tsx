import type { ReactNode } from "react";
import { SpeechBubble } from "../components/ui/SpeechBubble";
import { Sparkle } from "../components/ui/Sparkle";
import { useMascotteStore } from "./useMascotteStore";
import "./MascotteSymbols.scss";

/** Symboles HTML au-dessus de la tête, selon l'humeur (rendus dans un <Html> de drei) */
export function MascotteSymbols() {
  const mood = useMascotteStore((s) => s.mood);
  const sleeping = useMascotteStore((s) => s.sleeping);
  const dizzy = useMascotteStore((s) => s.dizzy);
  const speech = useMascotteStore((s) => s.speech);
  const pulling = useMascotteStore((s) => s.pulling);

  let symbol: ReactNode = null;
  if (pulling) {
    symbol = (
      <span className="msym msym--effort">
        <svg viewBox="0 0 12 16" width="12" height="16" aria-hidden="true">
          <path d="M6 0C4 4 1 7 1 10.5a5 5 0 0 0 10 0C11 7 8 4 6 0z" />
        </svg>
        <svg viewBox="0 0 12 16" width="9" height="12" aria-hidden="true">
          <path d="M6 0C4 4 1 7 1 10.5a5 5 0 0 0 10 0C11 7 8 4 6 0z" />
        </svg>
      </span>
    );
  } else if (dizzy) {
    symbol = (
      <span className="msym msym--dizzy">
        <Sparkle tone="highlight" size={14} style={{ left: 0, top: 6 }} />
        <Sparkle tone="detail" size={12} style={{ left: 22, top: 0 }} />
        <Sparkle tone="accent" size={13} style={{ left: 42, top: 8 }} />
      </span>
    );
  } else if (sleeping) {
    symbol = (
      <span className="msym msym--sleep">
        <span>Z</span>
        <span>z</span>
        <span>z</span>
      </span>
    );
  } else if (mood === "surprise") {
    symbol = <span className="msym msym--mark msym--alert">!</span>;
  } else if (mood === "reflechie") {
    symbol = <span className="msym msym--mark msym--think">?</span>;
  } else if (mood === "heureuse") {
    symbol = (
      <span className="msym msym--happy">
        <Sparkle tone="highlight" size={18} style={{ left: 0, top: 10 }} />
        <svg className="msym__heart" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 5.3 3 1.7-1.9 3.2-3 5.3-3 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z" />
        </svg>
        <Sparkle tone="detail" size={13} style={{ left: 50, top: 0 }} delay={0.4} />
      </span>
    );
  }

  return (
    <div className="msym-anchor">
      {speech && (
        <div className="msym-speech" key={speech.id}>
          <SpeechBubble text={speech.text} />
        </div>
      )}
      {symbol && (
        <div className="msym-slot" key={`${mood}-${sleeping}-${dizzy}-${pulling}`}>
          {symbol}
        </div>
      )}
    </div>
  );
}
