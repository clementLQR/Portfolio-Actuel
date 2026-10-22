import { Blob } from "../components/ui/Blob";
import { OrganicWave } from "../components/ui/Decor";
import type { LegalPage } from "../data/legal";
import "./Legal.scss";

/** Page légale (mentions, confidentialité, accessibilité) : sections numérotées */
export default function Legal({ page }: { page: LegalPage }) {
  const [start, highlight] = page.title;
  return (
    <article className="legal container" aria-labelledby="legal-title">
      {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
      <div className="page-decor" aria-hidden="true">
        <Blob variant="glow-violet" size="34vw" style={{ right: "-14%", top: "-6%" }} />
        <OrganicWave corner="bottom-right" tone="cool" width="clamp(220px, 28vw, 440px)" />
      </div>

      <header className="page-head">
        <div className="page-head__text">
          <h1 id="legal-title">
            {start && `${start} `}
            <span className="text-gradient">{highlight}</span>
          </h1>
          <p className="lead">{page.intro}</p>
          <p className="legal__updated label">Dernière mise à jour : {page.updated}</p>
        </div>
        <div
          className="page-head__mascot"
          data-mascot-anchor="contact"
          data-mascot-mood="reflechie"
          data-mascot-gaze="down-left"
        />
      </header>

      <div className="legal__sections">
        {page.sections.map((section, i) => (
          <section key={section.title} className="legal__section" aria-labelledby={`legal-${i}`} data-reveal="">
            <h2 id={`legal-${i}`} className="legal__title">
              <span className="legal__slot label" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              {section.title}
            </h2>
            {section.paragraphs?.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {section.items && (
              <ul className="legal__list">
                {section.items.map((item) => (
                  <li key={item.text}>
                    {item.title && <strong>{`${item.title} : `}</strong>}
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </article>
  );
}
