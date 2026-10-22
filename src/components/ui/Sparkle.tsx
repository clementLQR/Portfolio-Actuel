import type { CSSProperties } from "react";
import "./Sparkle.scss";

export type SparkleTone = "highlight" | "detail" | "accent" | "warm" | "violet";

interface SparkleProps {
  tone?: SparkleTone;
  size?: number;
  /** Position absolue dans le parent (top / left / right / bottom) */
  style?: CSSProperties;
  delay?: number;
  className?: string;
}

/** Étincelle rétro à 4 branches qui scintille */
export function Sparkle({ tone = "highlight", size = 18, style, delay = 0, className }: SparkleProps) {
  return (
    <svg
      className={["sparkle", `sparkle--${tone}`, className].filter(Boolean).join(" ")}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      <path d="M12 0c.8 6.6 3.4 9.2 12 12-8.6 2.8-11.2 5.4-12 12-.8-6.6-3.4-9.2-12-12C8.6 9.2 11.2 6.6 12 0z" />
    </svg>
  );
}

interface FloaterProps {
  shape?: "square" | "diamond";
  tone?: SparkleTone;
  size?: number;
  style?: CSSProperties;
  delay?: number;
}

/** Petits carrés et losanges flottants */
export function Floater({ shape = "square", tone = "warm", size = 10, style, delay = 0 }: FloaterProps) {
  return (
    <span
      className={`floater floater--${shape} sparkle--${tone}`}
      aria-hidden="true"
      style={{ ...style, width: size, height: size, animationDelay: `${delay}s` }}
    />
  );
}
