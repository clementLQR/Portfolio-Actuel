import "./SpeechBubble.scss";

interface SpeechBubbleProps {
  text: string;
}

/** Bulle de dialogue chanfreinée, au-dessus de la mascotte */
export function SpeechBubble({ text }: SpeechBubbleProps) {
  return (
    <div className="speech">
      <div className="speech__frame">
        <p className="speech__text">{text}</p>
      </div>
      <span className="speech__tail" aria-hidden="true" />
    </div>
  );
}
