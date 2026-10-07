// Petit serveur statique sans dépendance : `npm start` puis http://localhost:5173
// Comme Vercel (vercel.json, cleanUrls) : /mentions-legales sert mentions-legales.html, et une page
// absente renvoie 404.html.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT) || 5173;
const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".json": "application/json",
    ".webmanifest": "application/manifest+json",
    ".xml": "application/xml; charset=utf-8",
    ".txt": "text/plain; charset=utf-8",
    ".pdf": "application/pdf"
};

createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    const path = normalize(join(root, url.endsWith("/") ? url + "index.html" : url));
    if (!path.startsWith(root)) {
        res.writeHead(403).end();
        return;
    }
    // URL propre : sans extension, on essaie la page .html du même nom
    const candidates = extname(path) ? [path] : [path, path + ".html"];
    for (const file of candidates) {
        try {
            const body = await readFile(file);
            res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" });
            res.end(body);
            return;
        } catch { /* fichier suivant */ }
    }
    try {
        res.writeHead(404, { "Content-Type": types[".html"] }).end(await readFile(join(root, "404.html")));
    } catch {
        res.writeHead(404).end("Introuvable");
    }
}).listen(port, () => console.log(`Appartement 3D → http://localhost:${port}`));
