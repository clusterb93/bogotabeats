# BogotaBeats — site web & EPK

🌐 **https://bogotabeats.com** · dépôt : [clusterb93/bogotabeats](https://github.com/clusterb93/bogotabeats)

Site officiel de **BogotaBeats** (DJ · Latin Club, Guaracha, Latin Tech, Reggaeton) avec un **EPK**
(Electronic Press Kit) complet : mixes SoundCloud, live sessions YouTube, dates, vidéos, bio, stats,
photos presse HD, press kit, fiches techniques, logos et contact booking.

- 🇬🇧 **Anglais par défaut**, bascule en un clic vers 🇫🇷 français et 🇪🇸 espagnol
- 🌈 **Thème Rave** (sombre : néon, after, club queer) et 🌿 **thème Jungle** (clair : forêt, terre, chaleur)
- 🔄 **Synchronisé avec le Google Drive « PackPresse »** : photos, vidéos, logos, documents et flyers viennent du Drive
- 🚀 **Publication automatique** : chaque `git push` met le site en ligne en ~1 minute

---

## Comment ça marche

```
   Google Drive « PackPresse »            content/*.json (ce dépôt)
   photos · vidéos · logos · flyers       dates · sets · mixes · textes
   press kit · fiches techniques                    │
            │                                       │  git push
            └──────────────┬────────────────────────┘
                           ▼
              GitHub Actions « Sync Drive & deploy »
              lit le Drive ─► vérifie ─► construit ─► publie
                           ▼
                 https://bogotabeats.com
```

| Ce que tu modifies | Quand c'est en ligne |
|---|---|
| Un fichier du dépôt (`content/…`), puis `git push` | ~1 minute après le push |
| Le **Drive** (ajout / suppression de fichiers) | Le lendemain matin (synchro à 6 h UTC), **ou tout de suite** : GitHub → *Actions* → *Sync Drive & deploy* → **Run workflow** |

Le site est hébergé par **GitHub Pages** ; le nom de domaine `bogotabeats.com` est chez **IONOS**
(enregistrements DNS vers GitHub). Détails et dépannage : [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md).

---

## À quoi servent les dossiers du projet

| Dossier / fichier | À quoi ça sert | Tu y touches ? |
|---|---|---|
| **`content/`** | **Tout le contenu éditable du site** (voir détail ci-dessous) | ✅ **Oui — c'est ici que tout se passe** |
| `index.html` | Coquille de la page : titre et aperçu de partage (SEO), menu, pied de page. Les sections sont construites par le moteur | ❌ Seulement pour le titre / l'aperçu de partage |
| `styles.css` | Apparence et les 2 thèmes ; les couleurs sont des variables en haut du fichier | ❌ Seulement pour changer le design |
| `engine/` | Le « moteur », générique (rien de propre à BogotaBeats) : lit `content/` et le Drive, construit les sections choisies dans `site.json`, gère lecteurs, carrousels, langues, thèmes. Un fichier par type de section dans `engine/sections/` | ❌ Non |
| `public/` | Fichiers techniques mis à la racine du site : `.htaccess` (pour un hébergement Apache/IONOS), `robots.txt` | ❌ Non |
| `scripts/` | Outils en ligne de commande : synchro Drive, vérification, build, serveur local | ❌ Non (on les lance) |
| `templates/` | Modèles CSV à importer dans Google Sheets (feuilles « Dates » / « Sets ») | Optionnel |
| `docs/` | Documentation détaillée | 📖 À lire |
| `.github/workflows/` | La synchro quotidienne + la publication automatique | ❌ Non |
| `CLAUDE.md` | Consignes pour un assistant IA qui travaille sur le projet | ❌ Non |
| `dist/` | Créé par `npm run build` : la copie exacte de ce qui est publié (ignoré par git) | ❌ Non |

### Le dossier `content/` en détail

| Fichier | Contenu | Section du site |
|---|---|---|
| `site.json` | Bio, tagline, stats, genres, inspirations, rider, contact, réseaux, lien SoundCloud, choix des photos mises en avant, langue et thème par défaut, fichiers Drive masqués, **sections affichées et leur ordre** (`sections`) | Tout le site |
| `dates.json` | Toutes les dates (passées et à venir) | Tour |
| `sets.json` | Les vidéos YouTube de DJ sets | Live sessions |
| `mixes.json` | Les mixes SoundCloud mis en avant | Mixes (platine vinyle) |
| `ui.json` | Tous les textes de l'interface (menus, boutons, titres) en `en` / `fr` / `es` | Partout |
| `drive.json` | ⚠️ **Généré automatiquement** par la synchro du Drive — **ne jamais le modifier à la main** | — |

---

## Ce qui est dynamique sur le site

| Section | D'où vient le contenu | Automatique |
|---|---|---|
| **Accueil** | Photo et logo : Drive (`Photos`, `Logos`) choisis dans `site.json` · tagline : `site.json` | Logo / photo de repli si un fichier disparaît |
| **Mixes** | `mixes.json` (liens SoundCloud) | Titres et pochettes récupérés sur SoundCloud ; enchaînement au mix suivant |
| **Live sessions** | `sets.json` (liens YouTube) | Miniatures YouTube, départ à l'instant `?t=` du lien |
| **Tour** | `dates.json` + flyers du dossier Drive `Flyers` | Tri **à venir / passées** selon la date du jour ; la prochaine date passe en grande carte **Next gig** (compte à rebours, calendrier, itinéraire) |
| **Videos** | Dossier Drive `Videos` | Carrousel de toutes les vidéos du dossier |
| **EPK — photos presse** | Dossier Drive `Photos` | Galerie (carrousel sur mobile), téléchargement HD |
| **EPK — téléchargements** | Fichiers à la racine du Drive (press kit, fiches techniques) + dossier `Logos` | Les Google Docs sont proposés en PDF ; une carte Logos ouvre le dossier |
| **EPK — nouvelles rubriques** | Tout autre sous-dossier du Drive | Une section par dossier, titrée avec son nom |
| **EPK — bio, stats, genres, rider** | `site.json` | Compteurs animés |
| **Textes / langues / thèmes** | `ui.json`, `site.json` | Langue et thème mémorisés pour chaque visiteur |

---

## Actions courantes

> **Avant de modifier un fichier sur ton PC**, fais toujours `git pull` : le robot de synchro ajoute
> régulièrement des commits (contenu du Drive), sinon ton `git push` sera refusé.
>
> **Pour publier** une modification de fichier :
> ```bash
> npm run check                                   # vérifie qu'il n'y a pas d'erreur
> git add . && git commit -m "ce que j'ai changé" && git push
> ```
> Les fichiers JSON sont stricts : guillemets droits `"`, une virgule entre deux blocs `}, {`,
> **pas** de virgule après le dernier. `npm run check` signale les erreurs.

### 🎥 Ajouter une live session YouTube

Dans `content/sets.json`, ajouter un bloc **en haut** de la liste (l'ordre du fichier = l'ordre d'affichage) :

```json
{ "url": "https://www.youtube.com/watch?v=XXXXXXXXXXX", "title": "BogotaBeats @ Radio X", "where": "Radio X · 12.03.26" },
```

Le lien peut être collé tel quel (`&list=…`, `youtu.be/…`, `/live/…`). Avec `&t=600s`, la vidéo démarre à 10 min.

### 🎛️ Ajouter ou changer un mix SoundCloud

Dans `content/mixes.json` (idéalement tes 5 **titres épinglés** SoundCloud) :

```json
{ "url": "https://soundcloud.com/bogotabeats/nom-du-mix", "where": "Lieu · Ville · 12.03.26" },
```

Titre et pochette sont récupérés automatiquement. Le bouton « All mixes on SoundCloud » utilise `site.json → listenUrl`.

### 📅 Ajouter une date

**Option 1 — le plus rapide : le flyer dans le Drive.** Dépose le flyer dans le dossier Drive **`Flyers`**
en le nommant `AAAA-MM-JJ - Soirée - Lieu - Ville.jpg`, par exemple :
`2026-11-21 - Perreo Con-Sentido - Bar Désordre - Rennes.jpg`.
La date est créée avec son flyer (affiché sur la carte *Next gig*).

**Option 2 — dans `content/dates.json`** (l'ordre n'a pas d'importance) :

```json
{
  "date": "2026-11-21",
  "event": "Perreo Con-Sentido",
  "venue": "Bar Désordre",
  "city": "Rennes, FR",
  "type": "club",
  "time": "22:00–03:00",
  "link": "https://billetterie-ou-post-instagram"
},
```

`type` : `club`, `festival`, `radio`, `live`, `open air` ou `private` · `time` sert aussi au bouton « Add to calendar » ·
`link` affiche les boutons *Info* / *Event page* · `event` peut être traduit : `{ "en": "…", "fr": "…", "es": "…" }`.
Si un flyer du dossier `Flyers` commence par la même date, il est associé automatiquement.

**Option 3 — une Google Sheet « Dates »** dans le Drive (modifiable depuis le téléphone) : voir
[docs/MISE-A-JOUR.md](docs/MISE-A-JOUR.md#option-b--dans-une-google-sheet-le-plus-simple-même-depuis-un-téléphone-).
⚠️ Si cette feuille existe, elle **remplace** `dates.json` à chaque synchro.

Rien à faire ensuite : une date « à venir » passe toute seule dans « Past gigs » le lendemain.

### 🖼️ Ajouter, retirer ou réordonner des photos presse

- **Ajouter / retirer** : dans le dossier Drive **`Photos`**.
- **Ordre** : alphabétique → préfixer les noms (`01-…`, `02-…`) dans le Drive.
- **Masquer sans supprimer** : ajouter le nom exact du fichier dans `site.json → drive.hiddenFiles`
  (marche pour n'importe quel fichier du Drive : photo, vidéo, document).

### ⭐ Changer les photos mises en avant

Dans `site.json → drive`, une photo **par thème** (nom exact du fichier du Drive) :
`hero` (accueil), `aboutPhoto` (bio), `bookingPhoto` (fond du contact), `logo`.
`heroPosition` règle le cadrage de la photo d'accueil (`"50% 20%"` = centre horizontal, haut de l'image).

### 🎬 Ajouter des vidéos (carrousel « Videos »)

Les déposer dans le dossier Drive **`Videos`** (MP4 conseillé). La vidéo nommée dans
`site.json → drive.featuredVideo` passe en premier.

### 📄 Mettre à jour le press kit, les fiches techniques, les logos

Remplacer le fichier dans le Drive (racine pour le press kit et les fiches, dossier `Logos` pour les logos).
Les cartes du site se mettent à jour à la synchro suivante.

### 🗂️ Ajouter une nouvelle rubrique à l'EPK

Créer un sous-dossier dans le Drive PackPresse (ex. `Backstage`, `Presse`) : il devient une section de l'EPK
titrée avec son nom (images en galerie, vidéos, documents en cartes de téléchargement).

### ✍️ Modifier la bio, les stats, les genres, le rider, le contact, les réseaux

Tout est dans `content/site.json`. Chaque texte existe en `en` / `fr` / `es` (si une traduction manque,
l'anglais s'affiche). Les **stats** : `value` (nombre) + `suffix` (`+`, `k`) + `label`.

### 🧩 Réordonner, masquer ou renommer une section

`content/site.json → sections` : une ligne par section, dans l'ordre d'affichage. Retirer une ligne masque
la section (et son lien de menu) ; `"nav": false` garde la section sans lien de menu ; `"blocks"` de l'EPK
choisit et ordonne ses rubriques. Détail des types et options : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### 🔤 Corriger un texte de l'interface

`content/ui.json` : menus, boutons, titres de sections, badges… dans les 3 langues.

### 🔗 Liens à partager

| Lien | Effet |
|---|---|
| `https://bogotabeats.com/#epk` | Ouvre directement l'EPK |
| `https://bogotabeats.com/?lang=fr#epk` | EPK en français (ou `?lang=es`) |
| `https://bogotabeats.com/?theme=light` | Thème Jungle (`?theme=dark` pour Rave) |
| `https://bogotabeats.com/#dates` | Les dates |

### 🤖 Demander à Claude

Pour les mises à jour plus longues, tu peux simplement demander, par exemple :
« mets à jour les dates depuis mon Instagram », « ajoute ce set YouTube », « change la photo d'accueil du thème Jungle ».
Claude modifie les fichiers, vérifie en local, et ne publie qu'après ton accord.

---

## Commandes

Prérequis : [Node.js](https://nodejs.org) 18+ (aucune dépendance à installer).

```bash
npm run dev      # le site en local sur http://localhost:8080
npm run sync     # relit le Drive → content/drive.json (+ feuilles Dates/Sets si présentes)
npm run check    # vérifie le contenu (JSON valide, dates, liens YouTube/SoundCloud, photos citées…)
npm run build    # crée dist/ = exactement ce qui est publié
```

## Dépannage rapide

| Problème | Solution |
|---|---|
| Le site n'a pas changé après un push | Attendre ~1 min puis **Ctrl+F5** ; vérifier que le workflow est vert dans *Actions* |
| Une photo ajoutée au Drive n'apparaît pas | La synchro est quotidienne → *Run workflow* ; vérifier que le fichier est bien dans le dossier partagé |
| `git push` refusé (« rejected ») | `git pull` puis `git push` |
| Le workflow est rouge | Ouvrir le détail : `npm run check` indique la ligne fautive (souvent une virgule dans un JSON) |
| Le site est vide / sans photos | Un JSON de `content/` est invalide → `npm run check` |

## Documentation détaillée

| Fichier | Contenu |
|---|---|
| [docs/MISE-A-JOUR.md](docs/MISE-A-JOUR.md) | Toutes les mises à jour pas à pas, avec exemples à copier-coller |
| [docs/DRIVE.md](docs/DRIVE.md) | Comment le site lit le Drive, rôle de chaque dossier, flyers, Google Sheets, Instagram |
| [docs/THEMES-ET-LANGUES.md](docs/THEMES-ET-LANGUES.md) | Thèmes Rave / Jungle, couleurs, sélecteur, ajouter une langue |
| [docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md) | Hébergement, domaine bogotabeats.com, workflow, dépannage |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Organisation du code, pour faire évoluer le site |
| [CLAUDE.md](CLAUDE.md) | Consignes pour un assistant IA |
