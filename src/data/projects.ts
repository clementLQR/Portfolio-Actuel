// Projets de Clément.
// Visuels dans public/images/projets.

export type ProjectCategory = "web" | "design" | "experimentations" | "jeu";

export interface ProjectVisual {
  src: string;
  alt: string;
}

export interface ProjectLink {
  label: string;
  href: string;
}

/** Ligne de la fiche technique (Rôle, Durée, Stack…) */
export interface ProjectFact {
  label: string;
  value: string;
}

/** Chiffre clé mis en avant */
export interface ProjectStat {
  value: string;
  label: string;
}

/** Élément de liste, avec un intitulé en gras facultatif */
export interface ProjectItem {
  title?: string;
  text: string;
}

export interface ProjectSection {
  title: string;
  paragraphs?: string[];
  items?: ProjectItem[];
}

export interface ProjectChallenge {
  title: string;
  problem: string;
  solution: string;
}

export interface Project {
  slug: string;
  title: string;
  /** Sur-titre affiché au-dessus du nom du projet */
  kicker: string;
  category: ProjectCategory;
  /** Résumé d'une phrase, repris sur les cartes */
  summary: string;
  /** Quelques technologies pour les cartes */
  tags: string[];
  links: ProjectLink[];
  facts: ProjectFact[];
  stats: ProjectStat[];
  sections: ProjectSection[];
  challenges: ProjectChallenge[];
  stack: string[];
  visuals: ProjectVisual[];
  featured: boolean;
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  web: "Web",
  design: "Design",
  experimentations: "Expérimentations",
  jeu: "Jeu",
};


export const PROJECTS: Project[] = [
  {
    slug: "iut-quest",
    title: "IUT Quest",
    kicker: "SAÉ 4012 / Full-stack / 2026",
    category: "web",
    summary:
      "Un jeu de piste géolocalisé qui fait courir 12 équipes dans tout Blois, entre épreuves chronométrées et défis à prouver en photo.",
    tags: ["Laravel", "Leaflet", "PWA"],
    links: [
      { label: "Voir le site", href: "https://iut-quest.fr/" },
      { label: "Code", href: "https://github.com/Louischoubard/PEKIN-EXPRESS" },
    ],
    facts: [
      { label: "Rôle", value: "Développeur full-stack (front, tests, back)" },
      { label: "Durée", value: "1 mois" },
      { label: "Type", value: "SAÉ 4012, projet de groupe (4 personnes)" },
      { label: "Statut", value: "Démo en ligne" },
    ],
    stats: [
      { value: "12", label: "équipes" },
      { value: "6", label: "épreuves collectives" },
      { value: "100+", label: "défis au catalogue" },
      { value: "100+", label: "utilisateurs" },
    ],
    sections: [
      {
        title: "Présentation",
        paragraphs: [
          "IUT Quest est un jeu de piste grandeur nature inspiré de Pékin Express, conçu pour le challenge inter-filières de l'IUT de Blois. Le temps d'une journée, jusqu'à 12 équipes de 6 à 10 personnes (étudiants, enseignants et personnel administratif) s'affrontent à travers toute la ville.",
          "Le parcours s'étend sur les deux sites de l'IUT, la bibliothèque universitaire, le centre-ville et le château. Chaque équipe enchaîne six grandes épreuves collectives et pioche en parallèle dans un catalogue d'une centaine de défis libres en photo, vidéo ou texte, valant de 5 à 30 points. L'équipe qui totalise le plus de points repart avec le trophée.",
        ],
      },
      {
        title: "Mon rôle",
        paragraphs: [
          "Front-end de l'application publique utilisée par les équipes sur le terrain, et une partie des traitements PHP.",
        ],
        items: [
          { title: "Mobile-first et PWA", text: "joueurs dehors toute la journée, sur téléphone, en 4G." },
          {
            title: "Carte temps réel",
            text: "Leaflet + géolocalisation du navigateur ; watchPosition pousse régulièrement la position vers l'API et chaque équipe voit les autres se déplacer, chacune avec sa couleur.",
          },
          { title: "Côté serveur", text: "plusieurs traitements PHP avec leurs contrôleurs Laravel et vues Blade." },
          {
            title: "Côté interface",
            text: "profil et progression de l'équipe, barre d'avancement, minuteur de fin, vérification des médias avant envoi, classement verrouillé une heure avant la fin.",
          },
        ],
      },
      {
        title: "Fonctionnalités",
        items: [
          {
            title: "Carte temps réel",
            text: "équipes en couleur à côté des lieux de l'événement, avec légende et heure de dernière actualisation.",
          },
          {
            title: "Épreuves et défis",
            text: "six épreuves planifiées par créneau, plus un catalogue de défis libres ouverts jusqu'à 17 h.",
          },
          { title: "Validation par un admin", text: "aucun point automatique ; l'admin accepte ou refuse chaque preuve." },
          { title: "Médias en arrière-plan", text: "photos converties en WebP, vidéos traitées par un job asynchrone." },
          {
            title: "Back-office complet",
            text: "lieux, épreuves, groupes et planning, détection des conflits de créneaux, export PDF avec QR code.",
          },
        ],
      },
      {
        title: "Équipe",
        paragraphs: [
          "Djibril (maquette), Louis et Paul (back-end), Clément (front-end + traitements PHP). Kanban sur Trello, une branche Git par tâche, relecture systématique avant chaque merge.",
        ],
      },
    ],
    challenges: [
      {
        title: "Points comptés en double",
        problem:
          "Les points étaient crédités dès la soumission : un retour arrière du navigateur suffisait à les compter deux fois, et un refus de l'admin ne les retirait pas.",
        solution:
          "Un état explicite sur chaque défi (non validé, en cours, validé) et l'attribution des points au seul moment où un admin tranche.",
      },
      {
        title: "Vidéos lourdes en 4G",
        problem:
          "L'envoi d'une vidéo de plusieurs dizaines de Mo bloquait l'interface, et la preuve pouvait être ouverte avant la fin du transfert.",
        solution:
          "Photos compressées en WebP côté serveur, vidéos traitées par un job asynchrone avec FFmpeg ; la preuve n'apparaît à la validation qu'une fois prête.",
      },
      {
        title: "Géolocalisation instable",
        problem: "Le navigateur redemandait l'autorisation à chaque page et les positions devenaient incohérentes.",
        solution:
          "Autorisation demandée une fois puis gardée en session ; watchPosition suit en continu et n'envoie la position qu'à intervalle régulier, pour épargner la batterie.",
      },
    ],
    stack: ["Laravel", "PHP", "MySQL", "JavaScript", "Leaflet", "Docker", "FFmpeg", "PWA"],
    visuals: [
      { src: "/images/projets/iut-quest.webp", alt: "Logo d'IUT Quest : un coureur stylisé sur fond orange" },
      {
        src: "/images/projets/iut-quest-carte-defis.webp",
        alt: "IUT Quest sur mobile : carte temps réel des équipes avec le prochain rendez-vous, et liste des défis avec leur statut",
      },
      {
        src: "/images/projets/iut-quest-defi-classement.webp",
        alt: "IUT Quest sur mobile : fiche d'un défi avec dépôt de la preuve en photo, et classement des équipes",
      },
      {
        src: "/images/projets/iut-quest-admin-dashboard.webp",
        alt: "Back-office d'IUT Quest : tableau de bord avec la carte et le nombre de groupes et d'épreuves",
      },
      {
        src: "/images/projets/iut-quest-admin-epreuves.webp",
        alt: "Back-office d'IUT Quest : liste des épreuves avec leur durée et leur lieu",
      },
      {
        src: "/images/projets/iut-quest-admin-validation.webp",
        alt: "Back-office d'IUT Quest : épreuves et défis en attente de validation, et épreuves validées",
      },
    ],
    featured: true,
  },
  {
    slug: "freemessage",
    title: "FreeMessage",
    kicker: "SAÉ 3012 / Réseau social / Version 2",
    category: "web",
    summary:
      "Un réseau social thématique où l'on publie des messages (texte + image) dans 8 catégories, avec réactions et commentaires.",
    tags: ["PHP 8", "Twig", "MySQL"],
    links: [
      { label: "Code", href: "https://github.com/clementLQR/FreeMessage" },
    ],
    facts: [
      { label: "Rôle", value: "Développeur full-stack (front, back, tests)" },
      { label: "Durée", value: "2 mois" },
      { label: "Type", value: "SAÉ 3012, projet de groupe (2 personnes)" },
      { label: "Version", value: "V2, refonte personnelle de l'interface et d'une partie du back-end" },
      { label: "Architecture", value: "MVC en PHP natif, sans framework" },
    ],
    stats: [
      { value: "8", label: "catégories" },
      { value: "6", label: "tables SQL" },
      { value: "0", label: "framework" },
    ],
    sections: [
      {
        title: "Le projet en bref",
        paragraphs: [
          "FreeMessage est un réseau social organisé en 8 catégories : jeux vidéo, musique, films, livres, sport, peinture et dessin, photographie et séries. Je l'ai développé en PHP natif, avec une architecture MVC construite à la main : un routeur, des contrôleurs, des modèles et des vues Twig.",
          "L'objectif : comprendre et maîtriser tout ce qu'un framework fait habituellement à notre place, du routage aux sessions, en passant par la sécurité des formulaires, l'envoi de fichiers et l'accès à la base de données.",
        ],
      },
      {
        title: "Une version 2",
        paragraphs: [
          "La première version a été réalisée en binôme pendant la SAÉ, sans IA. Une fois le projet rendu, j'ai voulu aller plus loin et je l'ai repris de mon côté pour en faire une version 2.",
          "J'ai refait toute l'interface, plus moderne et plus soignée, en mobile-first, et amélioré plusieurs parties du back-end. Pour cette version, je me suis aidé de l'IA sur certaines mécaniques, ce qui m'a appris à bien restructurer un code existant. C'est cette version 2 que présentent les captures de cette page.",
        ],
      },
      {
        title: "Fonctionnalités",
        items: [
          {
            title: "Comptes",
            text: "inscription et connexion avec mots de passe hachés, pages protégées, profil avec biographie, identifiant modifiable et liste de ses publications.",
          },
          {
            title: "Publications",
            text: "message dans une catégorie, avec ou sans image ; tri par plus récentes ou plus likées ; dates en français via un filtre Twig personnalisé ; suppression de ses propres messages.",
          },
          {
            title: "Likes et dislikes asynchrones",
            text: "envoyés avec fetch() sans recharger la page ; une seule réaction par message, un second clic l'annule et passer de l'une à l'autre met à jour les deux compteurs.",
          },
          {
            title: "Commentaires",
            text: "sur chaque publication, avec le motif Post/Redirect/Get pour qu'un rechargement ne renvoie pas le commentaire.",
          },
          {
            title: "Administration",
            text: "gestion des publications, des commentaires et des comptes, recherche et tri des tableaux côté client.",
          },
          { title: "Responsive", text: "barre de navigation en bas sur mobile et tablette, barre latérale sur desktop." },
        ],
      },
      {
        title: "Sécurité",
        items: [
          { title: "Injection SQL", text: "toutes les requêtes passent par des requêtes préparées mysqli." },
          { title: "CSRF", text: "jeton unique par session (random_bytes), vérifié sur chaque requête POST avec hash_equals." },
          { title: "XSS", text: "échappement automatique des sorties par Twig." },
          { title: "Mots de passe", text: "hachage avec password_hash (bcrypt)." },
          {
            title: "Envoi de fichiers",
            text: "liste blanche d'extensions (jpg, png, gif, webp), 5 Mo maximum, contrôle du contenu réel avec getimagesize et renommage contre les collisions.",
          },
          { title: "Double soumission", text: "motif PRG (Post/Redirect/Get)." },
        ],
      },
      {
        title: "Architecture",
        items: [
          {
            title: "Point d'entrée unique",
            text: ".htaccess → routeur.php (vérification CSRF, dispatch des routes) → contrôleur → modèle (SQL) et vues Twig.",
          },
          { title: "URLs propres", text: "/categorie/3, /commentaires/12 grâce à la réécriture d'URL Apache." },
          {
            title: "Héritage de templates",
            text: "un gabarit parent (navigation, pied de page) et une vue enfant par page.",
          },
          {
            title: "Compteurs dénormalisés",
            text: "nbrLike, nbrDislike et nbrCom dans la table message, pour trier par popularité sans jointure coûteuse.",
          },
        ],
      },
    ],
    challenges: [],
    stack: ["PHP 8", "Twig 3", "MySQL / MariaDB", "JavaScript", "HTML / CSS", "Composer", "Git"],
    visuals: [
      { src: "/images/projets/freemessage.png", alt: "Logo de FreeMessage : une bulle de message avec un cœur, sur fond bleu" },
      {
        src: "/images/projets/freemessage-mobile.webp",
        alt: "FreeMessage sur mobile : connexion, choix d'un centre d'intérêt et commentaires d'une publication",
      },
      { src: "/images/projets/freemessage-connexion.webp", alt: "Page de connexion et d'inscription de FreeMessage sur ordinateur" },
      { src: "/images/projets/freemessage-publier.webp", alt: "Formulaire de publication d'un message avec image et catégorie" },
      { src: "/images/projets/freemessage-admin.webp", alt: "Administration des publications, avec recherche et suppression" },
    ],
    featured: true,
  },
  {
    slug: "portfolio",
    title: "Portfolio développeur",
    kicker: "Projet personnel / Creative dev / 2026",
    category: "web",
    summary:
      "Ce portfolio : un hub créatif façon menu de jeu vidéo, guidé par une mascotte 3D qui vit sur toute la page.",
    tags: ["React", "TypeScript", "Three.js"],
    links: [{ label: "Code", href: "https://github.com/clementLQR/Portfolio-Actuel" }],
    facts: [
      { label: "Rôle", value: "Design, modélisation 3D et développement" },
      { label: "Outils", value: "Blender, VS Code, Claude (assistant IA)" },
      { label: "Durée", value: "En cours" },
      { label: "Type", value: "Projet personnel" },
      { label: "Statut", value: "En développement" },
    ],
    stats: [
      { value: "6", label: "pages" },
      { value: "2", label: "thèmes, sombre et clair" },
      { value: "1", label: "mascotte 3D" },
      { value: "0", label: "librairie UI" },
    ],
    sections: [
      {
        title: "Le projet en bref",
        paragraphs: [
          "Je voulais un portfolio qui me ressemble : rigoureux sur le code, mais avec de la personnalité. Le site reprend les codes d'un écran-titre de jeu vidéo, chaleureux et lumineux sur fond nuit, avec un hub central d'où l'on part explorer mes projets, mes compétences et mon parcours.",
          "Une petite mascotte 3D guide la visite : elle se déplace de section en section, réagit aux survols et change d'humeur selon ce qui se passe à l'écran.",
        ],
      },
      {
        title: "Fonctionnalités",
        items: [
          {
            title: "Hub d'accueil",
            text: "la mascotte posée sur un socle holographique, entourée d'anneaux qui tournent en 3D et de quatre cartes en perspective.",
          },
          {
            title: "Mascotte vivante",
            text: "elle suit la souris du regard, cligne des yeux, s'endort après 30 secondes d'inactivité et court d'une section à l'autre.",
          },
          {
            title: "Humeurs",
            text: "curieuse au survol d'un lien, réfléchie pendant l'envoi du formulaire, heureuse en cas de succès, surprise en cas d'erreur.",
          },
          { title: "Nouvelle quête", text: "la mascotte tire le panneau de contact depuis le bord de l'écran." },
          { title: "Thèmes sombre et clair", text: "choix mémorisé, sans flash au chargement." },
        ],
      },
      {
        title: "La mascotte",
        paragraphs: [
          "Je voulais une mascotte entre le robot et le petit animal attachant. Je me suis inspiré d'EVE, le robot de WALL-E, pour la tête lisse et la visière, et des axolotls pour les oreilles en dégradé et la queue.",
          "Je l'ai modélisée dans Blender : un petit robot blanc mat, des dégradés en couleurs de sommets et un squelette de dix os auquel chaque pièce est attachée. Le modèle est exporté en glTF, puis compressé pour le web (1 Mo devenu 180 Ko).",
        ],
      },
      {
        title: "Conçu avec Claude",
        paragraphs: [
          "J'ai conçu ce site avec Claude, l'assistant IA d'Anthropic, utilisé comme binôme de développement. Le cahier des charges et l'architecture viennent de moi : stack, arborescence, direction artistique et fonctionnement de la mascotte (un seul canvas pour tout le site, des ancres HTML, des humeurs pilotées par un store).",
          "J'ai guidé la construction étape par étape : choix visuels, retours sur chaque rendu, corrections, contenus et visuels. Claude a écrit l'essentiel du code à partir de ces consignes et le vérifiait sur captures d'écran, en thème sombre et clair, sur ordinateur et sur mobile ; j'ai relu, ajusté et complété le résultat.",
          "C'est aussi avec lui que j'ai créé les animations de la mascotte : regard, clignements, sauts, course et humeurs. Elles sont calculées par le code plutôt qu'enregistrées dans le modèle 3D, ce qui garde le fichier léger.",
        ],
      },
      {
        title: "Technique",
        items: [
          {
            title: "Un seul canvas",
            text: "un Canvas React Three Fiber fixe pour tout le site, qui ne se démonte jamais entre les pages.",
          },
          {
            title: "Ancres HTML",
            text: "la mascotte se place sur des éléments data-mascot-anchor ; sa position 3D est calculée depuis getBoundingClientRect.",
          },
          {
            title: "Animations procédurales",
            text: "tout est animé os par os dans useFrame : regard, clignements, saut, course. Aucune donnée d'animation dans le modèle, qui reste léger (180 Ko).",
          },
          {
            title: "État global",
            text: "zustand pour l'humeur de la mascotte et le thème ; l'interface ne manipule jamais Three.js directement.",
          },
          { title: "Design tokens", text: "toutes les couleurs passent par des variables CSS sémantiques, en SCSS." },
        ],
      },
      {
        title: "Accessibilité et performance",
        items: [
          { title: "Mascotte décorative", text: "canvas masqué aux lecteurs d'écran, aucune information ne passe uniquement par elle." },
          { title: "Clavier", text: "navigation complète et focus toujours visible." },
          { title: "Mouvement réduit", text: "avec prefers-reduced-motion, plus de déplacements, de flottement ni d'orbites animées." },
          { title: "Chargement", text: "la 3D charge en arrière-plan, le site s'affiche sans l'attendre." },
        ],
      },
    ],
    challenges: [
      {
        title: "Clics bloqués par la 3D",
        problem:
          "Le canvas de la mascotte couvre tout l'écran : son conteneur interceptait les clics et rendait des boutons inutilisables.",
        solution:
          "Plus aucun événement de pointeur sur la couche 3D, et une zone HTML invisible synchronisée sur la mascotte pour garder les clics sur elle.",
      },
      {
        title: "Bordures octogonales",
        problem: "Une bordure combinée à un clip-path chanfreiné perd ses coins : le découpage coupe la bordure avec eux.",
        solution:
          "Un cadre fait de deux octogones superposés, dont l'épaisseur reste régulière sur les diagonales à toutes les résolutions.",
      },
      {
        title: "Une mascotte dans le HTML",
        problem: "Poser un modèle 3D sur des éléments HTML qui bougent au scroll et changent d'une page à l'autre.",
        solution:
          "Une caméra orthographique où une unité vaut un pixel, des ancres choisies selon leur visibilité et des trajets interpolés avec GSAP, en saut ou en course selon la distance.",
      },
    ],
    stack: ["React", "TypeScript", "Vite", "Three.js", "React Three Fiber", "zustand", "GSAP", "SCSS"],
    visuals: [
      { src: "/images/projets/portfolio.png", alt: "Logo du portfolio : la tête de la mascotte en blanc sur fond violet" },
      {
        src: "/images/projets/portfolio-blender-rendu.webp",
        alt: "La mascotte dans Blender, avec ses matériaux et ses couleurs, et la liste de ses pièces attachées au squelette",
      },
      {
        src: "/images/projets/portfolio-blender-squelette.webp",
        alt: "La mascotte dans Blender en vue grise, avec les os du squelette visibles dans le corps, la tête, les bras et la queue",
      },
    ],
    featured: true,
  },
  {
    slug: "baseprotect",
    title: "BaseProtect",
    kicker: "Projet de terminale / Jeu 2D / Python",
    category: "jeu",
    summary:
      "Un jeu de tir en pixel art : posté dans une tourelle, on abat les vagues de zombies avant qu'ils n'atteignent la base, sans toucher les survivants.",
    tags: ["Python", "Pygame", "SQLite"],
    links: [],
    facts: [
      { label: "Rôle", value: "Développeur (gameplay, interface, base de données)" },
      { label: "Type", value: "Projet de terminale en binôme, repris ensuite en personnel" },
      { label: "Graphismes", value: "Toutes les textures en pixel art, faites par moi" },
      { label: "Plateforme", value: "Ordinateur, jeu local" },
      { label: "Statut", value: "Jouable" },
    ],
    stats: [
      { value: "2", label: "modes de jeu" },
      { value: "10", label: "vagues et un boss" },
      { value: "6", label: "types de personnages" },
      { value: "2 000+", label: "lignes de Python" },
    ],
    sections: [
      {
        title: "Présentation",
        paragraphs: [
          "BaseProtect est mon premier jeu, commencé en terminale avec Pygame. Le joueur est un tireur posté dans une tourelle : des zombies et des survivants arrivent par la route, et il faut abattre les zombies avant qu'ils n'atteignent la base, sans tuer les survivants.",
          "Le jeu était déjà fonctionnel à l'époque, sans IA. Je l'ai repris récemment avec l'aide de l'IA pour le mettre à jour et le rendre plus jouable : règles équilibrées, interface entièrement en pixel art, sons, classements et options.",
          "Tous les graphismes sont de moi : décor de la ville, tourelle, personnages, boutons et logo, dessinés en pixel art.",
        ],
      },
      {
        title: "Gameplay",
        items: [
          { title: "Tir à la souris", text: "visée au viseur, chargeur de 24 balles et rechargement, sang et messages de points à chaque impact." },
          { title: "Survivants", text: "en abattre un coûte une vie et des points ; en sauver cinq rend une vie." },
          { title: "Deux modes", text: "10 vagues avec un boss final et une vraie victoire, ou infini avec un boss toutes les cinq vagues." },
          { title: "Comptes et classements", text: "connexion par pseudo, meilleur score et top 10 par mode, enregistrés en SQLite." },
          { title: "Options", text: "résolutions, plein écran, volumes de la musique et des effets, touche de rechargement modifiable." },
        ],
      },
      {
        title: "Technique",
        items: [
          { title: "Architecture", text: "un module par rôle (règles, personnages, interface, affichage, sons, base de données) et un fichier de réglages unique pour équilibrer le jeu." },
          { title: "Affichage", text: "une scène logique en 1920 x 1080, mise à l'échelle dans la fenêtre quelle que soit la résolution." },
          { title: "Interface pixel", text: "police pixel et cadres découpés dans les textures du jeu, sans aucune police système." },
          { title: "Sons", text: "tous générés par synthèse, avec la seule bibliothèque standard de Python." },
          { title: "Base de données", text: "requêtes paramétrées, sans risque d'injection SQL." },
        ],
      },
    ],
    challenges: [
      {
        title: "Des tirs injustes",
        problem: "Un survivant qui croisait un zombie le masquait, et balayer l'écran avec la souris faisait partir des balles perdues sur les survivants.",
        solution: "La zone touchée suit la silhouette dessinée du personnage, et aucun tir ne part tant que le viseur se déplace trop vite.",
      },
      {
        title: "Des avalanches de zombies",
        problem: "Les apparitions tirées au hasard créaient parfois des vagues impossibles à tenir.",
        solution: "Un budget de points de vie de zombies par seconde, qui augmente à chaque vague, avec un plafond de zombies à l'écran.",
      },
      {
        title: "Un fichier de 1 200 lignes",
        problem: "Tout le jeu tenait dans un seul fichier, difficile à faire évoluer.",
        solution: "Une refonte en modules, une étape à la fois, en vérifiant à chaque fois que le jeu se comportait exactement pareil.",
      },
    ],
    stack: ["Python", "Pygame", "SQLite", "Git"],
    visuals: [
      { src: "/images/projets/baseprotect.webp", alt: "Logo de BaseProtect en lettres pixel, rouge et gris, sur le fond gris du menu du jeu" },
      {
        src: "/images/projets/baseprotect-partie.webp",
        alt: "Une partie : zombies sur la route, tireur dans sa tourelle et tableau de bord du score, des vies et des munitions",
      },
      { src: "/images/projets/baseprotect-menu.webp", alt: "Menu d'accueil : connexion par pseudo, choix du mode et tableau des scores" },
      { src: "/images/projets/baseprotect-fin.webp", alt: "Écran de fin : game over, score et nouveau record" },
    ],
    featured: false,
  },
];

export function getProject(slug: string | undefined): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}
