// Pages légales : mentions légales, confidentialité, accessibilité
import { SOCIAL_LINKS } from "./navigation";

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  items?: { title?: string; text: string }[];
}

export interface LegalPage {
  path: string;
  /** Libellé court, pour le footer */
  label: string;
  /** Titre en deux parties : la seconde passe en dégradé (première partie vide possible) */
  title: [string, string];
  intro: string;
  updated: string;
  sections: LegalSection[];
}

const EMAIL = SOCIAL_LINKS.email;

export const LEGAL_PAGES: LegalPage[] = [
  {
    path: "/mentions-legales",
    label: "Mentions légales",
    title: ["Mentions", "légales"],
    intro:
      "Informations relatives à l'éditeur et à l'hébergement du site, conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).",
    updated: "21 octobre 2026",
    sections: [
      {
        title: "Éditeur du site",
        paragraphs: [
          "Ce site est un portfolio personnel, édité à titre non professionnel par Clément Lequeurre, étudiant en BUT Métiers du Multimédia et de l'Internet à l'IUT de Blois.",
        ],
        items: [
          { title: "Contact", text: EMAIL },
          {
            title: "Directeur de la publication",
            text: "Clément LEQUEURRE",
          },
        ],
      },
      {
        title: "Hébergement",
        paragraphs: [
          "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis. Site web : vercel.com.",
        ],
      },
      {
        title: "Propriété intellectuelle",
        paragraphs: [
          "L'ensemble des contenus de ce site (textes, visuels, code et éléments graphiques) est la propriété de Clément, sauf mention contraire. Toute reproduction ou réutilisation sans autorisation écrite préalable est interdite.",
          "Les projets réalisés en groupe restent la propriété de leurs auteurs respectifs : les membres de chaque équipe sont cités sur la page du projet.",
        ],
      },
      {
        title: "Crédits",
        items: [
          { title: "Conception, design et modélisation 3D", text: "Clément" },
          {
            title: "Développement et animations de la mascotte",
            text: "Clément, avec l'aide de Claude, l'assistant IA d'Anthropic.",
          },
          {
            title: "Typographies",
            text: "Chakra Petch et Montserrat, sous licence SIL Open Font License, hébergées directement sur le site.",
          },
          {
            title: "Technologies",
            text: "React, TypeScript, Three.js, React Three Fiber, GSAP.",
          },
        ],
      },
      {
        title: "Responsabilité",
        paragraphs: [
          "Les informations de ce site sont fournies à titre indicatif. Les liens vers des sites externes n'engagent pas la responsabilité de l'éditeur quant à leur contenu.",
        ],
      },
    ],
  },
  {
    path: "/confidentialite",
    label: "Politique de confidentialité",
    title: ["Politique de", "confidentialité"],
    intro:
      "Aucun cookie publicitaire, aucun outil de mesure d'audience. Voici exactement quelles données ce site traite, et pourquoi.",
    updated: "21 octobre 2026",
    sections: [
      {
        title: "Responsable du traitement",
        paragraphs: [`Clément Lequeurre, joignable à l'adresse ${EMAIL}.`],
      },
      {
        title: "Formulaire de contact",
        paragraphs: [
          "Le formulaire demande votre nom, votre adresse e-mail et votre message. Ces informations servent uniquement à vous répondre : elles ne sont ni revendues, ni utilisées à des fins commerciales.",
        ],
        items: [
          {
            title: "Base légale",
            text: "votre consentement, donné en envoyant le message.",
          },
          {
            title: "Durée de conservation",
            text: "le temps de l'échange, puis 12 mois au maximum dans la boîte mail de Clément.",
          },
          { title: "Destinataire", text: "Clément uniquement." },
          {
            title: "Envoi",
            text: "le message est transmis par e-mail via Resend, un service d'envoi d'e-mails basé aux États-Unis, puis conservé dans la boîte mail de Clément.",
          },
        ],
      },
      {
        title: "Stockage local et cookies",
        paragraphs: [
          "Le site enregistre votre choix de thème (clair ou sombre) dans le stockage local de votre navigateur. Cette information reste sur votre appareil et n'est jamais transmise. Aucun cookie n'est déposé.",
        ],
      },
      {
        title: "Services tiers",
        paragraphs: [
          "Le site est hébergé par Vercel, qui enregistre des journaux techniques (adresse IP, page demandée, date) pour assurer le fonctionnement et la sécurité du service. Ces données peuvent être traitées aux États-Unis.",
        ],
      },
      {
        title: "Vos droits",
        paragraphs: [
          `Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition sur vos données. Pour l'exercer, écrivez à ${EMAIL}.`,
          "Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr).",
        ],
      },
    ],
  },
  {
    path: "/accessibilite",
    label: "Accessibilité",
    title: ["", "Accessibilité"],
    intro:
      "Ce portfolio doit être utilisable par tout le monde, quels que soient l'appareil, le handicap ou les préférences de navigation.",
    updated: "21 octobre 2026",
    sections: [
      {
        title: "Engagements",
        items: [
          {
            title: "Navigation au clavier",
            text: "tout le site se parcourt avec la touche Tab, avec un focus toujours visible et un lien d'accès direct au contenu.",
          },
          {
            title: "Mascotte décorative",
            text: "elle est ignorée par les lecteurs d'écran et ne porte aucune information.",
          },
          {
            title: "Mouvement réduit",
            text: "si votre système le demande, les déplacements, flottements et orbites animées sont désactivés.",
          },
          {
            title: "Thèmes",
            text: "sombre et clair, avec des contrastes visés au niveau AA.",
          },
          {
            title: "Structure",
            text: "titres hiérarchisés, zones de navigation nommées et textes alternatifs sur les images.",
          },
        ],
      },
      {
        title: "État de conformité",
        paragraphs: ["Le site n'a pas encore fait l'objet d'un audit d'accessibilité complet."],
      },
      {
        title: "Signaler un problème",
        paragraphs: [
          `Un contenu vous est inaccessible ? Écrivez à ${EMAIL} en décrivant la page et le problème : vous recevrez une réponse et une correction dès que possible.`,
        ],
      },
    ],
  },
];
