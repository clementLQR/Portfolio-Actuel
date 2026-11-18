import type { FocusEvent, PointerEvent } from "react";
import { Link } from "react-router-dom";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { Icon } from "../components/ui/Icon";
import { Floater } from "../components/ui/Sparkle";
import { SKILL_CATEGORIES, projectsForSkill, skillSlug } from "../data/skills";
import "./Skills.scss";

/**
 * Info-bulle au-dessus de la tuile, ou en dessous quand elle passerait sous le header
 * (tuiles du haut de l'écran une fois la page descendue).
 */
function placeTip(event: PointerEvent<HTMLElement> | FocusEvent<HTMLElement>) {
  const tile = event.currentTarget;
  const tip = tile.querySelector<HTMLElement>(".skill__tip");
  if (!tip) return;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 0;
  const spaceAbove = tile.getBoundingClientRect().top - header;
  tile.dataset.tip = spaceAbove < tip.offsetHeight + 24 ? "below" : "above";
}

export default function Skills() {
  return (
    <div className="skills container">
      {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
      <div className="page-decor" aria-hidden="true">
        <OrganicWave corner="bottom-right" tone="cool" width="clamp(240px, 32vw, 520px)" />
        <Blob variant="glow-violet" size="40vw" style={{ right: "-16%", top: "-4%" }} />
        <Blob variant="planet-violet" size="clamp(140px, 14vw, 220px)" style={{ left: "-7%", top: "50%" }} />
      </div>
      <PixelSparkle tone="accent" pixel={4} style={{ right: "30%", top: "8%" }} />
      <Floater shape="diamond" tone="warm" size={10} style={{ right: "4%", top: "46%" }} />

      <header className="page-head">
        <div className="page-head__text">
          <h1>
            Mes <span className="text-gradient">compétences</span>
          </h1>
          <p className="lead">
            Mon inventaire : les outils que j'utilise au quotidien, rangés par catégorie. Survolez une tuile pour en savoir
            plus, cliquez dessus pour voir les projets où je l'utilise.
          </p>
        </div>
        <div className="page-head__mascot" data-mascot-anchor="competences" data-mascot-mood="reflechie" data-mascot-gaze="down-left" />
      </header>

      <div className="skills__categories">
        {SKILL_CATEGORIES.map((category, catIndex) => (
          <section key={category.id} className="skills__category" aria-labelledby={`cat-${category.id}`} data-reveal="">
            <header className="skills__category-head">
              <span className="skills__slot label" aria-hidden="true">
                {String(catIndex + 1).padStart(2, "0")}
              </span>
              <div>
                <h2 id={`cat-${category.id}`} className="skills__category-title">
                  {category.title}
                </h2>
                <p className="skills__category-intro">{category.intro}</p>
              </div>
            </header>
            <ul className="skills__grid">
              {category.skills.map((skill) => {
                const slug = skillSlug(skill);
                const tipId = `tip-${category.id}-${slug}`;
                const projectCount = projectsForSkill(skill).length;
                const content = (
                  <>
                    <span className="skill__icon">
                      <Icon name={skill.icon} size={30} />
                    </span>
                    <span className="skill__name">{skill.name}</span>
                    {/* Masquée de l'arbre d'accessibilité : lue comme description, pas dans le nom du lien */}
                    <span id={tipId} role="tooltip" className="skill__tip" aria-hidden="true">
                      {skill.description}
                      {projectCount > 0 && (
                        <span className="skill__more">
                          Voir {projectCount > 1 ? `les ${projectCount} projets` : "le projet"} →
                        </span>
                      )}
                    </span>
                  </>
                );
                const className = `skill skill--${skill.tone}`;
                return (
                  <li key={skill.name} className="skills__cell">
                    {/* Compétence utilisée dans au moins un projet : la tuile mène à ces projets */}
                    {projectCount > 0 ? (
                      <Link
                        to={`/projets?competence=${slug}`}
                        className={`${className} skill--link`}
                        aria-describedby={tipId}
                        onPointerEnter={placeTip}
                        onFocus={placeTip}
                      >
                        {content}
                      </Link>
                    ) : (
                      <div className={className} tabIndex={0} aria-describedby={tipId} onPointerEnter={placeTip} onFocus={placeTip}>
                        {content}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
