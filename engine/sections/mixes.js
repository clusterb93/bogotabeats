// Mixes SoundCloud (content/mixes.json) : platine vinyle + tracklist.
// Titres et pochettes viennent de l'oEmbed SoundCloud (mixes.json ne contient que les liens).
// Le lecteur est piloté par l'API Widget officielle : le vinyle tourne seulement pendant la lecture.
// Le bouton « Tous les mixes » mène à site.json → listenUrl.
import { $, esc, root, pad2 } from '../core.js';

const mix = { list: [], index: 0, iframe: null, widget: null, built: false };
const scArt = (url, size) => (url ? url.replace(/-t\d+x\d+\./, `-${size}.`) : '');
const scOptions = () => ({
  color: getComputedStyle(root).getPropertyValue('--accent').trim().replace('#', ''),
  hide_related: true, show_comments: false, show_user: false, show_reposts: false, show_teaser: false, visual: false,
});
const loadScApi = () => (window.SC?.Widget ? Promise.resolve() : new Promise((res, rej) => {
  const s = document.createElement('script');
  s.src = 'https://w.soundcloud.com/player/api.js';
  s.onload = res; s.onerror = rej;
  document.head.append(s);
}));

// Retire le nom de l'artiste des titres SoundCloud ("Mix by Artiste", "Artiste - Mix")
let cleanTitle = (s = '') => s.trim();
function makeCleaner(artist) {
  if (!artist) return;
  const a = artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const by = new RegExp(` by ${a}$`, 'i'), before = new RegExp(`^${a}\\s*[-–]\\s*`, 'i'), after = new RegExp(`\\s*[-–]\\s*${a}$`, 'i');
  cleanTitle = (s = '') => s.replace(by, '').replace(before, '').replace(after, '').trim();
}

let ctx;
function selectMix(i, autoplay) {
  mix.index = i;
  const m = mix.list[i];
  document.querySelectorAll('.track').forEach((b, k) => b.classList.toggle('is-current', k === i));
  $('#vinylLabel').innerHTML = m.art ? `<img src="${scArt(m.art, 't500x500')}" alt="" referrerpolicy="no-referrer">` : '';
  $('#deckTitle').textContent = ctx.tr(m.title);
  $('#deckWhere').textContent = m.where ? ctx.tr(m.where) : '';
  if (mix.widget) mix.widget.load(m.url, { ...scOptions(), auto_play: autoplay });
  else if (autoplay) ensurePlayer(true);
}

async function ensurePlayer(autoplay) {
  if (mix.iframe) return;
  const m = mix.list[mix.index];
  const qs = new URLSearchParams({ url: m.url, auto_play: autoplay, ...scOptions() });
  mix.iframe = document.createElement('iframe');
  Object.assign(mix.iframe, { title: 'SoundCloud', allow: 'autoplay; encrypted-media', referrerPolicy: 'strict-origin-when-cross-origin', src: `https://w.soundcloud.com/player/?${qs}` });
  $('#deckWidget').append(mix.iframe);
  try {
    await loadScApi();
    mix.widget = window.SC.Widget(mix.iframe);
    const E = window.SC.Widget.Events;
    const playing = (on) => $('#deck').classList.toggle('is-playing', on);
    mix.widget.bind(E.PLAY, () => playing(true));
    mix.widget.bind(E.PAUSE, () => playing(false));
    mix.widget.bind(E.FINISH, () => { playing(false); if (mix.index < mix.list.length - 1) selectMix(mix.index + 1, true); });
  } catch { /* l'API ne charge pas : le lecteur reste utilisable, sans animation du vinyle */ }
}

export default {
  id: 'mixes',
  nav: 'nav.mixes',
  className: 'section mixes',

  html: () => `
    <div class="wrap">
      <h2 class="h2" data-i18n="mixes.title">Mixes</h2>
      <p class="section__sub" data-i18n="mixes.sub"></p>
      <div class="deck" id="deck">
        <div class="deck__player">
          <div class="turntable">
            <div class="vinyl" id="vinyl"><div class="vinyl__label" id="vinylLabel"></div></div>
            <div class="tonearm" aria-hidden="true"></div>
          </div>
          <div class="deck__now">
            <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <div><p class="deck__title" id="deckTitle"></p><p class="deck__where" id="deckWhere"></p></div>
          </div>
          <div class="deck__widget" id="deckWidget"></div>
        </div>
        <ol class="tracklist" id="tracklist"></ol>
      </div>
      <a class="btn btn--ghost btn--sm mixes__all" id="allMixes" target="_blank" rel="noopener" data-i18n="mixes.more"></a>
    </div>`,

  setup(c, el) {
    ctx = c;
    makeCleaner(ctx.artist);
    $('#tracklist', el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-mix]');
      if (!b) return;
      const i = +b.dataset.mix;
      if (i === mix.index && mix.widget) mix.widget.toggle();
      else selectMix(i, true);
    });
    $('#vinyl', el).addEventListener('click', () => (mix.widget ? mix.widget.toggle() : ensurePlayer(true)));
  },

  async render(c, el) {
    if (mix.built) return;
    mix.built = true;
    const { mixes, site } = ctx;
    if (!mixes.length) { ctx.hideSection(el.id); return; }
    $('#allMixes', el).href = site.listenUrl || 'https://soundcloud.com';
    const metas = await Promise.all(mixes.map((m) =>
      fetch(`https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(m.url)}`).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
    mix.list = mixes.map((m, i) => ({
      ...m,
      title: m.title || cleanTitle(metas[i]?.title) || m.url.split('/').pop(),
      art: m.artwork || metas[i]?.thumbnail_url || '',
    }));
    $('#tracklist', el).innerHTML = mix.list.map((m, i) => `
      <li><button type="button" class="track" data-mix="${i}">
        <span class="track__num">${pad2(i + 1)}</span>
        ${m.art ? `<img class="track__art" src="${scArt(m.art, 't200x200')}" alt="" loading="lazy" referrerpolicy="no-referrer">` : '<span class="track__art"></span>'}
        <span class="track__txt"><span class="track__title">${esc(ctx.tr(m.title))}</span>${m.where ? `<span class="track__where">${esc(ctx.tr(m.where))}</span>` : ''}</span>
        <span class="eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="track__play" aria-hidden="true"></span>
      </button></li>`).join('');
    selectMix(0, false);
    // Le lecteur SoundCloud n'est chargé qu'à l'approche de la section (page plus légère)
    new IntersectionObserver((entries, obs) => {
      if (entries.some((e) => e.isIntersecting)) { obs.disconnect(); ensurePlayer(false); }
    }, { rootMargin: '400px' }).observe(el);
  },

  track(target) {
    const x = target.closest('[data-mix]');
    if (x) return ['play_mix', { mix_title: cleanTitle(mix.list[+x.dataset.mix]?.title || '') }];
    if (target.closest('#vinyl')) return ['play_mix', { mix_title: cleanTitle(mix.list[mix.index]?.title || '') }];
  },
};
