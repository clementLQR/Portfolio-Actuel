import "./ScrollIndicator.scss";

interface ScrollIndicatorProps {
  /** id de la section suivante */
  targetId: string;
}

/** Petite souris animée « SCROLL » qui mène à la section suivante */
export function ScrollIndicator({ targetId }: ScrollIndicatorProps) {
  return (
    <a href={`#${targetId}`} className="scroll-indicator">
      <span className="scroll-indicator__mouse" aria-hidden="true">
        <span className="scroll-indicator__wheel" />
      </span>
      <span className="label">Scroll</span>
      <span className="visually-hidden">vers la section suivante</span>
    </a>
  );
}
