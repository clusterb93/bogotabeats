# Mettre le site en ligne

Le site est **100 % statique** (HTML/CSS/JS + JSON). Il doit être servi en HTTP(S) (pas en ouvrant
`index.html` en double-clic : le navigateur bloque la lecture des fichiers JSON).

## Comment ça marche

Le workflow `.github/workflows/sync-drive.yml` tourne **tous les jours à 6 h UTC**, **à chaque
`git push`** et **à la demande** (bouton *Run workflow*) :

```
build ─► sync Drive + Google Sheets ─► check ─► commit des changements ─► build (dist/)
  │
  ├─► deploy-ionos  : envoi SFTP sur IONOS → https://bogotabeats.com      (si les secrets IONOS_* existent)
  └─► deploy-pages  : GitHub Pages → https://clusterb93.github.io/bogotabeats/   (sinon)
```

- `scripts/build.mjs` ne met dans `dist/` que les fichiers publics : `index.html`, `styles.css`,
  `app.js`, `content/`, plus le contenu de `public/` (`.htaccess`, `robots.txt`) et un `sitemap.xml`.
  La doc, les scripts et les modèles ne sont jamais publiés.
- L'envoi SFTP (`lftp mirror`) ne transfère que ce qui a changé et **supprime sur le serveur les
  fichiers qui n'existent plus** → le dossier IONOS doit être **dédié au site**.
- 👉 **Ajouter une photo ou une date dans le Drive suffit** : le site se met à jour le lendemain
  matin, ou tout de suite avec *Run workflow*.

## Hébergement IONOS + bogotabeats.com (configuration actuelle)

À faire une seule fois. Les intitulés exacts du panneau IONOS peuvent varier légèrement.

### 1. IONOS — relier le domaine à un dossier de l'espace web

1. Espace client IONOS → **Hébergement** → ton pack → gestionnaire de fichiers (ou via SFTP) :
   créer un dossier vide **`/bogotabeats`**.
2. **Domaines & SSL** → `bogotabeats.com` → *Modifier la destination / Utilisation du domaine* →
   **Espace web** → choisir le dossier **`/bogotabeats`**.
3. Faire de même pour **`www.bogotabeats.com`** (même dossier). Le `.htaccess` du site redirige
   automatiquement `www` et `http` vers `https://bogotabeats.com`.

### 2. IONOS — certificat SSL (HTTPS)

**Domaines & SSL** → `bogotabeats.com` → certificat SSL : activer le certificat inclus dans le pack
pour `bogotabeats.com` **et** `www.bogotabeats.com`. (Quelques minutes à quelques heures.)

### 3. IONOS — accès SFTP

**Hébergement** → **SFTP & SSH** : noter (ou créer) un utilisateur SFTP et définir son mot de passe.
Relever :

| Info | Exemple |
|---|---|
| Serveur | `access-1234567890.webspace-host.com` |
| Utilisateur | `a1234567` |
| Port | `22` (SFTP) |

> ⚠️ Ne jamais écrire ce mot de passe dans un fichier du projet ni l'envoyer par message :
> il va **uniquement** dans les secrets GitHub (étape suivante).

### 4. GitHub — les 4 secrets

Dépôt `clusterb93/bogotabeats` → **Settings → Secrets and variables → Actions → New repository secret** :

| Nom du secret | Valeur |
|---|---|
| `IONOS_SFTP_HOST` | le serveur, ex. `access-1234567890.webspace-host.com` |
| `IONOS_SFTP_USER` | l'utilisateur SFTP |
| `IONOS_SFTP_PASSWORD` | le mot de passe SFTP |
| `IONOS_SFTP_DIR` | le dossier du site, ex. `/bogotabeats` |

### 5. Premier déploiement

Onglet **Actions** → *Sync Drive & deploy* → **Run workflow**. Les étapes *build* puis
*deploy-ionos* doivent passer au vert ; la dernière étape vérifie que `https://bogotabeats.com`
répond (un simple avertissement s'affiche si le DNS ou le SSL ne sont pas encore prêts).

### 6. Après la bascule

- L'ancienne adresse GitHub Pages n'est plus mise à jour. Pour la retirer :
  **Settings → Pages → Unpublish site** (facultatif ; le site déclare déjà `bogotabeats.com`
  comme adresse officielle pour Google).
- Idée : créer une adresse **`booking@bogotabeats.com`** (incluse chez IONOS) et la mettre dans
  `site.json → contact.email` — plus pro qu'une Gmail sur un EPK.

### En cas de problème

| Symptôme | Piste |
|---|---|
| *deploy-ionos* échoue sur « Login failed » | Utilisateur / mot de passe / serveur des secrets ; port 22 bien en SFTP |
| *deploy-ionos* échoue sur le dossier | `IONOS_SFTP_DIR` doit exister et commencer par `/` |
| Le site affiche la page IONOS par défaut | Le domaine ne pointe pas sur le bon dossier (étape 1) |
| Avertissement de sécurité HTTPS | Certificat SSL pas encore actif pour ce nom (étape 2) |
| Vieille version affichée | Ctrl+F5 ; le HTML et les JSON sont servis sans cache, CSS/JS gardés 1 h max |

## Routine de mise à jour manuelle

```bash
git pull         # récupère les commits du bot (synchro Drive)
npm run sync     # récupère le Drive
npm run check    # vérifie
npm run dev      # contrôle visuel sur http://localhost:8080
git add . && git commit -m "maj dates" && git push   # publie (IONOS)
```

`npm run build` crée `dist/` en local si tu veux voir exactement ce qui part en ligne.

## Checklist

- [ ] Vérifier les **liens réseaux** dans `site.json → socials` (Facebook et YouTube déduits de `@bogotabeats` : à confirmer).
- [ ] Vérifier les **dates passées** reprises des flyers du press kit (années et lieux à confirmer, certains lieux/villes sont vides).
- [ ] Faire relire la **version espagnole**.
- [ ] Confirmer que le **numéro de téléphone** doit être public sur le site.
- [ ] Vérifier les **crédits photo** (Anatole Dovganyuk, CFranci…).
