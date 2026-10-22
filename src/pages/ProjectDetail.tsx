import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { Button } from "../components/ui/Button";
import { ChamferCard } from "../components/ui/ChamferCard";
import { Icon } from "../components/ui/Icon";
import { Tag } from "../components/ui/Tag";
import { PROJECTS, getProject, type ProjectSection } from "../data/projects";
import NotFound from "./NotFound";
import "./ProjectDetail.scss";

// Une section libre du projet : paragraphes puis liste à puces
function DetailSection({ section, index }: { section: ProjectSection; index: number }) {
  const id = `section-${index}`;
  return (
    <section className="detail__section" aria-labelledby={id} data-reveal="">
      <h2 id={id} className="detail__section-title">
        <span className="detail__slot label" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        {section.title}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph} className="detail__text">
          {paragraph}
        </p>
      ))}
      {section.items && (
        <ul className="detail__list">
          {section.items.map((item) => (
            <li key={item.text}>
              {item.title && (
                <strong>
                  {item.title}
                  {" : "}
                </strong>
              )}
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = getProject(slug);
  // La page est remontée à chaque changement d'URL : l'index repart de 0
  const [activeIndex, setActiveIndex] = useState(0);

  if (!project) return <NotFound />;

  const index = PROJECTS.indexOf(project);
  const previous = PROJECTS[(index - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(index + 1) % PROJECTS.length];
  const visual = project.visuals[activeIndex] ?? project.visuals[0];

  return (
    <article className="detail container">
      {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
      <div className="page-decor" aria-hidden="true">
        <OrganicWave corner="bottom-left" tone="warm" width="clamp(220px, 30vw, 480px)" />
        <Blob variant="glow-violet" size="36vw" style={{ right: "-12%", top: "4%" }} />
        <Blob variant="planet-blue" size="clamp(120px, 12vw, 200px)" style={{ left: "-6%", bottom: "16%" }} />
      </div>
      <PixelSparkle tone="highlight" pixel={4} style={{ right: "26%", top: "6%" }} />

      <Link to="/projets" className="detail__back">
        <Icon name="arrow-left" size={18} />
        Retour aux projets
      </Link>

      <header className="detail__head">
        <p className="detail__kicker label">{project.kicker}</p>
        <h1 className="detail__title">{project.title}</h1>
        <p className="lead">{project.summary}</p>
        {project.links.length > 0 && (
          <div className="detail__links">
            {project.links.map((link, i) => (
              <Button
                key={link.label}
                href={link.href}
                variant={i === 0 ? "primary" : "secondary"}
                icon="arrow-up-right"
              >
                {link.label}
              </Button>
            ))}
          </div>
        )}
      </header>

      {/* Miniatures seulement s'il y a plusieurs visuels */}
      <div className={`detail__gallery${project.visuals.length < 2 ? " detail__gallery--single" : ""}`}>
        {project.visuals.length > 1 && (
          <ul className="detail__thumbs" aria-label="Choisir un visuel">
            {project.visuals.map((item, i) => (
              <li key={item.src}>
                <button
                  type="button"
                  className={`detail__thumb${i === activeIndex ? " detail__thumb--active" : ""}`}
                  aria-pressed={i === activeIndex}
                  onClick={() => setActiveIndex(i)}
                >
                  <img src={item.src} alt="" width={1200} height={800} />
                  <span className="visually-hidden">{`Afficher le visuel ${i + 1} : ${item.alt}`}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <ChamferCard tone="cyan-violet" className="detail__main">
          {visual && (
            <img
              key={visual.src}
              src={visual.src}
              alt={visual.alt}
              width={1200}
              height={800}
              className="detail__main-img"
            />
          )}
        </ChamferCard>
      </div>

      {/* Chiffres clés */}
      <ul className="detail__stats" aria-label="Chiffres clés" data-reveal="">
        {project.stats.map((stat) => (
          <li key={stat.label} className="detail__stat">
            <span className="detail__stat-value text-gradient">{stat.value}</span>
            <span className="detail__stat-label">{stat.label}</span>
          </li>
        ))}
      </ul>

      <div className="detail__body">
        {/* Fiche technique, qui reste visible pendant la lecture */}
        <aside className="detail__aside" aria-label="Fiche du projet">
          <ChamferCard tone="cyan-violet">
            <div className="detail__sheet">
              <dl className="detail__facts">
                {project.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="label">{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="detail__stack">
                <p className="label">Stack</p>
                <ul aria-label="Stack technique">
                  {project.stack.map((tech, i) => (
                    <li key={tech}>
                      <Tag tone={(["accent", "violet", "warm"] as const)[i % 3]}>{tech}</Tag>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ChamferCard>
        </aside>

        <div className="detail__sections">
          {project.sections.map((section, i) => (
            <DetailSection key={section.title} section={section} index={i} />
          ))}
        </div>
      </div>

      {project.challenges.length > 0 && (
        <section className="detail__challenges" aria-labelledby="challenges-title">
          <h2 id="challenges-title" className="detail__challenges-title" data-reveal="">
            Défis <span className="text-gradient">rencontrés</span>
          </h2>
          <ul className="detail__challenge-grid">
            {project.challenges.map((challenge, i) => (
              <li key={challenge.title} data-reveal="">
                <ChamferCard tone={(["warm", "violet", "cyan"] as const)[i % 3]} className="detail__challenge">
                  <div className="detail__challenge-inner">
                    <h3 className="detail__challenge-name">{challenge.title}</h3>
                    <div>
                      <p className="detail__challenge-label label">
                        <Icon name="alert" size={16} />
                        Problème
                      </p>
                      <p>{challenge.problem}</p>
                    </div>
                    <div>
                      <p className="detail__challenge-label detail__challenge-label--ok label">
                        <Icon name="check" size={16} />
                        Solution
                      </p>
                      <p>{challenge.solution}</p>
                    </div>
                  </div>
                </ChamferCard>
              </li>
            ))}
          </ul>
        </section>
      )}

      {PROJECTS.length > 1 && previous && next && (
        <nav className="detail__pager" aria-label="Autres projets">
          <Link to={`/projets/${previous.slug}`} className="detail__pager-link">
            <Icon name="arrow-left" size={20} />
            <span>
              <span className="label">Projet précédent</span>
              <span className="detail__pager-title">{previous.title}</span>
            </span>
          </Link>
          <Link to={`/projets/${next.slug}`} className="detail__pager-link detail__pager-link--next">
            <span>
              <span className="label">Projet suivant</span>
              <span className="detail__pager-title">{next.title}</span>
            </span>
            <Icon name="arrow-right" size={20} />
          </Link>
        </nav>
      )}
      <div
        className="detail__mascot"
        data-mascot-anchor="projets"
        data-mascot-mood="curieuse"
        data-mascot-gaze="left"
      />
    </article>
  );
}
