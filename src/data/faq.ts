// Questions fréquentes de la page À propos, regroupées par thème

export interface FaqItem {
  question: string;
  answer: string[];
}

export interface FaqGroup {
  id: string;
  title: string;
  items: FaqItem[];
}

export const FAQ: FaqGroup[] = [
  {
    id: "ia",
    title: "L'IA",
    items: [
      {
        question: "Utilises-tu l'IA pour coder ?",
        answer: [
          "Oui, mais avec mesure. Je la vois comme un deuxième cerveau : elle me rend plus productif et plus efficace, à condition de savoir ce que je fais pour la guider vers le résultat attendu.",
          "Ce portfolio a été conçu avec Claude : j'ai fixé le cahier des charges, l'architecture et la direction artistique, guidé chaque étape et relu le résultat. Je le précise sur la page du projet.",
        ],
      },
      {
        question: "Et sans l'IA ?",
        answer: [
          "IUT Quest a été développé entièrement sans IA, tout comme la première version de FreeMessage, avec son architecture MVC en PHP écrite à la main. Mon premier jeu, BaseProtect, fonctionnait déjà en terminale, bien avant que l'IA soit aussi répandue qu'aujourd'hui.",
          "Pendant mon stage chez Volume Software, je travaillais en Genero, un langage que les IA connaissent mal : il fallait comprendre et mettre à jour les programmes existants par moi-même.",
        ],
      },
      {
        question: "Comment l'utilises-tu concrètement ?",
        answer: [
          "Pour apprendre et aller plus loin sur du code que je maîtrise déjà. Sur la version 2 de FreeMessage, elle m'a aidé à améliorer certaines mécaniques et à comprendre comment bien restructurer un code existant : retirer le code mort, clarifier l'organisation.",
          "Pendant mon stage, je m'en suis servi pour l'interface du chatbot d'assistance : les animations, et la compréhension du fonctionnement d'un LLM et de ses réponses en Markdown, que je devais convertir en HTML.",
          "Plus récemment, je l'ai utilisée pour mettre à jour BaseProtect et le rendre plus jouable.",
        ],
      },
      {
        question: "Quelles limites lui fixes-tu ?",
        answer: [
          "Je relis tout ce qu'elle propose avant de l'intégrer. Une IA peut produire du code qui fonctionne sans être sûr, et la sécurité ne se délègue pas : requêtes SQL, gestion des clés d'API, données des utilisateurs, formulaires, je vérifie moi-même.",
          "Je ne lui confie pas non plus de données sensibles, comme des mots de passe, des clés d'API ou le code confidentiel d'une entreprise.",
        ],
      },
    ],
  },
  {
    id: "equipe",
    title: "Le travail en équipe",
    items: [
      {
        question: "As-tu l'habitude de travailler en équipe ?",
        answer: [
          "Oui. IUT Quest s'est fait à quatre, FreeMessage en binôme, et mon stage chez Volume Software m'a plongé dans un projet d'entreprise, la migration d'un ERP.",
          "Le BUT MMI fait une large place aux projets de groupe, et c'est une façon de travailler que j'apprécie : chacun apporte son regard, et on avance plus loin ensemble.",
        ],
      },
      {
        question: "Comment t'organises-tu dans une équipe ?",
        answer: [
          "Sur IUT Quest : un tableau Kanban sur Trello, une branche Git par tâche et une relecture systématique avant chaque merge.",
          "Je documente aussi ma partie du travail, pour que chacun puisse s'y retrouver et reprendre mon code sans avoir besoin de moi.",
        ],
      },
      {
        question: "Et quand un projet ne se passe pas comme prévu ?",
        answer: [
          "Sur FreeMessage, le projet ne s'est pas déroulé comme prévu de notre côté. Plutôt que de refaire le travail de mon binôme ou de le critiquer, j'ai assuré ma partie.",
          "Une fois la SAÉ rendue, j'ai repris le projet de mon côté pour en faire une version 2, plus moderne.",
        ],
      },
    ],
  },
];
