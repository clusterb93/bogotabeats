// EPK (dossier de presse en ligne). Composé de blocs, choisis et ordonnés par l'option "blocks"
// de la section dans site.json (défaut : tous, dans l'ordre de BLOCKS ci-dessous).
// Textes : site.json (bio, music, genres, inspirations, influences, stats, setup) ; médias : le Drive.
import { $, esc, norm, drive, pad2, nearestChild } from '../core.js';

const galleryHtml = (ctx, list, group) => list.map((p, i) =>
  `<button data-lb="${group}" data-i="${i}" aria-label="${esc(p.name)}"><img src="${drive.img(p.id, 700)}" alt="${esc(ctx.artist)}" loading="lazy"></button>`).join('');

function dlCard(ctx, f) {
  const { t } = ctx;
  const n = norm(f.name);
  const isPresskit = /press ?kit|epk|dossier de presse/.test(n);
  const kind = isPresskit ? t('dl.presskit') : /fiche|technical|rider|tech/.test(n) ? t('dl.rider') : t('dl.doc');
  const href = drive.pdf(f) || drive.view(f);
  const label = f.name.replace(/\.(pdf|docx?)$/i, '');
  return `<a class="dl ${isPresskit ? 'dl--main' : ''} reveal" href="${href}" target="_blank" rel="noopener">
    <span class="dl__kind">${kind}</span><span class="dl__name">${esc(label)}</span><span class="dl__cta">${drive.pdf(f) ? t('dl.pdf') : t('dl.open')} ↗</span></a>`;
}

// Galeries en carrousel sur mobile : .gallery devient un rail horizontal (CSS) ; on suit la photo centrée pour le compteur.
function setupRails(ctx, el) {
  el.querySelectorAll('.gallery').forEach((rail) => {
    const count = rail.nextElementSibling?.classList.contains('rail-count') ? rail.nextElementSibling : null;
    if (!count || !rail.children.length) return;
    const update = () => {
      const items = [...rail.children];
      const best = nearestChild(rail, items);
      items.forEach((it, k) => it.classList.toggle('is-active', k === best));
      count.innerHTML = `<b>${pad2(best + 1)}</b> / ${pad2(items.length)} <span>· ${esc(ctx.t('gallery.swipe'))} →</span>`;
    };
    if (!rail.dataset.rail) {
      rail.dataset.rail = '1';
      let raf;
      rail.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
    }
    update();
  });
}

// Compteurs animés des chiffres clés (instant = valeur finale sans animation)
function countUp(ctx, el, instant = false) {
  el.querySelectorAll('[data-count]').forEach((n) => {
    const target = +n.dataset.count, suffix = n.dataset.suffix, dec = String(target).includes('.') ? 1 : 0;
    const show = (v) => { n.textContent = v.toLocaleString(ctx.locale(), { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    if (instant) return show(target);
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / 1400); show(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

const list = (ctx, items) => (items || []).map((g) => `<li>${esc(ctx.tr(g))}</li>`).join('');

// Blocs de l'EPK : html (squelette), render (contenu, à chaque langue), theme (photos), setup (une fois)
export const BLOCKS = {
  stats: {
    html: () => '<div class="stats" id="stats"></div>',
    render(ctx, el) {
      $('#stats', el).innerHTML = (ctx.site.stats || []).map((s) =>
        `<div class="stat reveal"><div class="stat__value" data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">${s.value}${esc(s.suffix || '')}</div><div class="stat__label">${esc(ctx.tr(s.label))}</div></div>`).join('');
      countUp(ctx, el, true);
    },
    setup(ctx, el) {
      new IntersectionObserver((entries, obs) => {
        if (entries.some((e) => e.isIntersecting)) { countUp(ctx, el); obs.disconnect(); }
      }, { threshold: 0.4 }).observe($('#stats', el));
    },
  },
  bio: {
    html: () => `
      <div class="epk__grid">
        <article>
          <h3 class="h2" data-i18n="epk.bio">Bio</h3>
          <div id="bio" class="prose"></div>
        </article>
        <figure class="epk__portrait" id="aboutPhoto"></figure>
      </div>`,
    render(ctx, el) { $('#bio', el).innerHTML = (ctx.tr(ctx.site.bio) || []).map((p) => `<p>${esc(p)}</p>`).join(''); },
    theme(ctx, el) {
      const about = ctx.photo('aboutPhoto', 2);
      if (about) $('#aboutPhoto', el).innerHTML = `<img src="${drive.img(about.id, 1000)}" alt="${esc(ctx.artist)}" loading="lazy">`;
    },
  },
  sound: {
    html: () => `
      <h3 class="h2" data-i18n="epk.sound">Musical universe</h3>
      <p class="prose" id="music"></p>
      <ul class="chips" id="genres"></ul>`,
    render(ctx, el) {
      $('#music', el).textContent = ctx.tr(ctx.site.music) || '';
      $('#genres', el).innerHTML = list(ctx, ctx.site.genres);
    },
  },
  inspirations: {
    html: () => `
      <h3 class="h2" data-i18n="epk.inspirations">Inspirations</h3>
      <p class="prose" id="inspirations"></p>
      <ul class="chips chips--outline" id="influences"></ul>`,
    render(ctx, el) {
      $('#inspirations', el).textContent = ctx.tr(ctx.site.inspirations) || '';
      $('#influences', el).innerHTML = list(ctx, ctx.site.influences);
    },
  },
  photos: {
    html: () => `
      <h3 class="h2" data-i18n="epk.photos">Press photos</h3>
      <p class="hint" data-i18n="epk.photosHint"></p>
      <div class="gallery" id="gallery"></div>
      <div class="rail-count"></div>`,
    render(ctx, el) {
      $('#gallery', el).innerHTML = galleryHtml(ctx, ctx.photos, 'photos');
      requestAnimationFrame(() => setupRails(ctx, el));
    },
  },
  // Tout autre sous-dossier du Drive (ex : "Mixes", "Backstage") obtient automatiquement sa propre rubrique
  extra: {
    html: () => '<div id="extraFolders"></div>',
    render(ctx, el) {
      $('#extraFolders', el).innerHTML = ctx.folders.extra.map((f, k) => {
        const files = ctx.visible(ctx.allFiles(f));
        const imgs = files.filter((x) => x.kind === 'image');
        const vids = files.filter((x) => x.kind === 'video');
        const docs = files.filter((x) => !['image', 'video', 'sheet'].includes(x.kind));
        ctx.galleries[`extra${k}`] = imgs;
        return `<h3 class="h2">${esc(f.name)}</h3>
          ${imgs.length ? `<div class="gallery">${galleryHtml(ctx, imgs, `extra${k}`)}</div><div class="rail-count"></div>` : ''}
          ${vids.length ? `<div class="video-grid" style="margin-bottom:88px">${vids.map((v) => `<button class="vthumb" data-drive="${v.id}"><img class="vcard__img" src="${drive.thumb(v.id, 600)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="yt__play"></span></button>`).join('')}</div>` : ''}
          ${docs.length ? `<div class="downloads">${docs.map((d) => dlCard(ctx, d)).join('')}</div>` : ''}`;
      }).join('');
    },
  },
  downloads: {
    html: () => `
      <h3 class="h2" data-i18n="epk.downloads">Downloads</h3>
      <div class="downloads" id="downloads"></div>`,
    render(ctx, el) {
      const { t, logos } = ctx;
      const files = ctx.visible(ctx.tree.files).filter((f) => !['image', 'video', 'sheet'].includes(f.kind));
      files.sort((a, b) => /press/i.test(b.name) - /press/i.test(a.name));
      // Les logos tiennent en une seule carte : elle ouvre le dossier Drive (fichiers à l'unité ou tout en .zip)
      const logoFolder = ctx.folders.logos[0];
      const preview = logos.find((f) => /white|blanc/.test(norm(f.name))) || logos[0];
      const logoCard = logoFolder && logos.length
        ? `<a class="dl dl--logos reveal" href="https://drive.google.com/drive/folders/${logoFolder.id}" target="_blank" rel="noopener">
            <span class="dl__kind">${t('dl.logos')}</span>
            ${preview ? `<img class="dl__logo" src="${drive.img(preview.id, 400)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
            <span class="dl__name">${t('dl.logosName').replace('{n}', logos.length)}</span>
            <span class="dl__cta">${t('dl.open')} ↗</span></a>`
        : '';
      $('#downloads', el).innerHTML = files.map((f) => dlCard(ctx, f)).join('') + logoCard;
    },
  },
  setup: {
    html: () => `
      <h3 class="h2" data-i18n="epk.setup">Tech / Rider</h3>
      <ul class="setup" id="setup"></ul>`,
    render(ctx, el) { $('#setup', el).innerHTML = (ctx.tr(ctx.site.setup) || []).map((g) => `<li>${esc(g)}</li>`).join(''); },
  },
};

const blocksOf = (cfg) => (cfg.blocks || Object.keys(BLOCKS)).filter((b) => BLOCKS[b] || console.warn(`EPK : bloc inconnu "${b}"`));
const each = (cfg, hook, ...args) => blocksOf(cfg).forEach((b) => BLOCKS[b][hook]?.(...args));

export default {
  id: 'epk',
  nav: 'nav.epk',
  className: 'section epk',

  html: (ctx, cfg) => `
    <div class="wrap">
      <h2 class="epk__title">- EPK -</h2>
      <p class="epk__lead" data-i18n="epk.lead"></p>
      ${blocksOf(cfg).map((b) => BLOCKS[b].html(ctx)).join('')}
    </div>`,
  setup: (ctx, el, cfg) => each(cfg, 'setup', ctx, el),
  render: (ctx, el, cfg) => each(cfg, 'render', ctx, el),
  theme: (ctx, el, cfg) => each(cfg, 'theme', ctx, el),
};
