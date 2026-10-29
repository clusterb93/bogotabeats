// Productions de l'artiste (content/releases.json) : morceaux sortis et à venir.
// Statut automatique d'après "date" (AAAA-MM-JJ) : passée = sorti (lecteur Bandcamp + bouton d'achat),
// absente ou future = « Coming soon » (extrait local "teaser" lu par un petit lecteur maison).
// Le lecteur Bandcamp n'est chargé qu'à l'approche de la section et reprend les couleurs du thème.
import { $, esc, root } from '../core.js';

const today = () => new Date().toISOString().slice(0, 10);
const isOut = (r) => r.date && r.date <= today();
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const cssColor = (v) => getComputedStyle(root).getPropertyValue(v).trim().replace('#', '');
const bcSrc = (id) => `https://bandcamp.com/EmbeddedPlayer/track=${id}/size=large/bgcol=${root.dataset.theme === 'light' ? 'ffffff' : '333333'}/linkcol=${cssColor('--accent')}/tracklist=false/artwork=none/transparent=true/`;

let visible = false;
function loadPlayers(el) {
  el.querySelectorAll('[data-bc]').forEach((box) => {
    box.innerHTML = `<iframe src="${bcSrc(box.dataset.bc)}" title="Bandcamp" loading="lazy" seamless></iframe>`;
  });
}

export default {
  id: 'music',
  nav: 'nav.music',
  className: 'section releases',

  html: () => `
    <div class="wrap">
      <h2 class="h2" data-i18n="music.title">Productions</h2>
      <p class="section__sub" data-i18n="music.sub"></p>
      <div class="releases__grid" id="releasesGrid"></div>
    </div>`,

  setup(ctx, el) {
    // Lecteur de l'extrait : un seul <audio> par carte, bouton lecture/pause + barre cliquable
    el.addEventListener('click', (e) => {
      const btn = e.target.closest('.teaser__play');
      if (btn) {
        const audio = btn.closest('.teaser').querySelector('audio');
        if (audio.paused) audio.play(); else audio.pause();
        return;
      }
      const bar = e.target.closest('.teaser__bar');
      if (bar) {
        const audio = bar.closest('.teaser').querySelector('audio');
        if (isFinite(audio.duration)) audio.currentTime = ((e.clientX - bar.getBoundingClientRect().left) / bar.offsetWidth) * audio.duration;
      }
    });
    new IntersectionObserver((entries, obs) => {
      if (entries.some((x) => x.isIntersecting)) { obs.disconnect(); visible = true; loadPlayers(el); }
    }, { rootMargin: '400px' }).observe(el);
  },

  render(ctx, el) {
    const list = ctx.releases || [];
    if (!list.length) { ctx.hideSection(el.id); return; }
    // Les morceaux sortis d'abord (du plus récent au plus ancien), puis ceux à venir
    const sorted = [...list].sort((a, b) => (!!isOut(b) - !!isOut(a)) || String(b.date || '').localeCompare(String(a.date || '')));
    $('#releasesGrid', el).innerHTML = sorted.map((r) => {
      const out = isOut(r);
      const meta = [r.release, r.label].filter(Boolean).map((x) => esc(ctx.tr(x))).join(' · ');
      const cover = r.cover
        ? `<img src="${esc(r.cover)}" alt="${esc(ctx.tr(r.title))}" loading="lazy" referrerpolicy="no-referrer">`
        : `<span class="release__ph" aria-hidden="true">${esc(ctx.tr(r.title))}</span>`;
      return `<article class="release reveal${out ? '' : ' release--soon'}">
        <div class="release__cover">${cover}<span class="release__badge">${esc(ctx.t(out ? 'music.out' : 'music.soon'))}</span></div>
        <div class="release__body">
          <p class="release__genre">${esc(ctx.tr(r.genre || ''))}</p>
          <h3 class="release__title">${esc(ctx.tr(r.title))}</h3>
          ${meta || out ? `<p class="release__meta">${meta}${out ? `${meta ? ' · ' : ''}${esc(ctx.fmt(r.date, { day: 'numeric', month: 'short', year: 'numeric' }))}` : ''}</p>` : ''}
          ${out && r.bandcampTrack ? `<div class="release__player" data-bc="${esc(r.bandcampTrack)}"></div>` : ''}
          ${!out && r.teaser ? `<div class="teaser">
            <audio src="${esc(r.teaser)}" preload="none" controlslist="nodownload"></audio>
            <button class="teaser__play" type="button" aria-label="${esc(ctx.t('music.play'))}"></button>
            <div class="teaser__txt"><span class="teaser__label">${esc(ctx.t('music.teaser'))}</span>
              <span class="teaser__bar"><span></span></span></div>
            <span class="teaser__time">0:00</span>
          </div>` : ''}
          ${out && r.bandcamp ? `<a class="btn btn--accent btn--sm release__buy" href="${esc(r.bandcamp)}" target="_blank" rel="noopener">${esc(ctx.t('music.buy'))}</a>` : ''}
        </div>
      </article>`;
    }).join('');
    el.querySelectorAll('.teaser').forEach((tz) => {
      const audio = $('audio', tz), fill = $('.teaser__bar span', tz), time = $('.teaser__time', tz);
      const on = (playing) => tz.classList.toggle('is-playing', playing);
      audio.addEventListener('play', () => { document.querySelectorAll('audio').forEach((a) => a !== audio && a.pause()); on(true); });
      audio.addEventListener('pause', () => on(false));
      audio.addEventListener('ended', () => { on(false); audio.currentTime = 0; });
      audio.addEventListener('timeupdate', () => {
        if (isFinite(audio.duration)) fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        time.textContent = mmss(audio.currentTime);
      });
    });
    if (visible) loadPlayers(el);
  },

  // Le lecteur Bandcamp reprend les couleurs du thème
  theme(ctx, el) { if (visible) loadPlayers(el); },

  track(target, ctx) {
    const card = target.closest('.release');
    const title = card?.querySelector('.release__title')?.textContent || '';
    if (target.closest('.release__buy')) return ['buy_release', { release_title: title }];
    if (target.closest('.teaser__play')) return ['play_teaser', { release_title: title }];
  },
};
