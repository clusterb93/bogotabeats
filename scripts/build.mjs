// Prépare le dossier dist/ : uniquement les fichiers publics du site (pas la doc, les scripts, etc.).
// Utilisé par le déploiement (IONOS et GitHub Pages). Usage : node scripts/build.mjs
import { cp, rm, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const PUBLIC = ['index.html', 'styles.css', 'engine', 'content', 'public'];
const SITE_URL = 'https://bogotabeats.com/';

await rm(dist, { recursive: true, force: true });
await mkdir(dist);
for (const entry of PUBLIC) {
  const from = path.join(root, entry);
  // Le contenu de public/ (.htaccess, robots.txt…) est copié à la racine du site
  const to = entry === 'public' ? dist : path.join(dist, entry);
  await cp(from, to, { recursive: true }).catch((e) => { if (e.code !== 'ENOENT') throw e; });
}

const today = new Date().toISOString().slice(0, 10);
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}</loc><lastmod>${today}</lastmod></url>
</urlset>
`);
console.log(`✔ dist/ prêt (${PUBLIC.join(', ')} + sitemap.xml)`);
