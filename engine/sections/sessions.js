// Live sessions YouTube (content/sets.json) : miniatures, lecteur chargé au clic (data-yt, géré par app.js).
import { $, esc } from '../core.js';

export function ytInfo(url = '') {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(url) ? url : null);
  const tm = url.match(/[?&](?:t|start)=(\d+)/);
  return { id, start: tm ? +tm[1] : 0 };
}

export default {
  id: 'sets',
  nav: 'nav.sets',
  className: 'section',

  html: () => `
    <div class="wrap">
      <h2 class="h2" data-i18n="sets.title">Live sessions</h2>
      <p class="section__sub" data-i18n="sets.sub"></p>
      <div class="sets" id="setsGrid"></div>
    </div>`,

  render(ctx, el) {
    if (!ctx.sets.length) { ctx.hideSection(el.id); return; }
    $('#setsGrid', el).innerHTML = ctx.sets.map((s) => {
      const { id, start } = ytInfo(s.url || s.youtube);
      if (!id) return '';
      return `<article class="set reveal">
        <button class="yt" data-yt="${id}" data-start="${start}" style="background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')" aria-label="${esc(ctx.tr(s.title))}"><span class="yt__play"></span></button>
        <div class="set__meta"><h3 class="set__title">${esc(ctx.tr(s.title))}</h3>${s.where ? `<p class="set__where">${esc(ctx.tr(s.where))}</p>` : ''}</div>
      </article>`;
    }).join('');
  },
};
