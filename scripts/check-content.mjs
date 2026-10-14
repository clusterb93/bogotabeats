// Vérifie les fichiers de contenu avant publication : node scripts/check-content.mjs (ou npm run check)
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const errors = [], warnings = [];

async function json(file) {
  try { return JSON.parse(await readFile(path.join(root, 'content', file), 'utf8')); }
  catch (e) { errors.push(`${file} : JSON invalide → ${e.message} (virgule en trop ou manquante ? guillemets ?)`); return null; }
}

const site = await json('site.json');
const sets = await json('sets.json');
const dates = await json('dates.json');
const drive = await json('drive.json');
const mixes = await json('mixes.json');

const TYPES = ['club', 'festival', 'radio', 'private', 'live', 'openair'];
if (Array.isArray(dates)) {
  const today = new Date().toISOString().slice(0, 10);
  dates.forEach((d, i) => {
    const where = `dates.json #${i + 1} (${d.event || '?'})`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date || '') || isNaN(new Date(d.date))) errors.push(`${where} : date "${d.date}" invalide, format attendu AAAA-MM-JJ`);
    if (!d.event) errors.push(`${where} : champ "event" vide`);
    if (d.type && !TYPES.includes(d.type.toLowerCase().replace(/[\s_-]+/g, ''))) warnings.push(`${where} : type "${d.type}" inconnu (${TYPES.join(', ')})`);
    if (d.link && !/^https?:\/\//.test(d.link)) warnings.push(`${where} : le lien doit commencer par https://`);
  });
  const up = dates.filter((d) => d.date >= today).length;
  console.log(`• ${dates.length} dates (${up} à venir, ${dates.length - up} passées)`);
}

if (Array.isArray(sets)) {
  sets.forEach((s, i) => {
    if (!/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)[\w-]{11}/.test(s.url || '')) errors.push(`sets.json #${i + 1} : URL YouTube non reconnue "${s.url}"`);
    if (!s.title) warnings.push(`sets.json #${i + 1} : pas de titre`);
  });
  console.log(`• ${sets.length} sets YouTube`);
}

if (Array.isArray(mixes)) {
  mixes.forEach((m, i) => {
    if (!/^https:\/\/(on\.)?soundcloud\.com\/[^/]+\/[^/?#]+/.test(m.url || '')) errors.push(`mixes.json #${i + 1} : lien SoundCloud non reconnu "${m.url}" (attendu : https://soundcloud.com/compte/morceau)`);
  });
  console.log(`• ${mixes.length} mixes SoundCloud`);
}

if (site && drive) {
  const names = new Set();
  const walk = (f) => { f.files.forEach((x) => names.add(x.name.toLowerCase())); f.folders.forEach(walk); };
  walk(drive);
  for (const key of ['hero', 'heroMobile', 'aboutPhoto', 'bookingPhoto', 'logo', 'featuredVideo']) {
    const v = site.drive?.[key];
    // Valeur simple ("photo.jpg") ou une par thème ({ "dark": "...", "light": "..." })
    const entries = v && typeof v === 'object' ? Object.entries(v) : v ? [['', v]] : [];
    for (const [theme, name] of entries) {
      if (!names.has(String(name).toLowerCase())) warnings.push(`site.json drive.${key}${theme ? `.${theme}` : ''} : "${name}" introuvable dans le Drive (renommé ? supprimé ?) → un autre fichier sera utilisé`);
    }
  }
  const ga = site.analytics?.ga4;
  if (ga && !/^G-[A-Z0-9]+$/.test(ga)) errors.push(`site.json analytics.ga4 : "${ga}" n'est pas un identifiant GA4 (format G-XXXXXXXXXX)`);
  console.log(ga ? `• Google Analytics : ${ga}` : '• Google Analytics : désactivé (analytics.ga4 vide)');
  for (const l of site.languages || []) {
    for (const key of ['bio', 'music', 'inspirations']) {
      if (site[key] && typeof site[key] === 'object' && !site[key][l]) warnings.push(`site.json ${key} : pas de traduction "${l}" (l'anglais sera affiché)`);
    }
  }
  console.log(`• Drive synchronisé le ${drive.syncedAt?.slice(0, 16).replace('T', ' ')}`);
}

warnings.forEach((w) => console.warn(`⚠ ${w}`));
errors.forEach((e) => console.error(`✖ ${e}`));
if (errors.length) process.exit(1);
console.log('✔ Contenu OK');
