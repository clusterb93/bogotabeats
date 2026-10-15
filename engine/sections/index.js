// Registre des types de section. site.json → "sections" choisit lesquelles afficher, dans quel ordre :
//   { "type": "tour", "id": "dates", "alt": true, "nav": "nav.dates", "decor": "leaf-tr" }
// Chaque type est un module qui exporte :
//   id         identifiant HTML par défaut (ancre du menu : #id)
//   nav        clé ui.json du lien de menu (null = pas de lien)
//   className  classes de la balise <section>
//   html(ctx, cfg)          squelette de la section (inséré une fois)
//   setup(ctx, el, cfg)     écouteurs, une fois après insertion           (facultatif)
//   render(ctx, el, cfg)    remplissage, relancé à chaque changement de langue (facultatif)
//   theme(ctx, el, cfg)     photos/logos dépendant du thème, relancé au changement de thème (facultatif)
//   track(target, ctx)      clic à mesurer → [événement, paramètres] ou rien (facultatif)
import hero from './hero.js';
import mixes from './mixes.js';
import sessions from './sessions.js';
import tour from './tour.js';
import videos from './videos.js';
import epk from './epk.js';
import contact from './contact.js';

export const SECTIONS = { hero, mixes, sessions, tour, videos, epk, contact };

// Page par défaut si site.json ne liste pas de sections
export const DEFAULT_SECTIONS = ['hero', 'mixes', 'sessions', 'tour', 'videos', 'epk', 'contact'].map((type) => ({ type }));

// Décors facultatifs posés en fond de section ("decor" dans site.json). Les feuilles ne sont visibles
// que dans les thèmes qui les activent (--leaf-opacity) et utilisent le symbole #monstera d'index.html.
const leaf = (pos) => `<div class="leaf leaf--${pos}" aria-hidden="true"><svg class="leaf__a" viewBox="0 0 200 230"><use href="#monstera"/></svg><svg class="leaf__b" viewBox="0 0 200 230"><use href="#monstera"/></svg></div>`;
export const DECOR = {
  'leaf-tr': leaf('tr'),
  'leaf-bl': leaf('bl'),
};
