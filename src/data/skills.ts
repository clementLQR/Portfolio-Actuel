import type { IconName } from "../components/ui/Icon";

export type SkillTone = "warm" | "accent" | "violet" | "highlight" | "detail";

export interface Skill {
  name: string;
  icon: IconName;
  tone: SkillTone;
  description: string;
}

export interface SkillCategory {
  id: string;
  title: string;
  intro: string;
  skills: Skill[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "front",
    title: "Front-end",
    intro: "Le terrain de jeu principal : des interfaces rapides, accessibles et agréables.",
    skills: [
      { name: "HTML / CSS", icon: "code", tone: "warm", description: "Intégration sémantique, responsive et accessible." },
      { name: "JavaScript", icon: "braces", tone: "highlight", description: "Le cœur de mes interfaces, du DOM aux API du navigateur." },
      { name: "TypeScript", icon: "ts", tone: "accent", description: "Typage strict pour des projets qui grandissent sereinement." },
      { name: "React", icon: "atom", tone: "accent", description: "Composants, hooks et gestion d'état, de l'app au site vitrine." },
      { name: "SCSS", icon: "layers", tone: "detail", description: "Architecture CSS, tokens de design et thèmes." },
    ],
  },
  {
    id: "back",
    title: "Back-end",
    intro: "Assez de back-end pour livrer un produit complet, de la base de données à l'API.",
    skills: [
      { name: "Node.js (bases)", icon: "hexagon", tone: "accent", description: "Premiers serveurs et scripts d'outillage en JavaScript." },
      { name: "Python (bases)", icon: "python", tone: "highlight", description: "Mon premier langage : algorithmique, scripts et un jeu avec Pygame." },
      { name: "PHP / Laravel", icon: "server", tone: "violet", description: "Applications complètes : authentification, rôles, paiements." },
      { name: "Symfony", icon: "terminal", tone: "highlight", description: "Projets structurés autour de Doctrine et des bundles." },
      { name: "WordPress", icon: "wordpress", tone: "accent", description: "Sites vitrines à mettre en ligne vite, faciles à gérer pour le client." },
      { name: "MySQL", icon: "database", tone: "warm", description: "Modélisation de données et requêtes optimisées." },
    ],
  },
  {
    id: "design",
    title: "Design",
    intro: "Je conçois avant de coder : parcours, maquettes et systèmes de composants.",
    skills: [
      { name: "Figma", icon: "pen", tone: "detail", description: "Maquettes, prototypes et design systems avec variantes." },
      { name: "UI/UX Design", icon: "layout", tone: "violet", description: "Recherche utilisateur, parcours et tests d'usage." },
      { name: "Création d'interfaces", icon: "cursor", tone: "warm", description: "Du croquis à l'écran final, avec ses micro-interactions." },
      { name: "Photoshop", icon: "photoshop", tone: "accent", description: "Retouche, montages et visuels pour le web." },
      { name: "Illustrator", icon: "illustrator", tone: "highlight", description: "Logos, icônes et illustrations vectorielles." },
      { name: "InDesign", icon: "indesign", tone: "detail", description: "Mise en page de documents, affiches et supports imprimés." },
    ],
  },
  {
    id: "creatif",
    title: "Créatif / 3D",
    intro: "Là où la technique prend vie : 3D temps réel, modélisation et animation.",
    skills: [
      { name: "Three.js", icon: "cube", tone: "accent", description: "Scènes 3D temps réel, shaders et intégration React." },
      { name: "Blender", icon: "blender", tone: "violet", description: "Modélisation, squelette et export glTF, comme la mascotte de ce site." },
      { name: "Animation web", icon: "sparkle", tone: "highlight", description: "GSAP, transitions et animations au scroll mesurées." },
    ],
  },
];

export type LevelState = "done" | "current" | "locked";

export interface Level {
  year: string;
  title: string;
  /** Établissement ou entreprise */
  place?: string;
  text: string;
  icon: IconName;
  state: LevelState;
  /** Niveau en cours : dates de début et de fin, pour la barre de progression */
  period?: { from: string; to: string };
}

// Frise du parcours, façon « niveaux débloqués »
export const LEVELS: Level[] = [
  {
    year: "2021",
    title: "Commencement de la programmation",
    place: "Autodidacte",
    text: "Mes tout premiers pas en autodidacte, avec les bases de l'algorithmique et de la programmation.",
    icon: "flag",
    state: "done",
  },
  {
    year: "2022-2024",
    title: "Bac général, spécialité NSI",
    place: "Lycée",
    text: "Mes débuts en programmation, avec des langages comme Python et JavaScript. En terminale, j'y ai codé mon premier jeu, BaseProtect, en Python avec Pygame.",
    icon: "code",
    state: "done",
  },
  {
    year: "2026",
    title: "Projets marquants",
    place: "IUT de Blois",
    text: "IUT Quest, un jeu de piste géolocalisé pour 12 équipes dans tout Blois, et FreeMessage, un réseau social codé en PHP natif sans framework.",
    icon: "trophy",
    state: "done",
  },
  {
    year: "2026",
    title: "Stage de 2e année",
    place: "Volume Software",
    text: "J'ai participé à la migration d'un ERP Genero vers Universal Rendering, et développé l'interface d'un chatbot connecté à une API.",
    icon: "briefcase",
    state: "done",
  },
  {
    year: "2024-2027",
    title: "BUT Métiers du Multimédia et de l'Internet",
    place: "IUT de Blois",
    text: "Spécialisation en développement web, où j'ai construit mes tout premiers projets.",
    icon: "graduation",
    state: "current",
    period: { from: "2024-09-01", to: "2027-06-30" },
  },
  {
    year: "Bientôt",
    title: "Niveau suivant",
    text: "Un stage en développement web de 11 semaines, de mars à juin 2027 : la prochaine étape reste à écrire. Et si on la construisait ensemble ?",
    icon: "lock",
    state: "locked",
  },
];
