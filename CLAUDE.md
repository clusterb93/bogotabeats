# CLAUDE.md — consignes pour l'assistant IA

Site + EPK du DJ **BogotaBeats**. Statique, sans dépendance ni framework (le « build » copie juste les fichiers publics dans dist/). Docs détaillées dans `docs/`.

## Règles

- **Contenu ≠ code.** Une demande de contenu (date, set, bio, photo) se traite dans `content/*.json`
  ou dans le Drive, jamais en dur dans `index.html` / `app.js`.
- `content/drive.json` est **généré** par `npm run sync` : ne pas l'éditer à la main.
- Toute nouvelle chaîne d'interface va dans `content/ui.json` **pour les 3 langues** (en, fr, es).
  Tout texte de contenu dans `site.json` suit le format `{ "en", "fr", "es" }`.
- Toute nouvelle couleur passe par une **variable CSS définie dans les deux thèmes** (Rave & Jungle).
  Garder l'identité : Rave = néon/post-apo/queer club ; Jungle = forêt/terre/chaleur.
- Dates : format `AAAA-MM-JJ`, tri passé/à venir automatique — ne jamais créer de liste « à venir » manuelle.
- Garder `<meta name="referrer" content="no-referrer">` et afficher les images Drive avec `<img referrerpolicy="no-referrer">`, jamais en `background-image` CSS (sinon Google les refuse).
- Après modification : `node scripts/check-content.mjs`, puis vérifier visuellement avec
  `node scripts/serve.mjs` (config `.claude/launch.json`) dans les 2 thèmes et en mobile.
- Ne pas publier (push, déploiement) sans demande explicite.

## Commandes

```bash
npm run sync    # Drive → content/drive.json (+ Sheets Dates/Sets)
npm run check   # validation du contenu
npm run dev     # http://localhost:8080
npm run build   # dist/ = ce qui est publié sur bogotabeats.com par GitHub Actions
```
