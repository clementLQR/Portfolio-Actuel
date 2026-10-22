import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Blob } from "../components/ui/Blob";
import { DottedRing, OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { Button } from "../components/ui/Button";
import { ChamferCard } from "../components/ui/ChamferCard";
import { Icon } from "../components/ui/Icon";
import { Sparkle } from "../components/ui/Sparkle";
import { FAQ } from "../data/faq";
import { CV } from "../data/navigation";
import { LEVELS, type LevelState } from "../data/skills";
import "./About.scss";

const STATE_LABELS: Record<LevelState, string> = {
  done: "Niveau débloqué",
  current: "En cours",
  locked: "Verrouillé",
};

/** Part écoulée d'une période, en pourcentage arrondi */
function progressOf(period: { from: string; to: string }): number {
  const start = Date.parse(period.from);
  const end = Date.parse(period.to);
  const ratio = (Date.now() - start) / (end - start);
  return Math.round(Math.min(1, Math.max(0, ratio)) * 100);
}

export default function About() {
  // Dès que l'image du haut sort de l'écran, la mascotte passe la tête en bas à droite
  // pour accompagner la lecture du parcours
  const visualRef = useRef<HTMLDivElement>(null);
  const [visualOut, setVisualOut] = useState(false);

  useEffect(() => {
    const target = visualRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setVisualOut(!entry?.isIntersecting), { threshold: 0.3 });
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="about">
      <section className="about__intro container" aria-labelledby="about-title">
        {/* Décor pleine largeur : il passe sous le rail jusqu'au bord de l'écran */}
        <div className="page-decor" aria-hidden="true">
          <Blob variant="planet-warm" size="clamp(160px, 18vw, 280px)" style={{ right: "-8%", top: "6%" }} />
          <Blob variant="glow-blue" size="34vw" style={{ left: "-12%", bottom: "-10%" }} />
        </div>
        <PixelSparkle tone="highlight" pixel={4} style={{ left: "46%", top: "10%" }} />
        <DottedRing size={180} style={{ right: "-2%", bottom: "-4%" }} />
        <Blob variant="planet-warm" size={84} mail style={{ left: "40%", bottom: "8%" }} />
        <Sparkle tone="detail" size={12} style={{ right: "22%", bottom: "14%" }} delay={0.9} />

        <div className="about__text">
          <h1 id="about-title">
            À <span className="text-accent">propos</span>
          </h1>
          <p className="lead">
            Je suis un développeur curieux, toujours en quête de nouvelles idées. J'aime explorer, expérimenter et donner
            vie à des univers qui sortent de l'ordinaire, sans jamais perdre de vue la personne qui les utilise.
          </p>
          <p>
            Formé au BUT MMI, je navigue entre le code et le design : je maquette dans Figma, j'intègre en React et
            TypeScript, je monte des back-ends en Laravel ou Symfony, et je passe par la suite Adobe ou Blender quand
            un projet demande des visuels. Ce mélange me permet de parler aussi bien aux designers qu'aux développeurs.
          </p>
          <div className="about__actions">
            <Button href="#parcours" variant="warm">
              En savoir plus
            </Button>
            <Button href={CV.href} download={CV.fileName} variant="secondary" icon="download">
              Télécharger mon CV
            </Button>
          </div>
        </div>

        <div ref={visualRef} className="about__visual-wrap">
          <ChamferCard tone="cyan-violet" className="about__visual">
            <img
              src="/images/a-propos.webp"
              alt="Fiche de personnage : photo de Clément regardant vers la mascotte, avec son nom, son niveau et ses outils"
              width={1800}
              height={1200}
            />
          </ChamferCard>
          {/* La mascotte 3D vient se poser dans le cercle d'orbite de l'image */}
          <div className="about__mascot" data-mascot-anchor="a-propos" data-mascot-mood="heureuse" data-mascot-gaze="left" />
        </div>
      </section>

      <section id="parcours" className="section about__journey container" aria-labelledby="journey-title">
        <div className="page-decor" aria-hidden="true">
          <OrganicWave corner="bottom-left" tone="cool" width="clamp(220px, 30vw, 480px)" />
        </div>
        <header className="about__journey-head" data-reveal="">
          <h2 id="journey-title">
            Mon <span className="text-gradient">parcours</span>
          </h2>
        </header>

        <ol className="levels">
          {LEVELS.map((level, index) => (
            <li key={level.title} className={`level level--${level.state}`} data-reveal="">
              <div className="level__marker" aria-hidden="true">
                <Icon name={level.icon} size={22} />
              </div>
              <div className="level__card">
                <p className="level__meta label">
                  <span>Niveau {index + 1}</span>
                  <span>{level.year}</span>
                  {level.place && <span>{level.place}</span>}
                </p>
                <h3 className="level__title">{level.title}</h3>
                <p className="level__text">{level.text}</p>
                <p className="level__state">
                  {level.state === "done" && <Icon name="check" size={16} />}
                  {STATE_LABELS[level.state]}
                </p>
                {level.state === "current" && level.period && (
                  <div
                    className="level__xp"
                    role="progressbar"
                    aria-label="Progression de la formation"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressOf(level.period)}
                  >
                    <span style={{ width: `${progressOf(level.period)}%` }} />
                  </div>
                )}
                {level.state === "locked" && (
                  <Link to="/contact" className="level__link">
                    Débloquer ce niveau
                    <Icon name="arrow-right" size={16} />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Questions fréquentes : IA et travail en équipe */}
      <section className="section about__faq container" aria-labelledby="faq-title">
        <header className="about__journey-head" data-reveal="">
          <h2 id="faq-title">
            Questions <span className="text-gradient">fréquentes</span>
          </h2>
        </header>
        <div className="faq">
          {FAQ.map((group) => (
            <div key={group.id} className="faq__group" data-reveal="">
              <h3 className="faq__group-title label">{group.title}</h3>
              {group.items.map((item) => (
                <details key={item.question} className="faq__item">
                  <summary className="faq__question">
                    {item.question}
                    <Icon name="arrow-right" size={18} className="faq__chevron" />
                  </summary>
                  <div className="faq__answer">
                    {item.answer.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div
        className="about__peek"
        data-mascot-anchor={visualOut ? "a-propos" : undefined}
        data-mascot-mood="heureuse"
        data-mascot-peek=""
        data-mascot-gaze="left"
      />
    </div>
  );
}
