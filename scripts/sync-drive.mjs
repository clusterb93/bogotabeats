// Synchronise le contenu du dossier Google Drive public (PackPresse) vers content/drive.json.
// Aucune clé API : on lit la vue "embeddedfolderview" que Google sert pour les dossiers partagés.
// Usage : node scripts/sync-drive.mjs   (ou npm run sync)

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(await readFile(path.join(root, 'content/site.json'), 'utf8'));
const ROOT_ID = site.drive.folderId;
const MAX_DEPTH = 3;

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

function kindOf(name, href) {
  if (href.includes('/drive/folders/')) return 'folder';
  if (href.includes('docs.google.com/document')) return 'doc';
  if (href.includes('docs.google.com/spreadsheets')) return 'sheet';
  if (href.includes('docs.google.com/presentation')) return 'slides';
  const ext = name.split('.').pop().toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif', 'avif'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'm4v', 'webm', 'avi', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'aiff', 'flac', 'm4a'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  return 'file';
}

async function listFolder(id) {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${id}`);
  if (!res.ok) throw new Error(`Dossier ${id} illisible (HTTP ${res.status}) – est-il bien partagé publiquement ?`);
  const html = await res.text();
  const items = [];
  const re = /<div class="flip-entry" id="entry-([^"]+)"[\s\S]*?<a href="([^"]+)"[\s\S]*?<div class="flip-entry-title">([^<]*)<\/div>/g;
  for (const m of html.matchAll(re)) {
    const [, fid, href, rawName] = m;
    const name = decode(rawName).trim();
    items.push({ id: fid, name, kind: kindOf(name, decode(href)) });
  }
  return items;
}

async function walk(id, name, depth) {
  const items = await listFolder(id);
  const folder = { id, name, files: [], folders: [] };
  for (const it of items) {
    if (it.kind === 'folder') {
      if (depth < MAX_DEPTH) folder.folders.push(await walk(it.id, it.name, depth + 1));
    } else {
      folder.files.push(it);
    }
  }
  folder.files.sort((a, b) => a.name.localeCompare(b.name, 'fr', { numeric: true }));
  return folder;
}

// --- Google Sheets optionnels : "Dates" et "Sets" -------------------------------------------
// Si le Drive contient une feuille dont le nom contient "dates" (ou "agenda", "gigs") ou "sets",
// elle devient la source de content/dates.json / content/sets.json. Sinon, les JSON restent tels quels.

function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head = [], ...body] = rows;
  const keys = head.map((h) => h.trim().toLowerCase());
  return body
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// Accepte 2026-02-20, 20/02/2026, 20/02/26, 20.02.2026
function normDate(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/);
  if (!m) return null;
  const y = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

const allFiles = (f) => [...f.files, ...f.folders.flatMap(allFiles)];
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

async function sheetRows(file) {
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${file.id}/export?format=csv`);
  if (!res.ok) throw new Error(`Feuille "${file.name}" illisible (HTTP ${res.status}) – partage "Tous les utilisateurs disposant du lien" ?`);
  return parseCsv(await res.text());
}

async function syncSheets(tree) {
  const sheets = allFiles(tree).filter((f) => f.kind === 'sheet');
  const datesSheet = sheets.find((f) => /dates|agenda|gigs/.test(norm(f.name)));
  const setsSheet = sheets.find((f) => /\bsets?\b/.test(norm(f.name)));

  if (datesSheet) {
    const rows = await sheetRows(datesSheet);
    const dates = [];
    for (const r of rows) {
      const date = normDate(r.date || '');
      if (!date) { console.warn(`  ⚠ date ignorée (format inconnu) : "${r.date}" – ${r.event || ''}`); continue; }
      dates.push({ date, event: r.event || r.soiree || r['soirée'] || '', venue: r.venue || r.lieu || '', city: r.city || r.ville || '', type: (r.type || 'club').toLowerCase(), link: r.link || r.lien || r.billetterie || '' });
    }
    await writeFile(path.join(root, 'content/dates.json'), JSON.stringify(dates, null, 2) + '\n');
    console.log(`✔ dates.json ← feuille "${datesSheet.name}" (${dates.length} dates)`);
  }
  if (setsSheet) {
    const rows = await sheetRows(setsSheet);
    const sets = rows.filter((r) => r.url || r.lien).map((r) => ({ url: r.url || r.lien, title: r.title || r.titre || '', where: r.where || r.lieu || '' }));
    await writeFile(path.join(root, 'content/sets.json'), JSON.stringify(sets, null, 2) + '\n');
    console.log(`✔ sets.json ← feuille "${setsSheet.name}" (${sets.length} sets)`);
  }
}

const tree = await walk(ROOT_ID, site.drive.label || 'Drive', 0);
const out = { syncedAt: new Date().toISOString(), ...tree };
await writeFile(path.join(root, 'content/drive.json'), JSON.stringify(out, null, 2) + '\n');

const count = (f) => f.files.length + f.folders.reduce((n, s) => n + count(s), 0);
console.log(`✔ drive.json mis à jour : ${count(tree)} fichiers, ${tree.folders.length} sous-dossiers (${tree.folders.map((f) => f.name).join(', ')})`);
await syncSheets(tree);
