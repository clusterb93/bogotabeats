# Architecture — pour faire évoluer le site

Choix de départ : **zéro dépendance, zéro build**. Du HTML/CSS/JS natif, lisible et modifiable
sans outillage. Node.js ne sert qu'aux scripts (synchro, vérification, serveur local).

## Moteur et contenu

Le site est séparé en deux :

- **Le moteur** (`engine/`) : le code générique, sans rien de propre à BogotaBeats. Il sait afficher
  des *types* de sections (accueil, mixes, dates…) à partir des données.
- **L'instance** (ce qui est propre à l'artiste) : `content/` (textes, liens, choix des sections),
  `index.html` (balises SEO/partage, décor SVG), `styles.css` (thèmes), `public/` et le Drive.

L'objectif : réutiliser le même moteur pour d'autres artistes en ne changeant que l'instance.

## Flux de données

```
content/site.json  ─┐   (dont "sections" : quelles sections, dans quel ordre)
content/ui.json    ─┤
content/sets.json  ─┼──► engine/app.js ──► sections construites dans <main> de index.html
content/dates.json ─┤
content/mixes.json ─┤
content/releases.json ─┤
content/drive.json ─┘ ◄── scripts/sync-drive.mjs ◄── Google Drive + Google Sheets
```

## `index.html`

Coquille de la page : balises `<head>` (titre, description, Open Graph), symbole SVG des feuilles,
menu (sans liens : ils sont générés), `<main>` **vide**, pied de page, bandeau de consentement, lightbox.
Les éléments avec `data-i18n="clé"` reçoivent le texte de `ui.json`.
Un petit script inline applique le thème avant l'affichage (anti-flash).

## Les sections : `site.json → sections`

```json
"sections": [
  { "type": "hero", "next": "sets" },
  { "type": "mixes", "decor": "leaf-tr" },
  { "type": "sessions", "alt": true },
  { "type": "tour", "alt": true },
  { "type": "videos", "decor": "leaf-bl" },
  { "type": "epk", "alt": true, "decor": "leaf-tr", "blocks": ["stats", "bio", "sound", "inspirations", "photos", "extra", "downloads", "setup"] },
  { "type": "contact" }
]
```

| Option | Rôle |
|---|---|
| `type` | Type de section (voir tableau ci-dessous) — obligatoire |
| `id` | Ancre de la section (`#id`) ; par défaut celle du type |
| `nav` | Clé `ui.json` du lien de menu ; `false` = pas de lien ; par défaut celle du type |
| `alt` | `true` = fond alterné (`section--alt`) |
| `decor` | Décor de fond : `leaf-tr` / `leaf-bl` (feuilles du thème Jungle) |
| autres | Options propres au type (`next`, `book`, `pastVisible`, `blocks`…) |

Sans `sections`, le moteur affiche les 7 types dans l'ordre par défaut. `npm run check` signale un
type ou un bloc inconnu et un identifiant en double.

| Type (`engine/sections/`) | Ancre | Contenu | Options |
|---|---|---|---|
| `hero` | `home` | Photo, logo, accroche, boutons | `next` (flèche / « Écouter » sans listenUrl, défaut : section suivante), `book` (défaut `contact`) |
| `mixes` | `mixes` | Platine SoundCloud (`mixes.json`) | — |
| `releases` | `music` | Productions : sorties (Bandcamp, achat) et à venir (extrait MP3) (`releases.json`) | — |
| `sessions` | `sets` | Vidéos YouTube (`sets.json`) | — |
| `tour` | `dates` | Prochaine date, à venir, passées (+ flyers du Drive) | `pastVisible` (défaut 6) |
| `videos` | `videos` | Carrousel des vidéos du Drive | — |
| `epk` | `epk` | Dossier de presse | `blocks` : `stats`, `bio`, `sound`, `inspirations`, `photos`, `extra` (dossiers Drive libres), `downloads`, `setup` |
| `contact` | `contact` | E-mail, téléphone, réseaux | — |

Une section sans contenu (aucun mix, aucune vidéo, aucun set) se masque avec son lien de menu.

## `engine/` (modules ES, sans dépendance)

| Fichier | Rôle |
|---|---|
| `core.js` | Outils (`$`, `esc`, URLs Drive, préférences) et `createContext()` : charge les JSON, langue (`t`, `tr`, `fmt`), thème (`forTheme`), fichiers du Drive rangés par rôle (`ROLES`), galeries de la lightbox |
| `app.js` | Construit les sections et le menu depuis `site.json`, puis gère langue, thème, lightbox, menu mobile, apparitions, ancres partagées (`/#epk`), Google Analytics |
| `sections/index.js` | **Registre des types** (`SECTIONS`), ordre par défaut, décors |
| `sections/<type>.js` | Un module par type de section |

Un module de section exporte :

```js
export default {
  id: 'dates',              // ancre par défaut
  nav: 'nav.dates',         // clé ui.json du lien de menu (null = pas de lien)
  className: 'section',     // classes de <section>
  html(ctx, cfg) {},        // squelette HTML, inséré une fois
  setup(ctx, el, cfg) {},   // écouteurs, une fois                       (facultatif)
  render(ctx, el, cfg) {},  // contenu, relancé à chaque changement de langue (facultatif)
  theme(ctx, el, cfg) {},   // photos par thème, relancé au changement de thème (facultatif)
  track(target, ctx) {},    // clic à mesurer → ['événement', { paramètres }]   (facultatif)
};
```

`ctx` donne accès au contenu (`ctx.site`, `ctx.dates`…), aux traductions (`ctx.t`, `ctx.tr`), aux
fichiers du Drive (`ctx.photos`, `ctx.photo('hero', 0)`, `ctx.filesOf('flyers', 'image')`), à
`ctx.artist` / `ctx.slug` (nom de l'artiste, jamais écrit en dur dans le moteur), `ctx.galleries`
(lightbox), `ctx.hideSection(id)` et `ctx.observeReveal()`.

Les lecteurs chargés au clic sont génériques : `data-yt="<id YouTube>"` et `data-drive="<id Drive>"`
(iframe créée par `app.js`), `data-lb="<galerie>" data-i="<n>"` pour la lightbox.

**Carrousel vidéos** (`sections/videos.js`) : défilement natif avec scroll-snap (swipe mobile, trackpad), flèches, clavier ←/→, glisser à la souris ; la carte la plus proche du centre devient active, et quitter une vidéo en cours retire son iframe (la lecture s'arrête).

Les images Drive sont toujours des balises `<img referrerpolicy="no-referrer">` (jamais des `background-image` CSS, qui envoient un referrer et sont refusées par Google).

Les vidéos ne chargent leur lecteur qu'au clic (miniature avant) : la page reste légère malgré
14 vidéos Drive et 4 sets YouTube.

### Ajouter un type de section

1. Créer `engine/sections/mon-type.js` (modèle : `sessions.js`, le plus simple) et l'ajouter à
   `SECTIONS` dans `engine/sections/index.js`.
2. `ui.json` : ajouter les clés (titre, lien de menu) **dans les 3 langues**.
3. Données : un nouveau `content/xxx.json` (ajouté au `Promise.all` de `core.js`) ou un champ de `site.json`.
4. `site.json → sections` : ajouter `{ "type": "mon-type" }` à l'endroit voulu.
5. Styles : dans `styles.css`, avec les variables des deux thèmes.

Idées de types à venir (pour d'autres profils d'artistes) : **Press / Quotes** (citations de médias),
**Discographie / sorties** (Spotify, Bandcamp, Beatport), **Membres** (groupes), **Merch**,
formulaire de booking (Formspree/Netlify Forms).

## `styles.css`

- En haut : variables des 2 thèmes (`[data-theme="dark"]`, `[data-theme="light"]`).
- Les règles spécifiques à un thème sont préfixées `[data-theme="…"]` (glitch, arches, feuilles…).
- Classes de base réutilisables : `.section`, `.wrap`, `.h2` (titre + barre), `.btn--accent`,
  `.btn--ghost`, `.chips`, `.gallery`, `.dl` (carte de téléchargement), `.reveal` (apparition).
- Responsive : 960 px (menu burger), 560 px (téléphone).
- `prefers-reduced-motion` coupe animations et grain.

## Scripts

| Script | Rôle |
|---|---|
| `scripts/sync-drive.mjs` | Parcourt le Drive (3 niveaux), écrit `drive.json`, convertit les Sheets Dates/Sets (CSV → JSON, normalisation des dates) |
| `scripts/check-content.mjs` | Valide les JSON, formats de dates, URLs YouTube, existence des photos choisies ; code de sortie ≠ 0 en cas d'erreur (bloque le déploiement CI) |
| `scripts/serve.mjs` | Serveur statique local, sans cache |

## Points d'attention techniques

- **Referrer** : `<meta name="referrer" content="no-referrer">` est indispensable — Google refuse
  de servir les images Drive à une page qui envoie un referrer. Les iframes YouTube remettent
  `referrerpolicy="strict-origin-when-cross-origin"` (YouTube l'exige).
- **Lecture du Drive** : `embeddedfolderview` est une page HTML non documentée de Google. Si Google
  la modifie un jour, la regex de `listFolder()` est le seul endroit à adapter (ou passer à
  l'API Drive v3 avec une clé API : `files.list?q='<id>' in parents`).
- Les URLs `lh3.googleusercontent.com/d/<id>=w<largeur>` redimensionnent côté Google : adapter
  la largeur demandée plutôt que de charger l'original.
