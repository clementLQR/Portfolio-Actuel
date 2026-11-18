import { useLayoutEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { ProjectCard } from "../components/ui/ProjectCard";
import { Sparkle } from "../components/ui/Sparkle";
import { Icon } from "../components/ui/Icon";
import { Tag } from "../components/ui/Tag";
import { CATEGORY_LABELS, PROJECTS, type Project, type ProjectCategory } from "../data/projects";
import { findSkill, projectsForSkill } from "../data/skills";
import { prefersReducedMotion } from "../hooks/useMediaQuery";
import "./Projects.scss";

gsap.registerPlugin(Flip);

type Filter = "tous" | ProjectCategory;

/** Seules les catégories qui ont au moins un projet deviennent des filtres */
function categoriesOf(projects: Project[]): ProjectCategory[] {
  return (Object.keys(CATEGORY_LABELS) as ProjectCategory[]).filter((id) =>
    projects.some((project) => project.category === id),
  );
}

export default function Projects() {
  const [filter, setFilter] = useState<Filter>("tous");
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  // Arrivée depuis une tuile de la page Compétences : /projets?competence=react
  const skill = findSkill(searchParams.get("competence"));
  const skillProjects = skill ? projectsForSkill(skill) : PROJECTS;
  const categories = categoriesOf(skillProjects);
  // Catégorie choisie sans projet pour cette compétence : on revient à « Tous »
  const activeFilter: Filter = filter !== "tous" && !categories.includes(filter) ? "tous" : filter;
  const filters: { id: Filter; label: string }[] = [
    { id: "tous", label: "Tous" },
    ...categories.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
  ];

  const isVisible = (project: Project) =>
    skillProjects.includes(project) && (activeFilter === "tous" || project.category === activeFilter);
  const visibleCount = PROJECTS.filter(isVisible).length;

  // On mémorise la position des cartes avant le nouveau rendu
  const rememberLayout = () => {
    if (gridRef.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(gridRef.current.children);
    }
  };

  const changeFilter = (next: Filter) => {
    if (next === activeFilter) return;
    rememberLayout();
    setFilter(next);
  };

  const clearSkill = () => {
    rememberLayout();
    setSearchParams({}, { replace: true, preventScrollReset: true });
  };

  // Réorganisation animée : les cartes glissent vers leur nouvelle place
  useLayoutEffect(() => {
    const state = flipState.current;
    if (!state || !gridRef.current) return;
    flipState.current = null;
    const animation = Flip.from(state, {
      targets: gridRef.current.children,
      duration: 0.55,
      ease: "power3.inOut",
      scale: true,
      absolute: true,
      onEnter: (elements) =>
        gsap.fromTo(elements, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.45, delay: 0.15 }),
      onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.85, duration: 0.3 }),
    });
    return () => {
      animation.kill();
    };
  }, [activeFilter, skill]);

  return (
    <div className="projects container">
      {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
      <div className="page-decor" aria-hidden="true">
        <OrganicWave corner="bottom-left" tone="cool" width="clamp(240px, 32vw, 520px)" />
        <Blob variant="glow-blue" size="38vw" style={{ right: "-14%", top: "-6%" }} />
        <Blob variant="planet-warm" size="clamp(140px, 14vw, 220px)" style={{ left: "-8%", bottom: "8%" }} />
      </div>
      <PixelSparkle tone="highlight" pixel={4} style={{ right: "26%", top: "10%" }} />
      <Sparkle tone="detail" size={12} style={{ right: "6%", top: "38%" }} delay={1.3} />

      <header className="page-head">
        <div className="page-head__text">
          <h1>
            Mes <span className="text-gradient">projets</span>
          </h1>
          <p className="lead">
            Sites, applications et expériences : une sélection de projets d'études et personnels, du croquis à la
            mise en ligne.
          </p>
        </div>
        <div className="page-head__mascot" data-mascot-anchor="projets" data-mascot-mood="neutre" data-mascot-gaze="down-left" />
      </header>

      {skill && (
        <div className="projects__skill">
          <p>
            Projets où j'utilise <strong>{skill.name}</strong>
          </p>
          <button type="button" className="projects__skill-clear" onClick={clearSkill}>
            <Icon name="close" size={16} />
            Voir tous les projets
          </button>
        </div>
      )}

      {/* Inutiles tant que tous les projets sont dans la même catégorie */}
      {categories.length > 1 && (
        <div className="projects__filters" role="group" aria-label="Filtrer les projets par catégorie">
          {filters.map((item) => (
            <Tag key={item.id} active={activeFilter === item.id} onClick={() => changeFilter(item.id)}>
              {item.label}
            </Tag>
          ))}
        </div>
      )}
      <p className="visually-hidden" aria-live="polite">
        {visibleCount} projet{visibleCount > 1 ? "s" : ""} affiché{visibleCount > 1 ? "s" : ""}
      </p>

      <ul ref={gridRef} className="projects__grid">
        {PROJECTS.map((project) => {
          return (
            <li key={project.slug} className="projects__item" hidden={!isVisible(project)} data-flip-id={project.slug}>
              <ProjectCard project={project} headingLevel="h2" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
