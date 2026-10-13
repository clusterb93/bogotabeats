# Architecture — pour faire évoluer le site

Choix de départ : **zéro dépendance, zéro build**. Du HTML/CSS/JS natif, lisible et modifiable
sans outillage. Node.js ne sert qu'aux scripts (synchro, vérification, serveur local).

## Flux de données

```
content/site.json  ─┐
content/ui.json    ─┤
content/sets.json  ─┼──► app.js (navigateur) ──► DOM de index.html
content/dates.json ─┤
content/drive.json ─┘ ◄── scripts/sync-drive.mjs ◄── Google Drive + Google Sheets
```

## `index.html`

Squelette statique : chaque section a un `id` (`home`, `sets`, `dates`, `videos`, `epk`,
`contact`) et des conteneurs vides (`#setsGrid`, `#past`, `#gallery`…) que `app.js` remplit.
Les éléments avec `data-i18n="clé"` reçoivent le texte de `ui.json`.
Un petit script inline applique le thème avant l'affichage (anti-flash).

## `app.js` (module ES)

| Bloc | Rôle |
|---|---|
| `drive.*` | Fabrique les URLs Google (image redimensionnée, miniature, téléchargement, lecteur, export PDF) |
| Chargement | `Promise.all` sur les 5 JSON ; chaque fichier a une valeur de repli si absent |
| `t(clé)` / `tr(valeur)` | Traductions : interface (`ui.json`) / champs de contenu multilingues |
| `forTheme(valeur)` | Choisit la variante `{dark, light}` d'un réglage selon le thème courant |
| `ROLES` | Règles nom-de-dossier → rôle (photos / logos / vidéos / autre) |
| `render*()` | Une fonction par section ; `renderAll()` relance tout (changement de langue) |
| Interactions | Délégation de clics : lecture YouTube/Drive à la demande (iframes chargées au clic seulement), lightbox, langue, thème |
| Observers | Apparitions au scroll, lien actif du menu, compteurs animés des stats |

Les vidéos ne chargent leur lecteur qu'au clic (miniature avant) : la page reste légère malgré
14 vidéos Drive et 4 sets YouTube.

### Ajouter une section

1. `index.html` : ajouter `<section class="section" id="ma-section">` avec un titre
   `<h2 class="h2" data-i18n="ma.cle">` et un conteneur vide.
2. `ui.json` : ajouter la clé dans les 3 langues ; ajouter un lien dans `.nav__links` si besoin.
3. `app.js` : écrire `renderMaSection()` et l'appeler dans `renderAll()`.
4. Données : un nouveau `content/xxx.json` (ajouté au `Promise.all`) ou un champ dans `site.json`.

Idées d'évolutions faciles : section **Press / Quotes** (citations de médias, comme sur le site
de Haviah Mighty), **Mixes SoundCloud** (iframe SoundCloud au clic, comme YouTube), page
**Merch**, formulaire de booking (Formspree/Netlify Forms), lien **calendrier .ics** des dates.

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
