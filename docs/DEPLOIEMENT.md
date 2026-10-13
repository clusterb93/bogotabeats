# Mettre le site en ligne

Le site est **100 % statique** (HTML/CSS/JS + JSON) : n'importe quel hébergeur statique convient.
Il doit être servi en HTTP(S) (pas en ouvrant `index.html` en double-clic : le navigateur bloque
la lecture des fichiers JSON).

## Option recommandée — GitHub Pages + synchro automatique

Le workflow `.github/workflows/sync-drive.yml` :
- tous les jours à 6 h UTC, **et** à chaque `git push`, **et** à la demande (bouton *Run workflow*),
- lance `npm run sync` (Drive + Google Sheets Dates/Sets) puis `npm run check`,
- enregistre les changements de `content/` dans le dépôt,
- publie le site sur GitHub Pages.

👉 Résultat : **ajouter une photo ou une date dans le Drive suffit**, le site se met à jour le
lendemain matin (ou tout de suite avec *Run workflow*).

### Mise en place (une seule fois)

1. Créer un dépôt sur GitHub (ex. `bogotabeats-site`) et y pousser ce dossier :
   ```bash
   git init
   git add .
   git commit -m "Site BogotaBeats"
   git branch -M main
   git remote add origin https://github.com/<compte>/bogotabeats-site.git
   git push -u origin main
   ```
2. Sur GitHub : **Settings → Pages → Build and deployment → Source : GitHub Actions**.
3. **Settings → Actions → General → Workflow permissions : Read and write permissions**.
4. Onglet **Actions** → *Sync Drive & deploy* → **Run workflow** pour la première publication.
5. L'adresse du site s'affiche dans le résultat du workflow (`https://<compte>.github.io/bogotabeats-site/`).

### Nom de domaine perso (ex. `bogotabeats.com`)

Settings → Pages → *Custom domain*, puis chez le registraire du domaine un enregistrement
`CNAME` vers `<compte>.github.io`. Mettre aussi à jour `og:image` / les liens absolus si besoin.

## Autres hébergeurs

| Hébergeur | Comment |
|---|---|
| **Netlify** / **Cloudflare Pages** | Glisser-déposer le dossier, ou connecter le dépôt GitHub (pas de commande de build, dossier de publication `.`). Pour la synchro auto, garder le workflow GitHub en retirant les 3 dernières étapes Pages : l'hébergeur republiera à chaque commit du bot. |
| **OVH / o2switch / FTP** | Lancer `npm run sync && npm run check` sur ton ordi, puis envoyer `index.html`, `styles.css`, `app.js` et le dossier `content/`. |

## Routine de mise à jour manuelle

```bash
npm run sync     # récupère le Drive
npm run check    # vérifie
npm run dev      # contrôle visuel sur http://localhost:8080
git add . && git commit -m "maj dates" && git push   # publie (si GitHub)
```

## Checklist avant la première mise en ligne

- [ ] Vérifier les **liens réseaux** dans `site.json → socials` (SoundCloud, Facebook, YouTube
      ont été déduits de `@bogotabeats` : à confirmer).
- [ ] Vérifier les **dates passées** reprises des flyers du press kit (années et lieux à confirmer,
      certains lieux/villes sont vides).
- [ ] Faire relire la **version espagnole**.
- [ ] Confirmer que le **numéro de téléphone** doit être public sur le site.
- [ ] Vérifier les **crédits photo** (Anatole Dovganyuk, CFranci…) — on peut les ajouter dans la
      légende de la galerie ou dans la bio si les photographes le demandent.
