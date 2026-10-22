import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { NOT_FOUND, PAGES, applyMeta, buildSitemap } from "./src/seo";

type ContactHandler = { POST: (request: Request) => Promise<Response> };
type NodeEnv = Record<string, string | undefined>;
// Le strict nécessaire de la requête Node, sans dépendre de @types/node
type IncomingRequest = { method?: string } & AsyncIterable<BlobPart>;

/**
 * En développement seulement : fait tourner api/contact.js dans le serveur de Vite,
 * avec les variables du fichier .env (RESEND_API_KEY…). En ligne, c'est Vercel qui s'en charge.
 */
function localApi(): Plugin {
  return {
    name: "api-locale",
    apply: "serve",
    configureServer(server) {
      const env = loadEnv(server.config.mode, server.config.root, "");
      const processEnv = (globalThis as unknown as { process: { env: NodeEnv } }).process.env;
      for (const key of ["RESEND_API_KEY", "CONTACT_TO", "CONTACT_FROM"]) {
        if (env[key]) processEnv[key] = env[key];
      }

      server.middlewares.use("/api/contact", async (req, res, next) => {
        const request = req as unknown as IncomingRequest;
        if (request.method !== "POST") return next();
        try {
          const chunks: BlobPart[] = [];
          for await (const chunk of request) chunks.push(chunk);
          const body = new Blob(chunks);
          const { POST } = (await server.ssrLoadModule("/api/contact.js")) as ContactHandler;
          const response = await POST(new Request("http://localhost/api/contact", { method: "POST", body }));
          res.statusCode = response.status;
          res.setHeader("Content-Type", response.headers.get("Content-Type") ?? "application/json");
          res.end(await response.text());
        } catch (error) {
          next(error);
        }
      });
    },
  };
}

/**
 * Au build : une page HTML par route, avec son titre, sa description et ses balises de partage
 * (lisibles sans JavaScript par les moteurs et les réseaux sociaux), une vraie page 404 et le sitemap.
 * Vercel sert /projets depuis projets.html grâce à « cleanUrls ».
 */
function seoPages(): Plugin {
  return {
    name: "pages-seo",
    apply: "build",
    enforce: "post",
    generateBundle(_options, bundle) {
      const index = bundle["index.html"];
      if (!index || index.type !== "asset") return;
      const html = String(index.source);
      for (const meta of PAGES) {
        const fileName = meta.path === "/" ? "index.html" : `${meta.path.slice(1)}.html`;
        if (fileName === "index.html") index.source = applyMeta(html, meta);
        else this.emitFile({ type: "asset", fileName, source: applyMeta(html, meta) });
      }
      this.emitFile({ type: "asset", fileName: "404.html", source: applyMeta(html, NOT_FOUND) });
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: buildSitemap(new Date().toISOString().slice(0, 10)) });
    },
  };
}

export default defineConfig({
  plugins: [react(), localApi(), seoPages()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // Fonction plutôt qu'objet : avec un objet, Rollup range aussi les dépendances
        // partagées (React, zustand…) dans le paquet 3D, que la page principale
        // importait alors dès le chargement.
        manualChunks(id) {
          // React et zustand à part : sinon Rollup les place dans le paquet 3D, qu'ils partagent
          if (/node_modules\/(react|react-dom|scheduler|zustand|react-router|react-router-dom)\//.test(id)) return "react";
          if (/node_modules\/(three|@react-three)\//.test(id)) return "three";
          // Flip ne sert qu'à la page Projets : il reste dans son paquet
          if (/node_modules\/gsap\/(?!.*Flip)/.test(id)) return "gsap";
          return undefined;
        },
      },
    },
  },
});
