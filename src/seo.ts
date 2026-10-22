// Référencement : titre, description et image de partage de chaque page.
// Partagé par le navigateur (mise à jour au changement de page) et par le build
// (une page HTML par route avec les bonnes balises, et le sitemap).
import { LEGAL_PAGES } from "./data/legal";
import { PROJECTS } from "./data/projects";

export const SITE_URL = "https://clementlequeurre.com";
const NAME = "Clément Lequeurre";
const DEFAULT_IMAGE = "/og-image.jpg";
const DEFAULT_IMAGE_ALT = "Clément Lequeurre, développeur web et creative dev, à côté de la mascotte 3D de son portfolio";

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Image de partage, chemin absolu sur le site */
  image: string;
  imageAlt: string;
  /** Page à ne pas indexer (page introuvable) */
  noindex?: boolean;
}

function page(path: string, title: string, description: string, image = DEFAULT_IMAGE, imageAlt = DEFAULT_IMAGE_ALT): PageMeta {
  return { path, title, description, image, imageAlt };
}

// Les réseaux sociaux ne lisent pas tous le WebP : on garde l'image par défaut dans ce cas
const shareable = (src: string | undefined) => (src && /\.(png|jpe?g)$/i.test(src) ? src : undefined);

/** Toutes les pages indexables, dans l'ordre du sitemap */
export const PAGES: PageMeta[] = [
  page(
    "/",
    `${NAME} | Portfolio développeur web`,
    "Portfolio de Clément Lequeurre, développeur web et creative developer en BUT MMI. Projets, compétences et parcours. Recherche un stage de mars à juin 2027.",
  ),
  page(
    "/projets",
    `Projets | ${NAME}`,
    `${PROJECTS.map((p) => p.title).join(", ")} : les projets web et jeu de Clément Lequeurre, développeur web en BUT MMI.`,
  ),
  ...PROJECTS.map((p) => {
    const cover = shareable(p.visuals[0]?.src);
    return page(
      `/projets/${p.slug}`,
      `${p.title} | ${NAME}`,
      p.summary,
      cover ?? DEFAULT_IMAGE,
      cover ? (p.visuals[0]?.alt ?? DEFAULT_IMAGE_ALT) : DEFAULT_IMAGE_ALT,
    );
  }),
  page(
    "/competences",
    `Compétences | ${NAME}`,
    "Front-end, back-end, design et 3D : les outils et savoir-faire de Clément Lequeurre, développeur web en BUT MMI.",
  ),
  page(
    "/a-propos",
    `À propos | ${NAME}`,
    "Parcours, CV et questions fréquentes : Clément Lequeurre, développeur web en BUT MMI à l'IUT de Blois, recherche un stage de mars à juin 2027.",
  ),
  page(
    "/contact",
    `Contact | ${NAME}`,
    "Une proposition de stage ou une question ? Écrivez à Clément Lequeurre, développeur web en BUT MMI. Réponse sous 48 heures.",
  ),
  ...LEGAL_PAGES.map((legal) => page(legal.path, `${legal.label} | ${NAME}`, legal.intro)),
];

export const NOT_FOUND: PageMeta = {
  ...page("/404", `Page introuvable | ${NAME}`, "Cette page n'existe pas, ou plus."),
  noindex: true,
};

export function metaFor(pathname: string): PageMeta {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  return PAGES.find((p) => p.path === path) ?? NOT_FOUND;
}

/** URL absolue d'une page (sans barre finale, sauf pour l'accueil) */
export const absoluteUrl = (path: string) => `${SITE_URL}${path === "/" ? "/" : path}`;

const escapeAttr = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Réécrit les balises de l'en-tête de index.html pour une page (utilisé au build) */
export function applyMeta(html: string, meta: PageMeta): string {
  const url = absoluteUrl(meta.path);
  const image = `${SITE_URL}${meta.image}`;
  const setContent = (input: string, attr: "name" | "property", key: string, value: string) =>
    input.replace(
      new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`),
      (_m, start: string, end: string) => `${start}${escapeAttr(value)}${end}`,
    );

  let out = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`);
  out = out.replace(/(<link rel="canonical" href=")[^"]*(")/, (_m, a: string, b: string) => `${a}${url}${b}`);
  out = setContent(out, "name", "description", meta.description);
  out = setContent(out, "property", "og:url", url);
  out = setContent(out, "property", "og:title", meta.title);
  out = setContent(out, "property", "og:description", meta.description);
  out = setContent(out, "property", "og:image", image);
  out = setContent(out, "property", "og:image:alt", meta.imageAlt);
  out = setContent(out, "name", "twitter:title", meta.title);
  out = setContent(out, "name", "twitter:description", meta.description);
  out = setContent(out, "name", "twitter:image", image);
  // Les dimensions annoncées ne valent que pour l'image par défaut (1200 x 630)
  if (meta.image !== DEFAULT_IMAGE) out = out.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*" \/>/g, "");
  if (meta.noindex) {
    out = out.replace(/\s*<link rel="canonical" href="[^"]*" \/>/, "");
    out = out.replace("</title>", '</title>\n    <meta name="robots" content="noindex" />');
  }
  return out;
}

/** sitemap.xml de toutes les pages indexables */
export function buildSitemap(lastmod: string): string {
  const urls = PAGES.map(
    (p) => `  <url>\n    <loc>${absoluteUrl(p.path)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
