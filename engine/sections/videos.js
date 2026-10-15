// Carrousel des vidéos du Drive (dossier "Videos") ; site.json → drive.featuredVideo passe en premier.
// La carte centrée est "active" ; un clic dessus lance la vidéo, un clic sur une voisine la centre.
// Quitter une vidéo en cours l'arrête (l'iframe est retirée).
import { $, drive, pad2, nearestChild } from '../core.js';

const carousel = { list: [], index: 0, built: false };

function setupCarousel(el) {
  const box = $('#videoCarousel', el);
  const cards = [...box.querySelectorAll('.vcard')];
  const total = cards.length;

  const stop = (card) => {
    card.querySelector('.vcard__media iframe')?.remove();
    card.classList.remove('is-playing');
  };
  const setActive = (i) => {
    if (i === carousel.index && cards[i].classList.contains('is-active')) return;
    cards.forEach((c, k) => {
      c.classList.toggle('is-active', k === i);
      if (k !== i) stop(c);
    });
    carousel.index = i;
    $('#vidCount', el).innerHTML = `<b>${pad2(i + 1)}</b> / ${pad2(total)}`;
    $('#vidBar', el).style.width = `${((i + 1) / total) * 100}%`;
    $('#vidPrev', el).disabled = i === 0;
    $('#vidNext', el).disabled = i === total - 1;
  };
  const goTo = (i, smooth = true) => {
    i = Math.max(0, Math.min(total - 1, i));
    const c = cards[i];
    box.scrollTo({ left: c.offsetLeft - (box.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
    setActive(i);
  };
  // Carte la plus proche du centre pendant le défilement (swipe, trackpad, molette)
  const nearest = () => nearestChild(box, cards);
  let raf;
  box.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setActive(nearest())); }, { passive: true });

  $('#vidPrev', el).onclick = () => goTo(carousel.index - 1);
  $('#vidNext', el).onclick = () => goTo(carousel.index + 1);
  box.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(carousel.index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(carousel.index + 1); }
  });

  // Glisser à la souris sur ordinateur (le tactile utilise le défilement natif)
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: box.scrollLeft, moved: false };
    box.classList.add('is-dragging');
  });
  addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    box.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    box.classList.remove('is-dragging');
    const moved = drag.moved;
    drag = null;
    if (moved) { goTo(nearest()); box.dataset.justDragged = '1'; setTimeout(() => delete box.dataset.justDragged, 50); }
  });

  box.addEventListener('click', (e) => {
    const media = e.target.closest('[data-vid]');
    if (!media || box.dataset.justDragged) return;
    const i = +media.dataset.vid;
    if (i !== carousel.index) { goTo(i); return; }
    if (media.querySelector('iframe')) return;
    media.insertAdjacentHTML('beforeend', `<iframe src="${drive.preview(carousel.list[i].id)}" allow="autoplay; fullscreen" allowfullscreen title="Video ${i + 1}"></iframe>`);
    cards[i].classList.add('is-playing');
  });

  addEventListener('resize', () => goTo(carousel.index, false));
  requestAnimationFrame(() => goTo(0, false));
}

export default {
  id: 'videos',
  nav: 'nav.videos',
  className: 'section',

  html: () => `
    <div class="wrap">
      <div class="carousel__head">
        <h2 class="h2" data-i18n="videos.title">Videos</h2>
        <div class="carousel__ctrl">
          <span class="carousel__count" id="vidCount" aria-live="polite"></span>
          <button class="carousel__arrow" id="vidPrev" type="button" aria-label="Previous">←</button>
          <button class="carousel__arrow" id="vidNext" type="button" aria-label="Next">→</button>
        </div>
      </div>
    </div>
    <div class="carousel" id="videoCarousel" tabindex="0" aria-roledescription="carousel" aria-label="Videos">
      <div class="carousel__track" id="vidTrack"></div>
    </div>
    <div class="wrap">
      <div class="carousel__progress"><span id="vidBar"></span></div>
    </div>`,

  render(ctx, el) {
    const { videos } = ctx;
    if (!videos.length) { ctx.hideSection(el.id); return; }
    if (carousel.built) return; // les vidéos ne dépendent pas de la langue
    const featured = ctx.byName(videos, ctx.site.drive?.featuredVideo);
    carousel.list = featured ? [featured, ...videos.filter((v) => v !== featured)] : videos;
    $('#vidTrack', el).innerHTML = carousel.list.map((v, i) => `
      <div class="vcard" data-i="${i}">
        <button class="vcard__media" type="button" data-vid="${i}" aria-label="Video ${i + 1}">
          <img class="vcard__img" src="${drive.thumb(v.id, 900)}" alt="" loading="lazy" draggable="false" referrerpolicy="no-referrer">
          <span class="yt__play"></span>
          <span class="vcard__num">${pad2(i + 1)}</span>
        </button>
      </div>`).join('');
    carousel.built = true;
    setupCarousel(el);
  },

  track(target) {
    const x = target.closest('[data-vid]');
    if (x) return ['play_video', { video_id: carousel.list[+x.dataset.vid]?.id || x.dataset.vid }];
  },
};
