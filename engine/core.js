// Moteur — outils partagés et contexte de rendu (contenu chargé, langue, thème, fichiers du Drive).
// Ce fichier ne contient rien de propre à un artiste : tout vient de content/*.json.

export const $ = (s, el = document) => el.querySelector(s);
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const pad2 = (n) => String(n).padStart(2, '0');
export const root = document.documentElement;

// ---------- URLs Google Drive ----------
export const drive = {
  img: (id, w = 1600) => `https://lh3.googleusercontent.com/d/${id}=w${w}`,
  thumb: (id, w = 800) => `https://drive.google.com/thumbnail?id=${id}&sz=w${w}`,
  download: (id) => `https://drive.google.com/uc?export=download&id=${id}`,
  view: (f) =>
    f.kind === 'doc' ? `https://docs.google.com/document/d/${f.id}/view`
    : f.kind === 'sheet' ? `https://docs.google.com/spreadsheets/d/${f.id}/view`
    : f.kind === 'slides' ? `https://docs.google.com/presentation/d/${f.id}/view`
    : `https://drive.google.com/file/d/${f.id}/view`,
  pdf: (f) =>
    f.kind === 'doc' ? `https://docs.google.com/document/d/${f.id}/export?format=pdf`
    : f.kind === 'slides' ? `https://docs.google.com/presentation/d/${f.id}/export/pdf`
    : null,
  preview: (id) => `https://drive.google.com/file/d/${id}/preview`,
};

// ---------- Préférences (mémorisées dans le navigateur) ----------
export const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
export const params = new URLSearchParams(location.search);

// Rail horizontal (galeries sur mobile, carrousels) : index de l'élément le plus proche du centre
export function nearestChild(box, items = [...box.children]) {
  const mid = box.scrollLeft + box.clientWidth / 2;
  let best = 0, dist = Infinity;
  items.forEach((it, k) => { const d = Math.abs(it.offsetLeft + it.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = k; } });
  return best;
}

// ---------- Chargement du contenu ----------
const load = (f, fallback) => fetch(`content/${f}`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : fallback)).catch(() => fallback);

export async function createContext() {
  const [site, ui, sets, dates, tree, mixes, releases] = await Promise.all([
    load('site.json', {}), load('ui.json', {}), load('sets.json', []), load('dates.json', []), load('drive.json', { files: [], folders: [] }), load('mixes.json', []), load('releases.json', []),
  ]);

  const LANGS = site.languages || Object.keys(ui);
  const DEFAULT_LANG = site.defaultLang || 'en';
  // Format des dates par langue ; une langue absente utilise son code tel quel ("pt" → format portugais)
  const LOCALES = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES', ...site.locales };
  const pick = (l) => (LANGS.includes(l) ? l : null);

  const ctx = {
    site, ui, sets, dates, tree, mixes, releases,
    LANGS, DEFAULT_LANG, LOCALES,
    lang: pick(params.get('lang')) || pick(store.get('lang')) || DEFAULT_LANG,
    artist: site.artist || '',
    slug: norm(site.artist || 'artist').replace(/[^a-z0-9]+/g, ''),
    // Images ouvrables dans la lightbox, par groupe : { photos: [...], "flyer-2026-10-16": [...] }
    galleries: {},
    t: (k) => ui[ctx.lang]?.[k] ?? ui[DEFAULT_LANG]?.[k] ?? k,
    // Un champ de contenu peut être un texte simple ou { "en": ..., "fr": ..., "es": ... }
    tr: (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[ctx.lang] ?? v[DEFAULT_LANG] ?? Object.values(v)[0] : v),
    // Un choix de photo peut être un nom de fichier ou { "dark": ..., "light": ... }
    forTheme: (v) => (v && typeof v === 'object' ? v[root.dataset.theme] ?? v.dark : v),
    locale: () => LOCALES[ctx.lang] || ctx.lang,
    fmt: (iso, opts) => new Date(`${iso}T12:00:00`).toLocaleDateString(ctx.locale(), opts),
    // Masque une section et son lien dans le menu (section sans contenu)
    hideSection(id) {
      const s = document.getElementById(id);
      if (s) s.hidden = true;
      document.querySelectorAll(`.nav__links a[href="#${id}"]`).forEach((a) => { a.hidden = true; });
    },
  };

  // ---------- Lecture du Drive : chaque dossier est rangé selon son nom ----------
  const hidden = new Set((site.drive?.hiddenFiles || []).map(norm));
  const visible = (files) => files.filter((f) => !hidden.has(norm(f.name)));
  const allFiles = (f) => [...f.files, ...f.folders.flatMap(allFiles)];
  const ROLES = [
    ['flyers', /flyer|affiche|poster/],
    ['photos', /photo|pic|image|press/],
    ['logos', /logo/],
    ['videos', /video|clip|teaser|aftermovie/],
  ];
  const folders = { flyers: [], photos: [], logos: [], videos: [], extra: [] };
  for (const f of tree.folders) {
    const role = ROLES.find(([, re]) => re.test(norm(f.name)))?.[0] || 'extra';
    folders[role].push(f);
  }
  const filesOf = (role, kind) => visible(folders[role].flatMap(allFiles)).filter((f) => !kind || f.kind === kind);
  const photos = filesOf('photos', 'image');
  const byName = (list, name) => name && list.find((f) => norm(f.name) === norm(name));

  Object.assign(ctx, {
    visible, allFiles, folders, filesOf, byName,
    photos,
    logos: filesOf('logos', 'image'),
    videos: filesOf('videos', 'video'),
    // Photo choisie dans site.json → drive.<clé> (par thème), sinon la n-ième photo du dossier
    photo: (key, fallbackIndex) => byName(photos, ctx.forTheme(site.drive?.[key])) || photos[fallbackIndex] || photos[0],
    logo: () => byName(ctx.logos, ctx.forTheme(site.drive?.logo)) || ctx.logos.find((f) => /white|blanc/.test(norm(f.name))) || ctx.logos[0],
  });
  ctx.galleries.photos = photos;
  return ctx;
}
