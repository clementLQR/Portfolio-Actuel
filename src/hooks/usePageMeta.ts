import { useEffect } from "react";
import { SITE_URL, absoluteUrl, metaFor } from "../seo";

function setMeta(attr: "name" | "property", key: string, value: string) {
  document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)?.setAttribute("content", value);
}

/**
 * Met à jour le titre de l'onglet et les balises de l'en-tête à chaque changement de page
 * (le build génère déjà les bonnes balises pour un premier chargement).
 */
export function usePageMeta(pathname: string): void {
  useEffect(() => {
    const meta = metaFor(pathname);
    const url = absoluteUrl(meta.path);
    const image = `${SITE_URL}${meta.image}`;

    document.title = meta.title;
    document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute("href", url);
    setMeta("name", "description", meta.description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:alt", meta.imageAlt);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", image);

    // Page introuvable : ne pas l'indexer
    let robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (meta.noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex";
    } else {
      robots?.remove();
    }
  }, [pathname]);
}
