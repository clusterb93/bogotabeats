# BogotaBeats — site web & EPK

Site officiel de **BogotaBeats** (DJ · Tribal House, Latin Club, Latin Tech, Neo Perreo) avec un
**EPK** (Electronic Press Kit) complet : bio, stats, photos presse HD, vidéos, logos, press kit,
fiches techniques, dates passées et à venir, sets YouTube et contact booking.

Inspiration visuelle : [haviahmighty.ca](https://haviahmighty.ca/home), avec la palette, les
photos et le logo (bandes jaune-bleu-rouge de la Colombie) de BogotaBeats.

- 🇬🇧 **Anglais par défaut**, bascule en un clic vers 🇫🇷 français et 🇪🇸 espagnol
- 🌈 **Thème Rave** (sombre) : after post-apo, néon rose / violet / cyan, grain, glow, club queer
- 🌿 **Thème Jungle** (clair) : forêt, terre, chaleur — sable, terracotta, vert jungle, soleil
- 🔄 **Synchronisé avec le Google Drive** « PackPresse » : une photo ajoutée au Drive apparaît sur le site

---

## Démarrage rapide

Prérequis : [Node.js](https://nodejs.org) 18 ou plus (aucune autre dépendance, pas de `npm install`).

```bash
npm run sync     # récupère le contenu du Drive → content/drive.json (+ feuilles Dates/Sets si présentes)
npm run check    # vérifie les fichiers de contenu (dates mal écrites, liens YouTube…)
npm run dev      # lance le site sur http://localhost:8080
```

## Mettre à jour le site — l'essentiel

| Je veux…                                   | Je fais…                                                                 |
|--------------------------------------------|--------------------------------------------------------------------------|
| Ajouter une **date** (à venir ou passée)    | Une ligne dans `content/dates.json` **ou** dans la Google Sheet « Dates » du Drive |
| Ajouter un **set YouTube**                  | Coller le lien dans `content/sets.json` (ou la Google Sheet « Sets »)     |
| Ajouter / retirer des **photos presse**     | Les déposer / supprimer dans le dossier **Photos** du Drive              |
| Changer la **photo d'accueil**              | `drive.hero` dans `content/site.json` (une photo par thème)              |
| Mettre à jour le **press kit / rider**      | Remplacer le fichier dans le Drive (même dossier racine)                 |
| Modifier la **bio, les stats, les genres**  | `content/site.json` (textes en `en` / `fr` / `es`)                       |
| Corriger un **texte de l'interface**        | `content/ui.json`                                                        |
| Ajouter une **nouvelle rubrique** (ex. Flyers) | Créer un sous-dossier dans le Drive : il devient une section de l'EPK  |

Les dates se classent **toutes seules** en « À venir » / « Dernières dates » selon la date du jour.

👉 Guide pas à pas : [docs/MISE-A-JOUR.md](docs/MISE-A-JOUR.md)

## Documentation

| Fichier | Contenu |
|---|---|
| [docs/MISE-A-JOUR.md](docs/MISE-A-JOUR.md) | Mettre à jour dates, sets, textes, photos — avec exemples à copier-coller |
| [docs/DRIVE.md](docs/DRIVE.md) | Comment le site lit le Google Drive, conventions de nommage, Google Sheets Dates/Sets |
| [docs/THEMES-ET-LANGUES.md](docs/THEMES-ET-LANGUES.md) | Les thèmes Rave / Jungle, les couleurs, ajouter une langue |
| [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Mettre le site en ligne (GitHub Pages + synchro automatique quotidienne, Netlify…) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Organisation du code, pour faire évoluer le site |
| [CLAUDE.md](CLAUDE.md) | Consignes pour un assistant IA qui travaillerait sur ce projet |

## Arborescence

```
bogotabeats/
├── index.html              Structure de la page (sections Home, Sets, Dates, Vidéos, EPK, Contact)
├── styles.css              Styles + les 2 thèmes (variables CSS en haut du fichier)
├── app.js                  Rendu : lit content/*.json et construit la page
├── content/                ← TOUT LE CONTENU ÉDITABLE EST ICI
│   ├── site.json           Profil : bio, stats, genres, contact, réseaux, choix des photos
│   ├── dates.json          Dates (passées et à venir)
│   ├── sets.json           Sets YouTube
│   ├── ui.json             Textes de l'interface en en / fr / es
│   └── drive.json          GÉNÉRÉ par `npm run sync` — ne pas modifier à la main
├── scripts/
│   ├── sync-drive.mjs      Lit le Drive public (sans clé API) → content/drive.json
│   ├── check-content.mjs   Vérifie le contenu avant publication
│   └── serve.mjs           Serveur local de développement
├── templates/              Modèles CSV à importer dans Google Sheets (Dates, Sets)
├── docs/                   Documentation
└── .github/workflows/      Synchro Drive quotidienne + déploiement GitHub Pages
```
