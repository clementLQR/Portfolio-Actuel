import type { IconName } from "../components/ui/Icon";

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  /** Correspondance exacte (pour l'accueil) */
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Accueil", icon: "home", end: true },
  { to: "/projets", label: "Projets", icon: "folder" },
  { to: "/a-propos", label: "À propos", icon: "user" },
  { to: "/competences", label: "Compétences", icon: "bolt" },
  { to: "/contact", label: "Contact", icon: "mail" },
];

export const SOCIAL_LINKS = {
  email: "clement.lequeurre@gmail.com",
  linkedin: "https://www.linkedin.com/in/cl%C3%A9ment-lequeurre",
  github: "https://github.com/clementLQR",
};

/** CV en PDF (public/), téléchargé sous ce nom */
export const CV = { href: "/CV-Clement-Lequeurre.pdf", fileName: "CV-Clement-Lequeurre.pdf" };

/** Attributs des liens vers un site externe : nouvel onglet, sans accès à la page d'origine */
export const EXTERNAL_LINK = { target: "_blank", rel: "noopener noreferrer" } as const;
