import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { ScrollIndicator } from "../components/layout/ScrollIndicator";
import { Blob } from "../components/ui/Blob";
import { OrganicWave, PixelSparkle } from "../components/ui/Decor";
import { Rocket } from "../components/ui/Rocket";
import { Button } from "../components/ui/Button";
import { ProjectCard } from "../components/ui/ProjectCard";
import { Floater, Sparkle } from "../components/ui/Sparkle";
import { PROJECTS } from "../data/projects";
import { prefersReducedMotion } from "../hooks/useMediaQuery";
import { useMascotteStore } from "../three/useMascotteStore";
import "./Home.scss";

gsap.registerPlugin(ScrollTrigger);

type HubTone = "warm" | "sunrise" | "violet" | "cyan";
type HubGlyphName = "folder" | "user" | "bolt" | "mail";

interface HubEntry {
  to: string;
  title: string;
  subtitle: string;
  glyph: HubGlyphName;
  tone: HubTone;
  position: "tl" | "tr" | "bl" | "br";
}

const HUB_ENTRIES: HubEntry[] = [
  { to: "/projets", title: "Projets", subtitle: "Découvrir mon travail", glyph: "folder", tone: "warm", position: "tl" },
  { to: "/a-propos", title: "À propos", subtitle: "Mon parcours", glyph: "user", tone: "sunrise", position: "tr" },
  { to: "/competences", title: "Compétences", subtitle: "Mes outils et savoir-faire", glyph: "bolt", tone: "violet", position: "bl" },
  { to: "/contact", title: "Contact", subtitle: "Me contacter", glyph: "mail", tone: "cyan", position: "br" },
];

/** Icônes pleines en dégradé, propres aux cartes du hub */
function HubGlyph({ name }: { name: HubGlyphName }) {
  const id = useId().replace(/:/g, "");
  const fill = `url(#${id})`;
  const shapes: Record<HubGlyphName, ReactNode> = {
    folder: (
      <>
        <path d="M5 13a4 4 0 0 1 4-4h9.5l4 4.5H39a4 4 0 0 1 4 4V37a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" fill={fill} />
        <path d="M5 19h38" className="hub-glyph__shade" />
      </>
    ),
    user: (
      <>
        <circle cx="24" cy="15" r="8.5" fill={fill} />
        <path d="M8 42c0-9 7.2-15 16-15s16 6 16 15z" fill={fill} />
      </>
    ),
    bolt: <path d="M27.5 3 9 27h13l-3 18 20-26H25.5z" fill={fill} />,
    mail: (
      <>
        <rect x="4" y="10" width="40" height="29" rx="5" fill={fill} />
        <path d="M6 13.5 24 27l18-13.5" className="hub-glyph__shade" />
      </>
    ),
  };
  return (
    <svg className="hub-glyph" width="48" height="48" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" className="hub-glyph__stop-a" />
          <stop offset="1" className="hub-glyph__stop-b" />
        </linearGradient>
      </defs>
      {shapes[name]}
    </svg>
  );
}

function HubCard({ entry }: { entry: HubEntry }) {
  return (
    <Link to={entry.to} className={`hub-card hub-card--${entry.position} hub-card--${entry.tone}`}>
      <span className="hub-card__panel">
        <HubGlyph name={entry.glyph} />
        <span className="hub-card__title">{entry.title}</span>
        <span className="hub-card__subtitle">{entry.subtitle}</span>
      </span>
      <span className="hub-card__pip" aria-hidden="true" />
    </Link>
  );
}

type NodeTone = "warm" | "accent" | "violet";

interface Ring {
  id: "outer" | "middle" | "inner";
  /** Nœuds lumineux : angle sur l'anneau et taille en px */
  nodes: { angle: number; size: number; tone: NodeTone }[];
}

const RINGS: Ring[] = [
  {
    id: "outer",
    nodes: [
      { angle: -90, size: 12, tone: "warm" },
      { angle: 160, size: 8, tone: "violet" },
    ],
  },
  {
    id: "middle",
    nodes: [
      { angle: 0, size: 14, tone: "accent" },
      { angle: 135, size: 9, tone: "warm" },
    ],
  },
  {
    id: "inner",
    nodes: [
      { angle: 90, size: 11, tone: "violet" },
      { angle: -135, size: 8, tone: "accent" },
    ],
  },
];

// Points d'amarrage sur l'anneau fixe (r = 48), à la hauteur du centre de chaque carte
const DOCKS = [
  { id: "tl", x: 50 - 44.1, y: 31, tone: "warm" },
  { id: "tr", x: 50 + 44.1, y: 31, tone: "accent" },
  { id: "bl", x: 50 - 44.1, y: 69, tone: "violet" },
  { id: "br", x: 50 + 44.1, y: 69, tone: "accent" },
] as const;

/** Anneaux façon sphère armillaire : chacun bascule sur X, Y et Z (CSS 3D) */
function Orbits() {
  return (
    <div className="orbits" aria-hidden="true">
      {/* Grand anneau fixe : ses nœuds sont reliés aux quatre cartes */}
      <svg className="orbits__halo" viewBox="0 0 100 100" focusable="false">
        <defs>
          <linearGradient id="halo-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" className="orbits__halo-stop-a" />
            <stop offset="0.5" className="orbits__halo-stop-b" />
            <stop offset="1" className="orbits__halo-stop-c" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="48" className="orbits__halo-ring" />
        <circle cx="50" cy="50" r="41" className="orbits__halo-ring orbits__halo-ring--thin" />
        {DOCKS.map((dock) => (
          <g key={dock.id} className={`orbits__dock orbits__dock--${dock.tone}`}>
            <line x1={dock.x} y1={dock.y} x2={dock.x < 50 ? -14 : 114} y2={dock.y} />
            <circle cx={dock.x} cy={dock.y} r="2.1" />
          </g>
        ))}
        <circle cx="50" cy="2" r="1.8" className="orbits__spark orbits__spark--violet" />
        <circle cx="50" cy="98" r="1.8" className="orbits__spark orbits__spark--detail" />
      </svg>
      <div className="orbits__scene">
        {RINGS.map((ring) => (
          <div key={ring.id} className={`orbits__ring orbits__ring--${ring.id}`}>
            {ring.nodes.map((node) => (
              <span
                key={node.angle}
                className="orbits__arm"
                style={{ "--angle": `${node.angle}deg`, "--node-size": `${node.size}px` } as CSSProperties}
              >
                <span className={`orbits__node orbits__node--${node.tone}`} />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const say = useMascotteStore((s) => s.say);
  const featured = PROJECTS.filter((project) => project.featured).slice(0, 3);

  // La mascotte accueille le visiteur
  useEffect(() => {
    const timer = window.setTimeout(() => say("Prêt(e) à explorer ?", 4500), 1100);
    return () => window.clearTimeout(timer);
  }, [say]);

  return (
    <>
      {/* ---------- Hero : le hub ---------- */}
      <section className="hub" aria-labelledby="hub-title">
        <Blob variant="planet-warm" size="clamp(260px, 30vw, 460px)" style={{ left: "-13%", top: "4%" }} />
        <Blob variant="planet-blue" size="clamp(200px, 22vw, 340px)" style={{ right: "-10%", top: "32%" }} />
        <Blob variant="planet-blue" size="clamp(220px, 24vw, 380px)" style={{ left: "56%", bottom: "-24%" }} />
        <Blob variant="glow-violet" size="40vw" style={{ left: "30%", top: "10%" }} />
        <OrganicWave corner="bottom-left" tone="cool" width="clamp(240px, 30vw, 480px)" />
        <OrganicWave corner="top-right" tone="warm" width="clamp(200px, 24vw, 400px)" />
        <PixelSparkle tone="highlight" pixel={4} style={{ left: "24%", top: "10%" }} />
        <PixelSparkle tone="detail" pixel={3} style={{ right: "22%", top: "14%" }} delay={0.6} />
        <Floater shape="square" tone="warm" size={12} style={{ right: "8%", top: "24%" }} />
        <Floater shape="diamond" tone="warm" size={11} style={{ left: "5%", bottom: "34%" }} delay={1.5} />
        <Floater shape="square" tone="accent" size={9} style={{ left: "9%", bottom: "46%" }} delay={0.8} />
        <Floater shape="diamond" tone="violet" size={10} style={{ right: "6%", bottom: "48%" }} delay={2.2} />

        <div className="hub__head container">
          <h1 id="hub-title" className="visually-hidden">
            Clément, développeur front-end et creative developer
          </h1>
        </div>

        <div className="hub__stage container">
          <div className="hub__core">
            <Orbits />
            <div className="hub__anchor" data-mascot-anchor="hero" data-mascot-socle="" data-mascot-mood="neutre" />
          </div>
          <nav className="hub__cards" aria-label="Explorer le portfolio">
            {HUB_ENTRIES.map((entry) => (
              <HubCard key={entry.to} entry={entry} />
            ))}
          </nav>
        </div>

        <div className="hub__bottom container">
          <ScrollIndicator targetId="bienvenue" />
        </div>
      </section>

      {/* ---------- Bienvenue ---------- */}
      <section id="bienvenue" className="section welcome" aria-labelledby="welcome-title">
        <Blob variant="glow-warm" size="34vw" style={{ right: "-10%", top: "0" }} />
        <OrganicWave corner="bottom-right" tone="warm" width="clamp(220px, 28vw, 440px)" />
        <div className="welcome__inner container">
          <div className="welcome__text" data-reveal="">
            <h2 id="welcome-title" className="welcome__title">
              Bonjour, <span className="text-accent">bienvenue</span> dans mon <span className="text-violet">univers</span>&nbsp;!
            </h2>
            <p className="lead">
              Je suis Clément, développeur front-end et creative developer en 3e année de BUT MMI. Je construis des
              interfaces soignées, rapides et accessibles, avec une petite touche de jeu. Ici, chaque projet est un
              niveau à explorer.
            </p>
            <div className="welcome__actions">
              <Button to="/a-propos">Explorer mon univers</Button>
              {/* Annotation manuscrite : décor uniquement */}
              <span className="welcome__note" aria-hidden="true">
                mon univers en un clin d'œil
              </span>
            </div>
          </div>
          <div className="welcome__mascot" data-mascot-anchor="bienvenue" data-mascot-mood="heureuse" data-mascot-gaze="left" />
          <PixelSparkle tone="highlight" pixel={4} style={{ right: "8%", top: "4%" }} />
          <Sparkle tone="detail" size={14} style={{ right: "34%", bottom: "6%" }} delay={1} />
        </div>
      </section>

      {/* ---------- Projets à la une ---------- */}
      <section className="section featured" aria-labelledby="featured-title">
        <div className="container">
          <div className="featured__head">
            <div className="featured__heading" data-reveal="">
              <h2 id="featured-title">
                Projets <span className="text-gradient">à la une</span>
              </h2>
            </div>
            <div className="featured__mascot" data-mascot-anchor="projets" data-mascot-mood="curieuse" data-mascot-gaze="down-left" />
          </div>
          <ul className="featured__grid">
            {featured.map((project) => (
              <li key={project.slug} data-reveal="">
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
          <div className="featured__more" data-reveal="">
            <Button to="/projets" variant="secondary">
              Voir tous les projets
            </Button>
          </div>
        </div>
      </section>

      {/* ---------- Contact rapide ---------- */}
      <QuickContact />
    </>
  );
}

type DrawerPhase = "closed" | "pulling" | "open";

/**
 * « Nouvelle quête » : le panneau est rangé dans le mur droit comme un tiroir.
 * Quand la section arrive à l'écran, la mascotte l'agrippe et le tire en trois à-coups.
 */
function QuickContact() {
  const sectionRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<DrawerPhase>(() => (prefersReducedMotion() ? "open" : "closed"));

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const drawer = drawerRef.current;
    if (!section || !drawer || prefersReducedMotion()) return;

    let current: DrawerPhase = "closed";
    let timeline: gsap.core.Timeline | null = null;
    let runTimer: number | undefined;

    // Position fermée : seul le bord gauche du panneau dépasse du mur
    const closedX = () => {
      const left = drawer.getBoundingClientRect().left - Number(gsap.getProperty(drawer, "x"));
      return Math.max(0, window.innerWidth * 0.84 - left);
    };
    gsap.set(drawer, { x: closedX() });

    const open = (celebrate: boolean) => {
      current = "open";
      const store = useMascotteStore.getState();
      store.setPulling(false);
      if (!celebrate) {
        setPhase("open");
        return;
      }
      // Elle souffle un instant à la poignée, puis repart en courant vers sa place
      store.pulseMood("heureuse", 3200);
      store.say("Et voilà !", 2400);
      runTimer = window.setTimeout(() => setPhase("open"), 900);
    };

    const play = () => {
      const start = Number(gsap.getProperty(drawer, "x"));
      current = "pulling";
      setPhase("pulling");
      useMascotteStore.getState().setPulling(true);
      // Le délai laisse à la mascotte le temps de sauter jusqu'à la poignée
      timeline = gsap
        .timeline({ delay: 1.1, onComplete: () => open(true) })
        .to(drawer, { x: start * 0.6, duration: 0.45, ease: "power3.out" })
        .to(drawer, { x: start * 0.25, duration: 0.45, ease: "power3.out" }, "+=0.35")
        .to(drawer, { x: 0, duration: 0.7, ease: "back.out(1.7)" }, "+=0.3");
    };

    const trigger = ScrollTrigger.create({ trigger: section, start: "top 60%", once: true, onEnter: play });

    // Au clavier, on n'attend pas l'animation : le contenu doit être visible tout de suite
    const onFocus = () => {
      if (current === "open") return;
      trigger.kill();
      timeline?.kill();
      gsap.set(drawer, { x: 0 });
      open(false);
    };
    const onResize = () => {
      if (current === "closed") gsap.set(drawer, { x: closedX() });
    };
    section.addEventListener("focusin", onFocus);
    window.addEventListener("resize", onResize);

    return () => {
      trigger.kill();
      timeline?.kill();
      window.clearTimeout(runTimer);
      section.removeEventListener("focusin", onFocus);
      window.removeEventListener("resize", onResize);
      gsap.set(drawer, { clearProps: "transform" });
      useMascotteStore.getState().setPulling(false);
    };
  }, []);

  const pulling = phase === "pulling";

  return (
    <section ref={sectionRef} className="section quick-contact" aria-labelledby="quick-contact-title">
      <Blob variant="planet-violet" size="clamp(160px, 18vw, 260px)" style={{ left: "-5%", bottom: "-10%" }} />
      {/* Fente lumineuse du mur, d'où sort le tiroir */}
      <span className={`quick-contact__slot${phase === "open" ? " quick-contact__slot--done" : ""}`} aria-hidden="true" />
      <div className="container">
        <div ref={drawerRef} className="quick-contact__drawer">
          {/* Poignée : la mascotte s'y accroche pendant qu'elle tire */}
          <div
            className="quick-contact__grip"
            data-mascot-anchor={pulling ? "contact" : undefined}
            data-mascot-priority={pulling ? "" : undefined}
            data-mascot-gaze="right"
          />
          <div className="quick-contact__panel">
            <div className="quick-contact__text">
              <h2 id="quick-contact-title">
                Un projet, un stage, <span className="text-warm">une idée</span>&nbsp;?
              </h2>
              <p className="lead">Je cherche un stage en développement web de 11 semaines, de mars à juin 2027.</p>
              <Button to="/contact" variant="warm">
                Lancer la discussion
              </Button>
            </div>
            {/* Fusée qui décolle vers la mascotte, dans l'espace libre sous le texte */}
            <Rocket size={92} className="quick-contact__rocket" />
            <div
              className="quick-contact__mascot"
              data-mascot-anchor={phase === "open" ? "contact" : undefined}
              data-mascot-mood="heureuse"
              data-mascot-gaze="left"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
