import { useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { ProjectCard } from "../components/ui/ProjectCard";
import { Sparkle } from "../components/ui/Sparkle";
import { Tag } from "../components/ui/Tag";
import { CATEGORY_LABELS, PROJECTS, type ProjectCategory } from "../data/projects";
import { prefersReducedMotion } from "../hooks/useMediaQuery";
import "./Projects.scss";

gsap.registerPlugin(Flip);

type Filter = "tous" | ProjectCategory;

// Seules les catégories qui ont au moins un projet deviennent des filtres
const CATEGORIES = (Object.keys(CATEGORY_LABELS) as ProjectCategory[]).filter((id) =>
  PROJECTS.some((project) => project.category === id),
);

const FILTERS: { id: Filter; label: string }[] = [
  { id: "tous", label: "Tous" },
  ...CATEGORIES.map((id) => ({ id, label: CATEGORY_LABELS[id] })),
];

export default function Projects() {
  const [filter, setFilter] = useState<Filter>("tous");
  const gridRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);

  const visibleCount = PROJECTS.filter((p) => filter === "tous" || p.category === filter).length;

  const changeFilter = (next: Filter) => {
    if (next === filter) return;
    // On mémorise la position des cartes avant le nouveau rendu
    if (gridRef.current && !prefersReducedMotion()) {
      flipState.current = Flip.getState(gridRef.current.children);
    }
    setFilter(next);
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
  }, [filter]);

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

      {/* Inutiles tant que tous les projets sont dans la même catégorie */}
      {CATEGORIES.length > 1 && (
        <div className="projects__filters" role="group" aria-label="Filtrer les projets par catégorie">
          {FILTERS.map((item) => (
            <Tag key={item.id} active={filter === item.id} onClick={() => changeFilter(item.id)}>
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
          const visible = filter === "tous" || project.category === filter;
          return (
            <li key={project.slug} className="projects__item" hidden={!visible} data-flip-id={project.slug}>
              <ProjectCard project={project} headingLevel="h2" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
