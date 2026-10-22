import type { ReactNode } from "react";
import "./Tag.scss";

export type TagTone = "default" | "accent" | "warm" | "violet" | "danger";

interface TagProps {
  children: ReactNode;
  tone?: TagTone;
  /** Avec onClick, le tag devient un bouton de filtre */
  onClick?: () => void;
  active?: boolean;
}

export function Tag({ children, tone = "default", onClick, active = false }: TagProps) {
  const classes = ["tag", `tag--${tone}`, active && "tag--active"].filter(Boolean).join(" ");
  if (onClick) {
    return (
      <button type="button" className={classes} aria-pressed={active} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <span className={classes}>{children}</span>;
}
