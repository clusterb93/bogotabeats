// Accueil : photo plein écran (par thème), logo, accroche, boutons Réserver / Écouter.
// Options : "book" (section du bouton Réserver, défaut "contact"), "next" (section visée par la flèche
// et par « Écouter » quand site.json n'a pas de listenUrl ; défaut : la section suivante).
import { $, esc, drive } from '../core.js';

export default {
  id: 'home',
  nav: 'nav.home',
  className: 'hero',

  html: (ctx, cfg) => `
    <picture class="hero__bg" id="heroPic"></picture>
    <div class="hero__shade"></div>
    <div class="hero__content">
      <h1 style="margin:0"><img class="hero__logo" id="heroLogo" alt="${esc(ctx.artist)}"></h1>
      <p class="hero__tag" id="tagline"></p>
      <div class="hero__cta">
        <a class="btn btn--accent" href="#${cfg.book || 'contact'}" data-i18n="cta.book">Book now</a>
        <a class="btn btn--ghost" id="listenBtn" href="#${cfg.next}" target="_blank" rel="noopener" data-i18n="cta.listen">Listen to a set</a>
      </div>
    </div>
    <a class="hero__scroll" href="#${cfg.next}" aria-label="Scroll">↓</a>`,

  render(ctx, el) {
    const { site } = ctx;
    $('#tagline', el).textContent = ctx.tr(site.tagline) || '';
    if (site.listenUrl) $('#listenBtn', el).href = site.listenUrl;
    else $('#listenBtn', el).removeAttribute('target'); // sans lien : le bouton descend vers la section suivante
  },

  theme(ctx, el) {
    const { site } = ctx;
    // Le logo du héros reste lisible sur la photo : choisi par thème dans site.json → drive.logo
    const logo = ctx.logo();
    if (logo) $('#heroLogo', el).src = drive.img(logo.id, 1000);
    const hero = ctx.photo('hero', 0);
    if (!hero) return;
    const heroM = ctx.byName(ctx.photos, ctx.forTheme(site.drive?.heroMobile)) || hero;
    $('#heroPic', el).innerHTML = `
      <source media="(max-width: 700px)" srcset="${drive.img(heroM.id, 900)}">
      <img src="${drive.img(hero.id, 2200)}" alt="${esc(ctx.artist)}" fetchpriority="high">`;
    // Cadrage facultatif de la photo d'accueil : "heroPosition": { "dark": "50% 20%", "light": "40% 30%" }
    el.style.setProperty('--hero-pos', ctx.forTheme(site.drive?.heroPosition) || '50% 25%');
  },
};
