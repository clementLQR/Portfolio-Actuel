import { Link, useLocation } from "react-router-dom";
import { LEGAL_PAGES } from "../../data/legal";
import { CV, EXTERNAL_LINK, NAV_ITEMS, SOCIAL_LINKS } from "../../data/navigation";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Sparkle } from "../ui/Sparkle";
import { Logo } from "./Logo";
import "./Footer.scss";

// Pages qui ont déjà leur propre appel au contact
const NO_CTA = ["/", "/contact"];

export function Footer() {
  const { pathname } = useLocation();
  const showCta = !NO_CTA.includes(pathname);
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Ligne d'orbite lumineuse en guise de séparation */}
      <div className="footer__orbit" aria-hidden="true">
        <span className="footer__node footer__node--accent" />
        <span className="footer__node footer__node--violet" />
        <span className="footer__node footer__node--warm" />
      </div>

      {showCta && (
        <section className="footer-cta container" aria-labelledby="footer-cta-title">
          <div className="footer-cta__panel">
            <Sparkle tone="highlight" size={18} style={{ right: "34%", top: "18%" }} />
            <Sparkle tone="detail" size={11} style={{ right: "30%", bottom: "22%" }} delay={0.7} />
            <div className="footer-cta__text">
              <p className="label">// Nouvelle quête</p>
              <h2 id="footer-cta-title" className="footer-cta__title">
                Une quête à me <span className="text-gradient">proposer</span> ?
              </h2>
              <p>Je cherche un stage en développement web de mars à juin 2027. Une proposition ou une simple question ? Je réponds sous 48 heures.</p>
            </div>
            <Button to="/contact">Me contacter</Button>
          </div>
        </section>
      )}

      <div className="footer__main container">
        <div className="footer__brand">
          <Link to="/" className="footer__logo" aria-label="Clément creative dev, retour à l'accueil">
            <Logo size={40} />
            <span aria-hidden="true">
              Clément
              <span className="footer__role">creative dev</span>
            </span>
          </Link>
          <p className="footer__pitch">
            Développeur front-end et creative developer. Des interfaces rigoureuses, avec un peu de magie dedans.
          </p>
          <ul className="footer__socials" aria-label="Réseaux">
            <li>
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="icon-btn" aria-label="Envoyer un e-mail">
                <Icon name="mail" size={20} />
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.linkedin} {...EXTERNAL_LINK} className="icon-btn" aria-label="LinkedIn (nouvel onglet)">
                <Icon name="linkedin" size={20} />
              </a>
            </li>
            <li>
              <a href={SOCIAL_LINKS.github} {...EXTERNAL_LINK} className="icon-btn" aria-label="GitHub (nouvel onglet)">
                <Icon name="github" size={20} />
              </a>
            </li>
          </ul>
        </div>

        <nav className="footer__col" aria-labelledby="footer-nav-title">
          <h2 id="footer-nav-title" className="footer__heading label">
            Navigation
          </h2>
          <ul className="footer__links">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <Link to={item.to}>{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="footer__col">
          <h2 className="footer__heading label">Contact</h2>
          <ul className="footer__links">
            <li>
              <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a>
            </li>
            <li>
              <Link to="/contact">Formulaire de contact</Link>
            </li>
            <li>
              <a href={CV.href} download={CV.fileName}>
                Télécharger mon CV (PDF)
              </a>
            </li>
            <li className="footer__note">Réponse sous 48 heures</li>
          </ul>
        </div>

        <nav className="footer__col" aria-labelledby="footer-legal-title">
          <h2 id="footer-legal-title" className="footer__heading label">
            Informations légales
          </h2>
          <ul className="footer__links">
            {LEGAL_PAGES.map((page) => (
              <li key={page.path}>
                <Link to={page.path}>{page.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* La mascotte vient se poser ici quand on arrive en bas de page. Prioritaire, sauf sur
            l'accueil où elle ne doit pas interrompre l'animation « Nouvelle quête » */}
        <div
          className="footer__mascot"
          data-mascot-anchor="footer"
          data-mascot-mood="heureuse"
          data-mascot-gaze="left"
          data-mascot-priority={pathname === "/" ? undefined : ""}
        />
      </div>

      <div className="footer__bottom container">
        <p>© {year} Clément. Tous droits réservés.</p>
        <p className="footer__made">Fait avec curiosité, React et Three.js.</p>
        <a href="#contenu" className="footer__top">
          Retour en haut
          <Icon name="arrow-up" size={16} />
        </a>
      </div>
    </footer>
  );
}
