# Mettre à jour le site

Tout le contenu se trouve dans **`content/`** et dans le **Google Drive « PackPresse »**.
On ne touche jamais au code (`index.html`, `app.js`, `styles.css`) pour mettre à jour du contenu.

> **Après chaque modification :** `npm run check` (vérifie qu'il n'y a pas d'erreur),
> puis publier (voir [DEPLOIEMENT.md](DEPLOIEMENT.md)). Si la synchro automatique est en place,
> les changements faits **dans le Drive** sont publiés tout seuls chaque matin.

---

## 1. Les dates 📅

### Option A — dans le fichier `content/dates.json`

Ajouter un bloc `{ … }` dans la liste (l'ordre n'a pas d'importance, le site trie tout seul) :

```json
[
  {
    "date": "2026-11-21",
    "event": "Perreo Con-Sentido",
    "venue": "Bar Désordre",
    "city": "Rennes",
    "type": "club",
    "link": "https://lien-vers-la-billetterie.com"
  },
  {
    "date": "2026-02-20",
    "event": "SantaMuerte — Ohm Town",
    "venue": "",
    "city": "Nantes",
    "type": "club",
    "link": ""
  }
]
```

| Champ   | Obligatoire | Description |
|---------|:-:|---|
| `date`  | ✅ | Format **AAAA-MM-JJ** (ex. `2026-11-21`) |
| `event` | ✅ | Nom de la soirée / de l'événement |
| `venue` |    | Lieu (club, bar, radio…) |
| `city`  |    | Ville |
| `type`  |    | `club`, `festival`, `radio`, `private` ou `live` (affiché en badge) |
| `link`  |    | Billetterie, event Facebook, replay… → affiche un bouton **Info** à la place du badge |

- **À venir / passées** : automatique selon la date du jour. Une date « à venir » bascule seule
  dans « Dernières dates » le lendemain.
- S'il n'y a aucune date à venir, le site affiche « New dates coming soon » + un bouton booking.
- Les 6 dernières dates passées sont affichées, avec un bouton « Voir toutes les dates ».
- ⚠️ Pièges JSON : une virgule entre chaque bloc `}, {`, **pas** de virgule après le dernier,
  des guillemets droits `"`. `npm run check` signale les erreurs.

### Option B — dans une Google Sheet (le plus simple, même depuis un téléphone) ⭐

1. Dans le Drive **PackPresse**, créer une Google Sheet nommée **`Dates`**
   (ou importer `templates/dates.csv` : *Fichier → Importer*).
2. Première ligne = en-têtes : `date | event | venue | city | type | link`
   (les noms français `lieu`, `ville`, `lien`, `billetterie` marchent aussi).
3. Une ligne par date. Formats de date acceptés : `2026-11-21`, `21/11/2026`, `21/11/26`, `21.11.2026`.
4. La feuille hérite du partage du dossier (« Tous les utilisateurs disposant du lien »).

À la prochaine synchro (`npm run sync` ou automatique chaque matin), la feuille **remplace**
`content/dates.json`. Les lignes avec une date illisible sont ignorées et signalées dans la console.

---

## 2. Les sets YouTube 🎧

`content/sets.json` — coller le lien YouTube tel quel (même avec `&list=…` ou `&t=2205s`) :

```json
[
  { "url": "https://www.youtube.com/watch?v=cULhs7p2_4M", "title": "BogotaBeats (DJ SET) | STIMUL", "where": "Roaz Club" },
  { "url": "https://youtu.be/XXXXXXXXXXX?t=600", "title": "Mon nouveau set", "where": "Radio X · 12.03.26" }
]
```

- L'ordre du fichier = l'ordre d'affichage (mettre le plus récent en premier).
- `?t=600` / `&t=600s` → la vidéo démarre à 10 min.
- Formats reconnus : `watch?v=`, `youtu.be/`, `/live/`, `/shorts/`, `/embed/`.
- Les titres peuvent être traduits : `"title": { "en": "…", "fr": "…", "es": "…" }`.
- Alternative : une Google Sheet **`Sets`** dans le Drive avec les colonnes `url | title | where`
  (modèle : `templates/sets.csv`).

---

## 3. Photos, vidéos, logos, documents 🖼️

Tout passe par le **Drive**, puis `npm run sync` :

| Action | Où |
|---|---|
| Ajouter des photos presse | Dossier **Photos** — elles apparaissent dans la galerie (ordre alphabétique) |
| Ajouter une vidéo | Dossier **Videos** — elle s'ajoute au carrousel (la `featuredVideo` passe en premier) |
| Nouveau logo | Dossier **Logos** (un nom contenant `white`/`blanc` = version pour fond sombre) |
| Mettre à jour le press kit / la fiche technique | Remplacer le fichier à la racine du Drive |
| Nouvelle rubrique (ex. **Flyers**, **Mixes**) | Créer un sous-dossier : il devient une section de l'EPK |

**Masquer** un fichier du site sans le supprimer du Drive : ajouter son nom exact dans
`site.json → drive.hiddenFiles` :

```json
"hiddenFiles": ["IMG_4121.MOV", "DSC00791.jpg"]
```

**Contrôler l'ordre de la galerie** : renommer les fichiers dans le Drive avec un préfixe
(`01-…`, `02-…`). Le tri est alphabétique « naturel » (2 avant 10).

### Choisir les photos mises en avant

Dans `content/site.json → drive`, une photo **par thème** (nom exact du fichier dans le Drive) :

```json
"hero":         { "dark": "DSC01144.jpg", "light": "Copie de PressPic_BogotaBeats_byAnatoleDOVGANYUK-17.jpg" },
"aboutPhoto":   { "dark": "CFranci-Bogotabeats-1-HD.jpg", "light": "70DF2AE6-…_a.heic" },
"bookingPhoto": { "dark": "CFranci-Bogotabeats-Foule-1-HD.jpg", "light": "Copie de PressPic_…-32.jpg" },
"logo":         { "dark": "BogotaBeats_logo_white.png", "light": "BogotaBeats_logo.png" },
"featuredVideo": "BOGOTABEATS_PROMO.mp4"
```

On peut aussi mettre un simple nom (`"hero": "DSC01144.jpg"`) pour utiliser la même photo dans
les deux thèmes, et `"heroMobile"` pour une photo différente sur téléphone.
Si un fichier est renommé ou supprimé, le site prend une autre photo automatiquement
(et `npm run check` le signale).

---

## 4. Textes du profil ✍️

`content/site.json` — chaque texte existe en `en` (par défaut), `fr` et `es` :

| Clé | Contenu |
|---|---|
| `tagline` | Sous-titre sous le logo (les styles) |
| `listenUrl` | Lien du bouton « Listen to a set » de l'accueil (SoundCloud) — si vide, le bouton descend vers les sets |
| `bio` | Biographie (une entrée = un paragraphe) |
| `music` | Paragraphe « The sound » |
| `inspirations`, `influences` | Texte + liste d'artistes |
| `genres` | Pastilles de genres |
| `stats` | Chiffres clés (`value`, `suffix` comme `+` ou `k`, `label`) |
| `setup` | Résumé technique / rider |
| `contact` | Email, téléphone (affiché + format international pour le lien `tel:`) |
| `socials` | Réseaux : `{ "name": "Instagram", "url": "https://…" }` — ajouter/retirer librement |

Si une traduction manque, le site affiche la version anglaise.

**Textes de l'interface** (menus, boutons, titres de sections) : `content/ui.json`.

---

## 5. Liens à partager 🔗

- Forcer la langue : `https://ton-site/?lang=fr` ou `?lang=es` — pratique pour envoyer l'EPK
  à un programmateur francophone / hispanophone.
- Forcer le thème : `?theme=light` (Jungle) ou `?theme=dark` (Rave).
- Aller directement à l'EPK : `https://ton-site/#epk` (ex. `https://ton-site/?lang=fr#epk`).

Le choix de langue/thème du visiteur est mémorisé dans son navigateur.
