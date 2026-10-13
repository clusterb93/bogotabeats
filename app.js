// BogotaBeats — rendu du site à partir de content/*.json
// Rien à modifier ici pour mettre à jour le contenu : voir docs/MISE-A-JOUR.md

const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const root = document.documentElement;

// ---------- URLs Google Drive ----------
const drive = {
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
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
const params = new URLSearchParams(location.search);

// ---------- Chargement ----------
const load = (f, fallback) => fetch(`content/${f}`, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : fallback)).catch(() => fallback);
const [site, ui, sets, dates, tree] = await Promise.all([
  load('site.json', {}), load('ui.json', {}), load('sets.json', []), load('dates.json', []), load('drive.json', { files: [], folders: [] }),
]);

const LANGS = site.languages || Object.keys(ui);
const DEFAULT_LANG = site.defaultLang || 'en';
const pick = (l) => (LANGS.includes(l) ? l : null);
let lang = pick(params.get('lang')) || pick(store.get('lang')) || DEFAULT_LANG;
// defaultTheme : "dark" (Rave), "light" (Jungle) ou "auto" (suit le réglage clair/sombre de l'appareil)
if (!params.get('theme') && !store.get('theme')) {
  const pref = site.defaultTheme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : site.defaultTheme;
  if (pref === 'light' || pref === 'dark') root.dataset.theme = pref;
}

const t = (k) => ui[lang]?.[k] ?? ui[DEFAULT_LANG]?.[k] ?? k;
// Un champ de contenu peut être un texte simple ou { "en": ..., "fr": ..., "es": ... }
const tr = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v[lang] ?? v[DEFAULT_LANG] ?? Object.values(v)[0] : v);
// Un choix de photo peut être un nom de fichier ou { "dark": ..., "light": ... }
const forTheme = (v) => (v && typeof v === 'object' ? v[root.dataset.theme] ?? v.dark : v);

// ---------- Lecture du Drive : chaque dossier est rangé selon son nom ----------
const hidden = new Set((site.drive?.hiddenFiles || []).map(norm));
const visible = (files) => files.filter((f) => !hidden.has(norm(f.name)));
const allFiles = (f) => [...f.files, ...f.folders.flatMap(allFiles)];
const ROLES = [
  ['photos', /photo|pic|image|press/],
  ['logos', /logo/],
  ['videos', /video|clip|teaser|aftermovie/],
];
const folders = { photos: [], logos: [], videos: [], extra: [] };
for (const f of tree.folders) {
  const role = ROLES.find(([, re]) => re.test(norm(f.name)))?.[0] || 'extra';
  folders[role].push(f);
}
const filesOf = (role, kind) => visible(folders[role].flatMap(allFiles)).filter((f) => !kind || f.kind === kind);
const photos = filesOf('photos', 'image');
const logos = filesOf('logos', 'image');
const videos = filesOf('videos', 'video');
const byName = (list, name) => name && list.find((f) => norm(f.name) === norm(name));
const photo = (key, fallbackIndex) => byName(photos, forTheme(site.drive?.[key])) || photos[fallbackIndex] || photos[0];

// ---------- Rendu ----------
function renderChrome() {
  root.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#langs').innerHTML = LANGS.map((l) => `<button type="button" data-lang="${l}" class="${l === lang ? 'is-on' : ''}" aria-pressed="${l === lang}">${l.toUpperCase()}</button>`).join('');
  const dark = root.dataset.theme === 'dark';
  // Le bouton annonce le thème vers lequel on bascule
  $('#themeBtn').innerHTML = dark
    ? `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 4 6 8 6-2 1-3 3-3 5 0 4-3 8-8 9 3-3 3-7 1-10-2-2-5-3-8-2 2-4 6-7 10-8z"/></svg>${t('theme.light')}`
    : `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>${t('theme.dark')}`;
  $('#themeBtn').setAttribute('aria-label', t('theme.switch'));
  $('meta[name="theme-color"]').content = dark ? '#07050b' : '#f4e8d4';
}

function renderBrand() {
  const logoName = forTheme(site.drive?.logo);
  const logo = byName(logos, logoName) || logos.find((f) => /white|blanc/.test(norm(f.name))) || logos[0];
  // Le logo du héros reste lisible sur la photo : blanc en Rave, couleur terre en Jungle
  if (logo) {
    $('#navLogo').src = drive.img(logo.id, 400);
    $('#heroLogo').src = drive.img(logo.id, 1000);
  }
  const hero = photo('hero', 0);
  if (hero) {
    const heroM = byName(photos, forTheme(site.drive?.heroMobile)) || hero;
    $('#heroPic').innerHTML = `
      <source media="(max-width: 700px)" srcset="${drive.img(heroM.id, 900)}">
      <img src="${drive.img(hero.id, 2200)}" alt="BogotaBeats" fetchpriority="high">`;
    // Cadrage facultatif de la photo d'accueil : "heroPosition": { "dark": "50% 20%", "light": "40% 30%" }
    const pos = forTheme(site.drive?.heroPosition);
    $('.hero').style.setProperty('--hero-pos', pos || '50% 25%');
  }
  const booking = photo('bookingPhoto', 1);
  if (booking) $('#contactBg').innerHTML = `<img src="${drive.img(booking.id, 1800)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  const about = photo('aboutPhoto', 2);
  if (about) $('#aboutPhoto').innerHTML = `<img src="${drive.img(about.id, 1000)}" alt="BogotaBeats" loading="lazy">`;
}

function ytInfo(url = '') {
  const id = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(url) ? url : null);
  const tm = url.match(/[?&](?:t|start)=(\d+)/);
  return { id, start: tm ? +tm[1] : 0 };
}

function renderSets() {
  $('#setsGrid').innerHTML = sets.map((s) => {
    const { id, start } = ytInfo(s.url || s.youtube);
    if (!id) return '';
    return `<article class="set reveal">
      <button class="yt" data-yt="${id}" data-start="${start}" style="background-image:url('https://i.ytimg.com/vi/${id}/hqdefault.jpg')" aria-label="${esc(tr(s.title))}"><span class="yt__play"></span></button>
      <div class="set__meta"><h3 class="set__title">${esc(tr(s.title))}</h3>${s.where ? `<p class="set__where">${esc(tr(s.where))}</p>` : ''}</div>
    </article>`;
  }).join('');
}

const LOCALES = { en: 'en-GB', fr: 'fr-FR', es: 'es-ES' };
const fmt = (iso, opts) => new Date(`${iso}T12:00:00`).toLocaleDateString(LOCALES[lang] || lang, opts);
function gigRow(d) {
  const where = [d.venue, d.city].filter(Boolean).join(' · ');
  const type = (d.type || 'club').toLowerCase();
  const badge = d.link
    ? `<a class="btn btn--ghost btn--sm" href="${esc(d.link)}" target="_blank" rel="noopener">${t('dates.info')}</a>`
    : `<span class="gig__type gig__type--${esc(type)}">${esc(t(`type.${type}`) === `type.${type}` ? type : t(`type.${type}`))}</span>`;
  return `<li class="gig reveal">
    <div class="gig__date"><span class="gig__day">${fmt(d.date, { day: '2-digit' })}</span><span class="gig__month">${fmt(d.date, { month: 'short' }).replace('.', '')}</span><span class="gig__year">${d.date.slice(0, 4)}</span></div>
    <div><p class="gig__event">${esc(tr(d.event))}</p>${where ? `<p class="gig__where">${esc(where)}</p>` : ''}</div>
    ${badge}
  </li>`;
}

const PAST_VISIBLE = 6;
let showAllPast = false;
function renderDates() {
  // Le tri à venir / passé se fait tout seul selon la date du jour
  const today = new Date().toISOString().slice(0, 10);
  const valid = dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d.date));
  const upcoming = valid.filter((d) => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = valid.filter((d) => d.date < today).sort((a, b) => b.date.localeCompare(a.date));

  $('#upcoming').innerHTML = upcoming.length
    ? `<h3 class="h3" style="margin-top:0">${t('dates.upcoming')}</h3><ol class="gigs">${upcoming.map(gigRow).join('')}</ol>`
    : `<div class="empty-upcoming reveal"><p>${t('dates.none')}</p><a class="btn btn--accent btn--sm" href="#contact">${t('dates.book')}</a></div>`;

  $('#past').innerHTML = (showAllPast ? past : past.slice(0, PAST_VISIBLE)).map(gigRow).join('');
  $('#morePast').hidden = showAllPast || past.length <= PAST_VISIBLE;
}

// ---------- Carrousel vidéos ----------
// La carte centrée est "active" ; un clic dessus lance la vidéo, un clic sur une voisine la centre.
// Quitter une vidéo en cours l'arrête (l'iframe est retirée).
const carousel = { list: [], index: 0, built: false };

function renderVideos() {
  if (!videos.length) { $('#videos').hidden = true; return; }
  if (carousel.built) return; // les vidéos ne dépendent pas de la langue
  const featured = byName(videos, site.drive?.featuredVideo);
  carousel.list = featured ? [featured, ...videos.filter((v) => v !== featured)] : videos;
  $('#vidTrack').innerHTML = carousel.list.map((v, i) => `
    <div class="vcard" data-i="${i}">
      <button class="vcard__media" type="button" data-vid="${i}" aria-label="Video ${i + 1}">
        <img class="vcard__img" src="${drive.thumb(v.id, 900)}" alt="" loading="lazy" draggable="false" referrerpolicy="no-referrer">
        <span class="yt__play"></span>
        <span class="vcard__num">${String(i + 1).padStart(2, '0')}</span>
      </button>
    </div>`).join('');
  carousel.built = true;
  setupCarousel();
}

function setupCarousel() {
  const box = $('#videoCarousel');
  const cards = [...box.querySelectorAll('.vcard')];
  const total = cards.length;

  const stop = (card) => {
    const media = card.querySelector('.vcard__media');
    media.querySelector('iframe')?.remove();
    card.classList.remove('is-playing');
  };
  const setActive = (i) => {
    if (i === carousel.index && cards[i].classList.contains('is-active')) return;
    cards.forEach((c, k) => {
      c.classList.toggle('is-active', k === i);
      if (k !== i) stop(c);
    });
    carousel.index = i;
    $('#vidCount').innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b> / ${String(total).padStart(2, '0')}`;
    $('#vidBar').style.width = `${((i + 1) / total) * 100}%`;
    $('#vidPrev').disabled = i === 0;
    $('#vidNext').disabled = i === total - 1;
  };
  const goTo = (i, smooth = true) => {
    i = Math.max(0, Math.min(total - 1, i));
    const c = cards[i];
    box.scrollTo({ left: c.offsetLeft - (box.clientWidth - c.offsetWidth) / 2, behavior: smooth ? 'smooth' : 'auto' });
    setActive(i);
  };
  // Carte la plus proche du centre pendant le défilement (swipe, trackpad, molette)
  const nearest = () => {
    const mid = box.scrollLeft + box.clientWidth / 2;
    let best = 0, dist = Infinity;
    cards.forEach((c, k) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < dist) { dist = d; best = k; } });
    return best;
  };
  let raf;
  box.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setActive(nearest())); }, { passive: true });

  $('#vidPrev').onclick = () => goTo(carousel.index - 1);
  $('#vidNext').onclick = () => goTo(carousel.index + 1);
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

function renderStats() {
  $('#stats').innerHTML = (site.stats || []).map((s) =>
    `<div class="stat reveal"><div class="stat__value" data-count="${s.value}" data-suffix="${esc(s.suffix || '')}">${s.value}${esc(s.suffix || '')}</div><div class="stat__label">${esc(tr(s.label))}</div></div>`).join('');
  countUp(true);
}

function renderEpkText() {
  $('#tagline').textContent = tr(site.tagline) || '';
  if (site.listenUrl) $('#listenBtn').href = site.listenUrl;
  else $('#listenBtn').removeAttribute('target'); // sans lien : le bouton descend vers les sets
  $('#bio').innerHTML = (tr(site.bio) || []).map((p) => `<p>${esc(p)}</p>`).join('');
  $('#music').textContent = tr(site.music) || '';
  $('#inspirations').textContent = tr(site.inspirations) || '';
  $('#genres').innerHTML = (site.genres || []).map((g) => `<li>${esc(tr(g))}</li>`).join('');
  $('#influences').innerHTML = (site.influences || []).map((g) => `<li>${esc(tr(g))}</li>`).join('');
  $('#setup').innerHTML = (tr(site.setup) || []).map((g) => `<li>${esc(g)}</li>`).join('');
}

let lbList = [], lbIndex = 0;
const galleries = { photos };
const galleryHtml = (list, group) => list.map((p, i) =>
  `<button data-lb="${group}" data-i="${i}" aria-label="${esc(p.name)}"><img src="${drive.img(p.id, 700)}" alt="BogotaBeats" loading="lazy"></button>`).join('');

function dlCard(f) {
  const n = norm(f.name);
  const isPresskit = /press ?kit|epk|dossier de presse/.test(n);
  const kind = isPresskit ? t('dl.presskit') : /fiche|technical|rider|tech/.test(n) ? t('dl.rider') : t('dl.doc');
  const href = drive.pdf(f) || drive.view(f);
  const label = f.name.replace(/\.(pdf|docx?)$/i, '');
  return `<a class="dl ${isPresskit ? 'dl--main' : ''} reveal" href="${href}" target="_blank" rel="noopener">
    <span class="dl__kind">${kind}</span><span class="dl__name">${esc(label)}</span><span class="dl__cta">${drive.pdf(f) ? t('dl.pdf') : t('dl.open')} ↗</span></a>`;
}

function renderGallery() {
  $('#gallery').innerHTML = galleryHtml(photos, 'photos');
  // Tout autre sous-dossier du Drive (ex : "Flyers", "Mixes") obtient automatiquement sa propre section
  $('#extraFolders').innerHTML = folders.extra.map((f, k) => {
    const files = visible(allFiles(f));
    const imgs = files.filter((x) => x.kind === 'image');
    const vids = files.filter((x) => x.kind === 'video');
    const docs = files.filter((x) => !['image', 'video', 'sheet'].includes(x.kind));
    galleries[`extra${k}`] = imgs;
    return `<h3 class="h2">${esc(f.name)}</h3>
      ${imgs.length ? `<div class="gallery">${galleryHtml(imgs, `extra${k}`)}</div>` : ''}
      ${vids.length ? `<div class="video-grid" style="margin-bottom:88px">${vids.map((v) => `<button class="vthumb" data-drive="${v.id}"><img class="vcard__img" src="${drive.thumb(v.id, 600)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="yt__play"></span></button>`).join('')}</div>` : ''}
      ${docs.length ? `<div class="downloads">${docs.map(dlCard).join('')}</div>` : ''}`;
  }).join('');
}

function renderDownloads() {
  const files = visible(tree.files).filter((f) => !['image', 'video', 'sheet'].includes(f.kind));
  files.sort((a, b) => /press/i.test(b.name) - /press/i.test(a.name));
  $('#downloads').innerHTML = files.map(dlCard).join('');
  $('#logos').innerHTML = logos.map((l) => {
    const onDark = /white|blanc/.test(norm(l.name));
    return `<a class="logo-card" href="${drive.download(l.id)}" target="_blank" rel="noopener">
      <div class="logo-card__img ${onDark ? '' : 'logo-card__img--light'}"><img src="${drive.img(l.id, 500)}" alt="${esc(l.name)}" loading="lazy"></div>
      <span>${esc(l.name)} ↓</span></a>`;
  }).join('');
}

function renderContact() {
  const c = site.contact || {};
  $('#mailLink').href = `mailto:${c.email}?subject=${encodeURIComponent('Booking BogotaBeats')}`;
  $('#mailLink').textContent = c.email || '';
  if (c.phone) { $('#phoneLink').href = `tel:${c.phoneIntl || c.phone}`; $('#phoneLink').textContent = c.phone; }
  $('#socials').innerHTML = (site.socials || []).map((s) => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join('');
  $('#year').textContent = new Date().getFullYear();
  $('#syncInfo').textContent = tree.syncedAt ? `${t('footer.sync')} ${fmt(tree.syncedAt.slice(0, 10), { dateStyle: 'medium' })}` : '';
}

function renderAll() {
  renderChrome();
  renderBrand();
  renderEpkText();
  renderSets();
  renderDates();
  renderVideos();
  renderStats();
  renderGallery();
  renderDownloads();
  renderContact();
  observeReveal();
}

// ---------- Interactions ----------
document.addEventListener('click', (e) => {
  const yt = e.target.closest('[data-yt]');
  if (yt) {
    yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${yt.dataset.yt}?autoplay=1&start=${yt.dataset.start || 0}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen title="YouTube"></iframe>`;
    yt.removeAttribute('data-yt');
    return;
  }
  const dv = e.target.closest('[data-drive]');
  if (dv) {
    dv.innerHTML = `<iframe src="${drive.preview(dv.dataset.drive)}" allow="autoplay; fullscreen" allowfullscreen title="Video"></iframe>`;
    dv.removeAttribute('data-drive');
    return;
  }
  const lb = e.target.closest('[data-lb]');
  if (lb) { lbList = galleries[lb.dataset.lb] || []; openLb(+lb.dataset.i); return; }
  const lg = e.target.closest('[data-lang]');
  if (lg) { lang = lg.dataset.lang; store.set('lang', lang); renderAll(); }
});

$('#themeBtn').addEventListener('click', () => {
  root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  store.set('theme', root.dataset.theme);
  renderChrome();
  renderBrand();
});
$('#morePast').addEventListener('click', () => { showAllPast = true; renderDates(); observeReveal(); });

// Lightbox
function openLb(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const p = lbList[lbIndex];
  $('#lbImg').src = drive.img(p.id, 2000);
  $('#lbDl').href = drive.download(p.id);
  $('#lightbox').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeLb() { $('#lightbox').hidden = true; document.body.style.overflow = ''; }
$('#lbClose').onclick = closeLb;
$('#lbPrev').onclick = () => openLb(lbIndex - 1);
$('#lbNext').onclick = () => openLb(lbIndex + 1);
$('#lightbox').addEventListener('click', (e) => { if (e.target.id === 'lightbox') closeLb(); });
document.addEventListener('keydown', (e) => {
  if ($('#lightbox').hidden) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') openLb(lbIndex - 1);
  if (e.key === 'ArrowRight') openLb(lbIndex + 1);
});

// Nav : fond au scroll, menu mobile, lien actif
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('is-solid', scrollY > 40);
addEventListener('scroll', onScroll, { passive: true });
onScroll();
$('#burger').onclick = () => { const open = nav.classList.toggle('is-open'); $('#burger').setAttribute('aria-expanded', open); };
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('is-open'); });
const links = [...document.querySelectorAll('.nav__links a')];
const sectionObs = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section').forEach((s) => sectionObs.observe(s));

// Apparitions + compteurs
let revealObs;
function observeReveal() {
  revealObs ??= new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => revealObs.observe(el));
}
function countUp(instant = false) {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = +el.dataset.count, suffix = el.dataset.suffix, dec = String(target).includes('.') ? 1 : 0;
    const show = (v) => { el.textContent = v.toLocaleString(LOCALES[lang], { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix; };
    if (instant) return show(target);
    const t0 = performance.now();
    const step = (now) => { const k = Math.min(1, (now - t0) / 1400); show(target * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

renderAll();
new IntersectionObserver((entries, obs) => {
  if (entries.some((e) => e.isIntersecting)) { countUp(); obs.disconnect(); }
}, { threshold: 0.4 }).observe($('#stats'));
