# Thèmes & langues

## Les deux thèmes

Le thème est porté par l'attribut `data-theme` de la balise `<html>` (`dark` ou `light`).
Le visiteur bascule avec le bouton à droite du menu ; son choix est mémorisé.

| | 🌈 **Rave** — `dark` | 🌿 **Jungle** — `light` |
|---|---|---|
| Ambiance | After post-apocalyptique, néon, club queer | Forêt, terre, chaleur, ébullition |
| Fond | Noir violacé `#07050b` + halos néon + grain « béton » | Sable `#f4e8d4` + halos soleil/terre + grain papier |
| Accent principal | Rose néon `#ff3ec8` | Terracotta `#c4451c` |
| Accents secondaires | Violet UV `#8b5cff`, cyan acide `#22e6ff` | Vert jungle `#2e5b32`, soleil `#f0b22e` |
| Titres | Rose avec glow, effet *glitch* au survol | Vert jungle, sobres |
| Barre sous les titres | Dégradé rose → violet → cyan | Dégradé soleil → terracotta → vert |
| Détails | Scanlines sur la photo d'accueil, contours lumineux | Feuilles tropicales en fond, portrait en arche, pastilles arrondies |
| Photos | Portrait néon cuir (DSC01144), foule, lumières | Lumière dorée (Anatole Dovganyuk), veste jaune, extérieur |
| Logo | Blanc | Brun « terre » |

**Thème par défaut** : `site.json → defaultTheme` = `"dark"`, `"light"` ou `"auto"` (suit le
réglage clair/sombre du téléphone ou de l'ordinateur du visiteur).
Si tu choisis autre chose que `"dark"`, change aussi la valeur `'dark'` dans le petit script en
haut de `index.html` (il applique le thème avant l'affichage pour éviter un flash).

### Retoucher les couleurs

Tout est en **variables CSS** en haut de `styles.css` : un bloc `[data-theme="dark"]` et un bloc
`[data-theme="light"]`. Changer une valeur (ex. `--accent`) suffit à mettre à jour tout le site.

| Variable | Rôle |
|---|---|
| `--bg`, `--bg-alt`, `--card`, `--line` | Fonds et bordures |
| `--text`, `--muted` | Texte principal / secondaire |
| `--accent`, `--accent-2`, `--accent-3` | Couleurs de la marque dans le thème |
| `--on-accent` | Texte posé sur un bouton/pastille de couleur accent |
| `--bar` | Dégradé des barres sous les titres et du footer |
| `--heading`, `--heading-shadow` | Couleur et glow des titres |
| `--ambient` | Halos de couleur en fond de page |
| `--grain-opacity` | Intensité du grain (0 = aucun) |
| `--leaf-opacity` | Visibilité des feuilles tropicales (0 en Rave) |
| `--hero-shade`, `--hero-text` | Dégradé et couleur du texte sur la photo d'accueil |

### Ajouter un 3ᵉ thème

1. Copier un bloc `[data-theme="…"]` dans `styles.css` avec un nouveau nom (ex. `sunset`).
2. Ajouter les photos de ce thème dans `site.json → drive.hero / aboutPhoto / bookingPhoto / logo`
   (ex. `"sunset": "photo.jpg"`).
3. Adapter le bouton de thème dans `app.js` (fonction `renderChrome` et l'écouteur `#themeBtn`)
   pour faire tourner les 3 thèmes.

## Les langues

- Langue par défaut : **anglais** (`site.json → defaultLang`).
- Langues proposées : `site.json → languages` = `["en", "fr", "es"]`, dans l'ordre des boutons.
- Ordre de priorité : paramètre d'URL `?lang=fr` > choix mémorisé du visiteur > langue par défaut.

Deux endroits contiennent du texte :

| Fichier | Contenu | Format |
|---|---|---|
| `content/ui.json` | Menus, boutons, titres de sections, badges | `{ "en": { "clé": "texte" }, "fr": {…}, "es": {…} }` |
| `content/site.json` | Bio, tagline, stats, inspirations, setup… | Chaque champ : `{ "en": "…", "fr": "…", "es": "…" }` |

Une traduction manquante retombe sur l'anglais : on peut traduire progressivement.
Les dates sont formatées automatiquement dans la langue (21 NOV / 21 NOV. / 21 NOV).

### Ajouter une langue (ex. portugais)

1. `site.json` : ajouter `"pt"` dans `languages`.
2. `ui.json` : copier le bloc `"en"` en `"pt"` et traduire.
3. `site.json` : ajouter `"pt": "…"` dans les textes à traduire (facultatif — sinon anglais).
4. `app.js` : ajouter `pt: 'pt-BR'` dans `LOCALES` (format des dates).

> ✋ La traduction espagnole a été générée : la faire relire par une personne hispanophone avant
> diffusion large.
