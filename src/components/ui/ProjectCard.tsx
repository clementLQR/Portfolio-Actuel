import { Link } from "react-router-dom";
import { CATEGORY_LABELS, type Project } from "../../data/projects";
import { ChamferCard, type CardTone } from "./ChamferCard";
import { Icon } from "./Icon";
import { Tag } from "./Tag";
import "./ProjectCard.scss";

const CATEGORY_TONE: Record<Project["category"], CardTone> = {
  web: "cyan",
  design: "violet",
  experimentations: "cyan-violet",
  jeu: "warm",
};

interface ProjectCardProps {
  project: Project;
  headingLevel?: "h2" | "h3";
}

export function ProjectCard({ project, headingLevel: Heading = "h3" }: ProjectCardProps) {
  const cover = project.visuals[0];
  return (
    <ChamferCard tone={CATEGORY_TONE[project.category]} interactive className="project-card">
      <article className="project-card__body">
        <div className="project-card__media">
          {cover && <img src={cover.src} alt="" loading="lazy" width={1200} height={800} />}
          <span className="project-card__category label">{CATEGORY_LABELS[project.category]}</span>
        </div>
        <div className="project-card__content">
          <Heading className="project-card__title">
            {/* Lien étiré : toute la carte est cliquable, mais un seul lien est annoncé */}
            <Link to={`/projets/${project.slug}`} className="project-card__link">
              {project.title}
            </Link>
          </Heading>
          <p className="project-card__summary">{project.summary}</p>
          <div className="project-card__footer">
            <ul className="project-card__tags" aria-label="Technologies">
              {project.tags.map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
            <span className="project-card__arrow" aria-hidden="true">
              <Icon name="arrow-right" size={18} />
            </span>
          </div>
        </div>
      </article>
    </ChamferCard>
  );
}
