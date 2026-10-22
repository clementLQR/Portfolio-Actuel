import type { HTMLAttributes, ReactNode } from "react";
import "./ChamferCard.scss";

export type CardTone = "warm" | "cyan" | "violet" | "cyan-violet" | "neutral";

interface ChamferCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  tone?: CardTone;
  /** Ajoute l'élévation et le halo au survol */
  interactive?: boolean;
}

/**
 * Carte chanfreinée : fine bordure lumineuse en dégradé.
 * Le halo passe par un filtre sur l'enveloppe (un clip-path couperait une box-shadow).
 */
export function ChamferCard({ children, tone = "neutral", interactive = false, className, ...rest }: ChamferCardProps) {
  const classes = ["ccard", `ccard--${tone}`, interactive && "ccard--interactive", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes} {...rest}>
      <div className="ccard__frame">
        <div className="ccard__inner">{children}</div>
      </div>
    </div>
  );
}
