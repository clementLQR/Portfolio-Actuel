import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { EXTERNAL_LINK } from "../../data/navigation";
import { Icon, type IconName } from "./Icon";
import "./Button.scss";

type Variant = "primary" | "secondary" | "warm";

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  /** Icône de fin ; la flèche « → » par défaut, `null` pour aucune */
  icon?: IconName | null;
  className?: string;
}

type ButtonProps = CommonProps &
  (
    | ({ to: string; href?: never } & { onClick?: () => void })
    | ({ href: string; to?: never } & { onClick?: () => void; download?: string })
    | ({ to?: never; href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">)
  );

function Inner({ children, icon }: Pick<CommonProps, "children" | "icon">) {
  return (
    <>
      <span className="btn__frame" aria-hidden="true" />
      <span className="btn__label">
        {children}
        {icon && <Icon name={icon} size={18} className="btn__icon" />}
      </span>
    </>
  );
}

/** Bouton « jeu vidéo » : double bordure chanfreinée, flèche, halo et enfoncement */
export function Button(props: ButtonProps) {
  const { children, variant = "primary", icon = "arrow-right", className } = props;
  const classes = ["btn", `btn--${variant}`, className].filter(Boolean).join(" ");

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes} onClick={props.onClick}>
        <Inner icon={icon}>{children}</Inner>
      </Link>
    );
  }

  if (props.href !== undefined) {
    const external = /^https?:\/\//.test(props.href);
    return (
      // Un autre site s'ouvre dans un nouvel onglet, annoncé aux lecteurs d'écran
      <a
        href={props.href}
        className={classes}
        onClick={props.onClick}
        download={props.download}
        {...(external ? EXTERNAL_LINK : {})}
      >
        <Inner icon={icon}>
          {children}
          {external && <span className="visually-hidden"> (nouvel onglet)</span>}
        </Inner>
      </a>
    );
  }

  const { variant: _v, icon: _i, className: _c, children: _ch, to: _t, href: _h, type = "button", ...rest } = props;
  return (
    <button type={type} className={classes} {...rest}>
      <Inner icon={icon}>{children}</Inner>
    </button>
  );
}
