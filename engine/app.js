// Moteur — construit la page à partir de content/*.json.
// Les sections affichées, leur ordre et leurs options viennent de site.json → "sections"
// (types disponibles : engine/sections/index.js). Rien à modifier ici pour mettre à jour le contenu :
// voir docs/MISE-A-JOUR.md.
import { $, esc, root, store, params, drive, createContext } from './core.js';
import { SECTIONS, DEFAULT_SECTIONS, DECOR } from './sections/index.js';

const ctx = await createContext();
const { site, t } = ctx;

// defaultTheme : "dark" (Rave), "light" (Jungle) ou "auto" (suit le réglage clair/sombre de l'appareil)
if (!params.get('theme') && !store.get('theme')) {
  const pref = site.defaultTheme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : site.defaultTheme;
  if (pref === 'light' || pref === 'dark') root.dataset.theme = pref;
}

// ---------- Thèmes ----------
const THEMES = [
  { id: 'dark', name: 'rave', color: '#07050b', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 2 4 14h6.5L9 22l10-12.5h-6.6L13.5 2z"/></svg>' },
  { id: 'light', name: 'jungle', color: '#f4e8d4', icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 3.5C11 3.6 4.6 8.6 4.1 16.4c-.1 1.2 0 2.4.3 3.4-.8.6-1.5 1.2-2 1.7l1.1 1.1c.5-.6 1.2-1.2 1.9-1.8 1 .4 2.1.6 3.3.6 7.7 0 12.3-6.8 11.8-17.9zM6.7 18.4c2.6-2.6 5.9-5.3 9.6-7.7l-.8-1.2c-3.8 2.4-7.1 5.1-9.7 7.7-.1-.3-.1-.6-.1-.9.4-6.1 5.1-10.3 13.3-10.9.1 8.9-3.8 14-9.9 14-.9 0-1.7-.3-2.4-1z"/></svg>' },
];
const currentTheme = () => THEMES.find((th) => th.id === root.dataset.theme) || THEMES[0];

// ---------- Construction des sections ----------
// Chaque entrée : { "type": "...", "id"?, "nav"?: clé ui.json | false, "alt"?: fond alterné, "decor"?, ...options du type }
const sections = (site.sections || DEFAULT_SECTIONS)
  .filter((cfg) => SECTIONS[cfg.type] || console.warn(`site.json sections : type inconnu "${cfg.type}"`))
  .map((cfg) => ({ ...cfg, mod: SECTIONS[cfg.type], id: cfg.id || SECTIONS[cfg.type].id }));
sections.forEach((s, i) => { s.next ??= sections[i + 1]?.id || ''; });

$('main').innerHTML = sections.map(({ mod, ...cfg }) =>
  `<section class="${mod.className}${cfg.alt ? ' section--alt' : ''}" id="${esc(cfg.id)}">${DECOR[cfg.decor] || ''}${mod.html(ctx, cfg)}</section>`).join('');
for (const s of sections) s.el = document.getElementById(s.id);

// Menu : un lien par section (clé ui.json du type, ou "nav" de la section ; "nav": false = pas de lien)
$('.nav__tools').insertAdjacentHTML('beforebegin', sections.map((s) => {
  const key = s.nav === false ? null : typeof s.nav === 'string' ? s.nav : s.mod.nav;
  return key ? `<a href="#${esc(s.id)}" data-i18n="${esc(key)}"></a>` : '';
}).join(''));

ctx.observeReveal = observeReveal;
const run = (hook) => sections.forEach((s) => s.mod[hook]?.call(s.mod, ctx, s.el, s));
run('setup');

// ---------- Rendu ----------
function renderChrome() {
  root.lang = ctx.lang;
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#langs').innerHTML = ctx.LANGS.map((l) => `<button type="button" data-lang="${l}" class="${l === ctx.lang ? 'is-on' : ''}" aria-pressed="${l === ctx.lang}">${l.toUpperCase()}</button>`).join('');
  // Sélecteur de thème : les deux options visibles, l'active surlignée, une bulle d'aide au survol
  $('#themes').setAttribute('aria-label', t('theme.label'));
  $('.themes-wrap').dataset.label = t('theme.label');
  $('#themes').innerHTML = THEMES.map((th) => {
    const on = root.dataset.theme === th.id;
    return `<button type="button" role="radio" aria-checked="${on}" class="${on ? 'is-on' : ''}" data-theme-set="${th.id}" data-tip="${esc(t(`theme.${th.id}Tip`))}">
      ${th.icon}<span>${esc(t(`theme.${th.id}`))}</span></button>`;
  }).join('');
  $('#themeHintText').textContent = t('theme.hint');
  $('meta[name="theme-color"]').content = currentTheme().color;
}

// Photos et logos qui changent avec le thème
function renderBrand() {
  const logo = ctx.logo();
  if (logo) $('#navLogo').src = drive.img(logo.id, 400);
  run('theme');
}

function renderFooter() {
  $('#year').textContent = new Date().getFullYear();
  $('#syncInfo').textContent = ctx.tree.syncedAt ? `${t('footer.sync')} ${ctx.fmt(ctx.tree.syncedAt.slice(0, 10), { dateStyle: 'medium' })}` : '';
}

function renderAll() {
  renderChrome();
  renderBrand();
  run('render');
  renderFooter();
  observeReveal();
}

// ---------- Interactions ----------
let lbList = [], lbIndex = 0;
document.addEventListener('click', (e) => {
  // Lecteurs chargés au clic seulement : YouTube (data-yt) et vidéos Drive (data-drive)
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
  if (lb) { lbList = ctx.galleries[lb.dataset.lb] || []; openLb(+lb.dataset.i); return; }
  const lg = e.target.closest('[data-lang]');
  if (lg) { ctx.lang = lg.dataset.lang; store.set('lang', ctx.lang); renderAll(); }
});

$('#themes').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-theme-set]');
  if (!btn) return;
  hideThemeHint();
  if (btn.dataset.themeSet === root.dataset.theme) return;
  root.dataset.theme = btn.dataset.themeSet;
  store.set('theme', root.dataset.theme);
  renderChrome();
  renderBrand();
});

// Bulle « 2 ambiances » affichée une seule fois par visiteur (ordinateur uniquement : sur mobile le sélecteur est dans le menu)
function hideThemeHint() {
  $('#themeHint').hidden = true;
  store.set('themeHintSeen', '1');
}
$('#themeHintClose').addEventListener('click', hideThemeHint);
if (!store.get('themeHintSeen') && !store.get('theme') && matchMedia('(min-width: 961px)').matches) {
  setTimeout(() => {
    $('#themeHint').hidden = false;
    setTimeout(hideThemeHint, 9000);
  }, 2500);
}

// Lightbox (galeries : ctx.galleries, remplies par les sections)
function openLb(i) {
  lbIndex = (i + lbList.length) % lbList.length;
  const p = lbList[lbIndex];
  $('#lbImg').src = p.url || drive.img(p.id, 2000);
  $('#lbDl').href = p.url || drive.download(p.id);
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
// Menu mobile : la page derrière ne défile plus tant qu'il est ouvert
const setMenu = (open) => {
  nav.classList.toggle('is-open', open);
  $('#burger').setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
};
$('#burger').onclick = () => setMenu(!nav.classList.contains('is-open'));
$('#navLinks').addEventListener('click', (e) => { if (e.target.tagName === 'A') setMenu(false); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });
const links = [...document.querySelectorAll('.nav__links a')];
const sectionObs = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === `#${en.target.id}`));
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section').forEach((s) => sectionObs.observe(s));

// Apparitions au scroll
let revealObs;
function observeReveal() {
  revealObs ??= new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); revealObs.unobserve(en.target); }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal:not(.is-in)').forEach((el) => revealObs.observe(el));
}

// ---------- Mesure d'audience : Google Analytics 4, uniquement après consentement ----------
// Actif seulement si site.json → analytics.ga4 contient un identifiant « G-XXXXXXX ».
// Rien n'est chargé (ni script Google, ni cookie) tant que le visiteur n'a pas cliqué sur « Accepter ».
// En local (localhost) on ne pollue pas les stats : les événements sont seulement affichés dans la console.
const GA_ID = /^G-[A-Z0-9]+$/.test(site.analytics?.ga4 || '') ? site.analytics.ga4 : null;
const GA_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const CONSENT_KEY = 'analyticsConsent';
let gaOn = false;

function startAnalytics() {
  if (gaOn || !GA_ID) return;
  gaOn = true;
  if (GA_LOCAL) { console.info(`[analytics] ${GA_ID} — mode local, rien n'est envoyé à Google`); return; }
  window[`ga-disable-${GA_ID}`] = false;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('set', 'user_properties', { site_language: ctx.lang, site_theme: currentTheme().name });
  gtag('config', GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(s);
}

function stopAnalytics() {
  if (!GA_ID) return;
  gaOn = false;
  window[`ga-disable-${GA_ID}`] = true;
  // Supprime les cookies _ga déjà posés (sur le domaine et ses parents, ex. .bogotabeats.com)
  const parts = location.hostname.split('.');
  const domains = ['', ...parts.map((_, i) => `; domain=.${parts.slice(i).join('.')}`)];
  document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => n.startsWith('_ga'))
    .forEach((n) => domains.forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/${d}`; }));
}

function track(name, params = {}) {
  if (!gaOn) return;
  if (GA_LOCAL) console.info('[analytics]', name, params);
  else window.gtag('event', name, params);
}

function setConsent(value) {
  store.set(CONSENT_KEY, value);
  $('#consent').hidden = true;
  if (value === 'granted') startAnalytics(); else stopAnalytics();
}

if (GA_ID) {
  $('#consentManage').hidden = false;
  $('#consentManage').onclick = () => { $('#consent').hidden = false; };
  $('#consent').addEventListener('click', (e) => { const b = e.target.closest('[data-consent]'); if (b) setConsent(b.dataset.consent); });
  const choice = store.get(CONSENT_KEY);
  if (choice === 'granted') startAnalytics();
  else if (choice !== 'denied') $('#consent').hidden = false;
}

// Ce que font les visiteurs : un seul écouteur (phase de capture, avant que les autres gestionnaires modifient le DOM).
// Les clics propres à une section sont décrits par son module (track).
document.addEventListener('click', (e) => {
  if (!gaOn) return;
  const el = e.target;
  const at = (s) => el.closest(s);
  let x;
  if ((x = at('[data-yt]'))) return track('play_set', { set_title: x.getAttribute('aria-label') || x.dataset.yt });
  if ((x = at('[data-drive]'))) return track('play_video', { video_id: x.dataset.drive });
  for (const s of sections) {
    const hit = s.mod.track?.(el, ctx);
    if (hit) return track(...hit);
  }
  if ((x = at('[data-lb]'))) return track('view_photo', { gallery: x.dataset.lb });
  if (at('#lbDl')) return track('download', { file_type: 'photo_hd', file_name: lbList[lbIndex]?.name || '' });
  if ((x = at('a.dl'))) return track('download', { file_type: x.querySelector('.dl__kind')?.textContent || 'doc', file_name: x.querySelector('.dl__name')?.textContent || '' });
  if ((x = at('a[download]'))) return track('add_to_calendar', { file_name: x.getAttribute('download') });
  if ((x = at('[data-lang]'))) return track('change_language', { language: x.dataset.lang });
  if ((x = at('[data-theme-set]')) && x.dataset.themeSet !== root.dataset.theme) return track('change_theme', { theme: THEMES.find((th) => th.id === x.dataset.themeSet)?.name });
  if ((x = at('a[href="#contact"]'))) return track('booking_cta', { location: x.closest('section, header')?.id || '' });
}, true);

// Sections vraiment regardées (une fois par visite et par section ; même ligne de repère que le lien actif du menu)
const seenSections = new Set();
const viewObs = new IntersectionObserver((entries) => entries.forEach((en) => {
  if (!en.isIntersecting || !gaOn || seenSections.has(en.target.id)) return;
  seenSections.add(en.target.id);
  track('section_view', { section: en.target.id });
}), { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main > section[id]').forEach((s) => viewObs.observe(s));

renderAll();

// Liens partagés vers une section (bogotabeats.com/#epk) : les sections n'existent qu'après le rendu,
// le navigateur ne peut donc pas y aller seul. On recale une fois les images chargées, sauf si le visiteur a déjà défilé.
const target = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
if (target) {
  target.scrollIntoView({ behavior: 'instant' });
  let moved = false;
  addEventListener('wheel', () => { moved = true; }, { once: true, passive: true });
  addEventListener('touchmove', () => { moved = true; }, { once: true, passive: true });
  const settle = () => { if (!moved) target.scrollIntoView({ behavior: 'instant' }); };
  if (document.readyState === 'complete') setTimeout(settle, 300); else addEventListener('load', settle, { once: true });
}
