# Appartement 3D · lo-fi

Un appartement cosy en 3D (three.js) au-dessus d'une ville futuriste au coucher du soleil.
On le parcourt au scroll : **chambre → marches → salon → bureau**, jusqu'à l'écran du PC.

Tout est généré par le code (géométries, textures peintes au canvas, shaders) : aucun fichier 3D ni image à charger.

## Lancer le site

Le site utilise des modules JavaScript : il doit être servi par un serveur HTTP
(ouvrir `index.html` en double-clic ne fonctionne pas).

```bash
npm start            # petit serveur sans dépendance → http://localhost:5173
```

Alternatives : l'extension VS Code **Live Server**, ou n'importe quel serveur statique.
Une connexion internet est nécessaire (three.js et les polices viennent d'un CDN).

## Navigation

| Action | Effet |
| --- | --- |
| Molette / glisser (mobile) | avance ou recule le long du trajet |
| `↓`, `Espace` | pièce suivante |
| Bouton plein écran (le plus à gauche des boutons ronds, en haut à droite) | passe le site en plein écran, comme `F11` (un second clic ou `Échap` en sort) ; masqué sur iPhone, où Safari ne le permet pas |
| Clic sur l'écran du PC (au bureau) | s'approcher : l'ordinateur démarre au premier allumage (BIOS, logo, jingle ; un clic passe le démarrage), puis l'écran devient un petit bureau, aux fenêtres déplaçables, réductibles (– ou clic sur leur bouton du dock) et fermables (À propos, Projets, Galerie, Notes, Radio, Terminal, Solitaire) ; clic à côté ou `Échap` pour revenir |
| Clic sur le téléphone posé sur le bureau (sur mobile : aussi « Allumer le téléphone » ou l'écran du PC, qui mène au téléphone) | s'approcher : une interface de smartphone s'ouvre (plein écran sur mobile), avec les mêmes contenus que l'ordinateur (À propos, Projets, Contact, Galerie) et « Mon CV » qui lance l'impression ; « Reposer le téléphone », clic à côté ou `Échap` pour revenir |
| Clic sur la baie vitrée du salon | s'approcher de la vitre pour contempler la ville : la souris oriente le regard ; clic, scroll ou `Échap` pour revenir |
| Clic sur la platine vinyle ou sur une pochette | la caméra s'approche (une pochette cliquée pose son disque) ; devant la platine, un clic sur une pochette change de disque (4 disques lofi), sur la platine met en pause ; la musique joue dans le salon, étouffée et lointaine à la chambre ou au bureau |
| Clic sur la télé (en arrivant au salon) | s'installer dans le canapé ; un clic sur la télé ou `←` `→` change de chaîne (5 chaînes animées : lofi, aquarium, cheminée, synthwave, mire) ; clic ailleurs, scroll ou `Échap` pour revenir |
| Clic sur la bibliothèque (vue d'ensemble avec les posters), ses figurines ou un poster du mur de gauche | s'approcher pour les contempler ; un clic sur un autre de ces objets y glisse, `Échap`, scroll ou un clic ailleurs pour revenir |
| Clic sur l'imprimante du bureau (sous la fenêtre), sur « CV.pdf » ou « Imprimer mon CV » (appli Contact) dans l'ordinateur | la caméra s'approche, l'imprimante imprime le CV ; depuis le téléphone, « Mon CV » fait de même ; la feuille s'affiche ensuite avec « Télécharger le PDF », « Imprimer » et « Ouvrir dans un onglet » ; Échap pour revenir |
| Repère « Arcade » au bord gauche de l'écran au salon, ou clic sur une borne | la caméra se place entre les deux bornes ; un clic sur l'une d'elles s'y installe (`Échap` : retour au choix, puis au salon) |
| Aux bornes d'arcade (Star Run, Breaker) | `←` `→` (ou `A` `D`) bouger, `Espace` tirer, `Entrée` lancer / relancer la partie ; `Échap` ou scroll pour revenir ; sur mobile, boutons à l'écran (◀ ▶ Feu Jouer, × pour revenir) ; bruitages dès la première touche |
| `↑` | pièce précédente |
| Points violets sur les objets cliquables | survol : nom de l'action ; clic : comme un clic sur l'objet. Masqués par défaut : le bouton ◉ (en haut à droite, à gauche de l'œil) les affiche ou les masque |
| `H` ou bouton « œil » (en haut à droite) | masquer / afficher l'interface (nom, menu, textes, indications) pour profiter de la scène |
| Menu à droite | aller directement à une pièce |
| Souris | léger effet de parallaxe |

Liens directs : `#chambre`, `#salon`, `#bureau`, `#arcade` (devant les bornes), ou `#t=1.4` pour une position précise du trajet (0 → 2).

## Structure

```
appartement 3d/
├── index.html              page, importmap three.js, interface (menu, chargement)
├── projets/                pages HTML des projets (iut-quest, freemessage) : indexables par Google
├── 404.html                page introuvable
├── robots.txt, sitemap.xml référencement (adresse : https://clementlequeurre.com)
├── site.webmanifest        nom, couleurs et icônes du site
├── vercel.json             URL propres (/mentions-legales), en-têtes de cache et de sécurité
├── .htaccess               même chose pour un hébergement Apache (ignoré par Vercel)
├── .gitignore              fichiers hors du dépôt git (CLAUDE.md, .claude/…)
├── .vercelignore           fichiers jamais mis en ligne (CLAUDE.md, README.md, server.mjs…)
├── mentions-legales.html   mentions légales (éditeur, hébergeur Vercel, crédits)
├── confidentialite.html    politique de confidentialité (stockage local, services tiers, droits RGPD)
├── css/style.css           styles de l'interface
├── css/legal.css           styles des pages légales
├── assets/favicon.svg
├── assets/cv/              CV en PDF + son aperçu en image (texture de la feuille imprimée, aperçu à l'écran)
├── assets/wallpaper-ville.webp  fond d'écran du PC et du téléphone (CONTENT.wallpaper)
├── assets/project-*.webp/png  couvertures des projets (1920×1080 : logo blanc sur aplat de couleur)
├── server.mjs              serveur local (npm start)
├── js/
│   ├── main.js             point d'entrée : renderer, ordre de construction, boucle
│   ├── navigation.js       trajets caméra, scroll / clavier / tactile, parallaxe
│   ├── ui.js               chargement, menu des pièces, indication
│   ├── guide.js            guide de prise en main : écran plein (bienvenue au centre, carte à gauche avec légende et raccourcis clavier ou gestes) et bulles fléchées, à la première visite ou via le lien « Guide »
│   ├── hotspots.js         points violets sur les objets cliquables (étiquette au survol, toujours ouverte sur écran tactile) ; « Arcade », la télé et la platine collées au bord quand elles sont hors champ
│   ├── story.js            textes du portfolio à l'arrivée dans chaque pièce (contenu : STORY en tête de fichier)
│   ├── desktop.js          bureau d'ordinateur sur l'écran du PC (contenu : CONTENT en tête de fichier ; appRenderers : applis partagées avec le téléphone)
│   ├── phone.js            téléphone du bureau : interface de smartphone (pensée pour le mobile), mêmes contenus que l'ordinateur
│   ├── icons.js            icônes des applis (pictogrammes SVG, une couleur unie par appli), communes au PC et au téléphone
│   ├── vinyl.js            musique lofi synthétisée (Web Audio) : disques de la platine (DISCS) et morceaux de la radio du PC (RADIO_TRACKS)
│   ├── cv.js               CV : impression à l'imprimante du bureau, aperçu, téléchargement et impression du PDF
│   ├── cursor.js           curseur personnalisé (étiquette au survol de la télé)
│   ├── lighting.js         lumière d'ambiance, soleil + ombres, lueurs
│   ├── config/
│   │   └── layout.js       plan de l'appartement (dimensions) et points caméra
│   ├── core/
│   │   ├── scene.js        scène, brouillard, uniforms partagés
│   │   ├── random.js       aléatoire déterministe (même scène à chaque chargement)
│   │   ├── quality.js      qualité selon la machine (?qualite=basse|haute) + résolution dynamique
│   │   ├── helpers.js      addBox, canvasTexture, makeDrape (tissus)
│   │   ├── materials.js    matériaux communs (murs, bois, néons, verre de lampe)
│   │   ├── textures.js     textures peintes : parquet, tapis, posters, écrans
│   │   ├── animated.js     registre des animations (onFrame, flicker)
│   │   └── interactive.js  objets cliquables (la télé) et lancer de rayon
│   ├── world/              la ville vue par les fenêtres
│   │   ├── zones.js        implantation : fleuve, grandes tours, voies suspendues, zones réservées
│   │   ├── atmosphere.js   dégradé du ciel + brume partagés (GLSL), brouillard des matériaux three.js
│   │   ├── kit.js          géométries de bâtiments, fusion de meshes, lots d'instances, trajectoires
│   │   ├── sky.js          ciel du couchant, soleil, nuages (shader)
│   │   ├── buildingMaterial.js  façades procédurales : habitation, bureaux, tours, industrie
│   │   ├── city.js         ~4000 immeubles instanciés, toits, LED, balcons, jardins, horizon
│   │   ├── streets.js      rues, voitures au sol, réverbères
│   │   ├── water.js        fleuve + lagune avec reflet planaire, quais
│   │   ├── towers.js       grandes tours (flèches, gradins, LED, jumelles, tour colossale)
│   │   ├── nearTower.js    tour proche + écran géant
│   │   ├── foreground.js   premier plan : toit-jardin, immeuble, passerelle, câbles
│   │   ├── industry.js     zone industrielle à l'horizon
│   │   ├── bridges.js      pont, monorail et ses rames, ponts sur le fleuve
│   │   ├── highways.js     voies rapides suspendues et leur circulation
│   │   ├── holograms.js    hologrammes et enseignes (shader)
│   │   ├── traffic.js      circulation aérienne (voies, véhicules, traînées)
│   │   ├── ships.js        gros véhicules : navettes, bus, taxis, cargos
│   │   └── vegetation.js   arbres, buissons, murs végétaux instanciés
│   ├── rooms/
│   │   ├── bedroom.js      chambre : lit, lampe à lave, étagère, mur végétal, marches
│   │   ├── salon.js        salon : baie vitrée, canapé, télé, bibliothèques
│   │   └── office.js       bureau : poste de travail, écran du PC, téléphone
│   ├── props/              objets réutilisables
│   │   ├── foliage.js      feuilles instanciées : plantes, lierre
│   │   ├── lavaLamp.js     lampe à lave animée
│   │   ├── posters.js      posters muraux
│   │   ├── printer.js      imprimante du bureau (impression animée et sonore de la feuille du CV)
│   │   ├── officeChair.js  chaise de bureau résille
│   │   ├── armchair.js     fauteuil moelleux avec plaid
│   │   ├── music.js        casque, platine (disque qui tourne), enceinte, pochettes
│   │   ├── figurine.js     figurine d'ange (bibliothèque du salon)
│   │   ├── letterToy.js    figurine « W » en vinyle (bibliothèque du salon)
│   │   ├── arcade.js       borne d'arcade, jeu jouable (niveaux à formations variées, boss tous les 5 niveaux ; démo en veille, cliquable)
│   │   ├── arcadeShared.js touches, bruitages et meilleur score communs aux jeux des bornes
│   │   ├── breakout.js     casse-briques de la seconde borne (démo, jouable)
│   │   └── cozy.js         tasse fumante, livre ouvert, lampe de table, lanterne, guirlande, guéridon
│   └── fx/
│       └── postprocessing.js  bloom + étalonnage lo-fi (grain, vignette)
└── archive/
    └── test-chambre-3d.html   ancienne version en un seul fichier
```

## Référencement

- **Adresse** : `https://clementlequeurre.com`, écrite en dur dans les balises `canonical`, Open Graph,
  les données structurées (JSON-LD) des pages, `robots.txt` et `sitemap.xml`. À remplacer partout si elle change.
- **Contenu lisible par Google** : la scène 3D n'en a pas. `index.html` contient une version texte du
  portfolio (`<main class="sr-only">`, aussi utile aux lecteurs d'écran) : à garder alignée sur les textes
  des pièces (`js/story.js`) et des projets (`js/desktop.js`).
- **Nouveau projet** : créer sa page dans `projets/` (copier une page existante), l'ajouter à `sitemap.xml`,
  à la liste `ItemList` du JSON-LD et à la version texte d'`index.html`, et lui donner un lien
  « Page du projet » dans `CONTENT.projects` (`js/desktop.js`).
- **`sitemap.xml`** : mettre à jour `lastmod` quand une page change.
- **Images** : `assets/og-image.jpg` (1200×630, aperçu de partage) et les icônes PNG sont générées depuis la scène
  et `favicon.svg`.

## Points d'attention

- **Ordre de construction** : les éléments « au hasard » de l'appartement (livres, feuilles…)
  partagent un même flux aléatoire. Changer l'ordre des appels dans `main.js`, ou ajouter un
  tirage `rand()` au milieu d'un module, modifie la disposition de tout ce qui suit.
  Les modules de la ville ont chacun leur générateur (`seeded(graine)`) ; `main.js` avance
  ensuite le flux global du nombre de tirages de l'ancienne ville (`skipRand`) pour que
  l'appartement reste identique. Pour un nouvel objet, préférer un générateur dédié (`bush()` et `addLeaf()` acceptent
  aussi un générateur en dernier paramètre), ou l'ajouter en fin de pièce sans tirage aléatoire.
- **Ville** : l'implantation (fleuve, grandes tours, voies suspendues, zones libres) est dans
  `world/zones.js` ; la ville instanciée évite ces zones et reste sous les couloirs aériens.
- **Reflets** : le fleuve rend la ville une seconde fois, en basse résolution, avec le calque
  `REFLECT_LAYER`. Tout ce qui est construit avant `enableReflections()` s'y reflète
  (sauf `userData.noReflect`) ; l'appartement n'y est pas.
- **Performance** : formes répétées en `InstancedMesh` (`Batch`), pièces uniques fusionnées par
  matériau (`MergeKit`), lumières de la ville en matériaux émissifs (aucune lumière dynamique
  ajoutée), motif des fenêtres moyenné au loin.
- **Repère** : `-z` pointe vers la ville. Chambre au niveau `y = 0`, salon et bureau à `y = -0.6`.
- **Animations** : un module qui anime quelque chose s'inscrit avec `onFrame((dt, t) => …)`.
