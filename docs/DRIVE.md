# Le Google Drive comme source de contenu

Le site lit le dossier Drive public **PackPresse**
(`site.json → drive.folderId` = `1i7wBmtRWy71WacUW7GR61aymIdeZMwTe`).

## Comment ça marche

```
Google Drive (partagé "Tous les utilisateurs disposant du lien")
        │  npm run sync  (scripts/sync-drive.mjs — sans clé API)
        ▼
content/drive.json   ← liste des dossiers/fichiers + leurs identifiants
        │  chargé par app.js dans le navigateur
        ▼
Images / vidéos / documents servis directement par Google
```

- La synchro lit la page `drive.google.com/embeddedfolderview?id=…` que Google fournit pour les
  dossiers partagés : **aucune clé API, aucun compte** nécessaire.
- Elle descend jusqu'à 3 niveaux de sous-dossiers.
- Les fichiers ne sont **pas copiés** : le site affiche les images via `lh3.googleusercontent.com`
  et les vidéos via le lecteur Drive. Le Drive reste la source unique.
- `content/drive.json` est **généré** : ne pas le modifier à la main, il est écrasé à chaque synchro.

> Pourquoi un fichier généré plutôt qu'une lecture en direct ? Le navigateur ne peut pas lire un
> dossier Drive directement (sécurité CORS) sans clé API. La synchro (manuelle ou automatique
> chaque matin via GitHub Actions) contourne ça simplement et rend le site rapide.

## Rangement : ce que le site fait de chaque dossier

Le rôle d'un sous-dossier est déduit de son **nom** (insensible aux majuscules/accents) :

| Le nom contient… | Rôle sur le site |
|---|---|
| `flyer`, `affiche`, `poster` | **Flyers** des soirées, associés aux dates par le début du nom (`2026-10-16 - …`) — voir MISE-A-JOUR.md |
| `photo`, `pic`, `image`, `press` | Galerie **Press photos** + photos d'accueil/bio/contact |
| `logo` | Logos du site (nav, héros) + section **Logos** téléchargeables |
| `video`, `clip`, `teaser`, `aftermovie` | Section **Videos** |
| *n'importe quoi d'autre* (ex. `Mixes`, `Presse`, `Backstage`) | **Nouvelle section** dans l'EPK, titrée avec le nom du dossier (images en galerie, vidéos, documents en cartes de téléchargement) |

Fichiers **à la racine** du Drive :

| Type | Rôle |
|---|---|
| PDF / Google Doc dont le nom contient `press kit`, `presskit`, `epk` | Carte mise en avant « Press kit » |
| PDF / Google Doc dont le nom contient `fiche`, `technical`, `rider`, `tech` | Carte « Tech rider » (les Google Docs sont téléchargés en PDF) |
| Autres documents | Carte « Document » |
| Google Sheet dont le nom contient `dates`, `agenda` ou `gigs` | Source des **dates** → `content/dates.json` |
| Google Sheet dont le nom contient `sets` | Source des **sets YouTube** → `content/sets.json` |

Les Google Sheets ne sont jamais affichées comme documents téléchargeables.

## Conseils de nommage

- **Logos** : mettre `white` ou `blanc` dans le nom de la version pour fond sombre.
- **Ordre** : préfixer `01-`, `02-`… pour imposer l'ordre de la galerie.
- **Photos d'accueil** : si tu renommes une photo citée dans `site.json → drive`, mets à jour le
  nom là-bas aussi (`npm run check` te prévient).
- Formats d'image : JPG, PNG, WEBP, HEIC (converti par Google). Vidéos : MP4 conseillé
  (les `.MOV` iPhone sont lus par le lecteur Drive mais peuvent mettre plus de temps à charger).
- Les très grosses vidéos (> 100 Mo) sont plus lentes à démarrer dans le lecteur Drive :
  pour la vidéo principale, une version compressée ou un upload YouTube est préférable.

## Partage

Le dossier doit rester partagé en **« Tous les utilisateurs disposant du lien — Lecteur »**.
Un fichier ajouté hérite de ce partage. Si une image n'apparaît pas, vérifier son partage
individuel dans le Drive.

## Changer de dossier Drive

Modifier `drive.folderId` dans `content/site.json` (l'identifiant est la fin de l'URL
`https://drive.google.com/drive/folders/<ID>`), puis `npm run sync`.

## Confidentialité

Tout ce qui est dans ce dossier est **public** (lien partagé + site). Ne pas y déposer de contrats,
devis, données personnelles de tiers, etc. — utiliser un autre dossier non partagé.
Les fiches techniques contiennent ton numéro de téléphone : c'est voulu pour le booking, mais à garder en tête.

## Instagram

Lire Instagram automatiquement (GitHub Actions chaque matin) demanderait l'**API Instagram Graph** :
compte professionnel (Créateur/Entreprise) relié à une page Facebook, une application Meta
développeur, un jeton d'accès à renouveler tous les 60 jours (stocké en secret GitHub), puis un
script qui devine les dates dans les légendes — fragile, car chaque légende est écrite différemment,
et les posts des collectifs (Club Magma, Waack à Rennes…) n'y apparaissent pas tous.

Choix retenu, plus fiable :
1. **Flyers dans le Drive** (`Flyers/2026-10-16 - Soirée - Lieu - Ville.jpg`) → la date et le flyer apparaissent seuls.
2. **Mise à jour à la demande par Claude** depuis le profil public Instagram (lecture des légendes
   et des posts en collaboration), relue avant publication.
