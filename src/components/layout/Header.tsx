import { useEffect, useRef, useState, type MouseEvent } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { EXTERNAL_LINK, NAV_ITEMS, SOCIAL_LINKS } from "../../data/navigation";
import { Icon } from "../ui/Icon";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import "./Header.scss";

export function Header() {
  const { pathname } = useLocation();
  const menuRef = useRef<HTMLDialogElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Le menu se ferme dès qu'on change de page
  useEffect(() => {
    menuRef.current?.close();
  }, [pathname]);

  const openMenu = () => {
    menuRef.current?.showModal();
    setMenuOpen(true);
  };

  // Clic sur le fond : fermeture
  const onDialogClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) event.currentTarget.close();
  };

  return (
    <header className={`header${scrolled ? " header--scrolled" : ""}`}>
      <Link to="/" className="header__brand" aria-label="Clément creative dev, retour à l'accueil">
        <Logo size={42} />
        <span className="header__name" aria-hidden="true">
          Clément
          <span className="header__role">creative dev</span>
        </span>
      </Link>

      <div className="header__actions">
        <ThemeToggle />
        <button
          type="button"
          className="icon-btn"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="menu-principal"
          onClick={openMenu}
        >
          <Icon name="menu" size={20} />
          <span className="visually-hidden">Ouvrir le menu</span>
        </button>
      </div>

      <dialog
        id="menu-principal"
        ref={menuRef}
        className="menu"
        aria-label="Menu principal"
        onClose={() => setMenuOpen(false)}
        onClick={onDialogClick}
      >
        <div className="menu__panel">
          <div className="menu__top">
            <p className="label">// Menu principal</p>
            <button type="button" className="icon-btn" onClick={() => menuRef.current?.close()}>
              <Icon name="close" size={20} />
              <span className="visually-hidden">Fermer le menu</span>
            </button>
          </div>
          <nav aria-label="Menu principal">
            <ol className="menu__list">
              {NAV_ITEMS.map((item, index) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="menu__link">
                    <span className="menu__index">{String(index + 1).padStart(2, "0")}</span>
                    <Icon name={item.icon} size={22} />
                    <span>{item.label}</span>
                    <Icon name="arrow-right" size={20} className="menu__arrow" />
                  </NavLink>
                </li>
              ))}
            </ol>
          </nav>
          <div className="menu__socials">
            <a href={`mailto:${SOCIAL_LINKS.email}`} className="icon-btn" aria-label="Envoyer un e-mail">
              <Icon name="mail" size={20} />
            </a>
            <a href={SOCIAL_LINKS.linkedin} {...EXTERNAL_LINK} className="icon-btn" aria-label="LinkedIn (nouvel onglet)">
              <Icon name="linkedin" size={20} />
            </a>
            <a href={SOCIAL_LINKS.github} {...EXTERNAL_LINK} className="icon-btn" aria-label="GitHub (nouvel onglet)">
              <Icon name="github" size={20} />
            </a>
          </div>
        </div>
      </dialog>
    </header>
  );
}
